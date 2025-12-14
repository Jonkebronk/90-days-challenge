import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  MacroCategory,
  MealType,
  GeneratedMeal,
  GeneratedMealPlan,
  FoodItemForGenerator,
} from '@/lib/types/meal-plan-generator';
import {
  calculateSwap,
  calculateMealTotalMacros,
  calculatePlanTotalMacros,
} from '@/lib/calculations/meal-plan-generator';

/**
 * PUT /api/meal-plan/[id]/swap
 * Swap a food item in a generated meal plan
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
    const { mealIndex, category, newFoodId } = body as {
      mealIndex: number;
      category: MacroCategory;
      newFoodId: string;
    };

    if (mealIndex === undefined || !category || !newFoodId) {
      return NextResponse.json(
        { error: 'mealIndex, category, and newFoodId are required' },
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
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Check coach access
    if (generatedPlan.nutritionPlan.coachId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'You do not have access to this plan' },
        { status: 403 }
      );
    }

    // Fetch the new food
    const newFood = await prisma.foodItem.findUnique({
      where: { id: newFoodId },
      select: {
        id: true,
        name: true,
        calories: true,
        proteinG: true,
        carbsG: true,
        fatG: true,
        macroCategory: true,
        mealTypes: true,
        isRecommended: true,
      },
    });

    if (!newFood) {
      return NextResponse.json(
        { error: 'Food item not found' },
        { status: 404 }
      );
    }

    // Check if food category matches
    if (newFood.macroCategory !== category) {
      return NextResponse.json(
        {
          error: `Fel kategori: ${newFood.name} är en ${newFood.macroCategory}-källa, inte ${category}`,
          feedback: {
            type: 'error',
            message: `${newFood.name} är en ${newFood.macroCategory}-källa, inte ${category}. Vill du lägga till den som ${newFood.macroCategory}-källa istället?`,
          },
        },
        { status: 400 }
      );
    }

    const newFoodForGenerator: FoodItemForGenerator = {
      id: newFood.id,
      name: newFood.name,
      calories: newFood.calories ? Number(newFood.calories) : 0,
      proteinG: newFood.proteinG ? Number(newFood.proteinG) : 0,
      carbsG: newFood.carbsG ? Number(newFood.carbsG) : 0,
      fatG: newFood.fatG ? Number(newFood.fatG) : 0,
      macroCategory: newFood.macroCategory as MacroCategory,
      mealTypes: (newFood.mealTypes || []) as MealType[],
      isRecommended: newFood.isRecommended,
    };

    // Get current meals from plan
    const meals = generatedPlan.meals as unknown as GeneratedMeal[];

    if (mealIndex < 0 || mealIndex >= meals.length) {
      return NextResponse.json(
        { error: 'Invalid meal index' },
        { status: 400 }
      );
    }

    const meal = meals[mealIndex];

    // Find the item to swap
    const itemIndex = meal.items.findIndex((item) => item.category === category);
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: `No ${category} item found in this meal` },
        { status: 400 }
      );
    }

    const currentItem = meal.items[itemIndex];

    // Calculate swap result
    const swapResult = calculateSwap(
      currentItem.selected,
      newFoodForGenerator,
      category
    );

    // Update the meal with new food
    const updatedMeal: GeneratedMeal = {
      ...meal,
      items: meal.items.map((item, idx) => {
        if (idx === itemIndex) {
          return {
            ...item,
            selected: swapResult.updatedMeal.items[0].selected,
            // Keep original alternatives
          };
        }
        return item;
      }),
    };

    // Recalculate meal totals
    updatedMeal.totalMacros = calculateMealTotalMacros(
      updatedMeal.items,
      updatedMeal.sauce
    );

    // Update meals array
    const updatedMeals = [...meals];
    updatedMeals[mealIndex] = updatedMeal;

    // Recalculate plan totals
    const actualMacros = calculatePlanTotalMacros(updatedMeals);

    // Save to database
    await prisma.generatedMealPlan.update({
      where: { id },
      data: {
        meals: updatedMeals as any,
        actualMacros: actualMacros as any,
      },
    });

    return NextResponse.json({
      updatedMeal,
      feedback: swapResult.feedback,
      actualMacros,
    });
  } catch (error) {
    console.error('Error swapping food:', error);
    return NextResponse.json(
      { error: 'Failed to swap food' },
      { status: 500 }
    );
  }
}
