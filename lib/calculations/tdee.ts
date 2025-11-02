export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  const baseCalc = 10 * weight_kg + 6.25 * height_cm - 5 * age

  if (gender === 'male') {
    return baseCalc + 5
  } else if (gender === 'female') {
    return baseCalc - 161
  } else {
    return baseCalc - 78
  }
}

export function getActivityMultiplier(activity_level: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  }
  return multipliers[activity_level] || 1.2
}

export function calculateTDEE(bmr: number, activity_level: string): number {
  return Math.round(bmr * getActivityMultiplier(activity_level))
}

export function calculateTargetCalories(
  tdee: number,
  goal: string,
  intensity: string
): number {
  const adjustments: Record<string, Record<string, number>> = {
    lose_weight: { beginner: -300, intermediate: -400, advanced: -500 },
    build_muscle: { beginner: 200, intermediate: 300, advanced: 400 },
    health: { beginner: 0, intermediate: 0, advanced: 0 }
  }
  const adjustment = adjustments[goal]?.[intensity] || 0
  return Math.round(tdee + adjustment)
}
