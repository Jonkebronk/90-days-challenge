'use client';

import { Card } from '@/components/ui/card';
import { Scale, Check } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import type { CalculationType } from '@/lib/types/client-nutrition-plan';
import { cn } from '@/lib/utils';

interface TypeOption {
  value: CalculationType;
  title: string;
  description: string;
}

const calculationTypes: TypeOption[] = [
  {
    value: 'weight_height_age',
    title: 'Vikt, Längd och Ålder',
    description: 'Uppskatta med hjälp av klientens vikt, längd och ålder',
  },
  // Future options can be added here:
  // { value: 'body_fat', title: 'Vikt och Kroppsfett', description: '...' },
  // { value: 'dexa_scan', title: 'DEXA-scanning', description: '...' },
];

export function Step3CalculationType() {
  const {
    calculationMethod,
    calculationType,
    setCalculationType,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // Skip this step if manual calculation method
  if (calculationMethod === 'manual') {
    nextStep();
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Beräkningsmetod</h2>
        <p className="text-sm text-gray-600 mt-1">
          Välj vilken beräkningsmetod som ska användas
        </p>
      </div>

      <div className="space-y-3">
        {calculationTypes.map((type) => (
          <Card
            key={type.value}
            onClick={() => setCalculationType(type.value)}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md',
              calculationType === type.value
                ? 'border-2 border-amber-500 bg-amber-50'
                : 'border border-gray-200 hover:border-amber-300'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    calculationType === type.value
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{type.title}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
              </div>
              {calculationType === type.value ? (
                <Check className="w-5 h-5 text-amber-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
            </div>
          </Card>
        ))}
      </div>

      <WizardNavigation onBack={previousStep} onNext={nextStep} />
    </div>
  );
}
