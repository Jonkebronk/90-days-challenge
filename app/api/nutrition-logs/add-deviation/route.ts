import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/nutrition-logs/add-deviation - Add deviation to a day's log
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, date, deviationMealId } = body;

    const targetUserId = userId || session.user.id;

    // Verify the deviation meal exists and belongs to the user
    const deviationMeal = await prisma.socialMeal.findFirst({
      where: {
        id: deviationMealId,
        userId: targetUserId,
        isDeviation: true,
      },
    });

    if (!deviationMeal) {
      return NextResponse.json(
        { error: 'Deviation meal not found or not marked as deviation' },
        { status: 404 }
      );
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Find or create the daily log
    let log = await prisma.dailyNutritionLog.findUnique({
      where: {
        userId_date: {
          userId: targetUserId,
          date: targetDate,
        },
      },
    });

    if (!log) {
      // Get planned nutrition from meal plan or nutrition plan
      let plannedKcal = 2000;
      let plannedProtein = 150;
      let plannedCarbs = 200;
      let plannedFat = 70;

      // Try to get from active meal plan
      const mealPlan = await prisma.smartMealPlan.findFirst({
        where: {
          userId: targetUserId,
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

      if (mealPlan) {
        const dayOfWeek = targetDate.getDay();
        const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
        const todaysMeals = mealPlan.days.find(d => d.dayNumber === adjustedDay);

        if (todaysMeals?.totalCalories) {
          plannedKcal = Math.round(todaysMeals.totalCalories);
          plannedProtein = todaysMeals.totalProtein || 0;
          plannedCarbs = todaysMeals.totalCarbs || 0;
          plannedFat = todaysMeals.totalFat || 0;
        }
      } else {
        // Try nutrition plan
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
        }
      }

      // Create the daily log
      log = await prisma.dailyNutritionLog.create({
        data: {
          userId: targetUserId,
          date: targetDate,
          plannedKcal,
          plannedProtein,
          plannedCarbs,
          plannedFat,
          actualKcal: plannedKcal,
          actualProtein: plannedProtein,
          actualCarbs: plannedCarbs,
          actualFat: plannedFat,
          hasDeviation: false,
        },
      });
    }

    if (!log) {
      return NextResponse.json(
        { error: 'Failed to create daily log' },
        { status: 500 }
      );
    }

    // Calculate deviation values from the meal
    const deviationKcal = deviationMeal.kcal;
    const deviationProtein = Number(deviationMeal.protein);
    const deviationCarbs = Number(deviationMeal.carbs);
    const deviationFat = Number(deviationMeal.fat);

    // Update the log with deviation
    const updatedLog = await prisma.dailyNutritionLog.update({
      where: { id: log.id },
      data: {
        deviationKcal,
        deviationProtein,
        deviationCarbs,
        deviationFat,
        hasDeviation: true,
        deviationMealId,
        // Update actual values (planned + deviation)
        actualKcal: log.plannedKcal + deviationKcal,
        actualProtein: Number(log.plannedProtein) + deviationProtein,
        actualCarbs: Number(log.plannedCarbs) + deviationCarbs,
        actualFat: Number(log.plannedFat) + deviationFat,
      },
      include: {
        deviationMeal: {
          include: {
            components: true,
          },
        },
      },
    });

    return NextResponse.json({ log: updatedLog });
  } catch (error) {
    console.error('Error adding deviation to nutrition log:', error);
    return NextResponse.json(
      { error: 'Failed to add deviation' },
      { status: 500 }
    );
  }
}
