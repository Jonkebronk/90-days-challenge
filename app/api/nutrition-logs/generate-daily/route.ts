import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/nutrition-logs/generate-daily - Generate daily log from meal plan
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, date } = body;

    const targetUserId = userId || session.user.id;

    // Check if user has permission
    if (targetUserId !== session.user.id) {
      const client = await prisma.user.findFirst({
        where: {
          id: targetUserId,
          coachId: session.user.id,
        },
      });
      if (!client) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const targetDate = date ? new Date(date) : new Date();
    // Normalize to start of day
    targetDate.setHours(0, 0, 0, 0);

    // Get the user's active meal plan for this date
    const mealPlan = await prisma.smartMealPlan.findFirst({
      where: {
        userId: targetUserId,
        isActive: true,
        type: 'week',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        days: {
          include: {
            meals: true,
          },
        },
      },
    });

    // Calculate planned nutrition from meal plan
    let plannedKcal = 0;
    let plannedProtein = 0;
    let plannedCarbs = 0;
    let plannedFat = 0;

    if (mealPlan) {
      // Get day of week (1 = Monday, 7 = Sunday)
      const dayOfWeek = targetDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      const todaysMeals = mealPlan.days.find(d => d.dayNumber === adjustedDay);

      if (todaysMeals) {
        // Use the day's totals if available, otherwise sum from meals
        if (todaysMeals.totalCalories) {
          plannedKcal = Math.round(todaysMeals.totalCalories);
          plannedProtein = todaysMeals.totalProtein || 0;
          plannedCarbs = todaysMeals.totalCarbs || 0;
          plannedFat = todaysMeals.totalFat || 0;
        } else {
          // Sum from individual meals
          todaysMeals.meals.forEach(meal => {
            plannedKcal += Math.round(meal.calories);
            plannedProtein += meal.protein;
            plannedCarbs += meal.carbs;
            plannedFat += meal.fat;
          });
        }
      }
    }

    // If no meal plan, try to get from nutrition plan
    if (plannedKcal === 0) {
      const nutritionPlan = await prisma.clientNutritionPlan.findFirst({
        where: {
          clientId: targetUserId,
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (nutritionPlan) {
        plannedKcal = Number(nutritionPlan.dailyCalorieTarget) || 2000;
        plannedProtein = Number(nutritionPlan.proteinGrams) || 150;
        plannedCarbs = Number(nutritionPlan.carbGrams) || 200;
        plannedFat = Number(nutritionPlan.fatGrams) || 70;
      } else {
        // Default fallback values
        plannedKcal = 2000;
        plannedProtein = 150;
        plannedCarbs = 200;
        plannedFat = 70;
      }
    }

    // Check if log already exists for this date
    const existingLog = await prisma.dailyNutritionLog.findUnique({
      where: {
        userId_date: {
          userId: targetUserId,
          date: targetDate,
        },
      },
    });

    if (existingLog) {
      // Update existing log with new planned values (keep deviation if exists)
      const updatedLog = await prisma.dailyNutritionLog.update({
        where: { id: existingLog.id },
        data: {
          plannedKcal,
          plannedProtein,
          plannedCarbs,
          plannedFat,
          // Recalculate actual with existing deviation
          actualKcal: plannedKcal + (existingLog.deviationKcal || 0),
          actualProtein: Number(plannedProtein) + Number(existingLog.deviationProtein || 0),
          actualCarbs: Number(plannedCarbs) + Number(existingLog.deviationCarbs || 0),
          actualFat: Number(plannedFat) + Number(existingLog.deviationFat || 0),
        },
      });

      return NextResponse.json({ log: updatedLog, updated: true });
    }

    // Create new log
    const newLog = await prisma.dailyNutritionLog.create({
      data: {
        userId: targetUserId,
        date: targetDate,
        plannedKcal,
        plannedProtein,
        plannedCarbs,
        plannedFat,
        // Initially, actual = planned (no deviation)
        actualKcal: plannedKcal,
        actualProtein: plannedProtein,
        actualCarbs: plannedCarbs,
        actualFat: plannedFat,
        hasDeviation: false,
      },
    });

    return NextResponse.json({ log: newLog, created: true });
  } catch (error) {
    console.error('Error generating daily nutrition log:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily nutrition log' },
      { status: 500 }
    );
  }
}
