// Client Nutrition Plan Types
// Used by the wizard for creating nutrition plans

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type CalculationMethod = 'automatic' | 'manual' | 'metabolism';

export type CalculationType = 'weight_height_age';

// Simple metabolism activity levels
export type MetabolismActivityLevel = 'sedentary' | 'moderate' | 'very_active';

export const METABOLISM_ACTIVITY_LABELS: Record<MetabolismActivityLevel, string> = {
  sedentary: 'Stillasittande',
  moderate: 'Måttligt aktiv (träning 2-4 ggr/vecka)',
  very_active: 'Mycket aktiv (tung träning 4+ ggr/vecka)',
};

export const METABOLISM_MULTIPLIERS: Record<MetabolismActivityLevel, number> = {
  sedentary: 25,
  moderate: 30,
  very_active: 35,
};

// Fat loss rate options
export type FatLossRate = 'conservative' | 'moderate' | 'aggressive';

export const FAT_LOSS_RATE_CONFIG: Record<FatLossRate, {
  label: string;
  gramsPerWeek: number;
  deficitPerWeek: number;
  deficitPerDay: number;
  description: string;
}> = {
  conservative: {
    label: '500g/vecka',
    gramsPerWeek: 500,
    deficitPerWeek: 3850,
    deficitPerDay: 550,
    description: 'Konservativt, bra för nybörjare eller de med lite att förlora',
  },
  moderate: {
    label: '700g/vecka',
    gramsPerWeek: 700,
    deficitPerWeek: 5390,
    deficitPerDay: 770,
    description: 'Optimal balans för de flesta',
  },
  aggressive: {
    label: '1000g/vecka',
    gramsPerWeek: 1000,
    deficitPerWeek: 7700,
    deficitPerDay: 1100,
    description: 'Aggressivt, endast för de med mycket att förlora och hög motivation',
  },
};

export type Gender = 'male' | 'female';

export type LifestyleActivity =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export type ExerciseActivity =
  | 'none'
  | 'light'
  | 'moderate'
  | 'heavy'
  | 'athlete';

export type WorkoutTime =
  | 'pre_breakfast'
  | 'morning'
  | 'lunch_time'
  | 'afternoon'
  | 'evening'
  | 'night_time';

export type NutritionSystem =
  | 'low_carb_backloading'
  | 'low_carb'
  | 'carb_backloading'
  | 'targeted_carb'
  | 'modified_carb_backloading'
  | 'balanced'
  | 'carb_front_loading'
  | 'high_carb';

// Display labels for Swedish UI
export const LIFESTYLE_ACTIVITY_LABELS: Record<LifestyleActivity, string> = {
  sedentary: 'Stillasittande (0.65x)',
  lightly_active: 'Lätt aktiv (0.75x)',
  moderately_active: 'Måttligt aktiv (0.85x)',
  very_active: 'Mycket aktiv (0.95x)',
  extremely_active: 'Extremt aktiv (1.05x)',
};

export const EXERCISE_ACTIVITY_LABELS: Record<ExerciseActivity, string> = {
  none: 'Ingen träning (0.5x)',
  light: 'Lätt träning (0.6x)',
  moderate: 'Måttlig träning (0.7x)',
  heavy: 'Tung träning (0.8x)',
  athlete: 'Atletisk (0.9x)',
};

export const WORKOUT_TIME_LABELS: Record<WorkoutTime, string> = {
  pre_breakfast: 'Före frukost',
  morning: 'Förmiddag',
  lunch_time: 'Lunchtid',
  afternoon: 'Eftermiddag',
  evening: 'Kväll',
  night_time: 'Natt',
};

export const NUTRITION_SYSTEM_LABELS: Record<NutritionSystem, string> = {
  low_carb_backloading: 'Low Carb Backloading',
  low_carb: 'Low Carb',
  carb_backloading: 'Carb Backloading',
  targeted_carb: 'Targeted Carb',
  modified_carb_backloading: 'Modified Carb Backloading',
  balanced: 'Balanserad',
  carb_front_loading: 'Carb Front Loading',
  high_carb: 'High Carb',
};

// Macro targets per day type
export interface DayMacros {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

// Meal slot distribution
export interface MealSlot {
  slot: number;
  name: string;
  time: string;
  caloriePercent: number;
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
}

// Client Nutrition Plan (matches Prisma model)
export interface ClientNutritionPlan {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  clientId: string;
  coachId: string;

  name: string | null;
  status: PlanStatus;

  calculationMethod: CalculationMethod;
  calculationType: CalculationType | null;

  weight: number;
  height: number;
  age: number;
  gender: Gender;

  lifestyleActivity: LifestyleActivity;
  exerciseActivity: ExerciseActivity;
  lifestyleFactor: number;
  exerciseFactor: number;

  lbm: number | null;
  bmr: number;
  tdee: number;

  caloricAdjustmentPercent: number;
  dailyCalorieTarget: number;

  proteinPerKg: number;
  proteinGrams: number;
  fatPerKg: number;
  fatGrams: number;
  carbGrams: number;

  hasTrainingDays: boolean;
  hasNonTrainingDays: boolean;

  mealsPerDay: number;
  workoutTime: WorkoutTime | null;

  nutritionSystem: NutritionSystem;

  trainingDayMacros: DayMacros | null;
  nonTrainingDayMacros: DayMacros | null;
  mealDistribution: MealSlot[] | null;
}

// Wizard step data for creating a plan
export interface WizardFormData {
  // Step 1: Client Selection
  clientId: string;
  clientName: string;
  clientEmail: string;

  // Step 2: Macro Calculation Method
  calculationMethod: CalculationMethod;

  // Step 3: Calculation Type
  calculationType: CalculationType;

  // Step 4: Body Details
  weight: number;
  height: number;
  age: number;
  gender: Gender;

  // Step 5: Activity Factors
  lifestyleActivity: LifestyleActivity;
  exerciseActivity: ExerciseActivity;

  // Step 6: Energy Target
  caloricAdjustmentPercent: number;

  // Step 7: Macro Targets
  proteinPerKg: number;
  fatPerKg: number;

  // Step 8: Training Days
  hasTrainingDays: boolean;
  hasNonTrainingDays: boolean;

  // Step 9: Meals Per Day
  mealsPerDay: number;

  // Step 10: Workout Time
  workoutTime: WorkoutTime;

  // Step 11: Nutrition System
  nutritionSystem: NutritionSystem;

  // Step 12: Plan Name (optional)
  planName: string;
}

// API request for creating a plan
export interface CreateNutritionPlanRequest {
  clientId: string;
  name?: string;
  calculationMethod: CalculationMethod;
  calculationType?: CalculationType;
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  lifestyleActivity: LifestyleActivity;
  exerciseActivity: ExerciseActivity;
  caloricAdjustmentPercent: number;
  proteinPerKg: number;
  fatPerKg: number;
  hasTrainingDays: boolean;
  hasNonTrainingDays: boolean;
  mealsPerDay: number;
  workoutTime?: WorkoutTime;
  nutritionSystem: NutritionSystem;
}

// Client data for selection
export interface ClientOption {
  id: string;
  name: string | null;
  email: string;
  age: number | null;
  height: number | null;
  currentWeight: number | null;
  gender: string | null;
}
