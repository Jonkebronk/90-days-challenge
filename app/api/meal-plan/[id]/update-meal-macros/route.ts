import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  GeneratedMeal,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';

/**
 * PUT /api/meal-plan/[id]/update-meal-macros
 * Update target macros for a specific meal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { mealIndex, targetMacros } = body as {
      mealIndex: number;
      targetMacros: CalculatedMacros;
    };

    if (mealIndex === undefined || !targetMacros) {
      return NextResponse.json(
        { error: 'mealIndex and targetMacros are required' },
        { status: 400 }
      );
    }

    // Fetch the meal plan
    const generatedPlan = await prisma.generatedMealPlan.findUnique({
      where: { id },
      include: { nutritionPlan: true },
    });

    if (!generatedPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // Check access
    if (generatedPlan.nutritionPlan.coachId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const meals = generatedPlan.meals as unknown as GeneratedMeal[];

    if (mealIndex < 0 || mealIndex >= meals.length) {
      return NextResponse.json({ error: 'Invalid meal index' }, { status: 400 });
    }

    // Update the meal's target macros
    meals[mealIndex].targetMacros = {
      protein: Math.round(targetMacros.protein * 10) / 10,
      carbs: Math.round(targetMacros.carbs * 10) / 10,
      fat: Math.round(targetMacros.fat * 10) / 10,
      kcal: Math.round(targetMacros.kcal),
    };

    // Save to database
    await prisma.generatedMealPlan.update({
      where: { id },
      data: {
        meals: meals as any,
      },
    });

    return NextResponse.json({
      updatedMeal: meals[mealIndex],
    });
  } catch (error) {
    console.error('Error updating meal macros:', error);
    return NextResponse.json(
      { error: 'Failed to update meal macros' },
      { status: 500 }
    );
  }
}
