import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { GeneratedMeal, MacroCategory } from '@/lib/types/meal-plan-generator';

/**
 * POST /api/meal-plan/[id]/remove-food
 * Remove a food item from a meal by category
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
    const body = await request.json();
    const { mealIndex, category, foodId } = body as {
      mealIndex: number;
      category: MacroCategory;
      foodId?: string;  // Optional - if provided, remove specific food; otherwise remove first in category
    };

    if (typeof mealIndex !== 'number' || !category) {
      return NextResponse.json(
        { error: 'mealIndex and category are required' },
        { status: 400 }
      );
    }

    // Fetch the meal plan
    const mealPlan = await prisma.generatedMealPlan.findUnique({
      where: { id },
      include: {
        nutritionPlan: {
          select: { coachId: true },
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Check coach access
    if (mealPlan.nutritionPlan.coachId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'You do not have access to this plan' },
        { status: 403 }
      );
    }

    const meals = mealPlan.meals as unknown as GeneratedMeal[];

    if (mealIndex < 0 || mealIndex >= meals.length) {
      return NextResponse.json(
        { error: 'Invalid meal index' },
        { status: 400 }
      );
    }

    const meal = meals[mealIndex];

    // Find the item to remove - either by foodId or by category
    let itemIndex: number;
    if (foodId) {
      // Remove specific food by ID
      itemIndex = meal.items.findIndex((item) => item.selected.foodId === foodId);
    } else {
      // Fallback: remove first item in category
      itemIndex = meal.items.findIndex((item) => item.category === category);
    }

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Food item not found in this meal' },
        { status: 404 }
      );
    }

    // Get the item to subtract its macros
    const removedItem = meal.items[itemIndex];

    // Remove the item
    const updatedItems = meal.items.filter((_, idx) => idx !== itemIndex);

    // Recalculate meal macros
    const updatedMealMacros = {
      protein: Math.max(0, meal.totalMacros.protein - removedItem.selected.macros.protein),
      carbs: Math.max(0, meal.totalMacros.carbs - removedItem.selected.macros.carbs),
      fat: Math.max(0, meal.totalMacros.fat - removedItem.selected.macros.fat),
      kcal: Math.max(0, meal.totalMacros.kcal - removedItem.selected.macros.kcal),
    };

    // Update meal
    meals[mealIndex] = {
      ...meal,
      items: updatedItems,
      totalMacros: updatedMealMacros,
    };

    // Recalculate total actual macros
    const actualMacros = meals.reduce(
      (acc, m) => ({
        protein: acc.protein + m.totalMacros.protein,
        carbs: acc.carbs + m.totalMacros.carbs,
        fat: acc.fat + m.totalMacros.fat,
        kcal: acc.kcal + m.totalMacros.kcal,
      }),
      { protein: 0, carbs: 0, fat: 0, kcal: 0 }
    );

    // Update the database
    const updatedPlan = await prisma.generatedMealPlan.update({
      where: { id },
      data: {
        meals: meals as any,
        actualMacros: actualMacros as any,
      },
    });

    return NextResponse.json({
      success: true,
      meals: updatedPlan.meals,
      actualMacros: updatedPlan.actualMacros,
    });
  } catch (error) {
    console.error('Error removing food:', error);
    return NextResponse.json(
      { error: 'Failed to remove food' },
      { status: 500 }
    );
  }
}
