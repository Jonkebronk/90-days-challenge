import type { CalculatedMacros, MacroCategory } from '@/lib/types/meal-plan-generator';

// Original recipe ingredient from database
export interface RecipeIngredientInfo {
  id: string;
  amount: number; // grams
  displayUnit?: string | null;
  displayAmount?: string | null;
  notes?: string | null;
  optional: boolean;
  foodItem: {
    id: string;
    name: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    image?: string | null;
  };
}

// Linked product selection for an ingredient
export interface LinkedProduct {
  productId: string; // Can be 'slv-123' for SLV products
  productName: string;
  grams: number;
  macros: CalculatedMacros;
  image?: string | null;
  source: 'product' | 'slv';
}

// State for a single ingredient in the customizer
export interface CustomizedIngredient {
  originalIngredient: RecipeIngredientInfo;
  linkedProduct: LinkedProduct | null;
  isLinked: boolean;
  isIncluded: boolean; // Toggle for include/skip ingredient
}

// Full customized recipe state
export interface CustomizedRecipeState {
  recipeId: string;
  recipeTitle: string;
  originalServings: number;
  ingredients: CustomizedIngredient[];
  totalMacros: CalculatedMacros;
}

// Props for RecipeCustomizerDialog
export interface RecipeCustomizerDialogProps {
  recipeId: string;
  mealPlanId: string;
  mealIndex: number;
  targetMacros?: CalculatedMacros; // For comparison with meal target
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Props for IngredientMatchRow
export interface IngredientMatchRowProps {
  ingredient: CustomizedIngredient;
  onLinkClick: () => void;
  onUnlink: () => void;
  onUpdateGrams: (grams: number) => void;
  onToggleInclude: () => void; // Toggle include/skip
}

// API request body for adding customized recipe
export interface AddCustomizedRecipeRequest {
  mealIndex: number;
  recipeId: string;
  recipeTitle: string;
  customizedIngredients: Array<{
    productId: string;
    productName: string;
    grams: number;
    macros: CalculatedMacros;
    source: 'product' | 'slv';
    image?: string | null;
  }>;
}

// Determine macro category based on dominant macro
export function determineMacroCategory(product: { protein: number; carbs: number; fat: number }): MacroCategory {
  const { protein, carbs, fat } = product; // per 100g

  // Threshold-based categorization (matches existing ProductSelectModal logic)
  if (protein >= 10 && protein > carbs && protein > fat) return 'protein';
  if (carbs >= 15 && carbs > protein * 1.5) return 'carb';
  if (fat >= 10 && fat > carbs) return 'fat';

  // Fallback: highest macro wins
  if (protein >= carbs && protein >= fat) return 'protein';
  if (carbs >= protein && carbs >= fat) return 'carb';
  return 'fat';
}
