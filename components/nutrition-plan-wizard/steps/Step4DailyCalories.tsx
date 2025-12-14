'use client';

import { useEffect } from 'react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import { FAT_LOSS_RATE_CONFIG } from '@/lib/types/client-nutrition-plan';
import { Calculator } from 'lucide-react';

export function Step4DailyCalories() {
  const {
    tdee, // Metabolism before deficit
    dailyCalorieTarget, // Already has deficit applied
    fatLossRate,
    recalculateMetabolism,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // Recalculate on mount
  useEffect(() => {
    recalculateMetabolism();
  }, [recalculateMetabolism]);

  const deficit = fatLossRate ? FAT_LOSS_RATE_CONFIG[fatLossRate].deficitPerDay : 0;
  // tdee = metabolism before deficit, dailyCalorieTarget = with deficit applied
  const metabolism = tdee;
  const finalCalories = dailyCalorieTarget;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Beräkna dagligt kaloriintag
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Baserat på ämnesomsättning och valt underskott
        </p>
      </div>

      {/* Formula */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700">Formel:</div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-600 font-mono text-sm">
            Ämnesomsättning - Dagligt underskott = Dagligt kaloriintag
          </div>
        </div>
      </div>

      {/* Example/Calculation */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700">Din beräkning:</div>
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-amber-800 font-mono text-lg text-center">
            {metabolism.toLocaleString('sv-SE')} kcal - {deficit} kcal = <strong>{finalCalories.toLocaleString('sv-SE')} kcal per dag</strong>
          </div>
        </div>
      </div>

      {/* Result summary */}
      <div className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-white">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Calculator className="w-6 h-6" />
          <span className="text-sm font-medium uppercase tracking-wide opacity-90">
            Dagligt kaloriintag
          </span>
        </div>
        <div className="text-4xl font-bold text-center">
          {finalCalories.toLocaleString('sv-SE')} kcal
        </div>
        <div className="text-center text-amber-100 text-sm mt-2">
          per dag för att nå ditt mål
        </div>
      </div>

      <WizardNavigation
        onBack={previousStep}
        onNext={nextStep}
      />
    </div>
  );
}
