import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  MacroCategory,
  GeneratedMeal,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';
import { calculatePlanTotalMacros, calculateMealTotalMacros } from '@/lib/calculations/meal-plan-generator';

/**
 * PUT /api/meal-plan/[id]/update-grams
 * Update grams for a specific food in a meal
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
    const { mealIndex, category, grams, foodId } = body as {
      mealIndex: number;
      category: MacroCategory;
      grams: number;
      foodId?: string;  // Optional - if provided, update specific food; otherwise update first in category
    };

    if (mealIndex === undefined || !category || grams === undefined) {
      return NextResponse.json(
        { error: 'mealIndex, category, and grams are required' },
        { status: 400 }
      );
    }

    if (grams < 0) {
      return NextResponse.json(
        { error: 'Grams must be positive' },
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

    const meal = meals[mealIndex];

    // Find item - either by foodId or by category
    let item;
    if (foodId) {
      item = meal.items.find((i) => i.selected.foodId === foodId);
    } else {
      item = meal.items.find((i) => i.category === category);
    }

    if (!item) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 });
    }

    // Calculate new macros based on new grams
    const oldGrams = item.selected.grams;
    const factor = grams / oldGrams;

    const newMacros: CalculatedMacros = {
      protein: Math.round(item.selected.macros.protein * factor * 10) / 10,
      carbs: Math.round(item.selected.macros.carbs * factor * 10) / 10,
      fat: Math.round(item.selected.macros.fat * factor * 10) / 10,
      kcal: Math.round(item.selected.macros.kcal * factor),
    };

    // Update the item
    item.selected.grams = Math.round(grams);
    item.selected.macros = newMacros;

    // Recalculate meal totals
    meal.totalMacros = calculateMealTotalMacros(meal.items, meal.sauce);

    // Recalculate plan totals
    const actualMacros = calculatePlanTotalMacros(meals);

    // Save to database
    await prisma.generatedMealPlan.update({
      where: { id },
      data: {
        meals: meals as any,
        actualMacros: actualMacros as any,
      },
    });

    return NextResponse.json({
      updatedMeal: meal,
      actualMacros,
    });
  } catch (error) {
    console.error('Error updating grams:', error);
    return NextResponse.json(
      { error: 'Failed to update grams' },
      { status: 500 }
    );
  }
}
