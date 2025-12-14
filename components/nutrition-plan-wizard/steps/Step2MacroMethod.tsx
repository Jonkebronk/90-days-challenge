'use client';

import { Card } from '@/components/ui/card';
import { Calculator, Sliders, Check, Activity } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import type { CalculationMethod } from '@/lib/types/client-nutrition-plan';
import { cn } from '@/lib/utils';

interface MethodOption {
  value: CalculationMethod;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const methods: MethodOption[] = [
  {
    value: 'automatic',
    title: 'Automatisk',
    description:
      'Beräkna makros baserat på klientens uppgifter och energibehov',
    icon: <Calculator className="w-6 h-6" />,
  },
  {
    value: 'metabolism',
    title: 'Beräkna ämnesomsättning',
    description: 'Enkel beräkning baserad på kroppsvikt och aktivitetsnivå',
    icon: <Activity className="w-6 h-6" />,
  },
  {
    value: 'manual',
    title: 'Manuell',
    description: 'Ställ in egna mål för protein, kolhydrater och fett manuellt',
    icon: <Sliders className="w-6 h-6" />,
  },
];

export function Step2MacroMethod() {
  const {
    calculationMethod,
    setCalculationMethod,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Makroberäkningsmetod
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Ange om du vill att vi ska beräkna makros automatiskt eller om du vill
          ställa in dem manuellt
        </p>
      </div>

      <div className="space-y-3">
        {methods.map((method) => (
          <Card
            key={method.value}
            onClick={() => setCalculationMethod(method.value)}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md',
              calculationMethod === method.value
                ? 'border-2 border-amber-500 bg-amber-50'
                : 'border border-gray-200 hover:border-amber-300'
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                  calculationMethod === method.value
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {method.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{method.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {method.description}
                </div>
              </div>
              {calculationMethod === method.value && (
                <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
              )}
            </div>
          </Card>
        ))}
      </div>

      <WizardNavigation onBack={previousStep} onNext={nextStep} />
    </div>
  );
}
