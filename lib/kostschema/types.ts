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
