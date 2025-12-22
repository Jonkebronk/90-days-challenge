// Meal Plan Generator Types
// Used for auto-generating meal schedules based on macro targets

// ===================
// ENUMS & CONSTANTS
// ===================

export type MacroCategory = 'protein' | 'carb' | 'fat' | 'vegetable' | 'sauce';

export type MealType = 'frukost' | 'mellanmål' | 'lunch' | 'middag' | 'kvällsmål';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  frukost: 'Frukost',
  mellanmål: 'Mellanmål',
  lunch: 'Lunch',
  middag: 'Middag',
  kvällsmål: 'Kvällsmål',
};

export const MACRO_CATEGORY_LABELS: Record<MacroCategory, string> = {
  protein: 'Proteinkälla',
  carb: 'Kolhydratkälla',
  fat: 'Fettkälla',
  vegetable: 'Grönsaker',
  sauce: 'Sås',
};

// Calorie constants per gram
export const KCAL_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

// Default vegetable portion (free, not counted in macros)
export const VEGETABLE_GRAMS = 200;

// Number of alternatives per food category
export const ALTERNATIVES_COUNT = 3;

// ===================
// MEAL CONFIGURATION
// ===================

export type DistributionMethod = 'auto' | 'percentage' | 'fixed';

export interface MealConfig {
  type: MealType;
  label?: string; // Custom label (e.g., "Mellanmål 1")
  includeProtein: boolean;
  includeCarbs: boolean;
  includeFat: boolean;
  // For percentage distribution (0-100)
  percentOfTotal?: number;
  // For fixed gram distribution
  fixedMacros?: CalculatedMacros;
}

export interface MealPlanSettings {
  mealConfigs: MealConfig[];
  distributionMethod: DistributionMethod;
}

// Default meal configuration (6 meals including kvällsmål)
export const DEFAULT_MEAL_CONFIGS: MealConfig[] = [
  { type: 'frukost', includeProtein: true, includeCarbs: true, includeFat: true, percentOfTotal: 18 },
  { type: 'mellanmål', includeProtein: true, includeCarbs: false, includeFat: true, percentOfTotal: 8 },
  { type: 'lunch', includeProtein: true, includeCarbs: true, includeFat: false, percentOfTotal: 27 },
  { type: 'mellanmål', includeProtein: true, includeCarbs: false, includeFat: true, percentOfTotal: 8 },
  { type: 'middag', includeProtein: true, includeCarbs: true, includeFat: false, percentOfTotal: 27 },
  { type: 'kvällsmål', includeProtein: true, includeCarbs: false, includeFat: true, percentOfTotal: 12 },
];

// Generate default config for N meals
export function generateDefaultMealConfigs(mealCount: number): MealConfig[] {
  const templates: { type: MealType; p: boolean; k: boolean; f: boolean }[] = [
    { type: 'frukost', p: true, k: true, f: true },
    { type: 'mellanmål', p: true, k: false, f: true },
    { type: 'lunch', p: true, k: true, f: false },
    { type: 'mellanmål', p: true, k: false, f: true },
    { type: 'middag', p: true, k: true, f: false },
    { type: 'kvällsmål', p: true, k: false, f: true },
    { type: 'mellanmål', p: true, k: false, f: true },
    { type: 'mellanmål', p: true, k: false, f: true },
  ];

  const basePercent = Math.floor(100 / mealCount);
  const remainder = 100 - basePercent * mealCount;

  return templates.slice(0, mealCount).map((t, i) => ({
    type: t.type,
    includeProtein: t.p,
    includeCarbs: t.k,
    includeFat: t.f,
    // Distribute remainder to first meals
    percentOfTotal: basePercent + (i < remainder ? 1 : 0),
  }));
}

// ===================
// MACRO TARGETS
// ===================

export interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
}

export interface CalculatedMacros {
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
}

// ===================
// FOOD WITH GRAMS
// ===================

export interface FoodPer100g {
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
}

export interface FoodWithGrams {
  foodId: string;
  name: string;
  grams: number;
  macros: CalculatedMacros;
  image?: string | null;
}

export interface FoodAlternative {
  foodId: string;
  name: string;
  grams: number;
  macros: CalculatedMacros;
  image?: string | null;
}

// ===================
// GENERATED MEAL
// ===================

export interface GeneratedMealItem {
  category: MacroCategory;
  selected: FoodWithGrams;
  alternatives: FoodAlternative[];
  isAlternative?: boolean; // If true, shows "ELLER" separator before this item
}

export interface GeneratedMeal {
  type: MealType;
  index: number; // For multiple meals of same type (e.g., 2 mellanmål)
  customName?: string; // User-defined custom name for this meal
  notes?: string; // Coach notes/tips for this meal
  items: GeneratedMealItem[];
  sauce?: FoodWithGrams;
  vegetableGrams: number; // Usually 200g for lunch/middag
  totalMacros: CalculatedMacros;
  targetMacros?: CalculatedMacros; // Per-meal target for manual editing
  selectedRecipe?: RecipeForMealPlan; // Selected recipe for this meal
  isRecipeMode?: boolean; // Whether using recipe mode instead of food items
}

export interface GeneratedMealPlan {
  id?: string;
  nutritionPlanId: string;
  mealConfigs: MealConfig[];
  meals: GeneratedMeal[];
  targetMacros: MacroTargets;
  actualMacros: CalculatedMacros;
}

// ===================
// FOOD SWAP
// ===================

export type SwapFeedbackType = 'success' | 'warning' | 'error';

export interface SwapAdjustment {
  foodId: string;
  name: string;
  category: MacroCategory;
  oldGrams: number;
  newGrams: number;
  reason: string;
}

export interface SwapFeedback {
  type: SwapFeedbackType;
  message: string;
  macroImpact?: {
    protein: number; // difference in grams
    carbs: number;
    fat: number;
    kcal: number;
  };
  adjustments?: SwapAdjustment[];
}

export interface SwapResult {
  updatedMeal: GeneratedMeal;
  feedback: SwapFeedback;
}

// ===================
// SAUCE
// ===================

export interface SauceAdjustment {
  mealIndex: number;
  foodId: string;
  name: string;
  oldGrams: number;
  newGrams: number;
}

export interface SauceResult {
  updatedPlan: GeneratedMealPlan;
  adjustments: SauceAdjustment[];
  warning?: string;
}

// ===================
// API INPUT/OUTPUT
// ===================

export interface GenerateMealPlanInput {
  nutritionPlanId: string;
  mealConfigs: MealConfig[];
}

export interface GenerateMealPlanOutput {
  id: string;
  meals: GeneratedMeal[];
  targetMacros: MacroTargets;
  actualMacros: CalculatedMacros;
}

export interface SwapInput {
  mealIndex: number;
  category: MacroCategory;
  newFoodId: string;
}

export interface SauceInput {
  mealIndex: number;
  sauceId: string;
  grams: number;
}

// ===================
// RECIPE MATCHING
// ===================

export interface RecipeMatch {
  recipeId: string;
  title: string;
  coverImage?: string;
  matchScore: number; // 0-1, how well ingredients match
  matchedIngredients: string[];
}

export interface RecipeSuggestionsResult {
  recipes: RecipeMatch[];
  aiSuggestions?: string[];
}

// ===================
// FOOD ITEM (from DB)
// ===================

export interface FoodItemForGenerator {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  macroCategory: MacroCategory | null;
  mealTypes: MealType[];
  isRecommended: boolean;
  image?: string | null;
}

// ===================
// RECIPE FOR MEAL PLAN
// ===================

// Mapping from Swedish meal type to recipe mealType
export const MEAL_TYPE_TO_RECIPE_TYPE: Record<MealType, string[]> = {
  frukost: ['breakfast'],
  mellanmål: ['snack'],
  lunch: ['lunch', 'dinner'],
  middag: ['lunch', 'dinner'],
  kvällsmål: ['snack'],
};

// Recipe for meal plan with scaling
export interface RecipeForMealPlan {
  recipeId: string;
  title: string;
  coverImage?: string | null;
  servings: number;
  baseServingMacros: CalculatedMacros;
  scaledServings: number;
  scaledMacros: CalculatedMacros;
}

// Recipe swap option with comparison info
export interface RecipeSwapOption {
  recipeId: string;
  title: string;
  coverImage?: string | null;
  scaledServings: number;
  scaledMacros: CalculatedMacros;
  macroDifference: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  matchScore: number;
}
