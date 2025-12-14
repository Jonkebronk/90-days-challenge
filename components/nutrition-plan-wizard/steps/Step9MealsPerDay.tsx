'use client';

import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import { cn } from '@/lib/utils';

const mealOptions = [2, 3, 4, 5, 6, 7];

export function Step9MealsPerDay() {
  const { mealsPerDay, setMealsPerDay, nextStep, previousStep } =
    useNutritionPlanWizardStore();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Måltider per dag</h2>
        <p className="text-sm text-gray-600 mt-1">
          Konfigurera måltidsfrekvens
        </p>
      </div>

      <div className="space-y-3">
        {mealOptions.map((meals) => (
          <Card
            key={meals}
            onClick={() => setMealsPerDay(meals)}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md',
              mealsPerDay === meals
                ? 'border-2 border-amber-500 bg-amber-50'
                : 'border border-gray-200 hover:border-amber-300'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">
                {meals} måltider
              </div>
              {mealsPerDay === meals ? (
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
              )}
            </div>
          </Card>
        ))}
      </div>

      <WizardNavigation onBack={previousStep} onNext={nextStep} />
    </div>
  );
}
