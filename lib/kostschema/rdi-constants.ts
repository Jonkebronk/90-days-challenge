// Nordic Nutrition Recommendations (NNR 2023) for adults
// Reference Daily Intake values

export interface RDIEntry {
  value: number
  unit: string
  name: string
  category: 'vitamin' | 'mineral'
}

export const RDI: Record<string, RDIEntry> = {
  // Vitamins
  vitaminA: { value: 900, unit: 'µg', name: 'Vitamin A', category: 'vitamin' },
  vitaminD: { value: 10, unit: 'µg', name: 'Vitamin D', category: 'vitamin' },
  vitaminE: { value: 10, unit: 'mg', name: 'Vitamin E', category: 'vitamin' },
  vitaminC: { value: 75, unit: 'mg', name: 'Vitamin C', category: 'vitamin' },
  vitaminB6: { value: 1.3, unit: 'mg', name: 'Vitamin B6', category: 'vitamin' },
  vitaminB12: { value: 2, unit: 'µg', name: 'Vitamin B12', category: 'vitamin' },
  thiamin: { value: 1.1, unit: 'mg', name: 'Tiamin (B1)', category: 'vitamin' },
  riboflavin: { value: 1.3, unit: 'mg', name: 'Riboflavin (B2)', category: 'vitamin' },
  niacin: { value: 15, unit: 'mg', name: 'Niacin (B3)', category: 'vitamin' },
  folate: { value: 400, unit: 'µg', name: 'Folat', category: 'vitamin' },

  // Minerals
  calcium: { value: 800, unit: 'mg', name: 'Kalcium', category: 'mineral' },
  iron: { value: 9, unit: 'mg', name: 'Järn', category: 'mineral' },
  magnesium: { value: 350, unit: 'mg', name: 'Magnesium', category: 'mineral' },
  phosphorus: { value: 600, unit: 'mg', name: 'Fosfor', category: 'mineral' },
  potassium: { value: 3500, unit: 'mg', name: 'Kalium', category: 'mineral' },
  zinc: { value: 9, unit: 'mg', name: 'Zink', category: 'mineral' },
  selenium: { value: 60, unit: 'µg', name: 'Selen', category: 'mineral' },
  iodine: { value: 150, unit: 'µg', name: 'Jod', category: 'mineral' }
}

// List of micronutrient keys for iteration
export const MICRONUTRIENT_KEYS = [
  'vitaminA', 'vitaminD', 'vitaminE', 'vitaminC', 'vitaminB6', 'vitaminB12',
  'thiamin', 'riboflavin', 'niacin', 'folate',
  'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'zinc', 'selenium', 'iodine'
] as const

export type MicronutrientKey = typeof MICRONUTRIENT_KEYS[number]

/**
 * Calculate percentage of RDI for a nutrient
 */
export function calculateRDIPercent(key: string, value: number | null): number {
  if (value === null || value === 0) return 0
  const rdi = RDI[key]
  if (!rdi) return 0
  return Math.round((value / rdi.value) * 100)
}

/**
 * Get color class based on RDI percentage
 * Red: <50%, Yellow: 50-80%, Green: 80-100%, Blue: >100%
 */
export function getRDIColorClass(percent: number): string {
  if (percent === 0) return 'bg-zinc-700'
  if (percent < 50) return 'bg-red-500'
  if (percent < 80) return 'bg-amber-500'
  if (percent <= 100) return 'bg-green-500'
  return 'bg-blue-500'
}

/**
 * Get text color class based on RDI percentage
 */
export function getRDITextColorClass(percent: number): string {
  if (percent === 0) return 'text-zinc-500'
  if (percent < 50) return 'text-red-400'
  if (percent < 80) return 'text-amber-400'
  if (percent <= 100) return 'text-green-400'
  return 'text-blue-400'
}
