// Custom hook for nutrition calculations
// Wraps calculation logic from lib/calculations/nutrition.ts

'use client';

import {
  calculateNutrition,
  calculatePhase1,
  calculatePhase2,
  calculatePhase3,
  calculatePhase4,
  generateAdjustedSchema,
  DEFAULT_MEAL_SCHEMA,
} from '@/lib/calculations/nutrition';
import {
  ActivityLevel,
  CardioOption,
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
  NutritionSchema,
} from '@/lib/types/nutrition';

export function useNutritionCalculations() {
  // Phase 1 calculations
  const calculatePhase1Data = (
    weight: number,
    activityLevel: ActivityLevel,
    weightLoss: number,
    steps: number
  ): Phase1Data => {
    const phase1 = calculatePhase1(weight, activityLevel, weightLoss, steps);

    // Generate adjusted schema based on calculated nutrition
    const adjustedSchema = generateAdjustedSchema(DEFAULT_MEAL_SCHEMA, {
      kcal: phase1.calories,
      protein: phase1.protein,
      fett: phase1.fat,
      kolhydrater: phase1.carbs,
      baseKcal: weight * activityLevel,
    });

    return {
      ...phase1,
      schema: adjustedSchema,
    };
  };

  // Phase 2 calculations
  const calculatePhase2Data = (
    phase1Steps: number,
    newWeight: number,
    activityLevel: ActivityLevel,
    weightLoss: number
  ): Phase2Data => {
    const phase2 = calculatePhase2(phase1Steps, newWeight, activityLevel, weightLoss);

    // Generate adjusted schema
    const adjustedSchema = generateAdjustedSchema(DEFAULT_MEAL_SCHEMA, {
      kcal: phase2.calories,
      protein: phase2.protein,
      fett: phase2.fat,
      kolhydrater: phase2.carbs,
      baseKcal: newWeight * activityLevel,
    });

    return {
      ...phase2,
      schema: adjustedSchema,
    };
  };

  // Phase 3 calculations
  const calculatePhase3Data = (
    phase2Steps: number,
    newWeight: number,
    activityLevel: ActivityLevel,
    weightLoss: number
  ): Phase3Data => {
    const phase3 = calculatePhase3(phase2Steps, newWeight, activityLevel, weightLoss);

    // Generate adjusted schema
    const adjustedSchema = generateAdjustedSchema(DEFAULT_MEAL_SCHEMA, {
      kcal: phase3.calories,
      protein: phase3.protein,
      fett: phase3.fat,
      kolhydrater: phase3.carbs,
      baseKcal: newWeight * activityLevel,
    });

    return {
      ...phase3,
      schema: adjustedSchema,
    };
  };

  // Phase 4 calculations
  const calculatePhase4Data = (
    phase3Steps: number,
    newWeight: number,
    baseActivityLevel: ActivityLevel,
    activityAdjustment: number,
    cardioOption: CardioOption
  ): Phase4Data => {
    const phase4 = calculatePhase4(
      phase3Steps,
      newWeight,
      baseActivityLevel,
      activityAdjustment,
      cardioOption
    );

    // Generate adjusted schema (maintenance calories)
    const effectiveActivity = (baseActivityLevel + activityAdjustment) as ActivityLevel;
    const adjustedSchema = generateAdjustedSchema(DEFAULT_MEAL_SCHEMA, {
      kcal: phase4.calories,
      protein: phase4.protein,
      fett: phase4.fat,
      kolhydrater: phase4.carbs,
      baseKcal: newWeight * effectiveActivity,
    });

    return {
      ...phase4,
      schema: adjustedSchema,
    };
  };

  // Quick calculation helper (without schema generation)
  const calculateQuick = (
    weight: number,
    activityLevel: ActivityLevel,
    weightLoss: number
  ) => {
    return calculateNutrition(weight, activityLevel, weightLoss);
  };

  return {
    calculatePhase1Data,
    calculatePhase2Data,
    calculatePhase3Data,
    calculatePhase4Data,
    calculateQuick,
    DEFAULT_MEAL_SCHEMA,
  };
}
