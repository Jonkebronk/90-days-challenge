'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import {
  LIFESTYLE_ACTIVITY_LABELS,
  EXERCISE_ACTIVITY_LABELS,
} from '@/lib/types/client-nutrition-plan';
import type {
  LifestyleActivity,
  ExerciseActivity,
} from '@/lib/types/client-nutrition-plan';
import {
  LIFESTYLE_ACTIVITY_FACTORS,
  EXERCISE_ACTIVITY_FACTORS,
} from '@/lib/calculations/nutrition-plan-formulas';

export function Step5ActivityFactors() {
  const {
    lbm,
    tdee,
    lifestyleActivity,
    exerciseActivity,
    lifestyleFactor,
    exerciseFactor,
    setActivityFactors,
    recalculateAll,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // Recalculate on mount
  useEffect(() => {
    recalculateAll();
  }, [recalculateAll]);

  const overallFactor = (lifestyleFactor + exerciseFactor).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Aktivitetsfaktorer</h2>
        <p className="text-sm text-gray-600 mt-1">
          Ange livsstils- och träningsaktivitetsnivåer
        </p>
      </div>

      {/* Calculation display */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-center gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 uppercase">Beräknad LBM</div>
            <div className="text-lg font-bold">{lbm} kg</div>
          </div>
          <div className="text-xl text-gray-400">×</div>
          <div>
            <div className="text-xs text-gray-500 uppercase">
              Total aktivitetsfaktor
            </div>
            <div className="text-lg font-bold">{overallFactor}</div>
          </div>
          <div className="text-xl text-gray-400">=</div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Beräknad TDEE</div>
            <div className="text-lg font-bold text-amber-600">{tdee} kcal</div>
          </div>
        </div>
      </Card>

      {/* Activity selectors */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Livsstilsaktivitet</Label>
          <p className="text-xs text-gray-500">
            Minimal stående eller gående aktivitet
          </p>
          <Select
            value={lifestyleActivity}
            onValueChange={(value: LifestyleActivity) =>
              setActivityFactors(value, exerciseActivity)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LIFESTYLE_ACTIVITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Träningsaktivitet</Label>
          <p className="text-xs text-gray-500">Ingen träning</p>
          <Select
            value={exerciseActivity}
            onValueChange={(value: ExerciseActivity) =>
              setActivityFactors(lifestyleActivity, value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EXERCISE_ACTIVITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <WizardNavigation onBack={previousStep} onNext={nextStep} />
    </div>
  );
}
