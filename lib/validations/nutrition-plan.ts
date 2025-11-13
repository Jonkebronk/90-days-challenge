// Zod validation schemas for Nutrition Plans

import { z } from 'zod';

// Activity level validation
export const activityLevelSchema = z.union([
  z.literal(25),
  z.literal(30),
  z.literal(35),
  z.literal(40),
]);

// Cardio option validation
export const cardioOptionSchema = z.union([z.literal(1), z.literal(2)]);

// Plan status validation
export const planStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']);

// Meal item schema
export const mealItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  amount: z.number().positive('Amount must be positive'),
  protein: z.number().nonnegative('Protein cannot be negative'),
  fett: z.number().nonnegative('Fat cannot be negative'),
  kolhydrater: z.number().nonnegative('Carbs cannot be negative'),
  kcal: z.number().nonnegative('Calories cannot be negative'),
});

// Meal schema
export const mealSchema = z.object({
  name: z.string().min(1, 'Meal name is required'),
  items: z.array(mealItemSchema).min(1, 'Meal must have at least one item'),
});

// Complete nutrition schema
export const nutritionSchemaSchema = z.object({
  meals: z.array(mealSchema).min(1, 'Must have at least one meal'),
  totals: z.object({
    protein: z.number(),
    fett: z.number(),
    kolhydrater: z.number(),
    kcal: z.number(),
  }),
});

// Phase 1 schema (Base calculations)
export const phase1DataSchema = z.object({
  weight: z
    .coerce.number()
    .positive('Weight must be positive')
    .min(30, 'Weight must be at least 30 kg')
    .max(300, 'Weight must be less than 300 kg'),
  activity: activityLevelSchema,
  weightLoss: z
    .coerce.number()
    .min(0, 'Weight loss cannot be negative')
    .max(1000, 'Weight loss deficit too high'),
  steps: z
    .coerce.number()
    .int('Steps must be a whole number')
    .positive('Steps must be positive')
    .min(1000, 'Minimum 1000 steps')
    .max(30000, 'Maximum 30000 steps'),
  calories: z.coerce.number().int().positive(),
  protein: z.coerce.number().int().positive(),
  fat: z.coerce.number().int().positive(),
  carbs: z.coerce.number().int(),
  schema: nutritionSchemaSchema.optional(),
});

// Phase 2 schema (Ramp up 1)
export const phase2DataSchema = z.object({
  weight: z
    .coerce.number()
    .positive()
    .min(30)
    .max(300),
  activity: activityLevelSchema,
  weightLoss: z.coerce.number().min(0).max(1000),
  steps: z.coerce.number().int().positive().min(1000).max(30000),
  calories: z.coerce.number().int().positive(),
  protein: z.coerce.number().int().positive(),
  fat: z.coerce.number().int().positive(),
  carbs: z.coerce.number().int(),
  cardioMinutes: z.coerce.number().int().default(10),
  cardioDescription: z.string(),
  schema: nutritionSchemaSchema.optional(),
});

// Phase 3 schema (Ramp up 2)
export const phase3DataSchema = z.object({
  weight: z
    .coerce.number()
    .positive()
    .min(30)
    .max(300),
  activity: activityLevelSchema,
  weightLoss: z.coerce.number().min(0).max(1000),
  steps: z.coerce.number().int().positive().min(1000).max(30000),
  calories: z.coerce.number().int().positive(),
  protein: z.coerce.number().int().positive(),
  fat: z.coerce.number().int().positive(),
  carbs: z.coerce.number().int(),
  cardioMinutes: z.coerce.number().int().default(20),
  cardioDescription: z.string(),
  schema: nutritionSchemaSchema.optional(),
});

// Phase 4 schema (Maintenance)
export const phase4DataSchema = z.object({
  weight: z
    .coerce.number()
    .positive()
    .min(30)
    .max(300),
  activity: activityLevelSchema,
  activityAdjustment: z
    .coerce.number()
    .min(-10, 'Activity adjustment too low')
    .max(10, 'Activity adjustment too high')
    .default(0),
  cardioOption: cardioOptionSchema,
  steps: z.coerce.number().int().positive().min(1000).max(30000),
  calories: z.coerce.number().int().positive(),
  protein: z.coerce.number().int().positive(),
  fat: z.coerce.number().int().positive(),
  carbs: z.coerce.number().int(),
  cardioMinutes: z.coerce.number().int().optional(),
  cardioDescription: z.string(),
  schema: nutritionSchemaSchema.optional(),
});

// Complete nutrition plan schema (for creating/updating)
export const coachNutritionPlanInputSchema = z.object({
  clientId: z.string().cuid('Invalid client ID'),
  clientName: z.string().min(1, 'Client name is required'),
  status: planStatusSchema.default('DRAFT'),
  phase1Data: phase1DataSchema,
  phase2Data: phase2DataSchema.optional(),
  phase3Data: phase3DataSchema.optional(),
  phase4Data: phase4DataSchema.optional(),
});

// Schema for updating a plan (all fields except clientId optional)
export const coachNutritionPlanUpdateSchema = z.object({
  clientName: z.string().min(1).optional(),
  status: planStatusSchema.optional(),
  phase1Data: phase1DataSchema.optional(),
  phase2Data: phase2DataSchema.optional(),
  phase3Data: phase3DataSchema.optional(),
  phase4Data: phase4DataSchema.optional(),
});

// Export types inferred from schemas
export type CoachNutritionPlanInput = z.infer<typeof coachNutritionPlanInputSchema>;
export type CoachNutritionPlanUpdate = z.infer<typeof coachNutritionPlanUpdateSchema>;
export type Phase1Data = z.infer<typeof phase1DataSchema>;
export type Phase2Data = z.infer<typeof phase2DataSchema>;
export type Phase3Data = z.infer<typeof phase3DataSchema>;
export type Phase4Data = z.infer<typeof phase4DataSchema>;
