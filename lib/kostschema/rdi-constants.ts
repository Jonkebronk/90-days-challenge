// Nordic Nutrition Recommendations (NNR 2023)
// Reference Daily Intake values by demographic group

export interface RDIEntry {
  value: number
  unit: string
  name: string
  category: 'vitamin' | 'mineral'
}

export interface DemographicProfile {
  id: string
  label: string
  group: 'barn' | 'kvinna' | 'man' | 'special'
}

// All demographic profiles
export const DEMOGRAPHIC_PROFILES: DemographicProfile[] = [
  // Barn (children)
  { id: 'barn_1-3', label: 'Barn 1-3 år', group: 'barn' },
  { id: 'barn_4-6', label: 'Barn 4-6 år', group: 'barn' },
  { id: 'barn_7-10', label: 'Barn 7-10 år', group: 'barn' },
  // Kvinna (women)
  { id: 'kvinna_11-14', label: 'Kvinna 11-14 år', group: 'kvinna' },
  { id: 'kvinna_15-17', label: 'Kvinna 15-17 år', group: 'kvinna' },
  { id: 'kvinna_18-24', label: 'Kvinna 18-24 år', group: 'kvinna' },
  { id: 'kvinna_25-50', label: 'Kvinna 25-50 år', group: 'kvinna' },
  { id: 'kvinna_51-70', label: 'Kvinna 51-70 år', group: 'kvinna' },
  { id: 'kvinna_70+', label: 'Kvinna >70 år', group: 'kvinna' },
  // Man (men)
  { id: 'man_11-14', label: 'Man 11-14 år', group: 'man' },
  { id: 'man_15-17', label: 'Man 15-17 år', group: 'man' },
  { id: 'man_18-24', label: 'Man 18-24 år', group: 'man' },
  { id: 'man_25-50', label: 'Man 25-50 år', group: 'man' },
  { id: 'man_51-70', label: 'Man 51-70 år', group: 'man' },
  { id: 'man_70+', label: 'Man >70 år', group: 'man' },
  // Special
  { id: 'gravid', label: 'Gravid', group: 'special' },
  { id: 'ammande', label: 'Ammande', group: 'special' },
]

// Nutrient metadata (units and names)
export const NUTRIENT_META: Record<string, { unit: string; name: string; category: 'vitamin' | 'mineral' }> = {
  vitaminA: { unit: 'µg', name: 'Vitamin A', category: 'vitamin' },
  vitaminD: { unit: 'µg', name: 'Vitamin D', category: 'vitamin' },
  vitaminE: { unit: 'mg', name: 'Vitamin E', category: 'vitamin' },
  vitaminC: { unit: 'mg', name: 'Vitamin C', category: 'vitamin' },
  vitaminB6: { unit: 'mg', name: 'Vitamin B6', category: 'vitamin' },
  vitaminB12: { unit: 'µg', name: 'Vitamin B12', category: 'vitamin' },
  thiamin: { unit: 'mg', name: 'Tiamin (B1)', category: 'vitamin' },
  riboflavin: { unit: 'mg', name: 'Riboflavin (B2)', category: 'vitamin' },
  niacin: { unit: 'mg', name: 'Niacin (B3)', category: 'vitamin' },
  folate: { unit: 'µg', name: 'Folat', category: 'vitamin' },
  calcium: { unit: 'mg', name: 'Kalcium', category: 'mineral' },
  iron: { unit: 'mg', name: 'Järn', category: 'mineral' },
  magnesium: { unit: 'mg', name: 'Magnesium', category: 'mineral' },
  phosphorus: { unit: 'mg', name: 'Fosfor', category: 'mineral' },
  potassium: { unit: 'mg', name: 'Kalium', category: 'mineral' },
  zinc: { unit: 'mg', name: 'Zink', category: 'mineral' },
  selenium: { unit: 'µg', name: 'Selen', category: 'mineral' },
  iodine: { unit: 'µg', name: 'Jod', category: 'mineral' },
}

// RDI values per demographic profile (NNR 2023)
// Values are daily recommended intake
export const RDI_BY_PROFILE: Record<string, Record<string, number>> = {
  // Barn 1-3 år
  'barn_1-3': {
    vitaminA: 300, vitaminD: 10, vitaminE: 5, vitaminC: 25, vitaminB6: 0.5, vitaminB12: 0.8,
    thiamin: 0.5, riboflavin: 0.6, niacin: 7, folate: 80,
    calcium: 600, iron: 8, magnesium: 85, phosphorus: 470, potassium: 1400, zinc: 4, selenium: 20, iodine: 70
  },
  // Barn 4-6 år
  'barn_4-6': {
    vitaminA: 350, vitaminD: 10, vitaminE: 6, vitaminC: 30, vitaminB6: 0.7, vitaminB12: 1.0,
    thiamin: 0.6, riboflavin: 0.8, niacin: 9, folate: 130,
    calcium: 700, iron: 9, magnesium: 120, phosphorus: 540, potassium: 1800, zinc: 6, selenium: 25, iodine: 90
  },
  // Barn 7-10 år
  'barn_7-10': {
    vitaminA: 500, vitaminD: 10, vitaminE: 7, vitaminC: 40, vitaminB6: 1.0, vitaminB12: 1.3,
    thiamin: 0.9, riboflavin: 1.1, niacin: 12, folate: 200,
    calcium: 900, iron: 9, magnesium: 200, phosphorus: 640, potassium: 2300, zinc: 7, selenium: 35, iodine: 120
  },
  // Kvinna 11-14 år
  'kvinna_11-14': {
    vitaminA: 600, vitaminD: 10, vitaminE: 8, vitaminC: 60, vitaminB6: 1.1, vitaminB12: 2.0,
    thiamin: 1.0, riboflavin: 1.2, niacin: 14, folate: 300,
    calcium: 900, iron: 15, magnesium: 280, phosphorus: 640, potassium: 3100, zinc: 8, selenium: 45, iodine: 150
  },
  // Kvinna 15-17 år
  'kvinna_15-17': {
    vitaminA: 700, vitaminD: 10, vitaminE: 8, vitaminC: 75, vitaminB6: 1.2, vitaminB12: 2.0,
    thiamin: 1.0, riboflavin: 1.2, niacin: 14, folate: 400,
    calcium: 900, iron: 15, magnesium: 280, phosphorus: 640, potassium: 3100, zinc: 9, selenium: 50, iodine: 150
  },
  // Kvinna 18-24 år
  'kvinna_18-24': {
    vitaminA: 700, vitaminD: 10, vitaminE: 8, vitaminC: 75, vitaminB6: 1.2, vitaminB12: 2.0,
    thiamin: 1.0, riboflavin: 1.2, niacin: 14, folate: 400,
    calcium: 800, iron: 15, magnesium: 280, phosphorus: 600, potassium: 3100, zinc: 7, selenium: 50, iodine: 150
  },
  // Kvinna 25-50 år
  'kvinna_25-50': {
    vitaminA: 700, vitaminD: 10, vitaminE: 8, vitaminC: 75, vitaminB6: 1.2, vitaminB12: 2.0,
    thiamin: 1.0, riboflavin: 1.2, niacin: 14, folate: 400,
    calcium: 800, iron: 15, magnesium: 280, phosphorus: 600, potassium: 3100, zinc: 7, selenium: 50, iodine: 150
  },
  // Kvinna 51-70 år
  'kvinna_51-70': {
    vitaminA: 700, vitaminD: 10, vitaminE: 8, vitaminC: 75, vitaminB6: 1.2, vitaminB12: 2.0,
    thiamin: 1.0, riboflavin: 1.2, niacin: 14, folate: 400,
    calcium: 800, iron: 9, magnesium: 280, phosphorus: 600, potassium: 3100, zinc: 7, selenium: 50, iodine: 150
  },
  // Kvinna >70 år
  'kvinna_70+': {
    vitaminA: 700, vitaminD: 20, vitaminE: 8, vitaminC: 75, vitaminB6: 1.2, vitaminB12: 2.0,
    thiamin: 1.0, riboflavin: 1.2, niacin: 14, folate: 400,
    calcium: 800, iron: 9, magnesium: 280, phosphorus: 600, potassium: 3100, zinc: 7, selenium: 50, iodine: 150
  },
  // Man 11-14 år
  'man_11-14': {
    vitaminA: 600, vitaminD: 10, vitaminE: 8, vitaminC: 60, vitaminB6: 1.2, vitaminB12: 2.0,
    thiamin: 1.1, riboflavin: 1.4, niacin: 16, folate: 300,
    calcium: 900, iron: 11, magnesium: 280, phosphorus: 640, potassium: 3300, zinc: 11, selenium: 50, iodine: 150
  },
  // Man 15-17 år
  'man_15-17': {
    vitaminA: 900, vitaminD: 10, vitaminE: 10, vitaminC: 75, vitaminB6: 1.4, vitaminB12: 2.0,
    thiamin: 1.3, riboflavin: 1.6, niacin: 19, folate: 400,
    calcium: 900, iron: 11, magnesium: 350, phosphorus: 640, potassium: 3500, zinc: 12, selenium: 60, iodine: 150
  },
  // Man 18-24 år
  'man_18-24': {
    vitaminA: 900, vitaminD: 10, vitaminE: 10, vitaminC: 75, vitaminB6: 1.4, vitaminB12: 2.0,
    thiamin: 1.2, riboflavin: 1.5, niacin: 17, folate: 400,
    calcium: 800, iron: 9, magnesium: 350, phosphorus: 600, potassium: 3500, zinc: 9, selenium: 60, iodine: 150
  },
  // Man 25-50 år
  'man_25-50': {
    vitaminA: 900, vitaminD: 10, vitaminE: 10, vitaminC: 75, vitaminB6: 1.3, vitaminB12: 2.0,
    thiamin: 1.1, riboflavin: 1.3, niacin: 15, folate: 400,
    calcium: 800, iron: 9, magnesium: 350, phosphorus: 600, potassium: 3500, zinc: 9, selenium: 60, iodine: 150
  },
  // Man 51-70 år
  'man_51-70': {
    vitaminA: 900, vitaminD: 10, vitaminE: 10, vitaminC: 75, vitaminB6: 1.3, vitaminB12: 2.0,
    thiamin: 1.1, riboflavin: 1.3, niacin: 15, folate: 400,
    calcium: 800, iron: 9, magnesium: 350, phosphorus: 600, potassium: 3500, zinc: 9, selenium: 60, iodine: 150
  },
  // Man >70 år
  'man_70+': {
    vitaminA: 900, vitaminD: 20, vitaminE: 10, vitaminC: 75, vitaminB6: 1.3, vitaminB12: 2.0,
    thiamin: 1.1, riboflavin: 1.3, niacin: 15, folate: 400,
    calcium: 800, iron: 9, magnesium: 350, phosphorus: 600, potassium: 3500, zinc: 9, selenium: 60, iodine: 150
  },
  // Gravid (pregnant)
  'gravid': {
    vitaminA: 800, vitaminD: 10, vitaminE: 10, vitaminC: 85, vitaminB6: 1.4, vitaminB12: 2.0,
    thiamin: 1.2, riboflavin: 1.4, niacin: 15, folate: 500,
    calcium: 900, iron: 15, magnesium: 280, phosphorus: 700, potassium: 3100, zinc: 9, selenium: 55, iodine: 175
  },
  // Ammande (breastfeeding)
  'ammande': {
    vitaminA: 1100, vitaminD: 10, vitaminE: 11, vitaminC: 100, vitaminB6: 1.5, vitaminB12: 2.6,
    thiamin: 1.4, riboflavin: 1.6, niacin: 17, folate: 500,
    calcium: 900, iron: 15, magnesium: 280, phosphorus: 900, potassium: 3100, zinc: 11, selenium: 60, iodine: 200
  }
}

// Default profile (Man 25-50 år - matches original RDI)
export const DEFAULT_PROFILE_ID = 'man_25-50'

// Legacy RDI export for backwards compatibility
export const RDI: Record<string, RDIEntry> = Object.fromEntries(
  Object.entries(NUTRIENT_META).map(([key, meta]) => [
    key,
    { ...meta, value: RDI_BY_PROFILE[DEFAULT_PROFILE_ID][key] }
  ])
)

// List of micronutrient keys for iteration
export const MICRONUTRIENT_KEYS = [
  'vitaminA', 'vitaminD', 'vitaminE', 'vitaminC', 'vitaminB6', 'vitaminB12',
  'thiamin', 'riboflavin', 'niacin', 'folate',
  'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'zinc', 'selenium', 'iodine'
] as const

export type MicronutrientKey = typeof MICRONUTRIENT_KEYS[number]

/**
 * Get RDI entry for a nutrient and profile
 */
export function getRDIForProfile(key: string, profileId: string): RDIEntry {
  const meta = NUTRIENT_META[key]
  const value = RDI_BY_PROFILE[profileId]?.[key] ?? RDI_BY_PROFILE[DEFAULT_PROFILE_ID][key]
  return { ...meta, value }
}

/**
 * Calculate percentage of RDI for a nutrient
 */
export function calculateRDIPercent(key: string, value: number | null, profileId: string = DEFAULT_PROFILE_ID): number {
  if (value === null || value === 0) return 0
  const rdi = getRDIForProfile(key, profileId)
  if (!rdi || rdi.value === 0) return 0
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
