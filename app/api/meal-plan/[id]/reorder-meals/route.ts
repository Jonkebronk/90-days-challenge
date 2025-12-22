import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { GeneratedMeal } from '@/lib/types/meal-plan-generator';

interface RequestBody {
  fromIndex: number;
  toIndex: number;
}

/**
 * POST /api/meal-plan/[id]/reorder-meals
 * Swap the position of two meals in the plan
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as RequestBody;
    const { fromIndex, toIndex } = body;

    // Validate required fields
    if (fromIndex === undefined || toIndex === undefined) {
      return NextResponse.json(
        { error: 'fromIndex and toIndex are required' },
        { status: 400 }
      );
    }

    // Fetch the generated meal plan
    const generatedPlan = await prisma.generatedMealPlan.findUnique({
      where: { id },
      include: {
        nutritionPlan: true,
      },
    });

    if (!generatedPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // Check access - coach or client can update
    const userId = (session.user as any).id;
    const isCoach = generatedPlan.nutritionPlan.coachId === userId;
    const isClient = generatedPlan.nutritionPlan.clientId === userId;

    if (!isCoach && !isClient) {
      return NextResponse.json(
        { error: 'You do not have access to this plan' },
        { status: 403 }
      );
    }

    // Get current meals from plan
    const meals = generatedPlan.meals as unknown as GeneratedMeal[];

    // Validate indices
    if (
      fromIndex < 0 ||
      fromIndex >= meals.length ||
      toIndex < 0 ||
      toIndex >= meals.length
    ) {
      return NextResponse.json({ error: 'Invalid meal indices' }, { status: 400 });
    }

    // Swap meals
    const updatedMeals = [...meals];
    const temp = updatedMeals[fromIndex];
    updatedMeals[fromIndex] = updatedMeals[toIndex];
    updatedMeals[toIndex] = temp;

    // Save to database
    await prisma.generatedMealPlan.update({
      where: { id },
      data: {
        meals: updatedMeals as any,
      },
    });

    return NextResponse.json({
      success: true,
      meals: updatedMeals,
    });
  } catch (error) {
    console.error('Error reordering meals:', error);
    return NextResponse.json(
      { error: 'Failed to reorder meals' },
      { status: 500 }
    );
  }
}
