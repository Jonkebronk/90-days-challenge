// Nutrition calculation functions
// Pure functions for all nutritional calculations based on 4-phase system

import {
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
  ActivityLevel,
  CardioOption,
  NutritionCalculation,
  NutritionSchema,
  Meal,
  MealItem,
} from '@/lib/types/nutrition';

/**
 * Base nutrition calculation
 * Formula: baseKcal = weight × activity level
 * Adjusted for weight loss: adjustedKcal = baseKcal - deficit
 * Macros: Protein = weight × 2.5g, Fat = weight × 0.7g, Carbs = remaining calories / 4
 */
export function calculateNutrition(
  weight: number,
  activityLevel: ActivityLevel,
  weightLoss: number
): NutritionCalculation {
  const baseKcal = weight * activityLevel;
  const adjustedKcal = weightLoss > 0 ? baseKcal - weightLoss : baseKcal;

  const protein = Math.round(weight * 2.5);
  const fett = Math.round(weight * 0.7);
  const proteinKcal = protein * 4;
  const fettKcal = fett * 9;
  const remainingKcal = adjustedKcal - proteinKcal - fettKcal;
  const kolhydrater = Math.round(remainingKcal / 4);

  return {
    kcal: Math.round(adjustedKcal),
    protein,
    fett,
    kolhydrater,
    baseKcal: Math.round(baseKcal),
  };
}

/**
 * Calculate Phase 1 (Base calculations)
 * Initial phase with base weight, activity level, deficit, and step goal
 */
export function calculatePhase1(
  weight: number,
  activityLevel: ActivityLevel,
  weightLoss: number,
  steps: number
): Phase1Data {
  const nutrition = calculateNutrition(weight, activityLevel, weightLoss);

  return {
    weight,
    activity: activityLevel,
    weightLoss,
    steps,
    calories: nutrition.kcal,
    protein: nutrition.protein,
    fat: nutrition.fett,
    carbs: nutrition.kolhydrater,
  };
}

/**
 * Calculate Phase 2 (Ramp up 1)
 * +25% steps from Phase 1
 * Add 10 min interval cardio after strength training
 */
export function calculatePhase2(
  phase1Steps: number,
  newWeight: number,
  activityLevel: ActivityLevel,
  weightLoss: number
): Phase2Data {
  const nutrition = calculateNutrition(newWeight, activityLevel, weightLoss);
  const newSteps = Math.round(phase1Steps * 1.25);

  return {
    weight: newWeight,
    activity: activityLevel,
    weightLoss,
    steps: newSteps,
    calories: nutrition.kcal,
    protein: nutrition.protein,
    fat: nutrition.fett,
    carbs: nutrition.kolhydrater,
    cardioMinutes: 10,
    cardioDescription: '10 varv intervall: 15 sek ALL OUT / 45 sek lugnt',
  };
}

/**
 * Calculate Phase 3 (Ramp up 2)
 * +25% steps from Phase 2 (total +56% from Phase 1)
 * 20 min cardio: 12 intervals + 8 min steady state
 */
export function calculatePhase3(
  phase2Steps: number,
  newWeight: number,
  activityLevel: ActivityLevel,
  weightLoss: number
): Phase3Data {
  const nutrition = calculateNutrition(newWeight, activityLevel, weightLoss);
  const newSteps = Math.round(phase2Steps * 1.25);

  return {
    weight: newWeight,
    activity: activityLevel,
    weightLoss,
    steps: newSteps,
    calories: nutrition.kcal,
    protein: nutrition.protein,
    fat: nutrition.fett,
    carbs: nutrition.kolhydrater,
    cardioMinutes: 20,
    cardioDescription: '12 varv intervall + 8 min steady state = 20 min totalt',
  };
}

/**
 * Calculate Phase 4 (Maintenance - "Din Nya Vardag")
 * Two cardio options:
 * Option 1: Keep 12 interval rounds, reduce steps by 30%
 * Option 2: No cardio, keep Phase 3 steps
 * No weight loss (maintenance calories)
 */
export function calculatePhase4(
  phase3Steps: number,
  newWeight: number,
  baseActivityLevel: ActivityLevel,
  activityAdjustment: number,
  cardioOption: CardioOption
): Phase4Data {
  const effectiveActivity = (baseActivityLevel + activityAdjustment) as ActivityLevel;
  const nutrition = calculateNutrition(newWeight, effectiveActivity, 0); // No deficit - maintenance

  let newSteps: number;
  let cardioMinutes: number | undefined;
  let cardioDescription: string;

  if (cardioOption === 1) {
    // Option 1: 12 intervals, reduce steps 30%
    newSteps = Math.round(phase3Steps * 0.7);
    cardioMinutes = 12;
    cardioDescription = '12 varv intervall efter styrketräning';
  } else {
    // Option 2: No cardio, keep steps
    newSteps = phase3Steps;
    cardioMinutes = undefined;
    cardioDescription = 'Ingen cardio - fokus på dagliga steg';
  }

  return {
    weight: newWeight,
    activity: baseActivityLevel,
    activityAdjustment,
    cardioOption,
    steps: newSteps,
    calories: nutrition.kcal,
    protein: nutrition.protein,
    fat: nutrition.fett,
    carbs: nutrition.kolhydrater,
    cardioMinutes,
    cardioDescription,
  };
}

/**
 * Generate adjusted meal schema based on target nutrition
 * Scales original meal template to match target calories
 */
export function generateAdjustedSchema(
  originalSchema: NutritionSchema,
  targetNutrition: NutritionCalculation
): NutritionSchema {
  const avgScalingFactor = targetNutrition.kcal / originalSchema.totals.kcal;

  const adjustedMeals: Meal[] = originalSchema.meals.map((meal) => ({
    ...meal,
    items: meal.items.map((item) => {
      const newAmount = item.amount * avgScalingFactor;
      const amountRatio = newAmount / item.amount;

      return {
        name: item.name,
        amount: Math.round(newAmount * 10) / 10, // Round to 1 decimal
        protein: Math.round(item.protein * amountRatio * 10) / 10,
        fett: Math.round(item.fett * amountRatio * 10) / 10,
        kolhydrater: Math.round(item.kolhydrater * amountRatio * 10) / 10,
        kcal: Math.round(item.kcal * amountRatio * 10) / 10,
      };
    }),
  }));

  // Calculate totals from adjusted meals
  const totals = adjustedMeals.reduce(
    (acc, meal) => {
      meal.items.forEach((item) => {
        acc.protein += item.protein;
        acc.fett += item.fett;
        acc.kolhydrater += item.kolhydrater;
        acc.kcal += item.kcal;
      });
      return acc;
    },
    { protein: 0, fett: 0, kolhydrater: 0, kcal: 0 }
  );

  return {
    meals: adjustedMeals,
    totals: {
      protein: Math.round(totals.protein * 10) / 10,
      fett: Math.round(totals.fett * 10) / 10,
      kolhydrater: Math.round(totals.kolhydrater * 10) / 10,
      kcal: Math.round(totals.kcal * 10) / 10,
    },
  };
}

/**
 * Default meal template (from original component)
 * Can be customized per client
 */
export const DEFAULT_MEAL_SCHEMA: NutritionSchema = {
  totals: { protein: 225, fett: 80, kolhydrater: 186.6, kcal: 2446.4 },
  meals: [
    {
      name: 'Måltid 1',
      items: [
        {
          name: 'Havregryn eller Naturell yoghurt 0.5% fett',
          amount: 50,
          protein: 6.6,
          fett: 3.4,
          kolhydrater: 26,
          kcal: 176.5,
        },
        {
          name: 'Hallon/Blåbär',
          amount: 50,
          protein: 0.5,
          fett: 0.3,
          kolhydrater: 2.7,
          kcal: 18.8,
        },
        {
          name: 'Omega-3',
          amount: 3,
          protein: 0,
          fett: 3,
          kolhydrater: 0,
          kcal: 27,
        },
        {
          name: 'Ägg (Medelstort ca 65g)',
          amount: 130,
          protein: 16.1,
          fett: 13.2,
          kolhydrater: 0.5,
          kcal: 183.3,
        },
        {
          name: 'Kvarg/keso max 1.5% fett eller whey',
          amount: 150,
          protein: 19.1,
          fett: 1.5,
          kolhydrater: 5.4,
          kcal: 113.4,
        },
        {
          name: 'Multivitamin',
          amount: 1,
          protein: 0,
          fett: 0,
          kolhydrater: 0,
          kcal: 0,
        },
      ],
    },
    {
      name: 'Måltid 2',
      items: [
        {
          name: 'Kvarg/keso max 1.5% fett eller whey',
          amount: 130,
          protein: 16.5,
          fett: 1.3,
          kolhydrater: 4.7,
          kcal: 98.3,
        },
        {
          name: 'Avokado eller naturella nötter',
          amount: 100,
          protein: 1.9,
          fett: 19.6,
          kolhydrater: 1.7,
          kcal: 197,
        },
      ],
    },
    {
      name: 'Måltid 3',
      items: [
        {
          name: 'Kyckling/Magert nötkött/Kalkon',
          amount: 200,
          protein: 46.2,
          fett: 2.4,
          kolhydrater: 0,
          kcal: 210,
        },
        {
          name: 'Ris (okokt) eller potatis',
          amount: 75,
          protein: 5.8,
          fett: 0.9,
          kolhydrater: 57.5,
          kcal: 269.3,
        },
        {
          name: 'Blandade grönsaker',
          amount: 200,
          protein: 7,
          fett: 0.6,
          kolhydrater: 6.2,
          kcal: 70,
        },
      ],
    },
    {
      name: 'Måltid 4',
      items: [
        {
          name: 'Kvarg/keso max 1.5% fett eller whey',
          amount: 130,
          protein: 16.5,
          fett: 1.3,
          kolhydrater: 4.7,
          kcal: 98.3,
        },
        {
          name: 'Avokado eller naturella nötter',
          amount: 100,
          protein: 1.9,
          fett: 19.6,
          kolhydrater: 1.7,
          kcal: 197,
        },
      ],
    },
    {
      name: 'Måltid 5',
      items: [
        {
          name: 'Kyckling/Magert nötkött/Kalkon',
          amount: 200,
          protein: 46.2,
          fett: 2.4,
          kolhydrater: 0,
          kcal: 210,
        },
        {
          name: 'Ris/mathavre/matvete/bönpasta',
          amount: 75,
          protein: 5.8,
          fett: 0.9,
          kolhydrater: 57.5,
          kcal: 269.3,
        },
        {
          name: 'Blandade grönsaker',
          amount: 200,
          protein: 7,
          fett: 0.6,
          kolhydrater: 6.2,
          kcal: 70,
        },
      ],
    },
    {
      name: 'Måltid 6',
      items: [
        {
          name: 'Kvarg/keso eller Casein',
          amount: 200,
          protein: 25.4,
          fett: 2,
          kolhydrater: 7.2,
          kcal: 151.2,
        },
        {
          name: 'Naturella nötter utan salt',
          amount: 15,
          protein: 2.5,
          fett: 7.2,
          kolhydrater: 4.5,
          kcal: 87.2,
        },
      ],
    },
  ],
};

/**
 * Utility: Get phase number from phase data
 */
export function getPhaseNumber(phase: Phase1Data | Phase2Data | Phase3Data | Phase4Data): number {
  if ('cardioOption' in phase) return 4;
  if ('cardioMinutes' in phase) {
    return phase.cardioMinutes === 20 ? 3 : 2;
  }
  return 1;
}

/**
 * Utility: Format steps with thousands separator
 */
export function formatSteps(steps: number): string {
  return steps.toLocaleString('sv-SE');
}

/**
 * Utility: Validate activity level
 */
export function isValidActivityLevel(value: number): value is ActivityLevel {
  return [25, 30, 35, 40].includes(value);
}
