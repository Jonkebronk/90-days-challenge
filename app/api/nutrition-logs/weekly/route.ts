import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/nutrition-logs/weekly - Get weekly data for bar chart
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');
    const userId = searchParams.get('userId') || session.user.id;

    // Check if user has permission to view this data
    if (userId !== session.user.id) {
      const client = await prisma.user.findFirst({
        where: {
          id: userId,
          coachId: session.user.id,
        },
      });
      if (!client) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Calculate week start and end
    let startDate: Date;
    if (weekStart) {
      startDate = new Date(weekStart);
    } else {
      // Default to current week (Monday start)
      startDate = new Date();
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
    }
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Auto-generate logs for past days that don't have entries
    await autoGenerateMissingLogs(userId, startDate, endDate);

    // Get logs for the week
    const logs = await prisma.dailyNutritionLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      include: {
        deviationMeal: {
          select: {
            id: true,
            mealType: true,
            kcal: true,
            protein: true,
            carbs: true,
            fat: true,
          },
        },
      },
    });

    // Generate array for all 7 days
    const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
    const weekData = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);

      const dayLog = logs.find(log => {
        const logDate = new Date(log.date);
        return logDate.toDateString() === currentDate.toDateString();
      });

      weekData.push({
        day: weekDays[i],
        date: currentDate.toISOString().split('T')[0],
        plannedKcal: dayLog?.plannedKcal || 0,
        actualKcal: dayLog?.actualKcal || (dayLog?.plannedKcal || 0),
        hasDeviation: dayLog?.hasDeviation || false,
        deviationKcal: dayLog?.deviationKcal || null,
        // Calculate compliance status
        status: getComplianceStatus(
          dayLog?.actualKcal || 0,
          dayLog?.plannedKcal || 0
        ),
        hasData: !!dayLog,
      });
    }

    // Calculate week summary
    const logsWithData = weekData.filter(d => d.hasData);
    const summary = {
      averageKcal: logsWithData.length > 0
        ? Math.round(logsWithData.reduce((sum, d) => sum + d.actualKcal, 0) / logsWithData.length)
        : 0,
      averagePlannedKcal: logsWithData.length > 0
        ? Math.round(logsWithData.reduce((sum, d) => sum + d.plannedKcal, 0) / logsWithData.length)
        : 0,
      totalDaysLogged: logsWithData.length,
      daysWithDeviation: logsWithData.filter(d => d.hasDeviation).length,
      compliancePercent: calculateCompliancePercent(logsWithData),
    };

    return NextResponse.json({
      weekStart: startDate.toISOString().split('T')[0],
      weekEnd: endDate.toISOString().split('T')[0],
      days: weekData,
      summary,
    });
  } catch (error) {
    console.error('Error fetching weekly nutrition logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly nutrition logs' },
      { status: 500 }
    );
  }
}

function getComplianceStatus(actual: number, planned: number): 'green' | 'yellow' | 'red' | 'none' {
  if (planned === 0) return 'none';

  const deviation = Math.abs(actual - planned);
  const percentDeviation = (deviation / planned) * 100;

  if (percentDeviation <= 5) return 'green'; // Within ±5%
  if (percentDeviation <= 15) return 'yellow'; // ±5-15%
  return 'red'; // >15%
}

function calculateCompliancePercent(days: Array<{ actualKcal: number; plannedKcal: number; hasData: boolean }>): number {
  const daysWithPlan = days.filter(d => d.hasData && d.plannedKcal > 0);
  if (daysWithPlan.length === 0) return 100;

  const compliantDays = daysWithPlan.filter(d => {
    const percentDeviation = Math.abs(d.actualKcal - d.plannedKcal) / d.plannedKcal * 100;
    return percentDeviation <= 15; // Count as compliant if within 15%
  });

  return Math.round((compliantDays.length / daysWithPlan.length) * 100);
}

// Auto-generate daily logs for past days based on meal plan
async function autoGenerateMissingLogs(userId: string, startDate: Date, endDate: Date) {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Include today

  // Get existing logs for the date range
  const existingLogs = await prisma.dailyNutritionLog.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { date: true },
  });

  const existingDates = new Set(
    existingLogs.map(log => new Date(log.date).toDateString())
  );

  // Get user's active meal plan
  const mealPlan = await prisma.smartMealPlan.findFirst({
    where: {
      userId,
      isActive: true,
      type: 'week',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      days: {
        include: { meals: true },
      },
    },
  });

  // Get nutrition plan as fallback
  const nutritionPlan = await prisma.clientNutritionPlan.findFirst({
    where: {
      clientId: userId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate default values
  let defaultKcal = 2000;
  let defaultProtein = 150;
  let defaultCarbs = 200;
  let defaultFat = 70;

  if (nutritionPlan) {
    defaultKcal = Number(nutritionPlan.dailyCalorieTarget) || 2000;
    defaultProtein = Number(nutritionPlan.proteinGrams) || 150;
    defaultCarbs = Number(nutritionPlan.carbGrams) || 200;
    defaultFat = Number(nutritionPlan.fatGrams) || 70;
  }

  // Generate logs for each missing day (up to today)
  const logsToCreate = [];

  for (let d = new Date(startDate); d <= endDate && d <= today; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    currentDate.setHours(0, 0, 0, 0);

    if (existingDates.has(currentDate.toDateString())) {
      continue; // Skip if log already exists
    }

    // Get planned values for this day from meal plan
    let plannedKcal = defaultKcal;
    let plannedProtein = defaultProtein;
    let plannedCarbs = defaultCarbs;
    let plannedFat = defaultFat;

    if (mealPlan) {
      const dayOfWeek = currentDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // 1=Mon, 7=Sun
      const dayPlan = mealPlan.days.find(day => day.dayNumber === adjustedDay);

      if (dayPlan) {
        if (dayPlan.totalCalories) {
          plannedKcal = Math.round(dayPlan.totalCalories);
          plannedProtein = dayPlan.totalProtein || defaultProtein;
          plannedCarbs = dayPlan.totalCarbs || defaultCarbs;
          plannedFat = dayPlan.totalFat || defaultFat;
        } else if (dayPlan.meals.length > 0) {
          // Sum from individual meals
          plannedKcal = Math.round(dayPlan.meals.reduce((sum, m) => sum + m.calories, 0));
          plannedProtein = dayPlan.meals.reduce((sum, m) => sum + m.protein, 0);
          plannedCarbs = dayPlan.meals.reduce((sum, m) => sum + m.carbs, 0);
          plannedFat = dayPlan.meals.reduce((sum, m) => sum + m.fat, 0);
        }
      }
    }

    logsToCreate.push({
      userId,
      date: new Date(currentDate),
      plannedKcal,
      plannedProtein,
      plannedCarbs,
      plannedFat,
      actualKcal: plannedKcal, // Assume followed plan
      actualProtein: plannedProtein,
      actualCarbs: plannedCarbs,
      actualFat: plannedFat,
      hasDeviation: false,
    });
  }

  // Bulk create missing logs
  if (logsToCreate.length > 0) {
    await prisma.dailyNutritionLog.createMany({
      data: logsToCreate,
      skipDuplicates: true,
    });
  }
}
