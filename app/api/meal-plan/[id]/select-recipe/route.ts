import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  GeneratedMeal,
  RecipeForMealPlan,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';
import { calculatePlanTotalMacros } from '@/lib/calculations/meal-plan-generator';

/**
 * PUT /api/meal-plan/[id]/select-recipe
 * Select a recipe for a specific meal (switches meal to recipe mode)
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
    const { mealIndex, recipeId, scaledServings, scaledMacros } = body as {
      mealIndex: number;
      recipeId: string;
      scaledServings: number;
      scaledMacros: CalculatedMacros;
    };

    if (mealIndex === undefined || !recipeId || !scaledServings || !scaledMacros) {
      return NextResponse.json(
        { error: 'mealIndex, recipeId, scaledServings, and scaledMacros are required' },
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

    // Check access - allow both coach and assigned client
    const userId = (session.user as any).id;
    const isCoach = generatedPlan.nutritionPlan.coachId === userId;
    const isClient = generatedPlan.nutritionPlan.clientId === userId;

    if (!isCoach && !isClient) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch the recipe
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
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
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const meals = generatedPlan.meals as unknown as GeneratedMeal[];

    if (mealIndex < 0 || mealIndex >= meals.length) {
      return NextResponse.json({ error: 'Invalid meal index' }, { status: 400 });
    }

    // Create the recipe for meal plan
    const selectedRecipe: RecipeForMealPlan = {
      recipeId: recipe.id,
      title: recipe.title,
      coverImage: recipe.coverImage,
      servings: recipe.servings,
      baseServingMacros: {
        kcal: Number(recipe.caloriesPerServing) || 0,
        protein: Number(recipe.proteinPerServing) || 0,
        carbs: Number(recipe.carbsPerServing) || 0,
        fat: Number(recipe.fatPerServing) || 0,
      },
      scaledServings,
      scaledMacros,
    };

    // Update the meal with recipe
    meals[mealIndex] = {
      ...meals[mealIndex],
      selectedRecipe,
      isRecipeMode: true,
      totalMacros: scaledMacros, // Recipe macros become the meal's total
    };

    // Recalculate plan totals
    const actualMacros = calculatePlanTotalMacros(meals);

    // Save to database
    await prisma.generatedMealPlan.update({
      where: { id },
      data: {
        meals: meals as any,
      },
    });

    return NextResponse.json({
      updatedMeal: meals[mealIndex],
      actualMacros,
    });
  } catch (error) {
    console.error('Error selecting recipe:', error);
    return NextResponse.json(
      { error: 'Failed to select recipe' },
      { status: 500 }
    );
  }
}
