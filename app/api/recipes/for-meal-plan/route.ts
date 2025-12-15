import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { MealType, RecipeSwapOption, CalculatedMacros } from '@/lib/types/meal-plan-generator';
import { MEAL_TYPE_TO_RECIPE_TYPE } from '@/lib/types/meal-plan-generator';
import { createRecipeSwapOption } from '@/lib/calculations/meal-plan-generator';

/**
 * GET /api/recipes/for-meal-plan
 * Fetch recipes suitable for a specific meal type with scaling calculations
 *
 * Query params:
 * - mealType: frukost, lunch, middag, mellanmål, kvällsmål
 * - targetKcal, targetProtein, targetCarbs, targetFat: Target macros
 * - currentKcal, currentProtein, currentCarbs, currentFat: Current meal macros (optional)
 * - limit: Max number of recipes (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const mealType = searchParams.get('mealType') as MealType;
    const targetKcal = parseFloat(searchParams.get('targetKcal') || '0');
    const targetProtein = parseFloat(searchParams.get('targetProtein') || '0');
    const targetCarbs = parseFloat(searchParams.get('targetCarbs') || '0');
    const targetFat = parseFloat(searchParams.get('targetFat') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Optional current macros for comparison
    const currentKcal = parseFloat(searchParams.get('currentKcal') || '0');
    const currentProtein = parseFloat(searchParams.get('currentProtein') || '0');
    const currentCarbs = parseFloat(searchParams.get('currentCarbs') || '0');
    const currentFat = parseFloat(searchParams.get('currentFat') || '0');

    if (!mealType || !MEAL_TYPE_TO_RECIPE_TYPE[mealType]) {
      return NextResponse.json(
        { error: 'Invalid or missing mealType' },
        { status: 400 }
      );
    }

    if (targetKcal <= 0) {
      return NextResponse.json(
        { error: 'targetKcal must be greater than 0' },
        { status: 400 }
      );
    }

    const targetMacros: CalculatedMacros = {
      kcal: targetKcal,
      protein: targetProtein,
      carbs: targetCarbs,
      fat: targetFat,
    };

    const currentMacros: CalculatedMacros | undefined = currentKcal > 0
      ? {
          kcal: currentKcal,
          protein: currentProtein,
          carbs: currentCarbs,
          fat: currentFat,
        }
      : undefined;

    // Map Swedish meal type to recipe mealType values
    const recipeMealTypes = MEAL_TYPE_TO_RECIPE_TYPE[mealType];

    // Fetch published recipes matching the meal type OR with no meal type set
    // (since many recipes don't have mealType categorized yet)
    const recipes = await prisma.recipe.findMany({
      where: {
        published: true,
        OR: [
          { mealType: { in: recipeMealTypes } },
          { mealType: null },
        ],
        // Only include recipes with nutrition data
        caloriesPerServing: {
          not: null,
          gt: 0,
        },
      },
      select: {
        id: true,
        title: true,
        coverImage: true,
        servings: true,
        caloriesPerServing: true,
        proteinPerServing: true,
        carbsPerServing: true,
        fatPerServing: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    // Calculate scaling and match scores for each recipe
    const recipeOptions: RecipeSwapOption[] = recipes
      .map((recipe) => {
        return createRecipeSwapOption(
          {
            id: recipe.id,
            title: recipe.title,
            coverImage: recipe.coverImage,
            caloriesPerServing: Number(recipe.caloriesPerServing) || 0,
            proteinPerServing: Number(recipe.proteinPerServing) || 0,
            carbsPerServing: Number(recipe.carbsPerServing) || 0,
            fatPerServing: Number(recipe.fatPerServing) || 0,
            servings: recipe.servings,
          },
          targetMacros,
          currentMacros
        );
      })
      // Sort by match score (highest first)
      .sort((a, b) => b.matchScore - a.matchScore)
      // Limit results
      .slice(0, limit);

    return NextResponse.json({
      recipes: recipeOptions,
      total: recipes.length,
    });
  } catch (error) {
    console.error('Error fetching recipes for meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}
