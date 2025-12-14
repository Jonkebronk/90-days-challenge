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
export const ALTERNATIVES_COUNT = 4;

// ===================
// MEAL CONFIGURATION
// ===================

export interface MealConfig {
  type: MealType;
  includeProtein: boolean;
  includeCarbs: boolean;
  includeFat: boolean;
}

// Default meal configuration (6 meals)
export const DEFAULT_MEAL_CONFIGS: MealConfig[] = [
  { type: 'frukost', includeProtein: true, includeCarbs: true, includeFat: true },
  { type: 'mellanmål', includeProtein: true, includeCarbs: false, includeFat: true },
  { type: 'lunch', includeProtein: true, includeCarbs: true, includeFat: false },
  { type: 'mellanmål', includeProtein: true, includeCarbs: false, includeFat: true },
  { type: 'middag', includeProtein: true, includeCarbs: true, includeFat: false },
  { type: 'kvällsmål', includeProtein: true, includeCarbs: false, includeFat: true },
];

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
}

export interface FoodAlternative {
  foodId: string;
  name: string;
  grams: number;
  macros: CalculatedMacros;
}

// ===================
// GENERATED MEAL
// ===================

export interface GeneratedMealItem {
  category: MacroCategory;
  selected: FoodWithGrams;
  alternatives: FoodAlternative[];
}

export interface GeneratedMeal {
  type: MealType;
  index: number; // For multiple meals of same type (e.g., 2 mellanmål)
  items: GeneratedMealItem[];
  sauce?: FoodWithGrams;
  vegetableGrams: number; // Usually 200g for lunch/middag
  totalMacros: CalculatedMacros;
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
}
