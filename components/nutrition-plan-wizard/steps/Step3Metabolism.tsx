'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import {
  MetabolismActivityLevel,
  METABOLISM_ACTIVITY_LABELS,
  METABOLISM_MULTIPLIERS,
} from '@/lib/types/client-nutrition-plan';
import { cn } from '@/lib/utils';

const activityOptions: {
  value: MetabolismActivityLevel;
  formula: string;
}[] = [
  {
    value: 'sedentary',
    formula: 'Kroppsvikt × 25 = kcal/dag',
  },
  {
    value: 'moderate',
    formula: 'Kroppsvikt × 30 = kcal/dag',
  },
  {
    value: 'very_active',
    formula: 'Kroppsvikt × 35 = kcal/dag',
  },
];

export function Step3Metabolism() {
  const {
    weight,
    metabolismActivityLevel,
    setBodyDetails,
    setMetabolismActivityLevel,
    recalculateMetabolism,
    dailyCalorieTarget,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // Recalculate when values change
  useEffect(() => {
    if (weight > 0 && metabolismActivityLevel) {
      recalculateMetabolism();
    }
  }, [weight, metabolismActivityLevel, recalculateMetabolism]);

  const handleWeightChange = (value: string) => {
    if (value === '') {
      setBodyDetails({ weight: 0 });
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setBodyDetails({ weight: num });
    }
  };

  const isValid = weight >= 30 && metabolismActivityLevel;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Beräkna ämnesomsättning
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Använd formeln baserat på klientens aktivitetsnivå
        </p>
      </div>

      {/* Weight input */}
      <div className="space-y-2">
        <Label htmlFor="weight">Kroppsvikt</Label>
        <div className="relative">
          <Input
            id="weight"
            type="text"
            inputMode="decimal"
            value={weight > 0 ? weight : ''}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="Ange vikt..."
            className="pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            kg
          </span>
        </div>
      </div>

      {/* Activity level selection */}
      <div className="space-y-2">
        <Label>Aktivitetsnivå</Label>
        <div className="space-y-3">
          {activityOptions.map((option) => (
            <Card
              key={option.value}
              onClick={() => setMetabolismActivityLevel(option.value)}
              className={cn(
                'p-4 cursor-pointer transition-all hover:shadow-md',
                metabolismActivityLevel === option.value
                  ? 'border-2 border-amber-500 bg-amber-50'
                  : 'border border-gray-200 hover:border-amber-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {METABOLISM_ACTIVITY_LABELS[option.value]}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {option.formula}
                  </div>
                </div>
                {metabolismActivityLevel === option.value && (
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Calculated result */}
      {isValid && dailyCalorieTarget > 0 && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-center">
            <div className="text-xs text-amber-600 uppercase tracking-wide font-medium">
              Beräknat dagligt energibehov
            </div>
            <div className="text-3xl font-bold text-amber-700 mt-1">
              {Math.round(dailyCalorieTarget)} kcal/dag
            </div>
            <div className="text-sm text-amber-600 mt-1">
              {weight} kg × {METABOLISM_MULTIPLIERS[metabolismActivityLevel!]} = {Math.round(dailyCalorieTarget)} kcal
            </div>
          </div>
        </div>
      )}

      <WizardNavigation
        onBack={previousStep}
        onNext={nextStep}
        isNextDisabled={!isValid}
      />
    </div>
  );
}
