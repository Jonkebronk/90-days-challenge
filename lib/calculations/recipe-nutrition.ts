import { RecipeIngredient, RecipeNutrition, FoodItem } from '@/components/recipe-editor/types'

interface IngredientWithFood extends RecipeIngredient {
  foodItem: FoodItem
}

/**
 * Calculate total nutrition for a recipe based on ingredients
 * @param ingredients - Array of recipe ingredients with foodItem data
 * @param servings - Number of servings the recipe makes
 * @returns Nutrition per serving
 */
export function calculateRecipeNutrition(
  ingredients: IngredientWithFood[],
  servings: number
): RecipeNutrition {
  if (servings <= 0) {
    throw new Error('Servings must be greater than 0')
  }

  // Calculate total nutrition from all ingredients
  const totals = ingredients.reduce(
    (acc, ingredient) => {
      const { foodItem, amount } = ingredient // amount is in grams

      // Calculate nutrition for this ingredient
      // Formula: (nutrition_per_100g * amount_in_grams) / 100
      const calories = (foodItem.calories * amount) / 100
      const protein = (foodItem.proteinG * amount) / 100
      const carbs = (foodItem.carbsG * amount) / 100
      const fat = (foodItem.fatG * amount) / 100

      return {
        calories: acc.calories + calories,
        protein: acc.protein + protein,
        carbs: acc.carbs + carbs,
        fat: acc.fat + fat,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Divide by servings to get per-serving values
  return {
    caloriesPerServing: Math.round(totals.calories / servings),
    proteinPerServing: Math.round((totals.protein / servings) * 10) / 10, // 1 decimal
    carbsPerServing: Math.round((totals.carbs / servings) * 10) / 10,
    fatPerServing: Math.round((totals.fat / servings) * 10) / 10,
  }
}

/**
 * Calculate nutrition for a single ingredient
 * @param foodItem - The food item
 * @param amountInGrams - Amount in grams
 * @returns Nutrition for this amount
 */
export function calculateIngredientNutrition(
  foodItem: FoodItem,
  amountInGrams: number
): {
  calories: number
  protein: number
  carbs: number
  fat: number
} {
  return {
    calories: Math.round((foodItem.calories * amountInGrams) / 100),
    protein: Math.round(((foodItem.proteinG * amountInGrams) / 100) * 10) / 10,
    carbs: Math.round(((foodItem.carbsG * amountInGrams) / 100) * 10) / 10,
    fat: Math.round(((foodItem.fatG * amountInGrams) / 100) * 10) / 10,
  }
}

/**
 * Validate nutrition values
 * @param nutrition - Nutrition object to validate
 * @returns true if valid
 */
export function validateNutrition(nutrition: RecipeNutrition): boolean {
  return (
    nutrition.caloriesPerServing >= 0 &&
    nutrition.proteinPerServing >= 0 &&
    nutrition.carbsPerServing >= 0 &&
    nutrition.fatPerServing >= 0
  )
}

/**
 * Format nutrition value for display
 * @param value - Numeric value
 * @param unit - Unit to append
 * @returns Formatted string
 */
export function formatNutrition(value: number, unit: string = 'g'): string {
  if (unit === 'kcal') {
    return `${Math.round(value)} ${unit}`
  }
  return `${value.toFixed(1)} ${unit}`
}
