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

// Categories that are compound dishes (rätter) - should be EXCLUDED
// NOTE: 'gröt' is NOT excluded since we want "Havregrynsgröt fullkorn" for havregryn
const EXCLUDED_CATEGORIES = [
  'blodprodukter',
  'blodrätter',
  'bullar',
  'kakor',
  'tårtor',
  'efterrätter',
  'glass',
  'godis',
  'grynrätter',
  'hamburgare',
  'korvrätter',
  'kötträtter',
  'majonnässallad',
  'röror',
  'osträtter',
  'pannkakor',
  'våfflor',
  'crêpes',
  'pastarätter',
  'pizza',
  'paj',
  'pirog',
  'färdig smörgås',
  'potatisrätter',
  'risrätter',
  'sallad blandad',
  'soppa mat',
  'söta soppor',
  'kräm',
  'efterrättssås',
  'äggrätter',
  'blandade rätter',
];

// Load SLV foods - excluding compound dishes (rätter)
function loadSlvFoods(): SlvFood[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'slv-foods.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const allFoods: SlvFood[] = [];

    for (const [categoryName, foods] of Object.entries(data.categories)) {
      // Skip excluded categories (compound dishes)
      if (EXCLUDED_CATEGORIES.some(exc => categoryName.toLowerCase().includes(exc.toLowerCase()))) {
        continue;
      }
      allFoods.push(...(foods as SlvFood[]));
    }

    console.log(`Loaded ${allFoods.length} SLV foods (excluding compound dishes)`);
    return allFoods;
  } catch (error) {
    console.error('Could not load SLV data:', error);
    return [];
  }
}

// Normalize food name for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    // Remove common suffixes/prefixes
    .replace(/\s*(rå|färsk|kokt|tillagad|stekt|grillad|ugnsrostad)\s*/g, ' ')
    .replace(/\s*(naturell|osötad|sötad|salt|osaltad)\s*/g, ' ')
    .replace(/\s*(fett|fetthalt)\s*\d+[,.]?\d*\s*%?\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Common food name mappings for better matching
const FOOD_MAPPINGS: Record<string, string[]> = {
  'ägg': ['ägg kokt', 'ägg hönsägg helt rå', 'ägg hela rå', 'hönsägg'],
  'havregryn': ['havregryn fullkorn', 'havregrynsgröt fullkorn', 'havregryn'],
  'hallon': ['hallon', 'hallon frysta', 'hallon blåbär frysvara'],
  'blåbär': ['blåbär', 'blåbär frysta', 'hallon blåbär frysvara'],
  'kvarg': ['kvarg naturell fett 0,2%', 'kvarg naturell', 'kvarg färskost fett 1%'],
  'keso': ['keso', 'cottage cheese'],
  'ris': ['ris vitt rått', 'ris råris rått', 'ris'],
  'kyckling': ['kycklingfilé rå', 'kycklingbröst rå', 'kyckling'],
  'lax': ['lax rå', 'laxfilé rå'],
  'nötfärs': ['nötfärs rå', 'färs nöt rå'],
  'pasta': ['pasta torr', 'pasta'],
  'potatis': ['potatis rå', 'potatis'],
  'banan': ['banan', 'banan färsk'],
  'äpple': ['äpple', 'äpple med skal'],
  'mjölk': ['mjölk', 'mellanmjölk'],
  'yoghurt': ['yoghurt naturell', 'yoghurt'],
  'ost': ['ost hårdost', 'ost'],
  'bröd': ['bröd', 'knäckebröd'],
  'havre': ['havregryn fullkorn', 'havregrynsgröt fullkorn'],
  'jordnötssmör': ['jordnötssmör', 'jordnötter'],
};

// Find best matching SLV food by name
function findBestMatch(searchName: string, slvFoods: SlvFood[]): SlvFood | null {
  const searchLower = searchName.toLowerCase().trim();
  const searchNormalized = normalizeName(searchName);

  console.log(`Searching for: "${searchName}" (normalized: "${searchNormalized}")`);

  // Try exact match first
  const exact = slvFoods.find(f => f.namn.toLowerCase() === searchLower);
  if (exact) {
    console.log(`  Exact match: ${exact.namn}`);
    return exact;
  }

  // Try normalized exact match
  const normalizedExact = slvFoods.find(f => normalizeName(f.namn) === searchNormalized);
  if (normalizedExact) {
    console.log(`  Normalized exact match: ${normalizedExact.namn}`);
    return normalizedExact;
  }

  // Check common food mappings
  for (const [key, alternatives] of Object.entries(FOOD_MAPPINGS)) {
    if (searchLower.includes(key)) {
      for (const alt of alternatives) {
        const mapped = slvFoods.find(f => f.namn.toLowerCase().includes(alt));
        if (mapped) {
          console.log(`  Mapped match: "${key}" -> ${mapped.namn}`);
          return mapped;
        }
      }
    }
  }

  // Try food name starts with search term (better than contains)
  const startsWithSearch = slvFoods.find(f => f.namn.toLowerCase().startsWith(searchLower));
  if (startsWithSearch) {
    console.log(`  Starts-with match: ${startsWithSearch.namn}`);
    return startsWithSearch;
  }

  // Try search term starts with food name first word
  const firstWord = searchLower.split(/[\s\/]+/)[0]; // Split on space or slash
  if (firstWord.length >= 3) {
    // Prefer simple foods (shorter names) over compound foods
    const startsWithMatches = slvFoods
      .filter(f => f.namn.toLowerCase().startsWith(firstWord))
      .sort((a, b) => a.namn.length - b.namn.length); // Shorter names first

    if (startsWithMatches.length > 0) {
      console.log(`  Starts-with match (shortest): ${startsWithMatches[0].namn}`);
      return startsWithMatches[0];
    }
  }

  // Try contains match - but prefer shorter/simpler foods
  const containsMatches = slvFoods
    .filter(f => f.namn.toLowerCase().includes(searchLower) || searchLower.includes(f.namn.toLowerCase()))
    .sort((a, b) => a.namn.length - b.namn.length);

  if (containsMatches.length > 0) {
    console.log(`  Contains match (shortest): ${containsMatches[0].namn}`);
    return containsMatches[0];
  }

  // Try fuzzy match - split words and match
  const searchWords = searchLower.split(/[\s\/]+/).filter(w => w.length >= 3);
  let bestMatch: SlvFood | null = null;
  let bestScore = 0;

  for (const food of slvFoods) {
    const foodLower = food.namn.toLowerCase();
    let score = 0;

    for (const searchWord of searchWords) {
      if (foodLower.includes(searchWord)) {
        score += 2;
      }
      // Extra points if food name starts with search word
      if (foodLower.startsWith(searchWord)) {
        score += 3;
      }
    }

    // Prefer shorter/simpler food names (penalize long compound names)
    if (score > 0) {
      score -= food.namn.length * 0.05; // Small penalty for longer names
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = food;
    }
  }

  if (bestMatch && bestScore >= 1.5) {
    console.log(`  Fuzzy match (score ${bestScore.toFixed(2)}): ${bestMatch.namn}`);
    return bestMatch;
  }

  console.log(`  No match found`);
  return null;
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
