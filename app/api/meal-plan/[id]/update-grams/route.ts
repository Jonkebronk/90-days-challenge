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

    // Check access - coach or client can update
    const userId = (session.user as any).id;
    const isCoach = generatedPlan.nutritionPlan.coachId === userId;
    const isClient = generatedPlan.nutritionPlan.clientId === userId;

    if (!isCoach && !isClient) {
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

    // Get per-100g values for the food item
    let per100g = { protein: 0, carbs: 0, fat: 0, kcal: 0 };

    // Debug logging
    console.log('Update grams request:', {
      foodId: item.selected.foodId,
      oldGrams: item.selected.grams,
      newGrams: grams,
      currentMacros: item.selected.macros,
    });

    // Check if this is an SLV food (id starts with "slv-")
    if (item.selected.foodId.startsWith('slv-')) {
      // For SLV foods, calculate per-100g from stored macros and grams
      const oldGrams = item.selected.grams || 100;
      if (oldGrams > 0 && item.selected.macros.kcal > 0) {
        per100g = {
          protein: (item.selected.macros.protein / oldGrams) * 100,
          carbs: (item.selected.macros.carbs / oldGrams) * 100,
          fat: (item.selected.macros.fat / oldGrams) * 100,
          kcal: (item.selected.macros.kcal / oldGrams) * 100,
        };
      }
    } else {
      // Fetch from database for regular food items
      // Try Product table first (main product database)
      const product = await prisma.product.findUnique({
        where: { id: item.selected.foodId },
      });

      if (product) {
        per100g = {
          protein: Number(product.protein || 0),
          carbs: Number(product.carbs || 0),
          fat: Number(product.fat || 0),
          kcal: Number(product.kcal || 0),
        };
        console.log('Found product:', { id: product.id, name: product.name, per100g });
      } else {
        // Try FoodItem table (legacy)
        const foodItem = await prisma.foodItem.findUnique({
          where: { id: item.selected.foodId },
        });

        if (foodItem) {
          per100g = {
            protein: Number(foodItem.proteinG || 0),
            carbs: Number(foodItem.carbsG || 0),
            fat: Number(foodItem.fatG || 0),
            kcal: Number(foodItem.calories || 0),
          };
          console.log('Found foodItem:', { id: foodItem.id, name: foodItem.name, per100g });
        } else {
          // Fallback: calculate from existing macros
          console.log('Fallback: using existing macros to calculate per100g');
          const oldGrams = item.selected.grams || 100;
          if (oldGrams > 0 && item.selected.macros.kcal > 0) {
            per100g = {
              protein: (item.selected.macros.protein / oldGrams) * 100,
              carbs: (item.selected.macros.carbs / oldGrams) * 100,
              fat: (item.selected.macros.fat / oldGrams) * 100,
              kcal: (item.selected.macros.kcal / oldGrams) * 100,
            };
          }
        }
      }
    }

    console.log('Calculated per100g:', per100g);

    // Calculate new macros based on new grams
    const factor = grams / 100;
    const newMacros: CalculatedMacros = {
      protein: Math.round(per100g.protein * factor * 10) / 10,
      carbs: Math.round(per100g.carbs * factor * 10) / 10,
      fat: Math.round(per100g.fat * factor * 10) / 10,
      kcal: Math.round(per100g.kcal * factor),
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
