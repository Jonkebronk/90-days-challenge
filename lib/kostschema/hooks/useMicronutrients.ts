import { useMemo, useState, useEffect } from 'react'
import { ScaledMeal, Micronutrients } from '../types'
import { MICRONUTRIENT_KEYS } from '../rdi-constants'

// Cache for SLV nutrition data (persists across renders)
const nutritionCache: Map<number, SLVNutrition | null> = new Map()

interface SLVNutrition {
  slvNummer: number
  protein: number
  carbs: number
  fat: number
  kcal: number
  vitaminA: number | null
  vitaminD: number | null
  vitaminE: number | null
  vitaminC: number | null
  vitaminB6: number | null
  vitaminB12: number | null
  thiamin: number | null
  riboflavin: number | null
  niacin: number | null
  folate: number | null
  calcium: number | null
  iron: number | null
  magnesium: number | null
  phosphorus: number | null
  potassium: number | null
  zinc: number | null
  selenium: number | null
  iodine: number | null
}

/**
 * Create empty micronutrients object
 */
function createEmptyMicronutrients(): Micronutrients {
  return {
    vitaminA: null,
    vitaminD: null,
    vitaminE: null,
    vitaminC: null,
    vitaminB6: null,
    vitaminB12: null,
    thiamin: null,
    riboflavin: null,
    niacin: null,
    folate: null,
    calcium: null,
    iron: null,
    magnesium: null,
    phosphorus: null,
    potassium: null,
    zinc: null,
    selenium: null,
    iodine: null
  }
}

/**
 * Add a value to a micronutrient total (handling nulls)
 */
function addMicronutrient(current: number | null, addition: number | null): number | null {
  if (addition === null) return current
  if (current === null) return addition
  return current + addition
}

/**
 * Fetch nutrition data for a specific SLV nummer
 */
async function fetchSLVNutrition(slvNummer: number): Promise<SLVNutrition | null> {
  // Check cache first
  if (nutritionCache.has(slvNummer)) {
    return nutritionCache.get(slvNummer) || null
  }

  try {
    const response = await fetch(`/api/slv-proxy?nummer=${slvNummer}`)
    if (!response.ok) {
      nutritionCache.set(slvNummer, null)
      return null
    }

    const data = await response.json()
    if (!data.food) {
      nutritionCache.set(slvNummer, null)
      return null
    }

    const nutrition: SLVNutrition = {
      slvNummer: data.food.slvNummer,
      protein: data.food.protein,
      carbs: data.food.carbs,
      fat: data.food.fat,
      kcal: data.food.kcal,
      vitaminA: data.food.vitaminA,
      vitaminD: data.food.vitaminD,
      vitaminE: data.food.vitaminE,
      vitaminC: data.food.vitaminC,
      vitaminB6: data.food.vitaminB6,
      vitaminB12: data.food.vitaminB12,
      thiamin: data.food.thiamin,
      riboflavin: data.food.riboflavin,
      niacin: data.food.niacin,
      folate: data.food.folate,
      calcium: data.food.calcium,
      iron: data.food.iron,
      magnesium: data.food.magnesium,
      phosphorus: data.food.phosphorus,
      potassium: data.food.potassium,
      zinc: data.food.zinc,
      selenium: data.food.selenium,
      iodine: data.food.iodine
    }

    nutritionCache.set(slvNummer, nutrition)
    return nutrition
  } catch {
    nutritionCache.set(slvNummer, null)
    return null
  }
}

/**
 * Hook to fetch and calculate daily micronutrients from scaled meals
 */
export function useMicronutrients(meals: ScaledMeal[]): {
  micronutrients: Micronutrients
  isLoading: boolean
} {
  const [nutritionData, setNutritionData] = useState<Map<number, SLVNutrition | null>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  // Collect all unique slvNummer from meals
  const slvNummers = useMemo(() => {
    const numbers = new Set<number>()
    meals.forEach(meal => {
      const categories = ['protein', 'kolhydrat', 'fett', 'tillagg'] as const
      categories.forEach(category => {
        meal.template[category].forEach(ingredient => {
          if (ingredient.slvNummer) {
            numbers.add(ingredient.slvNummer)
          }
        })
      })
    })
    return Array.from(numbers)
  }, [meals])

  // Fetch nutrition data for all ingredients
  useEffect(() => {
    if (slvNummers.length === 0) {
      setIsLoading(false)
      return
    }

    const fetchAll = async () => {
      setIsLoading(true)
      const results = new Map<number, SLVNutrition | null>()

      // Batch fetch (max 5 concurrent requests)
      const batchSize = 5
      for (let i = 0; i < slvNummers.length; i += batchSize) {
        const batch = slvNummers.slice(i, i + batchSize)
        const batchResults = await Promise.all(
          batch.map(nummer => fetchSLVNutrition(nummer))
        )
        batch.forEach((nummer, idx) => {
          results.set(nummer, batchResults[idx])
        })
      }

      setNutritionData(results)
      setIsLoading(false)
    }

    fetchAll()
  }, [slvNummers])

  // Calculate daily totals
  const micronutrients = useMemo(() => {
    const totals = createEmptyMicronutrients()

    meals.forEach(meal => {
      const categories = ['protein', 'kolhydrat', 'fett', 'tillagg'] as const
      categories.forEach(category => {
        // Only use first ingredient in each category (alternatives are options)
        const ingredient = meal.template[category][0]
        if (!ingredient || !ingredient.slvNummer) return

        const nutrition = nutritionData.get(ingredient.slvNummer)
        if (!nutrition) return

        // Calculate factor based on scaled amount
        const factor = ingredient.scaledAmount / 100

        // Add each micronutrient
        MICRONUTRIENT_KEYS.forEach(key => {
          const value = nutrition[key as keyof SLVNutrition]
          if (typeof value === 'number') {
            totals[key as keyof Micronutrients] = addMicronutrient(
              totals[key as keyof Micronutrients],
              value * factor
            )
          }
        })
      })
    })

    // Round all values
    MICRONUTRIENT_KEYS.forEach(key => {
      const value = totals[key as keyof Micronutrients]
      if (value !== null) {
        totals[key as keyof Micronutrients] = Math.round(value * 10) / 10
      }
    })

    return totals
  }, [meals, nutritionData])

  return { micronutrients, isLoading }
}
