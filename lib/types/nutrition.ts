// TypeScript types for 4-Phase Nutrition Calculator

export type ActivityLevel = 25 | 30 | 35 | 40;

export type CardioOption = 1 | 2;

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

// Base nutrition calculation result
export interface NutritionCalculation {
  kcal: number;
  protein: number;
  fett: number;
  kolhydrater: number;
  baseKcal: number;
}

// Meal item in schema
export interface MealItem {
  name: string;
  amount: number;
  protein: number;
  fett: number;
  kolhydrater: number;
  kcal: number;
}

// Meal containing items
export interface Meal {
  name: string;
  items: MealItem[];
}

// Complete nutrition schema with meals and totals
export interface NutritionSchema {
  meals: Meal[];
  totals: {
    protein: number;
    fett: number;
    kolhydrater: number;
    kcal: number;
  };
}

// Phase 1 Data (Base calculations)
export interface Phase1Data {
  weight: number;
  activity: ActivityLevel;
  weightLoss: number;
  steps: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  schema?: NutritionSchema;
}

// Phase 2 Data (Ramp up 1: +25% steps, 10min cardio)
export interface Phase2Data {
  weight: number;
  activity: ActivityLevel;
  weightLoss: number;
  steps: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cardioMinutes: number;
  cardioDescription: string;
  schema?: NutritionSchema;
}

// Phase 3 Data (Ramp up 2: +25% more steps, 20min cardio)
export interface Phase3Data {
  weight: number;
  activity: ActivityLevel;
  weightLoss: number;
  steps: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cardioMinutes: number;
  cardioDescription: string;
  schema?: NutritionSchema;
}

// Phase 4 Data (Maintenance)
export interface Phase4Data {
  weight: number;
  activity: ActivityLevel;
  activityAdjustment: number;
  cardioOption: CardioOption;
  steps: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cardioMinutes?: number;
  cardioDescription: string;
  schema?: NutritionSchema;
}

// Complete CoachNutritionPlan (from database)
export interface CoachNutritionPlan {
  id: string;
  clientId: string;
  clientName: string;
  coachId: string;
  status: PlanStatus;

  phase1Data: Phase1Data;
  phase2Data?: Phase2Data;
  phase3Data?: Phase3Data;
  phase4Data?: Phase4Data;

  createdAt: Date;
  updatedAt: Date;
}

// Input for creating/updating a plan
export interface CoachNutritionPlanInput {
  clientId: string;
  clientName: string;
  status?: PlanStatus;
  phase1Data: Phase1Data;
  phase2Data?: Phase2Data;
  phase3Data?: Phase3Data;
  phase4Data?: Phase4Data;
}

// Client info for selector
export interface ClientOption {
  id: string;
  name: string;
  email: string;
}
