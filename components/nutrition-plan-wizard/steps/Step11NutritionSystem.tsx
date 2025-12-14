'use client';

import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import { NUTRITION_SYSTEM_LABELS } from '@/lib/types/client-nutrition-plan';
import type { NutritionSystem } from '@/lib/types/client-nutrition-plan';
import { cn } from '@/lib/utils';

const nutritionSystemOptions: NutritionSystem[] = [
  'low_carb_backloading',
  'low_carb',
  'carb_backloading',
  'targeted_carb',
  'modified_carb_backloading',
  'balanced',
  'carb_front_loading',
  'high_carb',
];

export function Step11NutritionSystem() {
  const { nutritionSystem, setNutritionSystem, nextStep, previousStep } =
    useNutritionPlanWizardStore();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Näringssystem</h2>
        <p className="text-sm text-gray-600 mt-1">
          Välj system för näringsuppföljning
        </p>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {nutritionSystemOptions.map((system) => (
          <Card
            key={system}
            onClick={() => setNutritionSystem(system)}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md',
              nutritionSystem === system
                ? 'border-2 border-amber-500 bg-amber-50'
                : 'border border-gray-200 hover:border-amber-300'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">
                {NUTRITION_SYSTEM_LABELS[system]}
              </div>
              {nutritionSystem === system ? (
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
