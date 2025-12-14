// Nutrition Plan Calculation Formulas
// BMR, LBM, TDEE, and Macro calculations for the wizard

import type {
  Gender,
  LifestyleActivity,
  ExerciseActivity,
} from '@/lib/types/client-nutrition-plan';

// ========================================
// ACTIVITY FACTORS
// ========================================

// Lifestyle activity factors (based on reference screenshots)
export const LIFESTYLE_ACTIVITY_FACTORS: Record<LifestyleActivity, number> = {
  sedentary: 0.65,          // Stillasittande - minimal rörelse
  lightly_active: 0.75,     // Lätt aktiv - lite promenader
  moderately_active: 0.85,  // Måttligt aktiv - regelbundna promenader
  very_active: 0.95,        // Mycket aktiv - fysiskt jobb
  extremely_active: 1.05,   // Extremt aktiv - mycket fysiskt krävande
};

// Exercise activity factors
export const EXERCISE_ACTIVITY_FACTORS: Record<ExerciseActivity, number> = {
  none: 0.5,      // Ingen träning
  light: 0.6,     // 1-2 pass/vecka
  moderate: 0.7,  // 3-4 pass/vecka
  heavy: 0.8,     // 5-6 pass/vecka
  athlete: 0.9,   // 2x daglig träning
};

// ========================================
// BMR CALCULATION (Mifflin-St Jeor)
// ========================================

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * More accurate than Harris-Benedict for modern populations
 *
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param gender - 'male' or 'female'
 * @returns BMR in kcal/day
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number {
  // Men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
  // Women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

// ========================================
// LBM ESTIMATION (Boer Formula)
// ========================================

/**
 * Estimate Lean Body Mass using Boer formula
 * Used when body fat percentage is not available
 *
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param gender - 'male' or 'female'
 * @returns Estimated LBM in kg
 */
export function estimateLBM(
  weight: number,
  height: number,
  gender: Gender
): number {
  // Boer formula:
  // Men: LBM = (0.407 × weight) + (0.267 × height) - 19.2
  // Women: LBM = (0.252 × weight) + (0.473 × height) - 48.3

  if (gender === 'male') {
    return Math.round((0.407 * weight + 0.267 * height - 19.2) * 10) / 10;
  } else {
    return Math.round((0.252 * weight + 0.473 * height - 48.3) * 10) / 10;
  }
}

// ========================================
// TDEE CALCULATION
// ========================================

/**
 * Calculate Total Daily Energy Expenditure
 * Based on the reference formula: LBM × Overall Activity Factor = TDEE
 *
 * @param lbm - Lean Body Mass in kg
 * @param lifestyleActivity - Lifestyle activity level
 * @param exerciseActivity - Exercise activity level
 * @returns TDEE in kcal/day
 */
export function calculateTDEE(
  lbm: number,
  lifestyleActivity: LifestyleActivity,
  exerciseActivity: ExerciseActivity
): number {
  const lifestyleFactor = LIFESTYLE_ACTIVITY_FACTORS[lifestyleActivity];
  const exerciseFactor = EXERCISE_ACTIVITY_FACTORS[exerciseActivity];

  // Overall activity factor = lifestyle + exercise
  const overallFactor = lifestyleFactor + exerciseFactor;

  // TDEE = LBM × Overall Factor × 33 (kcal per kg LBM base)
  // Using 33 as base multiplier (common in Swedish fitness industry)
  return Math.round(lbm * overallFactor * 33);
}

/**
 * Alternative TDEE calculation using BMR
 * TDEE = BMR × Activity Multiplier
 */
export function calculateTDEEFromBMR(
  bmr: number,
  lifestyleActivity: LifestyleActivity,
  exerciseActivity: ExerciseActivity
): number {
  const lifestyleFactor = LIFESTYLE_ACTIVITY_FACTORS[lifestyleActivity];
  const exerciseFactor = EXERCISE_ACTIVITY_FACTORS[exerciseActivity];

  // Combined multiplier (1.0 base + lifestyle + exercise)
  const multiplier = 1.0 + lifestyleFactor + exerciseFactor;

  return Math.round(bmr * multiplier);
}

// ========================================
// CALORIE TARGET
// ========================================

/**
 * Calculate daily calorie target based on TDEE and adjustment percentage
 *
 * @param tdee - Total Daily Energy Expenditure
 * @param adjustmentPercent - Adjustment percentage (-30 to +30)
 * @returns Daily calorie target
 */
export function calculateDailyCalorieTarget(
  tdee: number,
  adjustmentPercent: number
): number {
  return Math.round(tdee * (1 + adjustmentPercent / 100));
}

// ========================================
// MACRO CALCULATIONS
// ========================================

/**
 * Calculate macro grams from daily calorie target
 *
 * @param weight - Body weight in kg
 * @param dailyCalories - Daily calorie target
 * @param proteinPerKg - Protein per kg body weight (1.6-2.6)
 * @param fatPerKg - Fat per kg body weight (min 0.7)
 * @returns Object with protein, fat, carbs in grams
 */
export function calculateMacros(
  weight: number,
  dailyCalories: number,
  proteinPerKg: number,
  fatPerKg: number
): { protein: number; fat: number; carbs: number } {
  // Protein: weight × proteinPerKg (1.6-2.6 g/kg)
  const proteinGrams = Math.round(weight * proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  // Fat: weight × fatPerKg (min 0.7 g/kg)
  const fatGrams = Math.round(weight * fatPerKg);
  const fatCalories = fatGrams * 9;

  // Carbs: remaining calories / 4
  const remainingCalories = dailyCalories - proteinCalories - fatCalories;
  const carbGrams = Math.max(0, Math.round(remainingCalories / 4));

  return {
    protein: proteinGrams,
    fat: fatGrams,
    carbs: carbGrams,
  };
}

/**
 * Calculate all nutrition values at once
 * Convenience function for the wizard
 */
export function calculateAllNutrition(params: {
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  lifestyleActivity: LifestyleActivity;
  exerciseActivity: ExerciseActivity;
  caloricAdjustmentPercent: number;
  proteinPerKg: number;
  fatPerKg: number;
}): {
  lbm: number;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  lifestyleFactor: number;
  exerciseFactor: number;
} {
  const {
    weight,
    height,
    age,
    gender,
    lifestyleActivity,
    exerciseActivity,
    caloricAdjustmentPercent,
    proteinPerKg,
    fatPerKg,
  } = params;

  // Step 1: Calculate LBM
  const lbm = estimateLBM(weight, height, gender);

  // Step 2: Calculate BMR
  const bmr = calculateBMR(weight, height, age, gender);

  // Step 3: Get activity factors
  const lifestyleFactor = LIFESTYLE_ACTIVITY_FACTORS[lifestyleActivity];
  const exerciseFactor = EXERCISE_ACTIVITY_FACTORS[exerciseActivity];

  // Step 4: Calculate TDEE using LBM method
  const tdee = calculateTDEE(lbm, lifestyleActivity, exerciseActivity);

  // Step 5: Apply caloric adjustment
  const dailyCalorieTarget = calculateDailyCalorieTarget(
    tdee,
    caloricAdjustmentPercent
  );

  // Step 6: Calculate macros
  const macros = calculateMacros(
    weight,
    dailyCalorieTarget,
    proteinPerKg,
    fatPerKg
  );

  return {
    lbm,
    bmr,
    tdee,
    dailyCalorieTarget,
    proteinGrams: macros.protein,
    fatGrams: macros.fat,
    carbGrams: macros.carbs,
    lifestyleFactor,
    exerciseFactor,
  };
}

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Validate weight is within reasonable range
 */
export function isValidWeight(weight: number): boolean {
  return weight >= 30 && weight <= 300;
}

/**
 * Validate height is within reasonable range
 */
export function isValidHeight(height: number): boolean {
  return height >= 100 && height <= 250;
}

/**
 * Validate age is within reasonable range
 */
export function isValidAge(age: number): boolean {
  return age >= 13 && age <= 100;
}

/**
 * Validate protein per kg is within recommended range
 */
export function isValidProteinPerKg(proteinPerKg: number): boolean {
  return proteinPerKg >= 1.6 && proteinPerKg <= 2.6;
}

/**
 * Validate fat per kg meets minimum requirement
 */
export function isValidFatPerKg(fatPerKg: number): boolean {
  return fatPerKg >= 0.7 && fatPerKg <= 2.0;
}

/**
 * Validate caloric adjustment is within range
 */
export function isValidCaloricAdjustment(percent: number): boolean {
  return percent >= -30 && percent <= 30;
}

/**
 * Validate meals per day is within range
 */
export function isValidMealsPerDay(meals: number): boolean {
  return meals >= 2 && meals <= 7;
}
