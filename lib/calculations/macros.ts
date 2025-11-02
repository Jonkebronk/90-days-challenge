export function calculateProtein(weight_kg: number, goal: string): number {
  const multipliers: Record<string, number> = {
    lose_weight: 2.2,
    build_muscle: 2.0,
    health: 1.8
  }
  return Math.round(weight_kg * (multipliers[goal] || 1.8))
}

export function calculateFat(target_calories: number): number {
  const fat_kcal = Math.round(target_calories * 0.27)
  return Math.round(fat_kcal / 9)
}

export function calculateCarbs(
  target_calories: number,
  protein_g: number,
  fat_g: number
): number {
  const remaining_kcal = target_calories - (protein_g * 4) - (fat_g * 9)
  return Math.max(0, Math.round(remaining_kcal / 4))
}

export function calculateMacros(
  target_calories: number,
  weight_kg: number,
  goal: string
) {
  const protein_g = calculateProtein(weight_kg, goal)
  const fat_g = calculateFat(target_calories)
  const carbs_g = calculateCarbs(target_calories, protein_g, fat_g)

  return { protein_g, carbs_g, fat_g }
}
