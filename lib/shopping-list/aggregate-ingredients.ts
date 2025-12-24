/**
 * Aggregera ingredienser från en måltidsplan
 *
 * Tar en SmartMealPlan med alla dagar, måltider och recept
 * och returnerar en summerad lista av unika ingredienser
 * med total mängd beräknad från alla recept.
 */

import type { Prisma } from '@prisma/client'

// Types för måltidsplandata
export interface FoodItemData {
  id: string
  name: string
  calories?: number | null
  proteinG?: number | null
  carbsG?: number | null
  fatG?: number | null
  macroCategory?: string | null
  subCategory?: string | null
  foodCategory?: {
    name: string
  } | null
}

export interface RecipeIngredientData {
  id: string
  foodItemId: string
  amount: Prisma.Decimal | number
  displayUnit?: string | null
  displayAmount?: string | null
  notes?: string | null
  foodItem: FoodItemData
}

export interface RecipeData {
  id: string
  title: string
  servings: number
  ingredients: RecipeIngredientData[]
}

export interface MealData {
  id: string
  slot: string
  scaleFactor: number
  scaledServings: number
  recipe: RecipeData
}

export interface DayData {
  id: string
  dayNumber: number
  dayName?: string | null
  meals: MealData[]
}

export interface MealPlanData {
  id: string
  name: string
  days: DayData[]
}

// Output types
export interface AggregatedIngredient {
  foodItemId: string
  foodItem: FoodItemData
  totalGrams: number
  recipeCount: number
  meals: string[] // ["Måndag Frukost", "Tisdag Middag"]
  category: string // Auto-assigned shopping category
  displayAmount?: string // "500g" or "2 st"
  displayUnit?: string
}

/**
 * Aggregera ingredienser från en måltidsplan
 * Summerar gram per unik FoodItem med hänsyn till scaleFactor
 */
export function aggregateIngredients(mealPlan: MealPlanData): AggregatedIngredient[] {
  const ingredientMap = new Map<string, AggregatedIngredient>()

  for (const day of mealPlan.days) {
    for (const meal of day.meals) {
      const scaleFactor = meal.scaleFactor || 1

      for (const ingredient of meal.recipe.ingredients) {
        const baseGrams = Number(ingredient.amount) || 0
        const scaledGrams = baseGrams * scaleFactor
        const key = ingredient.foodItemId

        const mealLabel = `${day.dayName || `Dag ${day.dayNumber}`} ${meal.slot}`

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!
          existing.totalGrams += scaledGrams
          existing.recipeCount += 1
          if (!existing.meals.includes(mealLabel)) {
            existing.meals.push(mealLabel)
          }
        } else {
          ingredientMap.set(key, {
            foodItemId: key,
            foodItem: ingredient.foodItem,
            totalGrams: scaledGrams,
            recipeCount: 1,
            meals: [mealLabel],
            category: autoAssignCategory(ingredient.foodItem),
            displayUnit: ingredient.displayUnit || 'g',
          })
        }
      }
    }
  }

  // Round to sensible amounts and calculate display values
  const aggregated = Array.from(ingredientMap.values()).map((ing) => ({
    ...ing,
    totalGrams: roundToSensibleAmount(ing.totalGrams, ing.foodItem),
    displayAmount: formatDisplayAmount(
      roundToSensibleAmount(ing.totalGrams, ing.foodItem),
      ing.displayUnit || 'g'
    ),
  }))

  // Sort by category, then name
  return aggregated.sort((a, b) => {
    if (a.category !== b.category) {
      return getCategoryOrder(a.category) - getCategoryOrder(b.category)
    }
    return a.foodItem.name.localeCompare(b.foodItem.name, 'sv')
  })
}

/**
 * Avrunda till vettiga mängder
 * Större mängder avrundas mer för att undvika "523g"
 */
function roundToSensibleAmount(grams: number, foodItem: FoodItemData): number {
  if (grams <= 0) return 0

  // Små mängder (<50g): avrunda till närmaste 5g
  if (grams < 50) {
    return Math.ceil(grams / 5) * 5
  }

  // Medelmängder (50-200g): avrunda till närmaste 25g
  if (grams < 200) {
    return Math.ceil(grams / 25) * 25
  }

  // Större mängder (200-1000g): avrunda till närmaste 50g
  if (grams < 1000) {
    return Math.ceil(grams / 50) * 50
  }

  // Stora mängder (>1kg): avrunda till närmaste 100g
  return Math.ceil(grams / 100) * 100
}

/**
 * Formatera mängd för visning
 */
function formatDisplayAmount(grams: number, unit: string): string {
  if (unit === 'g' || unit === 'gram') {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(1).replace('.0', '')} kg`
    }
    return `${grams}g`
  }
  return `${grams} ${unit}`
}

/**
 * Auto-tilldela inköpskategori baserat på FoodItem
 */
function autoAssignCategory(foodItem: FoodItemData): string {
  const name = foodItem.name.toLowerCase()
  const categoryName = foodItem.foodCategory?.name?.toLowerCase() || ''
  const macroCategory = foodItem.macroCategory?.toLowerCase() || ''

  // Frukt & Grönt
  if (
    categoryName.includes('grönsak') ||
    categoryName.includes('frukt') ||
    categoryName.includes('bär') ||
    macroCategory === 'vegetable'
  ) {
    return 'Frukt & Grönt'
  }

  // Mejeri
  if (
    categoryName.includes('mejeri') ||
    name.includes('mjölk') ||
    name.includes('yoghurt') ||
    name.includes('kvarg') ||
    name.includes('grädde') ||
    name.includes('smör')
  ) {
    return 'Mejeri'
  }

  // Ost
  if (name.includes('ost') && !name.includes('kost')) {
    return 'Ost'
  }

  // Kött & Fågel
  if (
    categoryName.includes('kött') ||
    categoryName.includes('fågel') ||
    name.includes('kyckling') ||
    name.includes('nötkött') ||
    name.includes('fläsk') ||
    name.includes('kalkon')
  ) {
    return 'Kött & Fågel'
  }

  // Fisk & Skaldjur
  if (
    categoryName.includes('fisk') ||
    categoryName.includes('skaldjur') ||
    name.includes('lax') ||
    name.includes('torsk') ||
    name.includes('räkor')
  ) {
    return 'Fisk & Skaldjur'
  }

  // Bröd & Baka
  if (
    categoryName.includes('bröd') ||
    name.includes('bröd') ||
    name.includes('mjöl') ||
    name.includes('havregryn')
  ) {
    return 'Bröd & Baka'
  }

  // Skafferi
  if (
    categoryName.includes('skafferi') ||
    name.includes('ris') ||
    name.includes('pasta') ||
    name.includes('olja') ||
    name.includes('socker') ||
    name.includes('salt')
  ) {
    return 'Skafferi'
  }

  // Fryst
  if (
    categoryName.includes('fryst') ||
    name.includes('fryst') ||
    name.includes('frysta')
  ) {
    return 'Fryst'
  }

  // Chark & Pålägg
  if (
    categoryName.includes('chark') ||
    name.includes('skinka') ||
    name.includes('bacon') ||
    name.includes('korv')
  ) {
    return 'Chark & Pålägg'
  }

  // Ägg
  if (name.includes('ägg')) {
    return 'Mejeri'
  }

  // Proteinkällor generellt
  if (macroCategory === 'protein') {
    return 'Kött & Fågel'
  }

  // Kolhydrater generellt
  if (macroCategory === 'carb') {
    return 'Skafferi'
  }

  // Fett generellt
  if (macroCategory === 'fat') {
    return 'Skafferi'
  }

  return 'Övrigt'
}

/**
 * Sorteringsordning för kategorier (ICA butikslayout)
 */
const CATEGORY_ORDER = [
  'Frukt & Grönt',
  'Bröd & Baka',
  'Mejeri',
  'Ost',
  'Chark & Pålägg',
  'Kött & Fågel',
  'Fisk & Skaldjur',
  'Fryst',
  'Skafferi',
  'Konserv',
  'Dryck',
  'Godis & Snacks',
  'Hygien & Hem',
  'Övrigt',
]

function getCategoryOrder(category: string): number {
  const index = CATEGORY_ORDER.indexOf(category)
  return index === -1 ? CATEGORY_ORDER.length : index
}

/**
 * Gruppera ingredienser efter kategori
 */
export function groupByCategory(
  ingredients: AggregatedIngredient[]
): Record<string, AggregatedIngredient[]> {
  const groups: Record<string, AggregatedIngredient[]> = {}

  for (const ing of ingredients) {
    if (!groups[ing.category]) {
      groups[ing.category] = []
    }
    groups[ing.category].push(ing)
  }

  // Sort groups by category order
  const sortedGroups: Record<string, AggregatedIngredient[]> = {}
  for (const category of CATEGORY_ORDER) {
    if (groups[category]) {
      sortedGroups[category] = groups[category]
    }
  }
  // Add any remaining categories
  for (const category of Object.keys(groups)) {
    if (!sortedGroups[category]) {
      sortedGroups[category] = groups[category]
    }
  }

  return sortedGroups
}
