'use client';

import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import { WORKOUT_TIME_LABELS } from '@/lib/types/client-nutrition-plan';
import type { WorkoutTime } from '@/lib/types/client-nutrition-plan';
import { cn } from '@/lib/utils';

const workoutTimeOptions: WorkoutTime[] = [
  'pre_breakfast',
  'morning',
  'lunch_time',
  'afternoon',
  'evening',
  'night_time',
];

export function Step10WorkoutTime() {
  const { workoutTime, setWorkoutTime, nextStep, previousStep } =
    useNutritionPlanWizardStore();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Träningstid</h2>
        <p className="text-sm text-gray-600 mt-1">
          Vilken tid på dagen tränar de?
        </p>
      </div>

      <div className="space-y-3">
        {workoutTimeOptions.map((time) => (
          <Card
            key={time}
            onClick={() => setWorkoutTime(time)}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md',
              workoutTime === time
                ? 'border-2 border-amber-500 bg-amber-50'
                : 'border border-gray-200 hover:border-amber-300'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">
                {WORKOUT_TIME_LABELS[time]}
              </div>
              {workoutTime === time ? (
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
