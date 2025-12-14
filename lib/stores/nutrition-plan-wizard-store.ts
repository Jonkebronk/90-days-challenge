// Zustand store for Nutrition Plan Wizard
// Manages wizard state with localStorage persistence

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CalculationMethod,
  CalculationType,
  Gender,
  LifestyleActivity,
  ExerciseActivity,
  WorkoutTime,
  NutritionSystem,
  MetabolismActivityLevel,
} from '@/lib/types/client-nutrition-plan';
import { METABOLISM_MULTIPLIERS } from '@/lib/types/client-nutrition-plan';
import { calculateAllNutrition } from '@/lib/calculations/nutrition-plan-formulas';

// Total wizard steps
export const TOTAL_STEPS = 13;

interface NutritionPlanWizardState {
  // Navigation
  currentStep: number;
  maxReachedStep: number;

  // Step 1: Client Selection
  clientId: string;
  clientName: string;
  clientEmail: string;

  // Step 2: Macro Calculation Method
  calculationMethod: CalculationMethod;

  // Step 2b: Metabolism Activity Level (for metabolism method)
  metabolismActivityLevel: MetabolismActivityLevel | null;

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

  // Step 12: Plan Name
  planName: string;

  // Calculated Values (derived from inputs)
  lbm: number;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  lifestyleFactor: number;
  exerciseFactor: number;

  // UI State
  isSubmitting: boolean;
  createdPlanId: string | null;

  // Actions - Navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoToStep: (step: number) => boolean;

  // Actions - Step 1: Client
  setClientData: (data: {
    id: string;
    name: string;
    email: string;
    age?: number | null;
    height?: number | null;
    currentWeight?: number | null;
    gender?: string | null;
  }) => void;

  // Actions - Step 2: Calculation Method
  setCalculationMethod: (method: CalculationMethod) => void;

  // Actions - Step 2b: Metabolism Activity Level
  setMetabolismActivityLevel: (level: MetabolismActivityLevel) => void;

  // Actions - Step 3: Calculation Type
  setCalculationType: (type: CalculationType) => void;

  // Actions - Step 4: Body Details
  setBodyDetails: (data: {
    weight?: number;
    height?: number;
    age?: number;
    gender?: Gender;
  }) => void;

  // Actions - Step 5: Activity Factors
  setActivityFactors: (
    lifestyle: LifestyleActivity,
    exercise: ExerciseActivity
  ) => void;

  // Actions - Step 6: Energy Target
  setCaloricAdjustment: (percent: number) => void;

  // Actions - Step 7: Macro Targets
  setMacroTargets: (proteinPerKg: number, fatPerKg: number) => void;

  // Actions - Step 8: Training Days
  setTrainingDays: (
    hasTraining: boolean,
    hasNonTraining: boolean
  ) => void;

  // Actions - Step 9: Meals Per Day
  setMealsPerDay: (meals: number) => void;

  // Actions - Step 10: Workout Time
  setWorkoutTime: (time: WorkoutTime) => void;

  // Actions - Step 11: Nutrition System
  setNutritionSystem: (system: NutritionSystem) => void;

  // Actions - Step 12: Plan Name
  setPlanName: (name: string) => void;

  // Actions - Calculations
  recalculateAll: () => void;
  recalculateMetabolism: () => void;

  // Actions - Submission
  setSubmitting: (isSubmitting: boolean) => void;
  setCreatedPlanId: (id: string) => void;

  // Actions - Reset
  reset: () => void;
}

const initialState = {
  // Navigation
  currentStep: 1,
  maxReachedStep: 1,

  // Step 1: Client Selection
  clientId: '',
  clientName: '',
  clientEmail: '',

  // Step 2: Macro Calculation Method
  calculationMethod: 'automatic' as CalculationMethod,

  // Step 2b: Metabolism Activity Level
  metabolismActivityLevel: null as MetabolismActivityLevel | null,

  // Step 3: Calculation Type
  calculationType: 'weight_height_age' as CalculationType,

  // Step 4: Body Details
  weight: 70,
  height: 170,
  age: 30,
  gender: 'male' as Gender,

  // Step 5: Activity Factors
  lifestyleActivity: 'moderately_active' as LifestyleActivity,
  exerciseActivity: 'moderate' as ExerciseActivity,

  // Step 6: Energy Target
  caloricAdjustmentPercent: 0,

  // Step 7: Macro Targets
  proteinPerKg: 2.0,
  fatPerKg: 0.8,

  // Step 8: Training Days
  hasTrainingDays: true,
  hasNonTrainingDays: true,

  // Step 9: Meals Per Day
  mealsPerDay: 4,

  // Step 10: Workout Time
  workoutTime: 'afternoon' as WorkoutTime,

  // Step 11: Nutrition System
  nutritionSystem: 'balanced' as NutritionSystem,

  // Step 12: Plan Name
  planName: '',

  // Calculated Values
  lbm: 0,
  bmr: 0,
  tdee: 0,
  dailyCalorieTarget: 0,
  proteinGrams: 0,
  fatGrams: 0,
  carbGrams: 0,
  lifestyleFactor: 0,
  exerciseFactor: 0,

  // UI State
  isSubmitting: false,
  createdPlanId: null,
};

export const useNutritionPlanWizardStore = create<NutritionPlanWizardState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation Actions
      setStep: (step) => {
        const { canGoToStep, maxReachedStep } = get();
        if (step >= 1 && step <= TOTAL_STEPS && canGoToStep(step)) {
          set({
            currentStep: step,
            maxReachedStep: Math.max(maxReachedStep, step),
          });
        }
      },

      nextStep: () => {
        const { currentStep, maxReachedStep, recalculateAll } = get();
        if (currentStep < TOTAL_STEPS) {
          // Recalculate when moving forward from body/activity steps
          if (currentStep >= 4 && currentStep <= 7) {
            recalculateAll();
          }
          set({
            currentStep: currentStep + 1,
            maxReachedStep: Math.max(maxReachedStep, currentStep + 1),
          });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      canGoToStep: (step) => {
        const { maxReachedStep, clientId } = get();
        // Can always go back to visited steps
        if (step <= maxReachedStep) return true;
        // Can only go forward one step at a time
        if (step > maxReachedStep + 1) return false;
        // Step 1 requires client selection
        if (step > 1 && !clientId) return false;
        return true;
      },

      // Step 1: Client
      setClientData: (data) => {
        set({
          clientId: data.id,
          clientName: data.name,
          clientEmail: data.email,
          // Pre-fill body details if available
          ...(data.age && { age: data.age }),
          ...(data.height && { height: data.height }),
          ...(data.currentWeight && { weight: Number(data.currentWeight) }),
          ...(data.gender && {
            gender: data.gender === 'female' ? 'female' : 'male',
          }),
        });
      },

      // Step 2: Calculation Method
      setCalculationMethod: (method) => set({ calculationMethod: method }),

      // Step 2b: Metabolism Activity Level
      setMetabolismActivityLevel: (level) => {
        set({ metabolismActivityLevel: level });
        get().recalculateMetabolism();
      },

      // Step 3: Calculation Type
      setCalculationType: (type) => set({ calculationType: type }),

      // Step 4: Body Details
      setBodyDetails: (data) => {
        const current = get();
        const updates: Partial<NutritionPlanWizardState> = {};

        if (data.weight !== undefined) updates.weight = data.weight;
        if (data.height !== undefined) updates.height = data.height;
        if (data.age !== undefined) updates.age = data.age;
        if (data.gender !== undefined) updates.gender = data.gender;

        set(updates);

        // Recalculate after body details change
        get().recalculateAll();
      },

      // Step 5: Activity Factors
      setActivityFactors: (lifestyle, exercise) => {
        set({
          lifestyleActivity: lifestyle,
          exerciseActivity: exercise,
        });
        get().recalculateAll();
      },

      // Step 6: Energy Target
      setCaloricAdjustment: (percent) => {
        set({ caloricAdjustmentPercent: percent });
        get().recalculateAll();
      },

      // Step 7: Macro Targets
      setMacroTargets: (proteinPerKg, fatPerKg) => {
        set({ proteinPerKg, fatPerKg });
        get().recalculateAll();
      },

      // Step 8: Training Days
      setTrainingDays: (hasTraining, hasNonTraining) => {
        set({
          hasTrainingDays: hasTraining,
          hasNonTrainingDays: hasNonTraining,
        });
      },

      // Step 9: Meals Per Day
      setMealsPerDay: (meals) => set({ mealsPerDay: meals }),

      // Step 10: Workout Time
      setWorkoutTime: (time) => set({ workoutTime: time }),

      // Step 11: Nutrition System
      setNutritionSystem: (system) => set({ nutritionSystem: system }),

      // Step 12: Plan Name
      setPlanName: (name) => set({ planName: name }),

      // Calculations
      recalculateAll: () => {
        const state = get();
        const results = calculateAllNutrition({
          weight: state.weight,
          height: state.height,
          age: state.age,
          gender: state.gender,
          lifestyleActivity: state.lifestyleActivity,
          exerciseActivity: state.exerciseActivity,
          caloricAdjustmentPercent: state.caloricAdjustmentPercent,
          proteinPerKg: state.proteinPerKg,
          fatPerKg: state.fatPerKg,
        });

        set({
          lbm: results.lbm,
          bmr: results.bmr,
          tdee: results.tdee,
          dailyCalorieTarget: results.dailyCalorieTarget,
          proteinGrams: results.proteinGrams,
          fatGrams: results.fatGrams,
          carbGrams: results.carbGrams,
          lifestyleFactor: results.lifestyleFactor,
          exerciseFactor: results.exerciseFactor,
        });
      },

      // Simple metabolism calculation (weight × activity multiplier)
      recalculateMetabolism: () => {
        const state = get();
        if (!state.metabolismActivityLevel || state.weight <= 0) return;

        const multiplier = METABOLISM_MULTIPLIERS[state.metabolismActivityLevel];
        const dailyCalories = state.weight * multiplier;

        // Calculate macros using default values
        const proteinGrams = state.weight * state.proteinPerKg;
        const fatGrams = state.weight * state.fatPerKg;
        const remainingCals = dailyCalories - (proteinGrams * 4) - (fatGrams * 9);
        const carbGrams = Math.max(0, remainingCals / 4);

        set({
          dailyCalorieTarget: Math.round(dailyCalories),
          tdee: Math.round(dailyCalories),
          proteinGrams: Math.round(proteinGrams),
          fatGrams: Math.round(fatGrams),
          carbGrams: Math.round(carbGrams),
        });
      },

      // Submission
      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      setCreatedPlanId: (id) => set({ createdPlanId: id }),

      // Reset
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'nutrition-plan-wizard',
      // Only persist form data, not UI state
      partialize: (state) => ({
        currentStep: state.currentStep,
        maxReachedStep: state.maxReachedStep,
        clientId: state.clientId,
        clientName: state.clientName,
        clientEmail: state.clientEmail,
        calculationMethod: state.calculationMethod,
        metabolismActivityLevel: state.metabolismActivityLevel,
        calculationType: state.calculationType,
        weight: state.weight,
        height: state.height,
        age: state.age,
        gender: state.gender,
        lifestyleActivity: state.lifestyleActivity,
        exerciseActivity: state.exerciseActivity,
        caloricAdjustmentPercent: state.caloricAdjustmentPercent,
        proteinPerKg: state.proteinPerKg,
        fatPerKg: state.fatPerKg,
        hasTrainingDays: state.hasTrainingDays,
        hasNonTrainingDays: state.hasNonTrainingDays,
        mealsPerDay: state.mealsPerDay,
        workoutTime: state.workoutTime,
        nutritionSystem: state.nutritionSystem,
        planName: state.planName,
      }),
    }
  )
);
