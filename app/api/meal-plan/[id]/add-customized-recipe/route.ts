import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  MacroCategory,
  GeneratedMeal,
  GeneratedMealItem,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';
import {
  calculateMealTotalMacros,
  calculatePlanTotalMacros,
} from '@/lib/calculations/meal-plan-generator';

// Determine macro category based on dominant macro (per 100g values)
function determineMacroCategory(macros: CalculatedMacros, grams: number): MacroCategory {
  // Convert to per 100g values for categorization
  const factor = 100 / grams;
  const protein = macros.protein * factor;
  const carbs = macros.carbs * factor;
  const fat = macros.fat * factor;

  // Threshold-based categorization
  if (protein >= 10 && protein > carbs && protein > fat) return 'protein';
  if (carbs >= 15 && carbs > protein * 1.5) return 'carb';
  if (fat >= 10 && fat > carbs) return 'fat';

  // Fallback: highest macro wins
  if (protein >= carbs && protein >= fat) return 'protein';
  if (carbs >= protein && carbs >= fat) return 'carb';
  return 'fat';
}

interface CustomizedIngredient {
  productId: string;
  productName: string;
  grams: number;
  macros: CalculatedMacros;
  source: 'product' | 'slv';
  image?: string | null;
}

interface RequestBody {
  mealIndex: number;
  recipeId: string;
  recipeTitle: string;
  customizedIngredients: CustomizedIngredient[];
}

/**
 * POST /api/meal-plan/[id]/add-customized-recipe
 * Add customized recipe ingredients to a meal in the plan
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
    const body = (await request.json()) as RequestBody;
    const { mealIndex, recipeId, recipeTitle, customizedIngredients } = body;

    // Validate required fields
    if (
      mealIndex === undefined ||
      !recipeId ||
      !recipeTitle ||
      !customizedIngredients ||
      customizedIngredients.length === 0
    ) {
      return NextResponse.json(
        { error: 'mealIndex, recipeId, recipeTitle, and customizedIngredients are required' },
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
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
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

    // Get current meals from plan
    const meals = generatedPlan.meals as unknown as GeneratedMeal[];

    if (mealIndex < 0 || mealIndex >= meals.length) {
      return NextResponse.json({ error: 'Invalid meal index' }, { status: 400 });
    }

    const meal = meals[mealIndex];

    // Create GeneratedMealItem for each customized ingredient
    const newItems: GeneratedMealItem[] = customizedIngredients.map((ing) => {
      const category = determineMacroCategory(ing.macros, ing.grams);

      return {
        category,
        selected: {
          foodId: ing.productId,
          name: ing.productName,
          grams: ing.grams,
          macros: ing.macros,
          image: ing.image || null,
        },
        alternatives: [],
        isAlternative: false, // All items from recipe are main sources
      };
    });

    // Add all new items to the meal
    const updatedMeal: GeneratedMeal = {
      ...meal,
      items: [...meal.items, ...newItems],
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
      success: true,
      updatedMeal,
      actualMacros,
      message: `${recipeTitle} tillagt med ${customizedIngredients.length} ingredienser`,
    });
  } catch (error) {
    console.error('Error adding customized recipe:', error);
    return NextResponse.json(
      { error: 'Failed to add customized recipe' },
      { status: 500 }
    );
  }
}
