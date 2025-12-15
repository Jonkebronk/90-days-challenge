// Meal Plan Generator Calculations
// Handles gram calculations, macro distribution, food swaps, and sauce adjustments

import type {
  MacroCategory,
  MealType,
  MealConfig,
  MacroTargets,
  CalculatedMacros,
  FoodWithGrams,
  FoodAlternative,
  GeneratedMealItem,
  GeneratedMeal,
  GeneratedMealPlan,
  SwapFeedback,
  SwapResult,
  SauceAdjustment,
  SauceResult,
  FoodItemForGenerator,
  FoodPer100g,
} from '@/lib/types/meal-plan-generator';
import {
  KCAL_PER_GRAM,
  VEGETABLE_GRAMS,
  ALTERNATIVES_COUNT,
} from '@/lib/types/meal-plan-generator';

// ===================
// GRAM CALCULATIONS
// ===================

/**
 * Calculate grams needed to hit a target macro value
 * Formula: gram = (targetMacro / per100g) × 100
 */
export function calculateGramsForMacro(
  targetMacro: number,
  per100g: number
): number {
  if (per100g <= 0) return 0;
  return (targetMacro / per100g) * 100;
}

/**
 * Calculate macros for a given food at a specific gram amount
 */
export function calculateMacrosForGrams(
  food: FoodItemForGenerator,
  grams: number
): CalculatedMacros {
  const factor = grams / 100;
  return {
    protein: Math.round(food.proteinG * factor * 10) / 10,
    carbs: Math.round(food.carbsG * factor * 10) / 10,
    fat: Math.round(food.fatG * factor * 10) / 10,
    kcal: Math.round(food.calories * factor),
  };
}

/**
 * Create FoodWithGrams from a food item and target macro
 */
export function createFoodWithGrams(
  food: FoodItemForGenerator,
  targetMacro: number,
  macroType: 'protein' | 'carbs' | 'fat'
): FoodWithGrams {
  const per100gValue =
    macroType === 'protein'
      ? food.proteinG
      : macroType === 'carbs'
      ? food.carbsG
      : food.fatG;

  const grams = calculateGramsForMacro(targetMacro, per100gValue);
  const macros = calculateMacrosForGrams(food, grams);

  return {
    foodId: food.id,
    name: food.name,
    grams: Math.round(grams),
    macros,
    image: food.image,
  };
}

// ===================
// MACRO DISTRIBUTION
// ===================

/**
 * Count how many meals have a specific macro category enabled
 */
function countMealsWithCategory(
  configs: MealConfig[],
  category: 'protein' | 'carbs' | 'fat'
): number {
  return configs.filter((c) => {
    switch (category) {
      case 'protein':
        return c.includeProtein;
      case 'carbs':
        return c.includeCarbs;
      case 'fat':
        return c.includeFat;
    }
  }).length;
}

/**
 * Distribute daily macros across meals based on which categories are enabled
 */
export function distributeMacros(
  dailyMacros: MacroTargets,
  mealConfigs: MealConfig[]
): Map<number, MacroTargets> {
  const distribution = new Map<number, MacroTargets>();

  const proteinMeals = countMealsWithCategory(mealConfigs, 'protein');
  const carbMeals = countMealsWithCategory(mealConfigs, 'carbs');
  const fatMeals = countMealsWithCategory(mealConfigs, 'fat');

  // Protein/carbs/fat per meal (evenly distributed)
  const proteinPerMeal = proteinMeals > 0 ? dailyMacros.protein / proteinMeals : 0;
  const carbsPerMeal = carbMeals > 0 ? dailyMacros.carbs / carbMeals : 0;
  const fatPerMeal = fatMeals > 0 ? dailyMacros.fat / fatMeals : 0;

  mealConfigs.forEach((config, index) => {
    const protein = config.includeProtein ? proteinPerMeal : 0;
    const carbs = config.includeCarbs ? carbsPerMeal : 0;
    const fat = config.includeFat ? fatPerMeal : 0;
    const kcal =
      protein * KCAL_PER_GRAM.protein +
      carbs * KCAL_PER_GRAM.carbs +
      fat * KCAL_PER_GRAM.fat;

    distribution.set(index, {
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      kcal: Math.round(kcal),
    });
  });

  return distribution;
}

// ===================
// MEAL GENERATION
// ===================

/**
 * Generate a single meal item with alternatives
 */
export function generateMealItem(
  foods: FoodItemForGenerator[],
  targetMacro: number,
  category: MacroCategory,
  macroType: 'protein' | 'carbs' | 'fat'
): GeneratedMealItem | null {
  if (foods.length === 0 || targetMacro <= 0) return null;

  // Sort by recommendation status, then alphabetically
  const sortedFoods = [...foods].sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return a.name.localeCompare(b.name, 'sv');
  });

  // Take up to ALTERNATIVES_COUNT foods
  const selectedFoods = sortedFoods.slice(0, ALTERNATIVES_COUNT);

  if (selectedFoods.length === 0) return null;

  // First food is the default selected
  const selected = createFoodWithGrams(selectedFoods[0], targetMacro, macroType);

  // Rest are alternatives
  const alternatives: FoodAlternative[] = selectedFoods.slice(1).map((food) => {
    const foodWithGrams = createFoodWithGrams(food, targetMacro, macroType);
    return {
      foodId: foodWithGrams.foodId,
      name: foodWithGrams.name,
      grams: foodWithGrams.grams,
      macros: foodWithGrams.macros,
      image: foodWithGrams.image,
    };
  });

  return {
    category,
    selected,
    alternatives,
  };
}

/**
 * Calculate total macros for a meal
 */
export function calculateMealTotalMacros(
  items: GeneratedMealItem[],
  sauce?: FoodWithGrams
): CalculatedMacros {
  const totals: CalculatedMacros = { protein: 0, carbs: 0, fat: 0, kcal: 0 };

  items.forEach((item) => {
    totals.protein += item.selected.macros.protein;
    totals.carbs += item.selected.macros.carbs;
    totals.fat += item.selected.macros.fat;
    totals.kcal += item.selected.macros.kcal;
  });

  if (sauce) {
    totals.protein += sauce.macros.protein;
    totals.carbs += sauce.macros.carbs;
    totals.fat += sauce.macros.fat;
    totals.kcal += sauce.macros.kcal;
  }

  return {
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    kcal: Math.round(totals.kcal),
  };
}

/**
 * Calculate total macros for entire plan
 */
export function calculatePlanTotalMacros(
  meals: GeneratedMeal[]
): CalculatedMacros {
  const totals: CalculatedMacros = { protein: 0, carbs: 0, fat: 0, kcal: 0 };

  meals.forEach((meal) => {
    totals.protein += meal.totalMacros.protein;
    totals.carbs += meal.totalMacros.carbs;
    totals.fat += meal.totalMacros.fat;
    totals.kcal += meal.totalMacros.kcal;
  });

  return {
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    kcal: Math.round(totals.kcal),
  };
}

// ===================
// FOOD SWAP
// ===================

/**
 * Determine which macro type is dominant for a food category
 */
function getMacroTypeForCategory(category: MacroCategory): 'protein' | 'carbs' | 'fat' {
  switch (category) {
    case 'protein':
      return 'protein';
    case 'carb':
      return 'carbs';
    case 'fat':
    case 'sauce':
      return 'fat';
    default:
      return 'protein';
  }
}

/**
 * Calculate swap result with feedback
 */
export function calculateSwap(
  currentFood: FoodWithGrams,
  newFood: FoodItemForGenerator,
  category: MacroCategory
): SwapResult {
  const macroType = getMacroTypeForCategory(category);

  // Get current macro value to maintain
  const targetMacro =
    macroType === 'protein' ? currentFood.macros.protein :
    macroType === 'carbs' ? currentFood.macros.carbs :
    currentFood.macros.fat;

  // Create new food with grams to hit same macro target
  const newFoodWithGrams = createFoodWithGrams(newFood, targetMacro, macroType);

  // Calculate macro impact (difference)
  const macroImpact = {
    protein: newFoodWithGrams.macros.protein - currentFood.macros.protein,
    carbs: newFoodWithGrams.macros.carbs - currentFood.macros.carbs,
    fat: newFoodWithGrams.macros.fat - currentFood.macros.fat,
    kcal: newFoodWithGrams.macros.kcal - currentFood.macros.kcal,
  };

  // Determine feedback type and message
  let feedbackType: 'success' | 'warning' | 'error' = 'success';
  let message = `Bytte ${currentFood.name} → ${newFood.name} (${newFoodWithGrams.grams}g)`;

  // Check for significant macro overlap (>5g difference in other macros)
  const significantOverlap =
    (category === 'protein' && (Math.abs(macroImpact.fat) > 5 || Math.abs(macroImpact.carbs) > 5)) ||
    (category === 'carb' && (Math.abs(macroImpact.protein) > 5 || Math.abs(macroImpact.fat) > 5)) ||
    (category === 'fat' && (Math.abs(macroImpact.protein) > 5 || Math.abs(macroImpact.carbs) > 5));

  if (significantOverlap) {
    feedbackType = 'warning';
    const impacts: string[] = [];
    if (Math.abs(macroImpact.protein) > 5) {
      impacts.push(`${macroImpact.protein > 0 ? '+' : ''}${Math.round(macroImpact.protein)}g protein`);
    }
    if (Math.abs(macroImpact.carbs) > 5) {
      impacts.push(`${macroImpact.carbs > 0 ? '+' : ''}${Math.round(macroImpact.carbs)}g kolhydrater`);
    }
    if (Math.abs(macroImpact.fat) > 5) {
      impacts.push(`${macroImpact.fat > 0 ? '+' : ''}${Math.round(macroImpact.fat)}g fett`);
    }
    message = `${currentFood.name} → ${newFood.name} (${newFoodWithGrams.grams}g). OBS: ${impacts.join(', ')}`;
  }

  const feedback: SwapFeedback = {
    type: feedbackType,
    message,
    macroImpact,
  };

  // Create updated meal item (we return partial result, caller handles full meal update)
  const updatedMeal: GeneratedMeal = {
    type: 'lunch', // Will be replaced by caller
    index: 0,
    items: [{
      category,
      selected: newFoodWithGrams,
      alternatives: [], // Will be populated by caller
    }],
    vegetableGrams: VEGETABLE_GRAMS,
    totalMacros: newFoodWithGrams.macros,
  };

  return {
    updatedMeal,
    feedback,
  };
}

// ===================
// SAUCE ADJUSTMENT
// ===================

/**
 * Find all snack meals (mellanmål) that have fat enabled
 */
function findFatSnackMeals(
  meals: GeneratedMeal[],
  configs: MealConfig[]
): { mealIndex: number; meal: GeneratedMeal }[] {
  return meals
    .map((meal, index) => ({ mealIndex: index, meal }))
    .filter(({ mealIndex }) => {
      const config = configs[mealIndex];
      return config?.type === 'mellanmål' && config.includeFat;
    });
}

/**
 * Adjust meal plan foods when sauce is added
 * Subtracts sauce macros (protein, carbs, fat) proportionally from all meals
 */
export function adjustForSauce(
  plan: GeneratedMealPlan,
  sauceFat: number,
  sauceMealIndex: number,
  sauceMacros?: { protein: number; carbs: number; fat: number; kcal: number }
): SauceResult {
  const updatedMeals = [...plan.meals];
  const adjustments: SauceAdjustment[] = [];

  // Use full macros if provided, otherwise just fat (backwards compatibility)
  const macrosToSubtract = sauceMacros || { protein: 0, carbs: 0, fat: sauceFat, kcal: 0 };

  // For each macro type, find meals with that category and reduce proportionally
  const macroCategories: { macro: 'protein' | 'carbs' | 'fat'; category: MacroCategory }[] = [
    { macro: 'protein', category: 'protein' },
    { macro: 'carbs', category: 'carb' },
    { macro: 'fat', category: 'fat' },
  ];

  for (const { macro, category } of macroCategories) {
    const toSubtract = macrosToSubtract[macro];
    if (toSubtract <= 0) continue;

    // Find all meals with this category (excluding the sauce meal itself)
    const mealsWithCategory = updatedMeals
      .map((meal, index) => ({ mealIndex: index, meal }))
      .filter(({ mealIndex, meal }) => {
        if (mealIndex === sauceMealIndex) return false;
        return meal.items.some((item) => item.category === category);
      });

    if (mealsWithCategory.length === 0) continue;

    // Calculate total macro amount available in these meals
    const totalAvailable = mealsWithCategory.reduce((sum, { meal }) => {
      const item = meal.items.find((i) => i.category === category);
      return sum + (item?.selected.macros[macro] || 0);
    }, 0);

    if (totalAvailable <= 0) continue;

    // Distribute reduction proportionally
    for (const { mealIndex, meal } of mealsWithCategory) {
      const item = meal.items.find((i) => i.category === category);
      if (!item) continue;

      const currentMacro = item.selected.macros[macro];
      const proportion = currentMacro / totalAvailable;
      const reductionAmount = Math.min(toSubtract * proportion, currentMacro * 0.5); // Max 50% reduction per item

      if (reductionAmount <= 0) continue;

      // Calculate new grams based on the macro reduction
      const macroPer100g = (item.selected.macros[macro] / item.selected.grams) * 100;
      const targetMacro = currentMacro - reductionAmount;
      const newGrams = Math.max(10, calculateGramsForMacro(targetMacro, macroPer100g));

      // Record adjustment
      adjustments.push({
        mealIndex,
        foodId: item.selected.foodId,
        name: item.selected.name,
        oldGrams: item.selected.grams,
        newGrams: Math.round(newGrams),
      });

      // Update meal items
      const updatedMeal = { ...meal };
      const updatedItems = meal.items.map((mealItem) => {
        if (mealItem.category === category) {
          const gramsFactor = newGrams / mealItem.selected.grams;
          const newMacros = {
            protein: mealItem.selected.macros.protein * gramsFactor,
            carbs: mealItem.selected.macros.carbs * gramsFactor,
            fat: mealItem.selected.macros.fat * gramsFactor,
            kcal: mealItem.selected.macros.kcal * gramsFactor,
          };
          return {
            ...mealItem,
            selected: {
              ...mealItem.selected,
              grams: Math.round(newGrams),
              macros: {
                protein: Math.round(newMacros.protein * 10) / 10,
                carbs: Math.round(newMacros.carbs * 10) / 10,
                fat: Math.round(newMacros.fat * 10) / 10,
                kcal: Math.round(newMacros.kcal),
              },
            },
          };
        }
        return mealItem;
      });
      updatedMeal.items = updatedItems;
      updatedMeal.totalMacros = calculateMealTotalMacros(updatedItems, updatedMeal.sauce);
      updatedMeals[mealIndex] = updatedMeal;
    }
  }

  const updatedPlan: GeneratedMealPlan = {
    ...plan,
    meals: updatedMeals,
    actualMacros: calculatePlanTotalMacros(updatedMeals),
  };

  return {
    updatedPlan,
    adjustments,
    warning: adjustments.length === 0 ? 'Inga livsmedel kunde justeras för såsen.' : undefined,
  };
}

// ===================
// VALIDATION
// ===================

/**
 * Validate that all macro categories have at least one meal enabled
 */
export function validateMealConfigs(
  configs: MealConfig[]
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  const hasProtein = configs.some((c) => c.includeProtein);
  const hasCarbs = configs.some((c) => c.includeCarbs);
  const hasFat = configs.some((c) => c.includeFat);

  if (!hasProtein) {
    warnings.push('Protein är inte aktiverat på någon måltid');
  }
  if (!hasCarbs) {
    warnings.push('Kolhydrater är inte aktiverat på någon måltid');
  }
  if (!hasFat) {
    warnings.push('Fett är inte aktiverat på någon måltid');
  }

  return {
    valid: hasProtein && hasCarbs && hasFat,
    warnings,
  };
}

/**
 * Calculate macro accuracy (how close actual is to target)
 */
export function calculateAccuracy(
  target: MacroTargets,
  actual: CalculatedMacros
): { protein: number; carbs: number; fat: number; kcal: number } {
  return {
    protein: target.protein > 0 ? (actual.protein / target.protein) * 100 : 100,
    carbs: target.carbs > 0 ? (actual.carbs / target.carbs) * 100 : 100,
    fat: target.fat > 0 ? (actual.fat / target.fat) * 100 : 100,
    kcal: target.kcal > 0 ? (actual.kcal / target.kcal) * 100 : 100,
  };
}
