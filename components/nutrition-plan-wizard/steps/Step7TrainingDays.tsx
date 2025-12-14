'use client';

import { Card } from '@/components/ui/card';
import { Check, Calendar, Dumbbell, Equal } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import { cn } from '@/lib/utils';

type MacroStrategy = 'same_all_days' | 'training_rest_days';

interface StrategyOption {
  value: MacroStrategy;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const strategies: StrategyOption[] = [
  {
    value: 'same_all_days',
    title: 'Samma makros alla dagar',
    description: 'Enklare att följa - samma mål varje dag oavsett träning',
    icon: <Equal className="w-6 h-6" />,
  },
  {
    value: 'training_rest_days',
    title: 'Träningsdagar & Vilodagar',
    description: 'Olika makros för träningsdagar och vilodagar för optimerad prestanda',
    icon: <Dumbbell className="w-6 h-6" />,
  },
];

export function Step7TrainingDays() {
  const {
    hasTrainingDays,
    hasNonTrainingDays,
    setTrainingDays,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // Determine current strategy based on state
  const currentStrategy: MacroStrategy =
    hasTrainingDays && hasNonTrainingDays ? 'training_rest_days' : 'same_all_days';

  const handleStrategyChange = (strategy: MacroStrategy) => {
    if (strategy === 'same_all_days') {
      setTrainingDays(false, false);
    } else {
      setTrainingDays(true, true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Träningsdagar
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Välj hur makros ska fördelas över veckan
        </p>
      </div>

      {/* Strategy selection */}
      <div className="space-y-3">
        {strategies.map((strategy) => (
          <Card
            key={strategy.value}
            onClick={() => handleStrategyChange(strategy.value)}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md',
              currentStrategy === strategy.value
                ? 'border-2 border-amber-500 bg-amber-50'
                : 'border border-gray-200 hover:border-amber-300'
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                  currentStrategy === strategy.value
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {strategy.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{strategy.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {strategy.description}
                </div>
              </div>
              {currentStrategy === strategy.value && (
                <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Info about selected strategy */}
      {currentStrategy === 'same_all_days' && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <strong>Samma makros varje dag</strong>
              <p className="mt-1">
                Din klient kommer att ha samma kalori- och makromål varje dag,
                vilket gör det enklare att planera och följa kosten.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStrategy === 'training_rest_days' && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <Dumbbell className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-700">
              <strong>Anpassade makros</strong>
              <p className="mt-1">
                Träningsdagar kan ha högre kolhydrater för energi,
                medan vilodagar fokuserar på återhämtning med anpassade makros.
              </p>
            </div>
          </div>
        </div>
      )}

      <WizardNavigation
        onBack={previousStep}
        onNext={nextStep}
      />
    </div>
  );
}
