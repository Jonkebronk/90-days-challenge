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
