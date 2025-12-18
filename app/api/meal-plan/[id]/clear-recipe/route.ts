import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { GeneratedMeal } from '@/lib/types/meal-plan-generator';
import {
  calculateMealTotalMacros,
  calculatePlanTotalMacros,
} from '@/lib/calculations/meal-plan-generator';

/**
 * DELETE /api/meal-plan/[id]/clear-recipe
 * Clear recipe selection and switch back to food items mode
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const mealIndex = parseInt(searchParams.get('mealIndex') || '-1');

    if (mealIndex < 0) {
      return NextResponse.json(
        { error: 'mealIndex query parameter is required' },
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

    // Check access - allow both coach and assigned client
    const userId = (session.user as any).id;
    const isCoach = generatedPlan.nutritionPlan.coachId === userId;
    const isClient = generatedPlan.nutritionPlan.clientId === userId;

    if (!isCoach && !isClient) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const meals = generatedPlan.meals as unknown as GeneratedMeal[];

    if (mealIndex >= meals.length) {
      return NextResponse.json({ error: 'Invalid meal index' }, { status: 400 });
    }

    // Clear recipe and switch back to food mode
    const updatedMeal = {
      ...meals[mealIndex],
      selectedRecipe: undefined,
      isRecipeMode: false,
      // Recalculate total macros from food items
      totalMacros: calculateMealTotalMacros(meals[mealIndex].items, meals[mealIndex].sauce),
    };

    meals[mealIndex] = updatedMeal;

    // Recalculate plan totals
    const actualMacros = calculatePlanTotalMacros(meals);

    // Save to database
    await prisma.generatedMealPlan.update({
      where: { id },
      data: {
        meals: meals as any,
      },
    });

    return NextResponse.json({
      updatedMeal: meals[mealIndex],
      actualMacros,
    });
  } catch (error) {
    console.error('Error clearing recipe:', error);
    return NextResponse.json(
      { error: 'Failed to clear recipe' },
      { status: 500 }
    );
  }
}
