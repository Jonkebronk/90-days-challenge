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
 */
function scaleIngredient(
  item: TemplateIngredient,
  targetMacro: number,
  macroType: 'protein' | 'carbs' | 'fat',
  customFood?: CustomFood
): ScaledIngredient {
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

  const macroPer100g = food[macroType]

  // Calculate grams needed to reach target macro
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
 *
 * Key improvement: Distributes each macro ONLY to meals that have sources for it.
 * - Protein: distributed to all meals (all have protein sources)
 * - Carbs: distributed only to meals with carb sources (breakfast, lunch, dinner)
 * - Fat: distributed only to meals with fat sources (breakfast, snacks, evening)
 */
export function useScaledMeals(
  macroTargets: MacroTargets,
  mealCount: number,
  overrides: IngredientOverrides = {}
): ScaledMeal[] {
  return useMemo(() => {
    const distribution = mealDistributions[mealCount]
    if (!distribution) return []

    // First pass: determine which meals have which macro sources
    const mealConfigs = distribution.map(meal => {
      const templateType = meal.type.startsWith('snack') ? 'snack' : meal.type
      const template = mealTemplates[templateType] || mealTemplates.snack
      return {
        meal,
        template,
        hasProtein: template.protein.length > 0,
        hasCarbs: template.kolhydrat.length > 0,
        hasFat: template.fett.length > 0
      }
    })

    // Calculate total percentages for each macro category
    const totalProteinPercent = mealConfigs
      .filter(c => c.hasProtein)
      .reduce((sum, c) => sum + c.meal.kcalPercent, 0)
    const totalCarbsPercent = mealConfigs
      .filter(c => c.hasCarbs)
      .reduce((sum, c) => sum + c.meal.kcalPercent, 0)
    const totalFatPercent = mealConfigs
      .filter(c => c.hasFat)
      .reduce((sum, c) => sum + c.meal.kcalPercent, 0)

    // Second pass: scale each meal with adjusted percentages
    return mealConfigs.map(({ meal, template, hasProtein, hasCarbs, hasFat }) => {
      // Calculate this meal's share of each macro (only if it has sources)
      const proteinShare = hasProtein ? meal.kcalPercent / totalProteinPercent : 0
      const carbsShare = hasCarbs ? meal.kcalPercent / totalCarbsPercent : 0
      const fatShare = hasFat ? meal.kcalPercent / totalFatPercent : 0

      // Calculate actual macro targets for this meal
      const mealProteinTarget = macroTargets.protein * proteinShare
      const mealCarbsTarget = macroTargets.carbs * carbsShare
      const mealFatTarget = macroTargets.fat * fatShare

      // Scale protein sources
      const scaledProtein = template.protein.map((item, index) => {
        const overrideKey = getOverrideKey(meal.type, 'protein', index)
        const customFood = overrides[overrideKey]
        return scaleIngredient(item, mealProteinTarget, 'protein', customFood)
      })

      // Scale carb sources
      const scaledKolhydrat = template.kolhydrat.map((item, index) => {
        const overrideKey = getOverrideKey(meal.type, 'kolhydrat', index)
        const customFood = overrides[overrideKey]
        return scaleIngredient(item, mealCarbsTarget, 'carbs', customFood)
      })

      // Scale fat sources
      const scaledFett = template.fett.map((item, index) => {
        const overrideKey = getOverrideKey(meal.type, 'fett', index)
        const customFood = overrides[overrideKey]
        return scaleIngredient(item, mealFatTarget, 'fat', customFood)
      })

      // Tillagg - don't scale, keep original amounts
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

        if (scaledProtein.length > 0) {
          protein += scaledProtein[0].macros.protein
          carbs += scaledProtein[0].macros.carbs
          fat += scaledProtein[0].macros.fat
          kcal += scaledProtein[0].macros.kcal
        }

        if (scaledKolhydrat.length > 0) {
          protein += scaledKolhydrat[0].macros.protein
          carbs += scaledKolhydrat[0].macros.carbs
          fat += scaledKolhydrat[0].macros.fat
          kcal += scaledKolhydrat[0].macros.kcal
        }

        if (scaledFett.length > 0) {
          protein += scaledFett[0].macros.protein
          carbs += scaledFett[0].macros.carbs
          fat += scaledFett[0].macros.fat
          kcal += scaledFett[0].macros.kcal
        }

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
