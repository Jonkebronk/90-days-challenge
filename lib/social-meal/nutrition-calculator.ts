import type {
  SelectedComponent,
  NutritionEstimate,
  QuickTrackCategory,
  PortionSize,
} from './types';
import { QUICK_TRACK_CATEGORIES, getFoodItemById } from './quick-track-categories';
import { getDinnerById } from './family-dinners';

/**
 * Calculate total nutrition from an array of selected components
 */
export function calculateTotalNutrition(
  components: SelectedComponent[]
): NutritionEstimate {
  const totals = components.reduce(
    (acc, component) => ({
      kcal: acc.kcal + component.kcal,
      protein: acc.protein + component.protein,
      carbs: acc.carbs + component.carbs,
      fat: acc.fat + component.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    kcal: Math.round(totals.kcal),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}

/**
 * Calculate nutrition with confidence range
 * Used for estimations where precision is uncertain
 */
export function calculateNutritionWithRange(
  components: SelectedComponent[],
  confidenceLevel: 'low' | 'medium' | 'high' = 'medium'
): NutritionEstimate {
  const base = calculateTotalNutrition(components);

  // Confidence ranges
  const ranges = {
    low: 0.25, // +/- 25%
    medium: 0.15, // +/- 15%
    high: 0.08, // +/- 8%
  };

  const range = ranges[confidenceLevel];

  return {
    ...base,
    kcalMin: Math.round(base.kcal * (1 - range)),
    kcalMax: Math.round(base.kcal * (1 + range)),
  };
}

/**
 * Get portion data for a specific food item and portion size
 */
export function getPortionData(
  category: QuickTrackCategory,
  itemId: string,
  portionSize: PortionSize,
  customGrams?: number
): { grams: number; kcal: number; protein: number; carbs: number; fat: number } | null {
  const item = getFoodItemById(category, itemId);
  if (!item) return null;

  // Custom portion calculation
  if (portionSize === 'custom' && customGrams) {
    const multiplier = customGrams / 100;
    return {
      grams: customGrams,
      kcal: Math.round(item.per100g.kcal * multiplier),
      protein: Math.round(item.per100g.protein * multiplier * 10) / 10,
      carbs: Math.round(item.per100g.carbs * multiplier * 10) / 10,
      fat: Math.round(item.per100g.fat * multiplier * 10) / 10,
    };
  }

  // Find predefined portion
  const portion = item.portions.find((p: { size: PortionSize }) => p.size === portionSize);
  if (!portion) return null;

  return {
    grams: portion.grams,
    kcal: portion.kcal,
    protein: portion.protein ?? Math.round((item.per100g.protein * portion.grams) / 100 * 10) / 10,
    carbs: portion.carbs ?? Math.round((item.per100g.carbs * portion.grams) / 100 * 10) / 10,
    fat: portion.fat ?? Math.round((item.per100g.fat * portion.grams) / 100 * 10) / 10,
  };
}

/**
 * Create a SelectedComponent from category, item, and portion
 */
export function createComponent(
  category: QuickTrackCategory,
  itemId: string,
  portionSize: PortionSize,
  customGrams?: number
): SelectedComponent | null {
  const item = getFoodItemById(category, itemId);
  if (!item) return null;

  const portionData = getPortionData(category, itemId, portionSize, customGrams);
  if (!portionData) return null;

  return {
    category,
    foodItemId: itemId,
    foodItemName: item.name,
    portionSize,
    ...portionData,
  };
}

/**
 * Create components from a family dinner preset
 */
export function createComponentsFromPreset(
  presetId: string
): SelectedComponent[] {
  const preset = getDinnerById(presetId);
  if (!preset) return [];

  const components: SelectedComponent[] = [];

  for (const comp of preset.components) {
    const component = createComponent(
      comp.categoryId,
      comp.itemId,
      comp.portion
    );
    if (component) {
      components.push(component);
    }
  }

  return components;
}

/**
 * Adjust portions based on calorie target
 * Useful for adapting a meal to user's needs
 */
export function adjustPortionsToTarget(
  components: SelectedComponent[],
  targetKcal: number
): SelectedComponent[] {
  const current = calculateTotalNutrition(components);
  const ratio = targetKcal / current.kcal;

  return components.map((component) => ({
    ...component,
    grams: Math.round(component.grams * ratio),
    kcal: Math.round(component.kcal * ratio),
    protein: Math.round(component.protein * ratio * 10) / 10,
    carbs: Math.round(component.carbs * ratio * 10) / 10,
    fat: Math.round(component.fat * ratio * 10) / 10,
  }));
}

/**
 * Suggest portion size based on calorie target for a meal
 */
export function suggestPortionSize(
  category: QuickTrackCategory,
  itemId: string,
  targetKcal: number
): PortionSize {
  const item = getFoodItemById(category, itemId);
  if (!item) return 'normal';

  // Find the portion closest to target calories
  let closestPortion: PortionSize = 'normal';
  let closestDiff = Infinity;

  for (const portion of item.portions) {
    const diff = Math.abs(portion.kcal - targetKcal);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestPortion = portion.size;
    }
  }

  return closestPortion;
}

/**
 * Get macro percentage breakdown
 */
export function getMacroBreakdown(
  nutrition: NutritionEstimate
): { proteinPct: number; carbsPct: number; fatPct: number } {
  const proteinCal = nutrition.protein * 4;
  const carbsCal = nutrition.carbs * 4;
  const fatCal = nutrition.fat * 9;
  const total = proteinCal + carbsCal + fatCal;

  if (total === 0) {
    return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
  }

  return {
    proteinPct: Math.round((proteinCal / total) * 100),
    carbsPct: Math.round((carbsCal / total) * 100),
    fatPct: Math.round((fatCal / total) * 100),
  };
}

/**
 * Format nutrition for display
 */
export function formatNutrition(nutrition: NutritionEstimate): {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  range?: string;
} {
  const result: ReturnType<typeof formatNutrition> = {
    kcal: `${nutrition.kcal} kcal`,
    protein: `${nutrition.protein}g protein`,
    carbs: `${nutrition.carbs}g kolhydrater`,
    fat: `${nutrition.fat}g fett`,
  };

  if (nutrition.kcalMin && nutrition.kcalMax) {
    result.range = `${nutrition.kcalMin}-${nutrition.kcalMax} kcal`;
  }

  return result;
}

/**
 * Validate components - check all have valid data
 */
export function validateComponents(
  components: SelectedComponent[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (components.length === 0) {
    errors.push('Inga komponenter valda');
  }

  components.forEach((comp, index) => {
    if (!comp.foodItemId) {
      errors.push(`Komponent ${index + 1}: Ingen matvara vald`);
    }
    if (comp.grams <= 0) {
      errors.push(`Komponent ${index + 1}: Ogiltig mängd`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compare two nutritional values and return difference
 */
export function compareNutrition(
  a: NutritionEstimate,
  b: NutritionEstimate
): NutritionEstimate {
  return {
    kcal: a.kcal - b.kcal,
    protein: Math.round((a.protein - b.protein) * 10) / 10,
    carbs: Math.round((a.carbs - b.carbs) * 10) / 10,
    fat: Math.round((a.fat - b.fat) * 10) / 10,
  };
}

/**
 * Generate hash for meal (for detecting duplicates/patterns)
 */
export function generateMealHash(components: SelectedComponent[]): string {
  const sorted = [...components].sort((a, b) =>
    a.foodItemId.localeCompare(b.foodItemId)
  );
  const ids = sorted.map((c) => `${c.foodItemId}:${c.portionSize}`).join('|');
  return ids;
}

/**
 * Check if two meals are similar (same components, potentially different portions)
 */
export function areMealsSimilar(
  a: SelectedComponent[],
  b: SelectedComponent[]
): boolean {
  if (a.length !== b.length) return false;

  const aIds = new Set(a.map((c) => c.foodItemId));
  const bIds = new Set(b.map((c) => c.foodItemId));

  if (aIds.size !== bIds.size) return false;

  for (const id of aIds) {
    if (!bIds.has(id)) return false;
  }

  return true;
}
