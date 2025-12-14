'use client';

import { Card } from '@/components/ui/card';
import { Check, TrendingDown, AlertCircle } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import {
  FatLossRate,
  FAT_LOSS_RATE_CONFIG,
} from '@/lib/types/client-nutrition-plan';
import { cn } from '@/lib/utils';

const rateOptions: FatLossRate[] = ['conservative', 'moderate', 'aggressive'];

export function Step3FatLossRate() {
  const {
    fatLossRate,
    dailyCalorieTarget,
    setFatLossRate,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  const getTargetCalories = (rate: FatLossRate) => {
    const deficit = FAT_LOSS_RATE_CONFIG[rate].deficitPerDay;
    return Math.max(1200, dailyCalorieTarget - deficit);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Välj tempo för fettförlust
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Välj hur snabbt din klient ska gå ner i vikt
        </p>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <strong>Kom ihåg:</strong> 1 kg kroppsfett = 7 700 kcal
        </div>
      </div>

      {/* Rate options */}
      <div className="space-y-3">
        {rateOptions.map((rate) => {
          const config = FAT_LOSS_RATE_CONFIG[rate];
          const targetCals = getTargetCalories(rate);

          return (
            <Card
              key={rate}
              onClick={() => setFatLossRate(rate)}
              className={cn(
                'p-4 cursor-pointer transition-all hover:shadow-md',
                fatLossRate === rate
                  ? 'border-2 border-amber-500 bg-amber-50'
                  : 'border border-gray-200 hover:border-amber-300'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        fatLossRate === rate
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-gray-900">
                      {config.label}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {config.description}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-100 rounded px-2 py-1">
                      <span className="text-gray-500">Underskott/vecka:</span>{' '}
                      <span className="font-medium text-gray-700">
                        {config.deficitPerWeek.toLocaleString('sv-SE')} kcal
                      </span>
                    </div>
                    <div className="bg-gray-100 rounded px-2 py-1">
                      <span className="text-gray-500">Underskott/dag:</span>{' '}
                      <span className="font-medium text-gray-700">
                        {config.deficitPerDay} kcal
                      </span>
                    </div>
                  </div>
                  {fatLossRate === rate && dailyCalorieTarget > 0 && (
                    <div className="mt-2 p-2 bg-amber-100 rounded text-sm">
                      <span className="text-amber-700">
                        Målkalorier: <strong>{targetCals} kcal/dag</strong>
                      </span>
                      <span className="text-amber-600 text-xs ml-2">
                        ({dailyCalorieTarget} - {config.deficitPerDay})
                      </span>
                    </div>
                  )}
                </div>
                {fatLossRate === rate && (
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0 ml-2" />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <WizardNavigation
        onBack={previousStep}
        onNext={nextStep}
        isNextDisabled={!fatLossRate}
      />
    </div>
  );
}
