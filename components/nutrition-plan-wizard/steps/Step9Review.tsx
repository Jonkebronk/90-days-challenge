'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import {
  LIFESTYLE_ACTIVITY_LABELS,
  EXERCISE_ACTIVITY_LABELS,
  WORKOUT_TIME_LABELS,
  NUTRITION_SYSTEM_LABELS,
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
    weight,
    height,
    age,
    gender,
    lifestyleActivity,
    exerciseActivity,
    caloricAdjustmentPercent,
    tdee,
    dailyCalorieTarget,
    proteinPerKg,
    fatPerKg,
    proteinGrams,
    fatGrams,
    carbGrams,
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
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kunde inte skapa kostplan');
      }

      const plan = await response.json();
      setCreatedPlanId(plan.id);
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
              <span className="text-gray-600">TDEE</span>
              <span className="font-medium">{tdee} kcal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kalorimål</span>
              <span className="font-medium">
                {caloricAdjustmentPercent >= 0 ? '+' : ''}
                {caloricAdjustmentPercent}%
              </span>
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
            <div className="flex justify-between">
              <span className="text-gray-600">Träningstid</span>
              <span className="font-medium">
                {WORKOUT_TIME_LABELS[workoutTime]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Näringssystem</span>
              <span className="font-medium">
                {NUTRITION_SYSTEM_LABELS[nutritionSystem]}
              </span>
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
