import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  MealConfig,
  MacroTargets,
  GeneratedMeal,
} from '@/lib/types/meal-plan-generator';
import { DEFAULT_MEAL_CONFIGS, VEGETABLE_GRAMS } from '@/lib/types/meal-plan-generator';
import { distributeMacros } from '@/lib/calculations/meal-plan-generator';

/**
 * POST /api/meal-plan/create-empty
 * Create an empty meal plan for manual editing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nutritionPlanId, mealConfigs } = body as {
      nutritionPlanId: string;
      mealConfigs?: MealConfig[];
    };

    if (!nutritionPlanId) {
      return NextResponse.json(
        { error: 'nutritionPlanId is required' },
        { status: 400 }
      );
    }

    // Fetch nutrition plan
    const nutritionPlan = await prisma.clientNutritionPlan.findUnique({
      where: { id: nutritionPlanId },
    });

    if (!nutritionPlan) {
      return NextResponse.json(
        { error: 'Nutrition plan not found' },
        { status: 404 }
      );
    }

    // Check coach access
    if (nutritionPlan.coachId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'You do not have access to this plan' },
        { status: 403 }
      );
    }

    // Check if a meal plan already exists for this nutrition plan
    const existingPlan = await prisma.generatedMealPlan.findFirst({
      where: { nutritionPlanId },
    });

    if (existingPlan) {
      // Return existing plan instead of creating duplicate
      return NextResponse.json({
        id: existingPlan.id,
        meals: existingPlan.meals,
        targetMacros: existingPlan.targetMacros,
        actualMacros: existingPlan.actualMacros,
      });
    }

    // Use provided configs or defaults
    const configs = mealConfigs || DEFAULT_MEAL_CONFIGS;

    // Get daily macro targets from nutrition plan
    const dailyMacros: MacroTargets = {
      protein: Number(nutritionPlan.proteinGrams),
      carbs: Number(nutritionPlan.carbGrams),
      fat: Number(nutritionPlan.fatGrams),
      kcal: Number(nutritionPlan.dailyCalorieTarget),
    };

    // Distribute macros across meals
    const macroDistribution = distributeMacros(dailyMacros, configs);

    // Create empty meals with target macros
    const meals: GeneratedMeal[] = configs.map((config, index) => {
      const mealMacros = macroDistribution.get(index) || { protein: 0, carbs: 0, fat: 0, kcal: 0 };
      const hasVegetables = config.type === 'lunch' || config.type === 'middag';

      return {
        type: config.type,
        index,
        items: [], // Empty - user will add foods manually
        vegetableGrams: hasVegetables ? VEGETABLE_GRAMS : 0,
        totalMacros: { protein: 0, carbs: 0, fat: 0, kcal: 0 },
        targetMacros: mealMacros, // Per-meal target for reference
      };
    });

    // Save to database
    const generatedPlan = await prisma.generatedMealPlan.create({
      data: {
        nutritionPlanId,
        mealConfigs: configs as any,
        meals: meals as any,
        targetMacros: dailyMacros as any,
        actualMacros: { protein: 0, carbs: 0, fat: 0, kcal: 0 } as any,
      },
    });

    return NextResponse.json({
      id: generatedPlan.id,
      meals,
      targetMacros: dailyMacros,
      actualMacros: { protein: 0, carbs: 0, fat: 0, kcal: 0 },
    });
  } catch (error) {
    console.error('Error creating empty meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to create meal plan' },
      { status: 500 }
    );
  }
}
