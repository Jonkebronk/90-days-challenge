import { useMemo } from 'react'
import { MacroTargets, ScaledMeal, ScaledIngredient, TemplateIngredient, IngredientOverrides, CustomFood } from '../types'
import { mealDistributions, mealTemplates, foodDatabase } from '../meal-templates'

/**
 * Get nutrition data for a food item by SLV nummer
 */
function getFoodNutrition(slvNummer: number | undefined) {
  if (!slvNummer) return null
  return foodDatabase[slvNummer] || null
}

/**
 * Create override key for ingredient lookup
 */
function getOverrideKey(mealType: string, category: string, index: number): string {
  return `${mealType}:${category}:${index}`
}

/**
 * Scale ingredients based on macro targets
 * - Protein sources: scale based on protein content
 * - Carb sources: scale based on carb content
 * - Fat sources: scale based on fat content (except vegetables)
 * - Vegetables: DO NOT scale (kept for volume/fiber)
 */
function scaleIngredient(
  item: TemplateIngredient,
  targetMacro: number,
  macroType: 'protein' | 'carbs' | 'fat',
  customFood?: CustomFood
): ScaledIngredient {
  // Use custom food if provided, otherwise get from database
  const food = customFood || getFoodNutrition(item.slvNummer)
  const ingredientName = customFood ? customFood.name : item.name
  const ingredientSlv = customFood ? customFood.slvNummer : item.slvNummer

  if (!food) {
    return {
      ...item,
      scaledAmount: item.amount,
      macros: { protein: 0, carbs: 0, fat: 0, kcal: 0 }
    }
  }

  // Get the relevant macro value per 100g
  const macroPer100g = food[macroType]

  // For vegetables (low fat content), don't scale
  if (macroType === 'fat' && food.fat < 5) {
    const factor = item.amount / 100
    return {
      ...item,
      name: ingredientName,
      slvNummer: ingredientSlv,
      scaledAmount: item.amount,
      macros: {
        protein: Math.round(food.protein * factor * 10) / 10,
        carbs: Math.round(food.carbs * factor * 10) / 10,
        fat: Math.round(food.fat * factor * 10) / 10,
        kcal: Math.round(food.kcal * factor)
      }
    }
  }

  // Calculate grams needed to reach target macro
  // Formula: grams = (targetMacro / macroPer100g) * 100
  let scaledAmount = item.amount
  if (macroPer100g > 0 && targetMacro > 0) {
    scaledAmount = Math.round((targetMacro / macroPer100g) * 100)
  }

  const factor = scaledAmount / 100
  return {
    ...item,
    name: ingredientName,
    slvNummer: ingredientSlv,
    scaledAmount,
    macros: {
      protein: Math.round(food.protein * factor * 10) / 10,
      carbs: Math.round(food.carbs * factor * 10) / 10,
      fat: Math.round(food.fat * factor * 10) / 10,
      kcal: Math.round(food.kcal * factor)
    }
  }
}

/**
 * Hook to calculate scaled meals based on macro targets
 * @param macroTargets - Daily macro targets
 * @param mealCount - Number of meals (4, 5, or 6)
 * @param overrides - Custom ingredient overrides from SLV search
 */
export function useScaledMeals(
  macroTargets: MacroTargets,
  mealCount: number,
  overrides: IngredientOverrides = {}
): ScaledMeal[] {
  return useMemo(() => {
    const distribution = mealDistributions[mealCount]
    if (!distribution) return []

    return distribution.map(meal => {
      // Get the right template (snack1/snack2 use 'snack' template)
      const templateType = meal.type.startsWith('snack') ? 'snack' : meal.type
      const template = mealTemplates[templateType] || mealTemplates.snack

      // Calculate meal macro targets based on kcal percentage
      const mealProteinTarget = macroTargets.protein * (meal.kcalPercent / 100)
      const mealCarbsTarget = macroTargets.carbs * (meal.kcalPercent / 100)
      const mealFatTarget = macroTargets.fat * (meal.kcalPercent / 100)

      // Scale protein sources (check for overrides)
      const scaledProtein = template.protein.map((item, index) => {
        const overrideKey = getOverrideKey(meal.type, 'protein', index)
        const customFood = overrides[overrideKey]
        return scaleIngredient(item, mealProteinTarget, 'protein', customFood)
      })

      // Scale carb sources (check for overrides)
      const scaledKolhydrat = template.kolhydrat.map((item, index) => {
        const overrideKey = getOverrideKey(meal.type, 'kolhydrat', index)
        const customFood = overrides[overrideKey]
        return scaleIngredient(item, mealCarbsTarget, 'carbs', customFood)
      })

      // Scale fat sources (check for overrides)
      const scaledFett = template.fett.map((item, index) => {
        const overrideKey = getOverrideKey(meal.type, 'fett', index)
        const customFood = overrides[overrideKey]
        return scaleIngredient(item, mealFatTarget, 'fat', customFood)
      })

      // Scale tillagg (additions) - don't scale, keep original
      const scaledTillagg = template.tillagg.map(item => {
        const food = getFoodNutrition(item.slvNummer)
        const factor = item.amount / 100
        return {
          ...item,
          scaledAmount: item.amount,
          macros: food ? {
            protein: Math.round(food.protein * factor * 10) / 10,
            carbs: Math.round(food.carbs * factor * 10) / 10,
            fat: Math.round(food.fat * factor * 10) / 10,
            kcal: Math.round(food.kcal * factor)
          } : { protein: 0, carbs: 0, fat: 0, kcal: 0 }
        }
      })

      // Calculate actual macros for this meal (using first alternative in each category)
      const calcMealMacros = () => {
        let protein = 0, carbs = 0, fat = 0, kcal = 0

        // First protein source
        if (scaledProtein.length > 0) {
          protein += scaledProtein[0].macros.protein
          carbs += scaledProtein[0].macros.carbs
          fat += scaledProtein[0].macros.fat
          kcal += scaledProtein[0].macros.kcal
        }

        // First carb source
        if (scaledKolhydrat.length > 0) {
          protein += scaledKolhydrat[0].macros.protein
          carbs += scaledKolhydrat[0].macros.carbs
          fat += scaledKolhydrat[0].macros.fat
          kcal += scaledKolhydrat[0].macros.kcal
        }

        // First fat source
        if (scaledFett.length > 0) {
          protein += scaledFett[0].macros.protein
          carbs += scaledFett[0].macros.carbs
          fat += scaledFett[0].macros.fat
          kcal += scaledFett[0].macros.kcal
        }

        // Additions
        scaledTillagg.forEach(item => {
          protein += item.macros.protein
          carbs += item.macros.carbs
          fat += item.macros.fat
          kcal += item.macros.kcal
        })

        return {
          protein: Math.round(protein),
          carbs: Math.round(carbs),
          fat: Math.round(fat),
          kcal: Math.round(kcal)
        }
      }

      const actualMacros = calcMealMacros()

      return {
        ...meal,
        kcal: actualMacros.kcal,
        protein: actualMacros.protein,
        carbs: actualMacros.carbs,
        fat: actualMacros.fat,
        template: {
          kolhydrat: scaledKolhydrat,
          protein: scaledProtein,
          fett: scaledFett,
          tillagg: scaledTillagg,
          kosttillskott: template.kosttillskott
        }
      }
    })
  }, [macroTargets, mealCount, overrides])
}

/**
 * Calculate daily totals from scaled meals
 */
export function calculateDailyTotals(meals: ScaledMeal[]) {
  return meals.reduce((acc, meal) => ({
    kcal: acc.kcal + meal.kcal,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fat: acc.fat + meal.fat
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })
}
