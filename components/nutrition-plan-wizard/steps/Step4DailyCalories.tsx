'use client';

import { useEffect } from 'react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import { CALORIE_GOAL_CONFIG } from '@/lib/types/client-nutrition-plan';
import { Calculator } from 'lucide-react';

export function Step4DailyCalories() {
  const {
    tdee, // Metabolism before adjustment
    dailyCalorieTarget, // Already has adjustment applied
    fatLossRate,
    recalculateMetabolism,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // Recalculate on mount
  useEffect(() => {
    recalculateMetabolism();
  }, [recalculateMetabolism]);

  const config = fatLossRate ? CALORIE_GOAL_CONFIG[fatLossRate] : null;
  const adjustment = config?.adjustmentPerDay || 0;
  const goalType = config?.goalType || 'deficit';
  const metabolism = tdee;
  const finalCalories = dailyCalorieTarget;

  // Dynamic text based on goal type
  const getFormulaText = () => {
    switch (goalType) {
      case 'deficit':
        return 'Ämnesomsättning - Dagligt underskott = Dagligt kaloriintag';
      case 'maintenance':
        return 'Ämnesomsättning = Dagligt kaloriintag';
      case 'surplus':
        return 'Ämnesomsättning + Dagligt överskott = Dagligt kaloriintag';
    }
  };

  const getCalculationText = () => {
    switch (goalType) {
      case 'deficit':
        return `${metabolism.toLocaleString('sv-SE')} kcal - ${Math.abs(adjustment)} kcal = `;
      case 'maintenance':
        return `${metabolism.toLocaleString('sv-SE')} kcal = `;
      case 'surplus':
        return `${metabolism.toLocaleString('sv-SE')} kcal + ${adjustment} kcal = `;
    }
  };

  const getSubtitle = () => {
    switch (goalType) {
      case 'deficit':
        return 'Baserat på ämnesomsättning och valt underskott';
      case 'maintenance':
        return 'Baserat på din ämnesomsättning';
      case 'surplus':
        return 'Baserat på ämnesomsättning och valt överskott';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Beräkna dagligt kaloriintag
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {getSubtitle()}
        </p>
      </div>

      {/* Formula */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700">Formel:</div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-600 font-mono text-sm">
            {getFormulaText()}
          </div>
        </div>
      </div>

      {/* Example/Calculation */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700">Din beräkning:</div>
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-amber-800 font-mono text-lg text-center">
            {getCalculationText()}<strong>{finalCalories.toLocaleString('sv-SE')} kcal per dag</strong>
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
