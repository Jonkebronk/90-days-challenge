// Kostschema Generator Types

export type ActivityLevel = 'sedentary' | 'moderate' | 'active'

export interface MacroCalculatorInput {
  bodyWeight: number
  activityLevel: ActivityLevel
  weightLossTempo: number // grams per week
  proteinFactor: number // g/kg body weight
}

export interface MacroTargets {
  kcal: number
  protein: number
  carbs: number
  fat: number
  tdee: number
}

export interface FoodItem {
  id: string
  slvNummer: number | null
  name: string
  category: 'protein' | 'kolhydrat' | 'fett' | 'grönsak'
  protein: number
  carbs: number
  fat: number
  kcal: number
  group: string
}

export interface TemplateIngredient {
  id: number
  amount: number
  unit: string
  name: string
  foodId: string
  slvNummer?: number
}

export interface MealTemplate {
  kolhydrat: TemplateIngredient[]
  protein: TemplateIngredient[]
  fett: TemplateIngredient[]
  tillagg: TemplateIngredient[]
  kosttillskott: { id: number; amount: number; unit: string; name: string }[]
}

export interface MealDistribution {
  type: string
  name: string
  label: string
  kcalPercent: number
}

export interface ScaledIngredient extends TemplateIngredient {
  scaledAmount: number
  macros: {
    protein: number
    carbs: number
    fat: number
    kcal: number
  }
}

// Simple text item for free text entries
export interface FreeTextItem {
  id: number
  text: string
}

export interface ScaledMeal {
  type: string
  name: string
  label: string
  kcalPercent: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  template: {
    kolhydrat: ScaledIngredient[]
    protein: ScaledIngredient[]
    fett: ScaledIngredient[]
    tillagg: ScaledIngredient[]
    kosttillskott: { id: number; amount: number; unit: string; name: string }[]
  }
  tillaggItems?: FreeTextItem[]
  supplementItems?: FreeTextItem[]
}

// Activity factors for TDEE calculation
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  moderate: 1.55,
  active: 1.9
}

// Calories per kg of body fat (approximately 7700 kcal per kg)
export const KCAL_PER_KG_FAT = 7700

// Custom ingredient from SLV search
export interface CustomFood {
  slvNummer: number
  name: string
  protein: number
  carbs: number
  fat: number
  kcal: number
  customAmount?: number // Override the calculated amount with a fixed gram value
}

// Key format: "mealType:category:index" e.g. "breakfast:protein:0"
export type IngredientOverrides = Record<string, CustomFood>

// Set of override keys for deleted ingredients
export type DeletedIngredients = Set<string>

// Day types for week configuration
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string; shortLabel: string }[] = [
  { key: 'monday', label: 'Måndag', shortLabel: 'Mån' },
  { key: 'tuesday', label: 'Tisdag', shortLabel: 'Tis' },
  { key: 'wednesday', label: 'Onsdag', shortLabel: 'Ons' },
  { key: 'thursday', label: 'Torsdag', shortLabel: 'Tor' },
  { key: 'friday', label: 'Fredag', shortLabel: 'Fre' },
  { key: 'saturday', label: 'Lördag', shortLabel: 'Lör' },
  { key: 'sunday', label: 'Söndag', shortLabel: 'Sön' }
]

// Configuration for a single day
export interface DayConfig {
  isTrainingDay: boolean
  trainingTime?: string // "15:00" format for calculating pre/post workout
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

// Meal timing with macro distribution percentages
export interface MealTiming {
  mealNumber: number
  name: string
  time: string
  isPreWorkout: boolean
  isPostWorkout: boolean
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
}

// Week configuration - each day can have different settings
export interface WeekConfig {
  days: Record<DayOfWeek, DayConfig>
}

// Macro source mode - calculate from weight or enter manually
export type MacroSourceMode = 'calculate' | 'manual'

// Week macro mode - same macros for all days or different per day
export type WeekMacroMode = 'same' | 'different'

// Default meal times for 4, 5, 6 meals per day
export const DEFAULT_MEAL_TIMES: Record<number, string[]> = {
  4: ['07:30', '12:00', '17:00', '21:00'],
  5: ['07:30', '12:00', '15:00', '18:30', '21:30'],
  6: ['07:30', '10:00', '12:30', '15:30', '18:30', '21:30']
}

// Macro distribution percentages for training days
export const TRAINING_DAY_CARB_DISTRIBUTION = {
  preWorkout: 0.20,   // 20% of daily carbs
  postWorkout: 0.30,  // 30% of daily carbs
  bedtime: 0.20,      // 20% of daily carbs
  remaining: 0.30     // 30% spread across other meals
}

export const TRAINING_DAY_FAT_DISTRIBUTION = {
  preWorkout: 0.10,   // 10% of daily fat (close to workout)
  postWorkout: 0.10,  // 10% of daily fat
  remaining: 0.80     // 80% spread across other meals
}

// Protein distribution - roughly even, slightly more at bedtime
export const PROTEIN_DISTRIBUTION = {
  regularMeal: 30,    // grams per meal
  bedtimeMeal: 35     // grams for last meal
}
