'use client';

import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import { cn } from '@/lib/utils';

interface DayTypeOption {
  id: 'training' | 'non_training';
  title: string;
  description: string;
}

const dayTypes: DayTypeOption[] = [
  {
    id: 'non_training',
    title: 'Vilodagar',
    description: 'Dagar utan träning',
  },
  {
    id: 'training',
    title: 'Träningsdagar',
    description: 'Dagar med träning',
  },
];

export function Step8TrainingDays() {
  const {
    hasTrainingDays,
    hasNonTrainingDays,
    setTrainingDays,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  const toggleDayType = (type: 'training' | 'non_training') => {
    if (type === 'training') {
      setTrainingDays(!hasTrainingDays, hasNonTrainingDays);
    } else {
      setTrainingDays(hasTrainingDays, !hasNonTrainingDays);
    }
  };

  const isSelected = (type: 'training' | 'non_training') => {
    return type === 'training' ? hasTrainingDays : hasNonTrainingDays;
  };

  // At least one must be selected
  const isValid = hasTrainingDays || hasNonTrainingDays;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Träningsdagar</h2>
        <p className="text-sm text-gray-600 mt-1">
          Detta hjälper till att informera deras makroplan
        </p>
      </div>

      <div className="space-y-3">
        {dayTypes.map((type) => (
          <Card
            key={type.id}
            onClick={() => toggleDayType(type.id)}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md',
              isSelected(type.id)
                ? 'border-2 border-amber-500 bg-amber-50'
                : 'border border-gray-200 hover:border-amber-300'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{type.title}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </div>
              {isSelected(type.id) ? (
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

      <p className="text-xs text-gray-500 text-center">
        Välj minst en dagstyp. Du kan välja båda för att ha olika makros på
        tränings- och vilodagar.
      </p>

      <WizardNavigation
        onBack={previousStep}
        onNext={nextStep}
        isNextDisabled={!isValid}
      />
    </div>
  );
}
