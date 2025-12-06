/**
 * Smart Meal Planner Core Library
 *
 * Provides algorithms for matching recipes to macro targets and generating meal plans.
 * Adapted for 90 Days Challenge database schema.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MacroTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MacroRatios {
  protein: number
  carbs: number
  fat: number
}

export interface FoodItem {
  id: string
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  commonServingSize: string
  isVegetarian: boolean
}

export interface RecipeIngredient {
  id: string
  recipeId: string
  foodItemId: string
  amount: number // in grams
  displayUnit?: string
  displayAmount?: string
  note?: string
  foodItem: FoodItem
}

export interface Recipe {
  id: string
  title: string
  description?: string
  servings: number
  // Nutrition per serving (adapted from caloriesPerServing etc.)
  calories: number
  protein: number
  carbs: number
  fat: number
  imageUrl?: string
  published: boolean
  categoryId?: string
  subcategoryId?: string
  ingredients: RecipeIngredient[]
}

export interface RecipeMatch {
  recipe: Recipe
  scaleFactor: number
  scaledServings: number
  macros: MacroTargets
  score: number
  deviation: MacroTargets
}

export interface MealSlot {
  name: string
  targetRatio: number
}

export interface PlannedMeal {
  slot: MealSlot
  recipe: RecipeMatch
}

export interface DayPlan {
  meals: PlannedMeal[]
  totals: MacroTargets
  targetDeviation: MacroTargets
  score: number
}

export interface WeekDay {
  dayNumber: number
  dayName: string
  plan: DayPlan
}

export interface WeekPlan {
  days: WeekDay[]
  weeklyTotals: MacroTargets
  averageScore: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_MEAL_SLOTS: MealSlot[] = [
  { name: 'Frukost', targetRatio: 0.25 },
  { name: 'Lunch', targetRatio: 0.35 },
  { name: 'Mellanmål', targetRatio: 0.10 },
  { name: 'Middag', targetRatio: 0.30 }
]

export const DAY_NAMES = [
  'Måndag',
  'Tisdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lördag',
  'Söndag'
]

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert macro ratios (percentages) to grams based on calorie target
 */
export function ratiosToGrams(calories: number, ratios: MacroRatios): MacroTargets {
  return {
    calories,
    protein: Math.round((ratios.protein / 100) * calories / 4),
    carbs: Math.round((ratios.carbs / 100) * calories / 4),
    fat: Math.round((ratios.fat / 100) * calories / 9)
  }
}

/**
 * Calculate macro totals from recipe and scale factor
 */
export function scaleMacros(recipe: Recipe, scaleFactor: number): MacroTargets {
  return {
    calories: Math.round(recipe.calories * scaleFactor),
    protein: Math.round(recipe.protein * scaleFactor),
    carbs: Math.round(recipe.carbs * scaleFactor),
    fat: Math.round(recipe.fat * scaleFactor)
  }
}

/**
 * Calculate deviation percentage between actual and target values
 */
export function calculateDeviation(actual: number, target: number): number {
  if (target === 0) return actual === 0 ? 0 : 100
  return ((actual - target) / target) * 100
}

/**
 * Calculate overall match score (0-1) based on macro deviations
 * Lower deviation = higher score
 */
export function calculateMatchScore(
  actual: MacroTargets,
  target: MacroTargets,
  weights = { calories: 0.4, protein: 0.3, carbs: 0.15, fat: 0.15 }
): number {
  const deviations = {
    calories: Math.abs(calculateDeviation(actual.calories, target.calories)),
    protein: Math.abs(calculateDeviation(actual.protein, target.protein)),
    carbs: Math.abs(calculateDeviation(actual.carbs, target.carbs)),
    fat: Math.abs(calculateDeviation(actual.fat, target.fat))
  }

  // Convert deviation to score (0-100% deviation maps to 1-0 score)
  const scoreFromDeviation = (dev: number) => Math.max(0, 1 - dev / 100)

  const weightedScore =
    scoreFromDeviation(deviations.calories) * weights.calories +
    scoreFromDeviation(deviations.protein) * weights.protein +
    scoreFromDeviation(deviations.carbs) * weights.carbs +
    scoreFromDeviation(deviations.fat) * weights.fat

  return Math.round(weightedScore * 100) / 100
}

/**
 * Check if recipe is vegetarian (all ingredients must be vegetarian)
 */
export function isRecipeVegetarian(recipe: Recipe): boolean {
  return recipe.ingredients.every(ing => ing.foodItem.isVegetarian)
}

// ============================================================================
// RECIPE MATCHING
// ============================================================================

interface MatchOptions {
  target: MacroTargets
  limit?: number
  vegetarian?: boolean
  categoryId?: string
  allowScaling?: boolean
  minScore?: number
  scaleRange?: { min: number; max: number }
}

/**
 * Find recipes that best match the given macro targets
 */
export function findMatchingRecipes(
  recipes: Recipe[],
  options: MatchOptions
): RecipeMatch[] {
  const {
    target,
    limit = 10,
    vegetarian = false,
    categoryId,
    allowScaling = true,
    minScore = 0.5,
    scaleRange = { min: 0.5, max: 3.0 }
  } = options

  let filteredRecipes = recipes.filter(r => r.published)

  // Apply filters
  if (vegetarian) {
    filteredRecipes = filteredRecipes.filter(isRecipeVegetarian)
  }
  if (categoryId) {
    filteredRecipes = filteredRecipes.filter(r => r.categoryId === categoryId)
  }

  // Calculate matches
  const matches: RecipeMatch[] = []

  for (const recipe of filteredRecipes) {
    // Skip recipes with no nutrition data
    if (!recipe.calories || recipe.calories === 0) continue

    let bestMatch: RecipeMatch | null = null

    if (allowScaling) {
      // Try different scale factors to find best match
      const scalesToTry = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0]

      for (const scale of scalesToTry) {
        if (scale < scaleRange.min || scale > scaleRange.max) continue

        const scaledMacros = scaleMacros(recipe, scale)
        const score = calculateMatchScore(scaledMacros, target)

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            recipe,
            scaleFactor: scale,
            scaledServings: Math.round(recipe.servings * scale * 10) / 10,
            macros: scaledMacros,
            score,
            deviation: {
              calories: calculateDeviation(scaledMacros.calories, target.calories),
              protein: calculateDeviation(scaledMacros.protein, target.protein),
              carbs: calculateDeviation(scaledMacros.carbs, target.carbs),
              fat: calculateDeviation(scaledMacros.fat, target.fat)
            }
          }
        }
      }
    } else {
      // Use recipe as-is
      const macros = scaleMacros(recipe, 1)
      const score = calculateMatchScore(macros, target)

      bestMatch = {
        recipe,
        scaleFactor: 1,
        scaledServings: recipe.servings,
        macros,
        score,
        deviation: {
          calories: calculateDeviation(macros.calories, target.calories),
          protein: calculateDeviation(macros.protein, target.protein),
          carbs: calculateDeviation(macros.carbs, target.carbs),
          fat: calculateDeviation(macros.fat, target.fat)
        }
      }
    }

    if (bestMatch && bestMatch.score >= minScore) {
      matches.push(bestMatch)
    }
  }

  // Sort by score and limit results
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// ============================================================================
// DAY PLANNING
// ============================================================================

interface DayPlanOptions {
  dayTarget: MacroTargets
  mealSlots?: MealSlot[]
  vegetarian?: boolean
  avoidRecipeIds?: string[]
}

/**
 * Generate a day plan with recipes for each meal slot
 */
export function planDay(
  recipes: Recipe[],
  options: DayPlanOptions
): DayPlan {
  const {
    dayTarget,
    mealSlots = DEFAULT_MEAL_SLOTS,
    vegetarian = false,
    avoidRecipeIds = []
  } = options

  const meals: PlannedMeal[] = []
  const usedRecipeIds = new Set(avoidRecipeIds)
  let remainingTarget = { ...dayTarget }

  for (let i = 0; i < mealSlots.length; i++) {
    const slot = mealSlots[i]
    const isLastMeal = i === mealSlots.length - 1

    // Calculate target for this meal
    let mealTarget: MacroTargets
    if (isLastMeal) {
      // Last meal gets remaining macros
      mealTarget = remainingTarget
    } else {
      mealTarget = {
        calories: Math.round(dayTarget.calories * slot.targetRatio),
        protein: Math.round(dayTarget.protein * slot.targetRatio),
        carbs: Math.round(dayTarget.carbs * slot.targetRatio),
        fat: Math.round(dayTarget.fat * slot.targetRatio)
      }
    }

    // Find matching recipe
    const availableRecipes = recipes.filter(r => !usedRecipeIds.has(r.id))
    const matches = findMatchingRecipes(availableRecipes, {
      target: mealTarget,
      limit: 1,
      vegetarian,
      minScore: 0.3
    })

    if (matches.length > 0) {
      const match = matches[0]
      meals.push({ slot, recipe: match })
      usedRecipeIds.add(match.recipe.id)

      // Update remaining target
      remainingTarget = {
        calories: remainingTarget.calories - match.macros.calories,
        protein: remainingTarget.protein - match.macros.protein,
        carbs: remainingTarget.carbs - match.macros.carbs,
        fat: remainingTarget.fat - match.macros.fat
      }
    }
  }

  // Calculate totals
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.recipe.macros.calories,
      protein: acc.protein + meal.recipe.macros.protein,
      carbs: acc.carbs + meal.recipe.macros.carbs,
      fat: acc.fat + meal.recipe.macros.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return {
    meals,
    totals,
    targetDeviation: {
      calories: calculateDeviation(totals.calories, dayTarget.calories),
      protein: calculateDeviation(totals.protein, dayTarget.protein),
      carbs: calculateDeviation(totals.carbs, dayTarget.carbs),
      fat: calculateDeviation(totals.fat, dayTarget.fat)
    },
    score: calculateMatchScore(totals, dayTarget)
  }
}

// ============================================================================
// WEEK PLANNING
// ============================================================================

interface WeekPlanOptions {
  vegetarian?: boolean
  allowRepeat?: boolean
}

/**
 * Generate a week plan with variety across days
 */
export function planWeek(
  recipes: Recipe[],
  dailyTarget: MacroTargets,
  options: WeekPlanOptions = {}
): WeekPlan {
  const { vegetarian = false, allowRepeat = true } = options

  const days: WeekDay[] = []
  const usedRecipeIds = new Set<string>()

  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    const dayPlan = planDay(recipes, {
      dayTarget: dailyTarget,
      vegetarian,
      avoidRecipeIds: allowRepeat ? [] : Array.from(usedRecipeIds)
    })

    // Track used recipes
    if (!allowRepeat) {
      dayPlan.meals.forEach(meal => usedRecipeIds.add(meal.recipe.recipe.id))
    }

    days.push({
      dayNumber: dayNum,
      dayName: DAY_NAMES[dayNum - 1],
      plan: dayPlan
    })
  }

  // Calculate weekly totals
  const weeklyTotals = days.reduce(
    (acc, day) => ({
      calories: acc.calories + day.plan.totals.calories,
      protein: acc.protein + day.plan.totals.protein,
      carbs: acc.carbs + day.plan.totals.carbs,
      fat: acc.fat + day.plan.totals.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const averageScore =
    days.reduce((sum, day) => sum + day.plan.score, 0) / days.length

  return {
    days,
    weeklyTotals,
    averageScore: Math.round(averageScore * 100) / 100
  }
}
