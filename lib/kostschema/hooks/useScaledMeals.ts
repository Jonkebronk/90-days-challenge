import { useMemo } from 'react'
import { MacroTargets, ScaledMeal, ScaledIngredient, TemplateIngredient, IngredientOverrides, CustomFood, DeletedIngredients } from '../types'
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

  // Use custom amount if provided, otherwise calculate based on macro target
  let scaledAmount = item.amount
  if (customFood?.customAmount !== undefined) {
    // User has manually set the amount
    scaledAmount = customFood.customAmount
  } else if (macroPer100g > 0 && targetMacro > 0) {
    // Calculate grams needed to reach target macro
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
 * Scale a custom food that was added via override (no template item)
 */
function scaleCustomFood(
  customFood: CustomFood,
  targetMacro: number,
  macroType: 'protein' | 'carbs' | 'fat',
  id: number
): ScaledIngredient {
  const macroPer100g = customFood[macroType === 'carbs' ? 'carbs' : macroType]

  // Use custom amount if provided, otherwise calculate based on macro target
  let scaledAmount = 100 // default
  if (customFood.customAmount !== undefined) {
    scaledAmount = customFood.customAmount
  } else if (macroPer100g > 0 && targetMacro > 0) {
    scaledAmount = Math.round((targetMacro / macroPer100g) * 100)
  }

  const factor = scaledAmount / 100
  return {
    id,
    amount: scaledAmount,
    unit: 'g',
    name: customFood.name,
    foodId: '',
    slvNummer: customFood.slvNummer,
    scaledAmount,
    macros: {
      protein: Math.round(customFood.protein * factor * 10) / 10,
      carbs: Math.round(customFood.carbs * factor * 10) / 10,
      fat: Math.round(customFood.fat * factor * 10) / 10,
      kcal: Math.round(customFood.kcal * factor)
    }
  }
}

/**
 * Get all override indices for a meal/category combination
 */
function getOverrideIndices(
  overrides: IngredientOverrides,
  mealType: string,
  category: string
): number[] {
  const prefix = `${mealType}:${category}:`
  const indices: number[] = []
  for (const key of Object.keys(overrides)) {
    if (key.startsWith(prefix)) {
      const index = parseInt(key.slice(prefix.length))
      if (!isNaN(index)) {
        indices.push(index)
      }
    }
  }
  return indices.sort((a, b) => a - b)
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
  overrides: IngredientOverrides = {},
  deletedIngredients: DeletedIngredients = new Set()
): ScaledMeal[] {
  return useMemo(() => {
    const distribution = mealDistributions[mealCount]
    if (!distribution) return []

    // First pass: determine which meals have which macro sources (including overrides)
    const mealConfigs = distribution.map(meal => {
      const templateType = meal.type.startsWith('snack') ? 'snack' : meal.type
      const template = mealTemplates[templateType] || mealTemplates.snack

      // Check both template and overrides for sources
      const proteinOverrides = getOverrideIndices(overrides, meal.type, 'protein')
      const carbsOverrides = getOverrideIndices(overrides, meal.type, 'kolhydrat')
      const fatOverrides = getOverrideIndices(overrides, meal.type, 'fett')

      return {
        meal,
        template,
        hasProtein: template.protein.length > 0 || proteinOverrides.length > 0,
        hasCarbs: template.kolhydrat.length > 0 || carbsOverrides.length > 0,
        hasFat: template.fett.length > 0 || fatOverrides.length > 0
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

      // Scale protein sources (template + overrides, filter out deleted)
      const proteinOverrideIndices = getOverrideIndices(overrides, meal.type, 'protein')
      const scaledProtein: ScaledIngredient[] = []

      // First, process template items
      template.protein.forEach((item, index) => {
        const overrideKey = getOverrideKey(meal.type, 'protein', index)
        if (deletedIngredients.has(overrideKey)) return
        const customFood = overrides[overrideKey]
        scaledProtein.push(scaleIngredient(item, mealProteinTarget, 'protein', customFood))
      })

      // Then, add override-only items (indices beyond template)
      proteinOverrideIndices.forEach(index => {
        if (index >= template.protein.length) {
          const overrideKey = getOverrideKey(meal.type, 'protein', index)
          if (deletedIngredients.has(overrideKey)) return
          const customFood = overrides[overrideKey]
          if (customFood) {
            scaledProtein.push(scaleCustomFood(customFood, mealProteinTarget, 'protein', index + 1000))
          }
        }
      })

      // Scale carb sources (template + overrides, filter out deleted)
      const carbsOverrideIndices = getOverrideIndices(overrides, meal.type, 'kolhydrat')
      const scaledKolhydrat: ScaledIngredient[] = []

      template.kolhydrat.forEach((item, index) => {
        const overrideKey = getOverrideKey(meal.type, 'kolhydrat', index)
        if (deletedIngredients.has(overrideKey)) return
        const customFood = overrides[overrideKey]
        scaledKolhydrat.push(scaleIngredient(item, mealCarbsTarget, 'carbs', customFood))
      })

      carbsOverrideIndices.forEach(index => {
        if (index >= template.kolhydrat.length) {
          const overrideKey = getOverrideKey(meal.type, 'kolhydrat', index)
          if (deletedIngredients.has(overrideKey)) return
          const customFood = overrides[overrideKey]
          if (customFood) {
            scaledKolhydrat.push(scaleCustomFood(customFood, mealCarbsTarget, 'carbs', index + 2000))
          }
        }
      })

      // Scale fat sources (template + overrides, filter out deleted)
      const fatOverrideIndices = getOverrideIndices(overrides, meal.type, 'fett')
      const scaledFett: ScaledIngredient[] = []

      template.fett.forEach((item, index) => {
        const overrideKey = getOverrideKey(meal.type, 'fett', index)
        if (deletedIngredients.has(overrideKey)) return
        const customFood = overrides[overrideKey]
        scaledFett.push(scaleIngredient(item, mealFatTarget, 'fat', customFood))
      })

      fatOverrideIndices.forEach(index => {
        if (index >= template.fett.length) {
          const overrideKey = getOverrideKey(meal.type, 'fett', index)
          if (deletedIngredients.has(overrideKey)) return
          const customFood = overrides[overrideKey]
          if (customFood) {
            scaledFett.push(scaleCustomFood(customFood, mealFatTarget, 'fat', index + 3000))
          }
        }
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
  }, [macroTargets, mealCount, overrides, deletedIngredients])
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
