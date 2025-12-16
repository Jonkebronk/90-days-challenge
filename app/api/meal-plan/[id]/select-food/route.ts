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
        image: true,
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

    // Find the item to update, or create a new one if it doesn't exist
    const itemIndex = meal.items.findIndex((item) => item.category === category);

    // Fetch alternative products (same macroCategory, different product)
    const alternativeProducts = await prisma.product.findMany({
      where: {
        macroCategory: category,
        id: { not: productId },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        kcal: true,
        protein: true,
        carbs: true,
        fat: true,
        image: true,
      },
      take: 3,
      orderBy: { name: 'asc' },
    });

    // Calculate alternatives with scaled grams to match similar macros
    const alternatives = alternativeProducts.map((alt) => {
      // Scale to match same primary macro as selected product
      let scaledGrams = grams;
      if (category === 'protein' && alt.protein > 0) {
        scaledGrams = Math.round((macros.protein / (Number(alt.protein) / 100)) * 100) / 100 * 100;
      } else if (category === 'carb' && alt.carbs > 0) {
        scaledGrams = Math.round((macros.carbs / (Number(alt.carbs) / 100)) * 100) / 100 * 100;
      } else if (category === 'fat' && alt.fat > 0) {
        scaledGrams = Math.round((macros.fat / (Number(alt.fat) / 100)) * 100) / 100 * 100;
      }

      // Ensure reasonable grams (10-500g range)
      scaledGrams = Math.max(10, Math.min(500, Math.round(scaledGrams)));

      const altMacros = {
        protein: Math.round((Number(alt.protein) / 100) * scaledGrams * 10) / 10,
        carbs: Math.round((Number(alt.carbs) / 100) * scaledGrams * 10) / 10,
        fat: Math.round((Number(alt.fat) / 100) * scaledGrams * 10) / 10,
        kcal: Math.round((Number(alt.kcal) / 100) * scaledGrams),
      };

      return {
        foodId: alt.id,
        name: alt.name,
        grams: scaledGrams,
        macros: altMacros,
        image: alt.image,
      };
    });

    // Create the new/updated item
    const newItem = {
      category,
      selected: {
        foodId: product.id,
        name: product.name,
        grams: grams,
        macros: macros,
        image: product.image,
      },
      alternatives,
    };

    // Update the meal - either replace existing item or add new one
    let updatedItems;
    if (itemIndex >= 0) {
      // Update existing item
      updatedItems = meal.items.map((item, idx) =>
        idx === itemIndex ? newItem : item
      );
    } else {
      // Add new item
      updatedItems = [...meal.items, newItem];
    }

    const updatedMeal: GeneratedMeal = {
      ...meal,
      items: updatedItems,
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
