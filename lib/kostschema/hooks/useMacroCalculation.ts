import { useMemo } from 'react'
import { MacroCalculatorInput, MacroTargets, ACTIVITY_FACTORS, KCAL_PER_KG_FAT } from '../types'

/**
 * Calculate macros based on body weight and goals
 *
 * BMR = 10 * weight + 900 (simplified Mifflin-St Jeor)
 * TDEE = BMR * activity factor
 * Target kcal = TDEE - daily deficit
 * Protein = weight * protein factor
 * Fat = weight * 0.7
 * Carbs = remaining calories / 4
 */
export function useMacroCalculation(input: MacroCalculatorInput): MacroTargets {
  const { bodyWeight, activityLevel, weightLossTempo, proteinFactor } = input

  return useMemo(() => {
    // Validate input
    if (!bodyWeight || bodyWeight <= 0) {
      return { kcal: 0, protein: 0, carbs: 0, fat: 0, tdee: 0 }
    }

    // Base Metabolic Rate (simplified Mifflin-St Jeor)
    const bmr = 10 * bodyWeight + 900

    // Total Daily Energy Expenditure
    const tdee = bmr * ACTIVITY_FACTORS[activityLevel]

    // Daily calorie deficit from weight loss tempo
    // weightLossTempo is in grams per week
    const weeklyDeficit = (weightLossTempo / 1000) * KCAL_PER_KG_FAT // Convert grams to kg
    const dailyDeficit = weeklyDeficit / 7
    const targetKcal = Math.round(tdee - dailyDeficit)

    // Protein: based on body weight * factor
    const protein = Math.round(bodyWeight * proteinFactor)
    const proteinKcal = protein * 4

    // Fat: ~0.7g per kg body weight
    const fat = Math.round(bodyWeight * 0.7)
    const fatKcal = fat * 9

    // Carbs: remaining calories divided by 4, minimum 50g
    const remainingKcal = targetKcal - proteinKcal - fatKcal
    const carbs = Math.round(Math.max(remainingKcal / 4, 50))

    return {
      kcal: targetKcal,
      protein,
      carbs,
      fat,
      tdee: Math.round(tdee)
    }
  }, [bodyWeight, activityLevel, weightLossTempo, proteinFactor])
}

/**
 * Calculate macros without React hook (for server-side or one-time calculations)
 */
export function calculateMacros(input: MacroCalculatorInput): MacroTargets {
  const { bodyWeight, activityLevel, weightLossTempo, proteinFactor } = input

  if (!bodyWeight || bodyWeight <= 0) {
    return { kcal: 0, protein: 0, carbs: 0, fat: 0, tdee: 0 }
  }

  const bmr = 10 * bodyWeight + 900
  const tdee = bmr * ACTIVITY_FACTORS[activityLevel]
  const weeklyDeficit = (weightLossTempo / 1000) * KCAL_PER_KG_FAT
  const dailyDeficit = weeklyDeficit / 7
  const targetKcal = Math.round(tdee - dailyDeficit)

  const protein = Math.round(bodyWeight * proteinFactor)
  const proteinKcal = protein * 4

  const fat = Math.round(bodyWeight * 0.7)
  const fatKcal = fat * 9

  const remainingKcal = targetKcal - proteinKcal - fatKcal
  const carbs = Math.round(Math.max(remainingKcal / 4, 50))

  return {
    kcal: targetKcal,
    protein,
    carbs,
    fat,
    tdee: Math.round(tdee)
  }
}
