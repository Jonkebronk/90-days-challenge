'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import {
  METABOLISM_MULTIPLIERS,
  CALORIE_GOAL_CONFIG,
} from '@/lib/types/client-nutrition-plan';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function Step9Review() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    clientId,
    clientName,
    calculationMethod,
    metabolismActivityLevel,
    fatLossRate,
    weight,
    height,
    age,
    gender,
    lifestyleActivity,
    exerciseActivity,
    caloricAdjustmentPercent,
    tdee: storeTdee,
    dailyCalorieTarget: storeDailyCalorieTarget,
    proteinPerKg,
    fatPerKg,
    proteinGrams: storeProteinGrams,
    fatGrams: storeFatGrams,
    carbGrams: storeCarbGrams,
    hasTrainingDays,
    hasNonTrainingDays,
    mealsPerDay,
    workoutTime,
    nutritionSystem,
    planName,
    setPlanName,
    previousStep,
    nextStep,
    setCreatedPlanId,
  } = useNutritionPlanWizardStore();

  // Calculate values directly for metabolism method to ensure consistency
  const isMetabolismMethod = calculationMethod === 'metabolism';

  let tdee: number;
  let dailyCalorieTarget: number;
  let proteinGrams: number;
  let fatGrams: number;
  let carbGrams: number;
  let adjustmentDisplay: string;
  let adjustmentLabel: string;

  if (isMetabolismMethod && metabolismActivityLevel) {
    const multiplier = METABOLISM_MULTIPLIERS[metabolismActivityLevel];
    tdee = Math.round(weight * multiplier);
    const config = fatLossRate ? CALORIE_GOAL_CONFIG[fatLossRate] : null;
    const adjustment = config?.adjustmentPerDay || 0;
    const goalType = config?.goalType || 'maintenance';
    dailyCalorieTarget = Math.round(Math.max(1200, tdee + adjustment));

    // Display text based on goal type
    if (goalType === 'deficit') {
      adjustmentDisplay = `-${Math.abs(adjustment)} kcal`;
      adjustmentLabel = 'Underskott';
    } else if (goalType === 'surplus') {
      adjustmentDisplay = `+${adjustment} kcal`;
      adjustmentLabel = 'Överskott';
    } else {
      adjustmentDisplay = '0 kcal';
      adjustmentLabel = 'Balans';
    }

    // Calculate macros
    proteinGrams = Math.round(weight * proteinPerKg);
    fatGrams = Math.round(weight * fatPerKg);
    const remainingCals = dailyCalorieTarget - (proteinGrams * 4) - (fatGrams * 9);
    carbGrams = Math.round(Math.max(0, remainingCals / 4));
  } else {
    // Use store values for other methods
    tdee = storeTdee;
    dailyCalorieTarget = storeDailyCalorieTarget;
    proteinGrams = storeProteinGrams;
    fatGrams = storeFatGrams;
    carbGrams = storeCarbGrams;
    adjustmentDisplay = `${caloricAdjustmentPercent >= 0 ? '+' : ''}${caloricAdjustmentPercent}%`;
    adjustmentLabel = 'Kalorimål';
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/nutrition-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          name: planName || `${clientName}s kostplan`,
          calculationMethod,
          calculationType: 'weight_height_age',
          weight,
          height,
          age,
          gender,
          lifestyleActivity,
          exerciseActivity,
          caloricAdjustmentPercent,
          proteinPerKg,
          fatPerKg,
          hasTrainingDays,
          hasNonTrainingDays,
          mealsPerDay,
          workoutTime,
          nutritionSystem,
          // Metabolism method fields
          metabolismActivityLevel,
          calorieGoal: fatLossRate,
          // Send calculated values to ensure consistency
          dailyCalorieTarget,
          proteinGrams,
          fatGrams,
          carbGrams,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kunde inte skapa kostplan');
      }

      const plan = await response.json();
      setCreatedPlanId(plan.id);

      // Automatically create the meal plan (kostschema)
      try {
        await fetch('/api/meal-plan/create-empty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nutritionPlanId: plan.id,
          }),
        });
      } catch (mealPlanError) {
        console.error('Error creating meal plan:', mealPlanError);
        // Continue anyway - user can create it manually
      }

      toast.success('Kostplan skapad!');
      nextStep();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error(
        error instanceof Error ? error.message : 'Något gick fel'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Slutgranskning</h2>
        <p className="text-sm text-gray-600 mt-1">
          Granska alla val och skapa kostplanen
        </p>
      </div>

      {/* Plan name */}
      <div className="space-y-2">
        <Label htmlFor="planName">Plannamn</Label>
        <Input
          id="planName"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder={`${clientName}s kostplan`}
        />
      </div>

      {/* Summary cards */}
      <Card className="p-4 space-y-4">
        {/* Energy & Macros */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Energi & Makros
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {isMetabolismMethod ? 'Ämnesomsättning' : 'TDEE'}
              </span>
              <span className="font-medium">{tdee} kcal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {adjustmentLabel}
              </span>
              <span className="font-medium">{adjustmentDisplay}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-600">Dagligt energimål</span>
              <span className="font-bold text-amber-600">
                {dailyCalorieTarget} kcal
              </span>
            </div>
          </div>
        </div>

        <hr />

        {/* Macros detail */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Makronutrienter
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-gray-500">Protein</div>
              <div className="font-bold text-pink-500">{proteinGrams}g</div>
              <div className="text-xs text-gray-400">{proteinPerKg}g/kg</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Fett</div>
              <div className="font-bold text-amber-500">{fatGrams}g</div>
              <div className="text-xs text-gray-400">{fatPerKg}g/kg</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Kolhydrater</div>
              <div className="font-bold text-teal-500">{carbGrams}g</div>
              <div className="text-xs text-gray-400">resterande</div>
            </div>
          </div>
        </div>

        <hr />

        {/* Meal plan options */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Måltidsplan
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Träningsdagar</span>
              <span className="font-medium">
                {hasTrainingDays ? 'Ja' : 'Nej'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Måltider per dag</span>
              <span className="font-medium">{mealsPerDay}</span>
            </div>
          </div>
        </div>
      </Card>

      <WizardNavigation
        onBack={previousStep}
        onNext={handleSubmit}
        nextLabel="Skapa Plan"
        isLoading={isSubmitting}
      />
    </div>
  );
}
