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
    const { mealIndex, category, productId, grams, macros, isAlternative } = body as {
      mealIndex: number;
      category: MacroCategory;
      productId: string;
      grams: number;
      macros: CalculatedMacros;
      isAlternative?: boolean;
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

    // Fetch the product (or handle SLV products which have ID like "slv-123")
    let product: {
      id: string;
      name: string;
      kcal: number;
      protein: number;
      carbs: number;
      fat: number;
      macroCategory: string | null;
      image: string | null;
    } | null = null;

    if (productId.startsWith('slv-')) {
      // SLV product - we don't have it in our database, use the macros from the request
      // The name should be sent in the request body for SLV products
      product = {
        id: productId,
        name: body.productName || 'Livsmedelsverket produkt',
        kcal: macros.kcal,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        macroCategory: category,
        image: null,
      };
    } else {
      // Regular product from database
      const dbProduct = await prisma.product.findUnique({
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

      if (dbProduct) {
        product = {
          id: dbProduct.id,
          name: dbProduct.name,
          kcal: Number(dbProduct.kcal),
          protein: Number(dbProduct.protein),
          carbs: Number(dbProduct.carbs),
          fat: Number(dbProduct.fat),
          macroCategory: dbProduct.macroCategory,
          image: dbProduct.image,
        };
      }
    }

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

    // Create the new item
    const newItem = {
      category,
      selected: {
        foodId: product.id,
        name: product.name,
        grams: grams,
        macros: macros,
        image: product.image,
      },
      alternatives: [],
      isAlternative: isAlternative || false,
    };

    // If isAlternative is true, always add as a new item (don't replace)
    // Otherwise, find existing item to update or add new
    let updatedItems;
    if (isAlternative) {
      // Add as alternative (new item marked as alternative)
      updatedItems = [...meal.items, newItem];
    } else {
      // Find existing item without isAlternative flag to replace
      const itemIndex = meal.items.findIndex(
        (item) => item.category === category && !item.isAlternative
      );

      if (itemIndex >= 0) {
        // Update existing primary item
        updatedItems = meal.items.map((item, idx) =>
          idx === itemIndex ? newItem : item
        );
      } else {
        // Add new primary item
        updatedItems = [...meal.items, newItem];
      }
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
