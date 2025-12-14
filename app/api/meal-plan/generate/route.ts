import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  MealConfig,
  MacroCategory,
  MealType,
  MacroTargets,
  GeneratedMeal,
  GeneratedMealItem,
  FoodItemForGenerator,
} from '@/lib/types/meal-plan-generator';
import {
  VEGETABLE_GRAMS,
  ALTERNATIVES_COUNT,
} from '@/lib/types/meal-plan-generator';
import {
  distributeMacros,
  generateMealItem,
  calculateMealTotalMacros,
  calculatePlanTotalMacros,
  validateMealConfigs,
} from '@/lib/calculations/meal-plan-generator';

/**
 * POST /api/meal-plan/generate
 * Generate a meal plan based on nutrition plan and meal configs
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
      mealConfigs: MealConfig[];
    };

    if (!nutritionPlanId) {
      return NextResponse.json(
        { error: 'nutritionPlanId is required' },
        { status: 400 }
      );
    }

    if (!mealConfigs || !Array.isArray(mealConfigs) || mealConfigs.length === 0) {
      return NextResponse.json(
        { error: 'mealConfigs array is required' },
        { status: 400 }
      );
    }

    // Validate meal configs
    const validation = validateMealConfigs(mealConfigs);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid meal configs', warnings: validation.warnings },
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

    // Get daily macro targets from nutrition plan
    const dailyMacros: MacroTargets = {
      protein: Number(nutritionPlan.proteinGrams),
      carbs: Number(nutritionPlan.carbGrams),
      fat: Number(nutritionPlan.fatGrams),
      kcal: Number(nutritionPlan.dailyCalorieTarget),
    };

    // Distribute macros across meals
    const macroDistribution = distributeMacros(dailyMacros, mealConfigs);

    // Fetch foods for each category
    const [proteinFoods, carbFoods, fatFoods, vegetableFoods] = await Promise.all([
      fetchFoodsForCategory('protein'),
      fetchFoodsForCategory('carb'),
      fetchFoodsForCategory('fat'),
      fetchFoodsForCategory('vegetable'),
    ]);

    // Generate meals
    const meals: GeneratedMeal[] = [];
    let mealIndex = 0;

    for (const [index, config] of mealConfigs.entries()) {
      const mealMacros = macroDistribution.get(index);
      if (!mealMacros) continue;

      const items: GeneratedMealItem[] = [];

      // Add protein source if enabled
      if (config.includeProtein && mealMacros.protein > 0) {
        const mealTypeFoods = filterFoodsForMealType(proteinFoods, config.type);
        const proteinItem = generateMealItem(
          mealTypeFoods,
          mealMacros.protein,
          'protein',
          'protein'
        );
        if (proteinItem) items.push(proteinItem);
      }

      // Add carb source if enabled
      if (config.includeCarbs && mealMacros.carbs > 0) {
        const mealTypeFoods = filterFoodsForMealType(carbFoods, config.type);
        const carbItem = generateMealItem(
          mealTypeFoods,
          mealMacros.carbs,
          'carb',
          'carbs'
        );
        if (carbItem) items.push(carbItem);
      }

      // Add fat source if enabled
      if (config.includeFat && mealMacros.fat > 0) {
        const mealTypeFoods = filterFoodsForMealType(fatFoods, config.type);
        const fatItem = generateMealItem(
          mealTypeFoods,
          mealMacros.fat,
          'fat',
          'fat'
        );
        if (fatItem) items.push(fatItem);
      }

      // Add vegetables for lunch/middag
      const hasVegetables = config.type === 'lunch' || config.type === 'middag';

      const meal: GeneratedMeal = {
        type: config.type,
        index: mealIndex++,
        items,
        vegetableGrams: hasVegetables ? VEGETABLE_GRAMS : 0,
        totalMacros: calculateMealTotalMacros(items),
      };

      meals.push(meal);
    }

    // Calculate actual totals
    const actualMacros = calculatePlanTotalMacros(meals);

    // Save to database
    const generatedPlan = await prisma.generatedMealPlan.create({
      data: {
        nutritionPlanId,
        mealConfigs: mealConfigs as any,
        meals: meals as any,
        targetMacros: dailyMacros as any,
        actualMacros: actualMacros as any,
      },
    });

    return NextResponse.json({
      id: generatedPlan.id,
      meals,
      targetMacros: dailyMacros,
      actualMacros,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

/**
 * Fetch foods for a specific macro category
 * Uses Product model instead of FoodItem
 */
async function fetchFoodsForCategory(
  category: MacroCategory
): Promise<FoodItemForGenerator[]> {
  const products = await prisma.product.findMany({
    where: {
      macroCategory: category,
    },
    select: {
      id: true,
      name: true,
      kcal: true,
      protein: true,
      carbs: true,
      fat: true,
      macroCategory: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    calories: product.kcal ? Number(product.kcal) : 0,
    proteinG: product.protein ? Number(product.protein) : 0,
    carbsG: product.carbs ? Number(product.carbs) : 0,
    fatG: product.fat ? Number(product.fat) : 0,
    macroCategory: product.macroCategory as MacroCategory,
    mealTypes: [] as MealType[], // Product doesn't have mealTypes, allow all meals
    isRecommended: false, // Product doesn't have isRecommended
  }));
}

/**
 * Filter foods that are suitable for a specific meal type
 */
function filterFoodsForMealType(
  foods: FoodItemForGenerator[],
  mealType: MealType
): FoodItemForGenerator[] {
  // If food has mealTypes specified, filter by it
  // If mealTypes is empty, assume food is suitable for all meals
  return foods.filter((food) => {
    if (!food.mealTypes || food.mealTypes.length === 0) return true;
    return food.mealTypes.includes(mealType);
  });
}
