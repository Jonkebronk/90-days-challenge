export type Gender = 'male' | 'female' | 'other'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active'

export type Goal = 'lose_weight' | 'build_muscle' | 'health'

export type IntensityLevel = 'beginner' | 'intermediate' | 'advanced'

export type TrainingLocation = 'home' | 'gym' | 'outdoor'

export type DietaryPreference = 'none' | 'vegetarian' | 'vegan' | 'pescatarian'

export interface OnboardingData {
  // Step 1: Profile
  age?: number
  gender?: Gender
  height_cm?: number
  current_weight_kg?: number
  target_weight_kg?: number

  // Step 2: Goals
  primary_goal?: Goal
  intensity_level?: IntensityLevel

  // Step 3: Lifestyle
  activity_level?: ActivityLevel
  training_location?: TrainingLocation
  training_frequency?: number
  time_per_session?: number

  // Step 4: Nutrition
  meals_per_day?: number
  dietary_preference?: DietaryPreference[]
  allergies?: string[]

  // Step 5: Calculations (auto-generated)
  tdee?: number
  target_calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
}

export interface UserProfile {
  id: string
  user_id: string
  age: number
  gender: Gender
  height_cm: number
  current_weight_kg: number
  target_weight_kg: number
  activity_level: ActivityLevel
  primary_goal: Goal
  intensity_level: IntensityLevel
  training_location: TrainingLocation
  training_frequency: number
  time_per_session: number
  meals_per_day: number
  dietary_preference: DietaryPreference[]
  allergies: string[]
  created_at: string
}

export interface NutritionPlan {
  id: string
  user_id: string
  tdee: number
  target_calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  current_phase: number
  start_date: string
  created_at: string
}
