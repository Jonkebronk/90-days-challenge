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
 * - categoryId: Filter by category (optional)
 * - subcategoryId: Filter by subcategory (optional)
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
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');
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

    // Build category filter
    const categoryFilter: Record<string, unknown> = {};
    if (subcategoryId) {
      categoryFilter.subcategoryId = subcategoryId;
    } else if (categoryId) {
      categoryFilter.categoryId = categoryId;
    }

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
        // Category filter
        ...categoryFilter,
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
        categoryId: true,
        subcategoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });

    // Get available categories and subcategories from the fetched recipes
    const categoryMap = new Map<string, { id: string; name: string; slug: string; subcategories: Map<string, { id: string; name: string; slug: string }> }>();

    for (const recipe of recipes) {
      if (recipe.category) {
        if (!categoryMap.has(recipe.category.id)) {
          categoryMap.set(recipe.category.id, {
            id: recipe.category.id,
            name: recipe.category.name,
            slug: recipe.category.slug,
            subcategories: new Map(),
          });
        }
        if (recipe.subcategory) {
          const cat = categoryMap.get(recipe.category.id)!;
          if (!cat.subcategories.has(recipe.subcategory.id)) {
            cat.subcategories.set(recipe.subcategory.id, {
              id: recipe.subcategory.id,
              name: recipe.subcategory.name,
              slug: recipe.subcategory.slug,
            });
          }
        }
      }
    }

    // Categories to exclude from meal plan selection (not actual meals)
    const excludedCategorySlugs = ['saser', 'tips-pa-tillagning'];

    // Convert to arrays for response, excluding non-meal categories
    const categories = Array.from(categoryMap.values())
      .filter(cat => !excludedCategorySlugs.includes(cat.slug))
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        subcategories: Array.from(cat.subcategories.values()),
      }));

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
      categories,
    });
  } catch (error) {
    console.error('Error fetching recipes for meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}
