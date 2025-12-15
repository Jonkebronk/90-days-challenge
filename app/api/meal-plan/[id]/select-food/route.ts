import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  MacroCategory,
  GeneratedMeal,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';
import {
  calculateMealTotalMacros,
  calculatePlanTotalMacros,
} from '@/lib/calculations/meal-plan-generator';

/**
 * PUT /api/meal-plan/[id]/select-food
 * Select a specific food from the product library for a meal
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
    const { mealIndex, category, productId, grams, macros } = body as {
      mealIndex: number;
      category: MacroCategory;
      productId: string;
      grams: number;
      macros: CalculatedMacros;
    };

    // Validate required fields
    if (
      mealIndex === undefined ||
      !category ||
      !productId ||
      grams === undefined ||
      !macros
    ) {
      return NextResponse.json(
        { error: 'mealIndex, category, productId, grams, and macros are required' },
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

    // Fetch the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
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

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get current meals from plan
    const meals = generatedPlan.meals as unknown as GeneratedMeal[];

    if (mealIndex < 0 || mealIndex >= meals.length) {
      return NextResponse.json(
        { error: 'Invalid meal index' },
        { status: 400 }
      );
    }

    const meal = meals[mealIndex];

    // Find the item to update
    const itemIndex = meal.items.findIndex((item) => item.category === category);
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: `No ${category} item found in this meal` },
        { status: 400 }
      );
    }

    // Update the meal item with the selected product
    const updatedMeal: GeneratedMeal = {
      ...meal,
      items: meal.items.map((item, idx) => {
        if (idx === itemIndex) {
          return {
            ...item,
            selected: {
              foodId: product.id,
              name: product.name,
              grams: grams,
              macros: macros,
            },
            // Keep existing alternatives
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
      actualMacros,
      feedback: {
        type: 'success',
        message: `${product.name} tillagd (${grams}g)`,
      },
    });
  } catch (error) {
    console.error('Error selecting food:', error);
    return NextResponse.json(
      { error: 'Failed to select food' },
      { status: 500 }
    );
  }
}
