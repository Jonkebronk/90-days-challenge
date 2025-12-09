/**
 * Macro Distribution Logic
 *
 * Calculates per-meal macro targets based on:
 * - Training vs rest day
 * - Training time (determines pre/post workout meals)
 * - Number of meals
 * - Total daily macros
 */

import {
  DayConfig,
  MealTiming,
  DEFAULT_MEAL_TIMES,
  TRAINING_DAY_CARB_DISTRIBUTION,
  TRAINING_DAY_FAT_DISTRIBUTION,
  PROTEIN_DISTRIBUTION
} from './types'

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Get default meal names based on meal count
 */
function getMealNames(mealCount: number): string[] {
  const names: Record<number, string[]> = {
    4: ['Frukost', 'Lunch', 'Middag', 'Kvällsmål'],
    5: ['Frukost', 'Lunch', 'Mellanmål', 'Middag', 'Kvällsmål'],
    6: ['Frukost', 'Förmiddagsmål', 'Lunch', 'Mellanmål', 'Middag', 'Kvällsmål']
  }
  return names[mealCount] || names[5]
}

/**
 * Determine which meals are pre-workout and post-workout based on training time
 * Pre-workout: Last meal within 4 hours before training
 * Post-workout: First meal within 2 hours after training
 */
function classifyMealsAroundTraining(
  mealTimes: string[],
  trainingTime: string
): { preWorkoutIndex: number | null; postWorkoutIndex: number | null } {
  const trainingMinutes = parseTimeToMinutes(trainingTime)

  let preWorkoutIndex: number | null = null
  let postWorkoutIndex: number | null = null

  // Find pre-workout meal (last meal within 4 hours before training)
  for (let i = mealTimes.length - 1; i >= 0; i--) {
    const mealMinutes = parseTimeToMinutes(mealTimes[i])
    const timeBefore = trainingMinutes - mealMinutes

    if (timeBefore > 0 && timeBefore <= 240) { // Within 4 hours before
      preWorkoutIndex = i
      break
    }
  }

  // Find post-workout meal (first meal within 2 hours after training)
  // Assume training lasts ~1 hour
  const trainingEndMinutes = trainingMinutes + 60

  for (let i = 0; i < mealTimes.length; i++) {
    const mealMinutes = parseTimeToMinutes(mealTimes[i])
    const timeAfter = mealMinutes - trainingEndMinutes

    if (timeAfter >= 0 && timeAfter <= 120) { // Within 2 hours after training ends
      postWorkoutIndex = i
      break
    }
  }

  return { preWorkoutIndex, postWorkoutIndex }
}

/**
 * Calculate meal timings with macro distribution for a training day
 */
function calculateTrainingDayDistribution(
  dayConfig: DayConfig,
  mealCount: number,
  mealTimes: string[]
): MealTiming[] {
  const { totalProtein, totalCarbs, totalFat, trainingTime } = dayConfig
  const mealNames = getMealNames(mealCount)

  const { preWorkoutIndex, postWorkoutIndex } = trainingTime
    ? classifyMealsAroundTraining(mealTimes, trainingTime)
    : { preWorkoutIndex: null, postWorkoutIndex: null }

  const bedtimeIndex = mealCount - 1

  // Count remaining meals (not pre, post, or bedtime)
  let remainingMealCount = mealCount
  if (preWorkoutIndex !== null) remainingMealCount--
  if (postWorkoutIndex !== null && postWorkoutIndex !== preWorkoutIndex) remainingMealCount--
  if (bedtimeIndex !== preWorkoutIndex && bedtimeIndex !== postWorkoutIndex) remainingMealCount--
  remainingMealCount = Math.max(remainingMealCount, 1)

  const meals: MealTiming[] = []

  for (let i = 0; i < mealCount; i++) {
    const isPreWorkout = i === preWorkoutIndex
    const isPostWorkout = i === postWorkoutIndex
    const isBedtime = i === bedtimeIndex

    // Protein: even distribution, slightly more at bedtime
    const proteinGrams = isBedtime
      ? PROTEIN_DISTRIBUTION.bedtimeMeal
      : PROTEIN_DISTRIBUTION.regularMeal

    // Carbs: bias toward training
    let carbsGrams: number
    if (isPreWorkout) {
      carbsGrams = Math.round(totalCarbs * TRAINING_DAY_CARB_DISTRIBUTION.preWorkout)
    } else if (isPostWorkout) {
      carbsGrams = Math.round(totalCarbs * TRAINING_DAY_CARB_DISTRIBUTION.postWorkout)
    } else if (isBedtime) {
      carbsGrams = Math.round(totalCarbs * TRAINING_DAY_CARB_DISTRIBUTION.bedtime)
    } else {
      // Remaining carbs split across other meals
      const remainingCarbs = totalCarbs * TRAINING_DAY_CARB_DISTRIBUTION.remaining
      carbsGrams = Math.round(remainingCarbs / remainingMealCount)
    }

    // Fat: away from training
    let fatGrams: number
    if (isPreWorkout) {
      fatGrams = Math.round(totalFat * TRAINING_DAY_FAT_DISTRIBUTION.preWorkout)
    } else if (isPostWorkout) {
      fatGrams = Math.round(totalFat * TRAINING_DAY_FAT_DISTRIBUTION.postWorkout)
    } else {
      // Remaining fat split across other meals
      const remainingFat = totalFat * TRAINING_DAY_FAT_DISTRIBUTION.remaining
      const otherMeals = mealCount - (preWorkoutIndex !== null ? 1 : 0) - (postWorkoutIndex !== null ? 1 : 0)
      fatGrams = Math.round(remainingFat / Math.max(otherMeals, 1))
    }

    meals.push({
      mealNumber: i + 1,
      name: mealNames[i],
      time: mealTimes[i],
      isPreWorkout,
      isPostWorkout,
      proteinGrams,
      carbsGrams,
      fatGrams
    })
  }

  // Adjust protein to match total (due to rounding)
  const totalAssignedProtein = meals.reduce((sum, m) => sum + m.proteinGrams, 0)
  const proteinDiff = totalProtein - totalAssignedProtein
  if (proteinDiff !== 0 && meals.length > 0) {
    // Add difference to last meal
    meals[meals.length - 1].proteinGrams += proteinDiff
  }

  return meals
}

/**
 * Calculate meal timings with macro distribution for a rest day
 * Macros are distributed more evenly
 */
function calculateRestDayDistribution(
  dayConfig: DayConfig,
  mealCount: number,
  mealTimes: string[]
): MealTiming[] {
  const { totalProtein, totalCarbs, totalFat } = dayConfig
  const mealNames = getMealNames(mealCount)

  const bedtimeIndex = mealCount - 1

  const meals: MealTiming[] = []

  for (let i = 0; i < mealCount; i++) {
    const isBedtime = i === bedtimeIndex
    const isBreakfast = i === 0

    // Protein: even distribution, slightly more at bedtime
    const proteinGrams = isBedtime
      ? PROTEIN_DISTRIBUTION.bedtimeMeal
      : PROTEIN_DISTRIBUTION.regularMeal

    // Carbs: even distribution, optionally 0 at breakfast for lower carb days
    let carbsGrams: number
    if (isBreakfast && totalCarbs < 100) {
      // Low carb day: skip breakfast carbs
      carbsGrams = 0
    } else {
      carbsGrams = Math.round(totalCarbs / mealCount)
    }

    // Fat: slightly more at later meals for satiety
    const baseFat = totalFat / mealCount
    const lateMealBonus = i >= mealCount - 2 ? 0.1 : -0.05
    const fatGrams = Math.round(baseFat * (1 + lateMealBonus))

    meals.push({
      mealNumber: i + 1,
      name: mealNames[i],
      time: mealTimes[i],
      isPreWorkout: false,
      isPostWorkout: false,
      proteinGrams,
      carbsGrams,
      fatGrams
    })
  }

  // Adjust totals to match targets
  const totalAssignedProtein = meals.reduce((sum, m) => sum + m.proteinGrams, 0)
  const totalAssignedCarbs = meals.reduce((sum, m) => sum + m.carbsGrams, 0)
  const totalAssignedFat = meals.reduce((sum, m) => sum + m.fatGrams, 0)

  if (meals.length > 0) {
    meals[meals.length - 1].proteinGrams += totalProtein - totalAssignedProtein
    meals[meals.length - 1].carbsGrams += totalCarbs - totalAssignedCarbs
    meals[meals.length - 1].fatGrams += totalFat - totalAssignedFat
  }

  return meals
}

/**
 * Main function: Calculate meal timings with macro distribution
 */
export function calculateMealDistribution(
  dayConfig: DayConfig,
  mealCount: number,
  customMealTimes?: string[]
): MealTiming[] {
  const mealTimes = customMealTimes || DEFAULT_MEAL_TIMES[mealCount] || DEFAULT_MEAL_TIMES[5]

  if (dayConfig.isTrainingDay) {
    return calculateTrainingDayDistribution(dayConfig, mealCount, mealTimes)
  } else {
    return calculateRestDayDistribution(dayConfig, mealCount, mealTimes)
  }
}

/**
 * Create a default day config
 */
export function createDefaultDayConfig(isTrainingDay: boolean): DayConfig {
  return {
    isTrainingDay,
    trainingTime: isTrainingDay ? '15:00' : undefined,
    totalCalories: isTrainingDay ? 2800 : 2000,
    totalProtein: 180,
    totalCarbs: isTrainingDay ? 310 : 80,
    totalFat: isTrainingDay ? 65 : 100
  }
}

/**
 * Create a default week config with alternating training/rest days
 */
export function createDefaultWeekConfig(): Record<string, DayConfig> {
  return {
    monday: createDefaultDayConfig(true),   // Training
    tuesday: createDefaultDayConfig(false), // Rest
    wednesday: createDefaultDayConfig(true), // Training
    thursday: createDefaultDayConfig(false), // Rest
    friday: createDefaultDayConfig(true),    // Training
    saturday: createDefaultDayConfig(false), // Rest
    sunday: createDefaultDayConfig(false)    // Rest
  }
}

/**
 * Calculate total weekly calories
 */
export function calculateWeeklyCalories(weekConfig: Record<string, DayConfig>): number {
  return Object.values(weekConfig).reduce((sum, day) => sum + day.totalCalories, 0)
}
