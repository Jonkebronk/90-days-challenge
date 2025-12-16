import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';
import type {
  GeneratedMeal,
  CalculatedMacros,
  MealType,
} from '@/lib/types/meal-plan-generator';
import {
  calculateMealTotalMacros,
  calculatePlanTotalMacros,
} from '@/lib/calculations/meal-plan-generator';

interface SlvFood {
  nummer: number;
  namn: string;
  typ: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AISuggestedItem {
  name: string;
  grams: number;
  category: 'protein' | 'carb' | 'fat';
}

interface AISuggestedMeal {
  mealType: MealType;
  mealIndex: number;
  items: AISuggestedItem[];
}

// Load SLV foods
function loadSlvFoods(): SlvFood[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'slv-foods.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const allFoods: SlvFood[] = [];
    for (const category of Object.values(data.categories)) {
      allFoods.push(...(category as SlvFood[]));
    }
    return allFoods;
  } catch (error) {
    console.error('Could not load SLV data:', error);
    return [];
  }
}

// Find best matching SLV food by name
function findBestMatch(searchName: string, slvFoods: SlvFood[]): SlvFood | null {
  const searchLower = searchName.toLowerCase().trim();

  // Try exact match first
  const exact = slvFoods.find(f => f.namn.toLowerCase() === searchLower);
  if (exact) return exact;

  // Try contains match
  const contains = slvFoods.find(f => f.namn.toLowerCase().includes(searchLower));
  if (contains) return contains;

  // Try reverse contains (search term in food name)
  const reverseContains = slvFoods.find(f => searchLower.includes(f.namn.toLowerCase()));
  if (reverseContains) return reverseContains;

  // Try fuzzy match - split words and match
  const searchWords = searchLower.split(/\s+/);
  let bestMatch: SlvFood | null = null;
  let bestScore = 0;

  for (const food of slvFoods) {
    const foodWords = food.namn.toLowerCase().split(/\s+/);
    let score = 0;
    for (const searchWord of searchWords) {
      if (searchWord.length < 3) continue;
      for (const foodWord of foodWords) {
        if (foodWord.includes(searchWord) || searchWord.includes(foodWord)) {
          score++;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = food;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

// Calculate macros for given grams
function calculateMacros(food: SlvFood, grams: number): CalculatedMacros {
  const factor = grams / 100;
  return {
    protein: Math.round((food.protein || 0) * factor * 10) / 10,
    carbs: Math.round((food.carbs || 0) * factor * 10) / 10,
    fat: Math.round((food.fat || 0) * factor * 10) / 10,
    kcal: Math.round((food.kcal || 0) * factor),
  };
}

/**
 * POST /api/meal-plan/apply-ai-suggestion
 * Apply AI-suggested foods to a meal plan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mealPlanId, suggestions } = body as {
      mealPlanId: string;
      suggestions: AISuggestedMeal[];
    };

    if (!mealPlanId || !suggestions || suggestions.length === 0) {
      return NextResponse.json(
        { error: 'mealPlanId and suggestions are required' },
        { status: 400 }
      );
    }

    // Fetch the meal plan
    const generatedPlan = await prisma.generatedMealPlan.findUnique({
      where: { id: mealPlanId },
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

    // Load SLV foods for matching
    const slvFoods = loadSlvFoods();

    // Get current meals
    const meals = generatedPlan.meals as unknown as GeneratedMeal[];
    const updatedMeals = [...meals];
    const appliedItems: string[] = [];
    const failedItems: string[] = [];

    // Process each suggested meal
    for (const suggestion of suggestions) {
      const { mealIndex, items } = suggestion;

      if (mealIndex < 0 || mealIndex >= meals.length) {
        continue;
      }

      const meal = updatedMeals[mealIndex];

      for (const item of items) {
        // Find matching SLV food
        const slvFood = findBestMatch(item.name, slvFoods);

        if (!slvFood) {
          failedItems.push(item.name);
          continue;
        }

        // Calculate macros
        const macros = calculateMacros(slvFood, item.grams);

        // Create the new item
        const newItem = {
          category: item.category,
          selected: {
            foodId: `slv-${slvFood.nummer}`,
            name: slvFood.namn,
            grams: item.grams,
            macros,
            image: null,
          },
          alternatives: [],
        };

        // Find existing item in this category or add new
        const existingIndex = meal.items.findIndex(i => i.category === item.category);
        if (existingIndex >= 0) {
          meal.items[existingIndex] = newItem;
        } else {
          meal.items.push(newItem);
        }

        appliedItems.push(`${slvFood.namn} (${item.grams}g)`);
      }

      // Recalculate meal totals
      meal.totalMacros = calculateMealTotalMacros(meal.items, meal.sauce);
      updatedMeals[mealIndex] = meal;
    }

    // Recalculate plan totals
    const actualMacros = calculatePlanTotalMacros(updatedMeals);

    // Save to database
    await prisma.generatedMealPlan.update({
      where: { id: mealPlanId },
      data: {
        meals: updatedMeals as any,
        actualMacros: actualMacros as any,
      },
    });

    return NextResponse.json({
      success: true,
      appliedItems,
      failedItems,
      actualMacros,
      message: failedItems.length > 0
        ? `${appliedItems.length} livsmedel tillagda. ${failedItems.length} kunde inte matchas.`
        : `${appliedItems.length} livsmedel tillagda i kostschemat.`,
    });
  } catch (error) {
    console.error('Error applying AI suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to apply AI suggestion' },
      { status: 500 }
    );
  }
}
