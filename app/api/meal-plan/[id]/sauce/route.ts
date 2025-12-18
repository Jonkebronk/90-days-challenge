import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  MacroCategory,
  MealType,
  MealConfig,
  GeneratedMeal,
  GeneratedMealPlan,
  FoodWithGrams,
} from '@/lib/types/meal-plan-generator';
import {
  calculateMacrosForGrams,
  calculateMealTotalMacros,
  adjustForSauce,
} from '@/lib/calculations/meal-plan-generator';

/**
 * POST /api/meal-plan/[id]/sauce
 * Add sauce to a meal and adjust snack fat sources
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
    const { mealIndex, sauceId, grams } = body as {
      mealIndex: number;
      sauceId: string;
      grams: number;
    };

    if (mealIndex === undefined || !sauceId || !grams) {
      return NextResponse.json(
        { error: 'mealIndex, sauceId, and grams are required' },
        { status: 400 }
      );
    }

    if (grams <= 0 || grams > 100) {
      return NextResponse.json(
        { error: 'Grams must be between 1 and 100' },
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

    // Fetch the sauce from Product model
    const sauce = await prisma.product.findUnique({
      where: { id: sauceId },
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

    if (!sauce) {
      return NextResponse.json(
        { error: 'Sauce not found' },
        { status: 404 }
      );
    }

    // Verify it's a sauce
    if (sauce.macroCategory !== 'sauce') {
      return NextResponse.json(
        { error: `${sauce.name} är inte en sås` },
        { status: 400 }
      );
    }

    // Get current meals and configs from plan
    const meals = generatedPlan.meals as unknown as GeneratedMeal[];
    const mealConfigs = generatedPlan.mealConfigs as unknown as MealConfig[];
    const targetMacros = generatedPlan.targetMacros as unknown as {
      protein: number;
      carbs: number;
      fat: number;
      kcal: number;
    };

    if (mealIndex < 0 || mealIndex >= meals.length) {
      return NextResponse.json(
        { error: 'Invalid meal index' },
        { status: 400 }
      );
    }

    const meal = meals[mealIndex];

    // Check meal type allows sauce (lunch/middag)
    if (meal.type !== 'lunch' && meal.type !== 'middag') {
      return NextResponse.json(
        { error: 'Sås kan endast läggas till på lunch eller middag' },
        { status: 400 }
      );
    }

    // Calculate sauce macros
    const sauceMacros = calculateMacrosForGrams(
      {
        id: sauce.id,
        name: sauce.name,
        calories: sauce.kcal ? Number(sauce.kcal) : 0,
        proteinG: sauce.protein ? Number(sauce.protein) : 0,
        carbsG: sauce.carbs ? Number(sauce.carbs) : 0,
        fatG: sauce.fat ? Number(sauce.fat) : 0,
        macroCategory: 'sauce',
        mealTypes: [],
        isRecommended: false,
      },
      grams
    );

    const sauceWithGrams: FoodWithGrams = {
      foodId: sauce.id,
      name: sauce.name,
      grams,
      macros: sauceMacros,
    };

    // Update meal with sauce
    const updatedMeal: GeneratedMeal = {
      ...meal,
      sauce: sauceWithGrams,
    };
    updatedMeal.totalMacros = calculateMealTotalMacros(
      updatedMeal.items,
      updatedMeal.sauce
    );

    // Update meals array
    const updatedMeals = [...meals];
    updatedMeals[mealIndex] = updatedMeal;

    // Create plan object for sauce adjustment
    const planForAdjustment: GeneratedMealPlan = {
      nutritionPlanId: generatedPlan.nutritionPlanId,
      mealConfigs,
      meals: updatedMeals,
      targetMacros,
      actualMacros: generatedPlan.actualMacros as unknown as {
        protein: number;
        carbs: number;
        fat: number;
        kcal: number;
      },
    };

    // Adjust meal plan to compensate for sauce macros
    const sauceResult = adjustForSauce(
      planForAdjustment,
      sauceMacros.fat,
      mealIndex,
      sauceMacros // Pass full macros for subtraction
    );

    // Save to database
    await prisma.generatedMealPlan.update({
      where: { id },
      data: {
        meals: sauceResult.updatedPlan.meals as any,
        actualMacros: sauceResult.updatedPlan.actualMacros as any,
      },
    });

    return NextResponse.json({
      updatedPlan: {
        meals: sauceResult.updatedPlan.meals,
        actualMacros: sauceResult.updatedPlan.actualMacros,
      },
      adjustments: sauceResult.adjustments,
      warning: sauceResult.warning,
    });
  } catch (error) {
    console.error('Error adding sauce:', error);
    return NextResponse.json(
      { error: 'Failed to add sauce' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meal-plan/[id]/sauce
 * Remove sauce from a meal
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
    const { searchParams } = new URL(request.url);
    const mealIndex = parseInt(searchParams.get('mealIndex') || '-1', 10);

    if (mealIndex < 0) {
      return NextResponse.json(
        { error: 'mealIndex is required' },
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

    // Get current meals
    const meals = generatedPlan.meals as unknown as GeneratedMeal[];

    if (mealIndex >= meals.length) {
      return NextResponse.json(
        { error: 'Invalid meal index' },
        { status: 400 }
      );
    }

    // Remove sauce from meal
    const updatedMeal: GeneratedMeal = {
      ...meals[mealIndex],
      sauce: undefined,
    };
    updatedMeal.totalMacros = calculateMealTotalMacros(updatedMeal.items);

    // Update meals array
    const updatedMeals = [...meals];
    updatedMeals[mealIndex] = updatedMeal;

    // Recalculate totals
    const actualMacros = {
      protein: 0,
      carbs: 0,
      fat: 0,
      kcal: 0,
    };
    updatedMeals.forEach((meal) => {
      actualMacros.protein += meal.totalMacros.protein;
      actualMacros.carbs += meal.totalMacros.carbs;
      actualMacros.fat += meal.totalMacros.fat;
      actualMacros.kcal += meal.totalMacros.kcal;
    });

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
    });
  } catch (error) {
    console.error('Error removing sauce:', error);
    return NextResponse.json(
      { error: 'Failed to remove sauce' },
      { status: 500 }
    );
  }
}
