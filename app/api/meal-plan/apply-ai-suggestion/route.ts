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
  useProductLibrary?: boolean;  // If true, search product library instead of SLV
  productId?: string;  // Direct product ID if specified
}

interface AISuggestedMeal {
  mealType: MealType;
  mealIndex: number;
  items: AISuggestedItem[];
}

interface ProductLibraryFood {
  id: string;
  name: string;
  brand: string | null;
  kcal: number | { toNumber(): number };  // Prisma Decimal
  protein: number | { toNumber(): number };
  carbs: number | { toNumber(): number };
  fat: number | { toNumber(): number };
  image: string | null;
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
// NOTE: Alternatives should be exact SLV food names that START with these strings
const FOOD_MAPPINGS: Record<string, string[]> = {
  'ägg': ['ägg kokt', 'ägg rått'],  // Exact SLV names
  'havregryn': ['havregryn fullkorn'],
  'hallon': ['hallon frysvara', 'hallon'],
  'blåbär': ['blåbär'],
  'kvarg': ['kvarg naturell fett 0,2%'],  // ALLTID 0,2% - inte 1%
  'keso': ['keso'],
  'ris': ['ris vitt', 'ris råris'],
  'kyckling': ['kycklingfilé', 'kycklingbröst'],
  'lax': ['lax'],
  'nötfärs': ['nötfärs'],
  'pasta': ['pasta'],
  'potatis': ['potatis'],
  'banan': ['banan'],
  'äpple': ['äpple'],
  'mjölk': ['mjölk'],
  'yoghurt': ['yoghurt naturell', 'yoghurt'],
  'ost': ['ost'],
  'bröd': ['bröd'],
  'havre': ['havregryn fullkorn'],
  'jordnötssmör': ['jordnötssmör'],
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

  // Check common food mappings - require search to START with key or be exact
  for (const [key, alternatives] of Object.entries(FOOD_MAPPINGS)) {
    // Only match if search term starts with key (e.g. "ägg" matches "ägg hönsägg" but not "gris lägg")
    if (searchLower.startsWith(key) || searchLower === key) {
      for (const alt of alternatives) {
        // Find food that STARTS with the alternative (more precise)
        const mapped = slvFoods.find(f => f.namn.toLowerCase().startsWith(alt));
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

// Helper to convert Decimal or number to number
function toNum(val: number | { toNumber(): number } | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && 'toNumber' in val) return val.toNumber();
  return Number(val) || 0;
}

// Calculate macros for given grams
function calculateMacros(food: SlvFood | ProductLibraryFood, grams: number): CalculatedMacros {
  const factor = grams / 100;
  return {
    protein: Math.round(toNum(food.protein) * factor * 10) / 10,
    carbs: Math.round(toNum(food.carbs) * factor * 10) / 10,
    fat: Math.round(toNum(food.fat) * factor * 10) / 10,
    kcal: Math.round(toNum(food.kcal) * factor),
  };
}

// Search product library for a food (Product is global, not per coach)
async function searchProductLibrary(searchName: string): Promise<ProductLibraryFood | null> {
  const searchLower = searchName.toLowerCase().trim();

  console.log(`Searching product library for: "${searchName}"`);

  // Try exact match first
  const exactMatch = await prisma.product.findFirst({
    where: {
      name: { equals: searchName, mode: 'insensitive' },
    },
    select: {
      id: true,
      name: true,
      brand: true,
      kcal: true,
      protein: true,
      carbs: true,
      fat: true,
      image: true,
    },
  });

  if (exactMatch) {
    console.log(`  Product library exact match: ${exactMatch.name}`);
    return exactMatch;
  }

  // Try contains match
  const containsMatch = await prisma.product.findFirst({
    where: {
      OR: [
        { name: { contains: searchLower, mode: 'insensitive' } },
        { brand: { contains: searchLower, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      brand: true,
      kcal: true,
      protein: true,
      carbs: true,
      fat: true,
      image: true,
    },
    orderBy: { name: 'asc' },
  });

  if (containsMatch) {
    console.log(`  Product library contains match: ${containsMatch.name}`);
    return containsMatch;
  }

  console.log(`  No product library match found`);
  return null;
}

// Get product by ID
async function getProductById(productId: string): Promise<ProductLibraryFood | null> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
    },
    select: {
      id: true,
      name: true,
      brand: true,
      kcal: true,
      protein: true,
      carbs: true,
      fat: true,
      image: true,
    },
  });

  return product;
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
    const { mealPlanId, suggestions, useProductLibrary } = body as {
      mealPlanId: string;
      suggestions: AISuggestedMeal[];
      useProductLibrary?: boolean;  // Global flag to use product library for all failed SLV matches
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
    const productLibraryItems: string[] = [];  // Items found in product library

    console.log('Processing suggestions:', JSON.stringify(suggestions, null, 2));

    // Process each suggested meal
    for (const suggestion of suggestions) {
      const { mealIndex, items } = suggestion;

      console.log(`Processing meal ${mealIndex} with ${items.length} items`);

      if (mealIndex < 0 || mealIndex >= meals.length) {
        console.log(`  Skipping - invalid meal index (max: ${meals.length - 1})`);
        continue;
      }

      const meal = updatedMeals[mealIndex];

      for (const item of items) {
        console.log(`  Processing item: "${item.name}" ${item.grams}g (${item.category})`);

        let foodId: string;
        let foodName: string;
        let macros: CalculatedMacros;
        let foodImage: string | null = null;
        let fromProductLibrary = false;

        // Check if item specifically requests product library or has a direct product ID
        if (item.productId) {
          // Direct product ID provided
          const product = await getProductById(item.productId);
          if (!product) {
            console.log(`    FAILED: Product ID "${item.productId}" not found`);
            failedItems.push(item.name);
            continue;
          }
          foodId = product.id;
          foodName = product.brand ? `${product.name} (${product.brand})` : product.name;
          macros = calculateMacros(product, item.grams);
          foodImage = product.image;
          fromProductLibrary = true;
          console.log(`    MATCHED (product ID): "${item.name}" -> "${foodName}"`);
        } else if (item.useProductLibrary) {
          // Explicitly use product library
          const product = await searchProductLibrary(item.name);
          if (!product) {
            console.log(`    FAILED: No product library match found for "${item.name}"`);
            failedItems.push(item.name);
            continue;
          }
          foodId = product.id;
          foodName = product.brand ? `${product.name} (${product.brand})` : product.name;
          macros = calculateMacros(product, item.grams);
          foodImage = product.image;
          fromProductLibrary = true;
          console.log(`    MATCHED (product library): "${item.name}" -> "${foodName}"`);
        } else {
          // Try SLV database first
          const slvFood = findBestMatch(item.name, slvFoods);

          if (slvFood) {
            foodId = `slv-${slvFood.nummer}`;
            foodName = slvFood.namn;
            macros = calculateMacros(slvFood, item.grams);
            console.log(`    MATCHED (SLV): "${item.name}" -> "${foodName}"`);
          } else if (useProductLibrary) {
            // SLV failed, try product library as fallback
            console.log(`    SLV failed, trying product library...`);
            const product = await searchProductLibrary(item.name);
            if (product) {
              foodId = product.id;
              foodName = product.brand ? `${product.name} (${product.brand})` : product.name;
              macros = calculateMacros(product, item.grams);
              foodImage = product.image;
              fromProductLibrary = true;
              console.log(`    MATCHED (product library fallback): "${item.name}" -> "${foodName}"`);
            } else {
              console.log(`    FAILED: No match in SLV or product library for "${item.name}"`);
              failedItems.push(item.name);
              continue;
            }
          } else {
            console.log(`    FAILED: No SLV match found for "${item.name}"`);
            failedItems.push(item.name);
            continue;
          }
        }

        // Create the new item
        const newItem = {
          category: item.category,
          selected: {
            foodId,
            name: foodName,
            grams: item.grams,
            macros,
            image: foodImage,
          },
          alternatives: [],
        };

        // Check if this exact food already exists in the meal
        const existingFoodIndex = meal.items.findIndex(
          i => i.selected.foodId === newItem.selected.foodId
        );

        if (existingFoodIndex >= 0) {
          // Update existing food (same food, update grams)
          meal.items[existingFoodIndex] = newItem;
          console.log(`    Updated existing food: ${foodName}`);
        } else {
          // Add as new item (allow multiple items per category!)
          meal.items.push(newItem);
          console.log(`    Added new food: ${foodName}`);
        }

        if (fromProductLibrary) {
          productLibraryItems.push(`${foodName} (${item.grams}g)`);
        }
        appliedItems.push(`${foodName} (${item.grams}g)`);
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

    // Build message
    let message = `${appliedItems.length} livsmedel tillagda i kostschemat.`;
    if (productLibraryItems.length > 0) {
      message += ` (${productLibraryItems.length} från livsmedelsbiblioteket)`;
    }
    if (failedItems.length > 0) {
      message = `${appliedItems.length} livsmedel tillagda. ${failedItems.length} kunde inte matchas: ${failedItems.join(', ')}`;
    }

    return NextResponse.json({
      success: true,
      appliedItems,
      failedItems,
      productLibraryItems,
      actualMacros,
      message,
    });
  } catch (error) {
    console.error('Error applying AI suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to apply AI suggestion' },
      { status: 500 }
    );
  }
}
