import { CatalogSchema, CatalogMeal, CatalogFoodItem, ScaledCatalogSchema } from './types'

/**
 * Calculate the scale factor needed to adjust a schema to target calories
 */
export function calculateScaleFactor(originalKcal: number, targetKcal: number): number {
  if (originalKcal <= 0) return 1
  return targetKcal / originalKcal
}

/**
 * Scale a food item by the given factor
 */
function scaleFoodItem(food: CatalogFoodItem, factor: number): CatalogFoodItem {
  return {
    ...food,
    amountG: Math.round(food.amountG * factor),
    protein: +(food.protein * factor).toFixed(1),
    carbs: +(food.carbs * factor).toFixed(1),
    fat: +(food.fat * factor).toFixed(1),
    kcal: Math.round(food.kcal * factor)
  }
}

/**
 * Scale a meal by the given factor
 */
function scaleMeal(meal: CatalogMeal, factor: number): CatalogMeal {
  return {
    ...meal,
    foods: meal.foods.map(food => scaleFoodItem(food, factor)),
    totalProtein: Math.round(meal.totalProtein * factor),
    totalCarbs: Math.round(meal.totalCarbs * factor),
    totalFat: Math.round(meal.totalFat * factor),
    totalKcal: Math.round(meal.totalKcal * factor)
  }
}

/**
 * Scale an entire schema to target calories
 * Returns a ScaledCatalogSchema with original values preserved
 */
export function scaleSchema(
  schema: CatalogSchema,
  targetKcal: number
): ScaledCatalogSchema {
  const factor = calculateScaleFactor(schema.totals.kcal, targetKcal)

  return {
    ...schema,
    scaleFactor: factor,
    originalTotals: { ...schema.totals },
    meals: schema.meals.map(meal => scaleMeal(meal, factor)),
    totals: {
      protein: Math.round(schema.totals.protein * factor),
      carbs: Math.round(schema.totals.carbs * factor),
      fat: Math.round(schema.totals.fat * factor),
      kcal: Math.round(schema.totals.kcal * factor)
    }
  }
}

/**
 * Format grams for display (rounds to nearest 5g for cleaner look)
 */
export function formatGrams(grams: number, roundToFive: boolean = false): string {
  if (roundToFive) {
    return `${Math.round(grams / 5) * 5}g`
  }
  return `${Math.round(grams)}g`
}

/**
 * Calculate macro percentages from totals
 */
export function calculateMacroPercentages(totals: { protein: number; carbs: number; fat: number; kcal: number }) {
  const proteinKcal = totals.protein * 4
  const carbsKcal = totals.carbs * 4
  const fatKcal = totals.fat * 9
  const totalCalFromMacros = proteinKcal + carbsKcal + fatKcal

  if (totalCalFromMacros === 0) {
    return { protein: 0, carbs: 0, fat: 0 }
  }

  return {
    protein: Math.round((proteinKcal / totalCalFromMacros) * 100),
    carbs: Math.round((carbsKcal / totalCalFromMacros) * 100),
    fat: Math.round((fatKcal / totalCalFromMacros) * 100)
  }
}
