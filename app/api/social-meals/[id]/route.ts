import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// DELETE - Delete a social meal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if the meal exists and belongs to the user
    const meal = await prisma.socialMeal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // If this is a deviation, also remove it from the daily nutrition log
    if (meal.isDeviation) {
      await prisma.dailyNutritionLog.updateMany({
        where: {
          deviationMealId: id,
        },
        data: {
          hasDeviation: false,
          deviationMealId: null,
          deviationKcal: null,
          deviationProtein: null,
          deviationCarbs: null,
          deviationFat: null,
        },
      });
    }

    // Delete the components first (cascade should handle this, but being explicit)
    await prisma.quickTrackComponent.deleteMany({
      where: {
        socialMealId: id,
      },
    });

    // Delete the meal
    await prisma.socialMeal.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting social meal:', error);
    return NextResponse.json(
      { error: 'Failed to delete social meal' },
      { status: 500 }
    );
  }
}

// GET - Get a specific social meal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const meal = await prisma.socialMeal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        components: true,
      },
    });

    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ meal });
  } catch (error) {
    console.error('Error fetching social meal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social meal' },
      { status: 500 }
    );
  }
}
