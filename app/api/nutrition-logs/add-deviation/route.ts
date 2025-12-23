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
      // Generate the daily log first
      const generateResponse = await fetch(
        new URL('/api/nutrition-logs/generate-daily', request.url).toString(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: targetUserId, date: targetDate.toISOString() }),
        }
      );
      const generateData = await generateResponse.json();
      log = generateData.log;
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
