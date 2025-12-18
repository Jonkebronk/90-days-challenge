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

    // Check access - allow both coach and assigned client
    const userId = (session.user as any).id;
    const isCoach = generatedPlan.nutritionPlan.coachId === userId;
    const isClient = generatedPlan.nutritionPlan.clientId === userId;

    if (!isCoach && !isClient) {
      return NextResponse.json(
        { error: 'You do not have access to this plan' },
        { status: 403 }
      );
    }

    // Fetch the new food from Product model
    const newFood = await prisma.product.findUnique({
      where: { id: newFoodId },
      select: {
        id: true,
        name: true,
        kcal: true,
        protein: true,
        carbs: true,
        fat: true,
        macroCategory: true,
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
      calories: newFood.kcal ? Number(newFood.kcal) : 0,
      proteinG: newFood.protein ? Number(newFood.protein) : 0,
      carbsG: newFood.carbs ? Number(newFood.carbs) : 0,
      fatG: newFood.fat ? Number(newFood.fat) : 0,
      macroCategory: newFood.macroCategory as MacroCategory,
      mealTypes: [] as MealType[], // Product doesn't have mealTypes
      isRecommended: false, // Product doesn't have isRecommended
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

    // Check if the new food is one of the alternatives
    const alternativeIndex = currentItem.alternatives.findIndex(
      (alt) => alt.foodId === newFoodId
    );
    const isSwappingWithAlternative = alternativeIndex !== -1;

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
          const newSelected = swapResult.updatedMeal.items[0].selected;

          // Build new alternatives list
          let newAlternatives = [...item.alternatives];

          if (isSwappingWithAlternative) {
            // Remove the new selection from alternatives
            newAlternatives = newAlternatives.filter(
              (alt) => alt.foodId !== newFoodId
            );
            // Add the old selected to alternatives
            newAlternatives.unshift({
              foodId: item.selected.foodId,
              name: item.selected.name,
              grams: item.selected.grams,
              macros: item.selected.macros,
              image: item.selected.image,
            });
          }

          return {
            ...item,
            selected: newSelected,
            alternatives: newAlternatives,
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
