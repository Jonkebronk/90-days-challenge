'use client';

import { Card } from '@/components/ui/card';
import { Check, TrendingDown, TrendingUp, Minus, AlertCircle } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import {
  CalorieGoal,
  CALORIE_GOAL_CONFIG,
} from '@/lib/types/client-nutrition-plan';
import { cn } from '@/lib/utils';

// Group goals by type for display
const deficitOptions: CalorieGoal[] = ['conservative', 'moderate', 'aggressive'];
const maintenanceOptions: CalorieGoal[] = ['maintenance'];
const surplusOptions: CalorieGoal[] = ['surplus'];

export function Step3FatLossRate() {
  const {
    fatLossRate,
    dailyCalorieTarget,
    setFatLossRate,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  const getTargetCalories = (goal: CalorieGoal) => {
    const adjustment = CALORIE_GOAL_CONFIG[goal].adjustmentPerDay;
    return Math.max(1200, dailyCalorieTarget + adjustment);
  };

  const getIcon = (goalType: 'deficit' | 'maintenance' | 'surplus') => {
    switch (goalType) {
      case 'deficit':
        return TrendingDown;
      case 'maintenance':
        return Minus;
      case 'surplus':
        return TrendingUp;
    }
  };

  const getIconColor = (goalType: 'deficit' | 'maintenance' | 'surplus', isSelected: boolean) => {
    if (isSelected) return 'bg-amber-500 text-white';
    switch (goalType) {
      case 'deficit':
        return 'bg-blue-100 text-blue-500';
      case 'maintenance':
        return 'bg-gray-100 text-gray-500';
      case 'surplus':
        return 'bg-green-100 text-green-500';
    }
  };

  const renderGoalCard = (goal: CalorieGoal) => {
    const config = CALORIE_GOAL_CONFIG[goal];
    const Icon = getIcon(config.goalType);
    const isSelected = fatLossRate === goal;

    return (
      <Card
        key={goal}
        onClick={() => setFatLossRate(goal)}
        className={cn(
          'p-4 cursor-pointer transition-all hover:shadow-md',
          isSelected
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
                  getIconColor(config.goalType, isSelected)
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="font-semibold text-gray-900">
                {config.label}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {config.description}
            </div>
            {config.goalType === 'deficit' && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-100 rounded px-2 py-1">
                  <span className="text-gray-500">Underskott/vecka:</span>{' '}
                  <span className="font-medium text-gray-700">
                    {Math.abs(config.adjustmentPerWeek).toLocaleString('sv-SE')} kcal
                  </span>
                </div>
                <div className="bg-gray-100 rounded px-2 py-1">
                  <span className="text-gray-500">Underskott/dag:</span>{' '}
                  <span className="font-medium text-gray-700">
                    {Math.abs(config.adjustmentPerDay)} kcal
                  </span>
                </div>
              </div>
            )}
            {config.goalType === 'surplus' && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-100 rounded px-2 py-1">
                  <span className="text-green-600">Överskott/vecka:</span>{' '}
                  <span className="font-medium text-green-700">
                    {config.adjustmentPerWeek.toLocaleString('sv-SE')} kcal
                  </span>
                </div>
                <div className="bg-green-100 rounded px-2 py-1">
                  <span className="text-green-600">Överskott/dag:</span>{' '}
                  <span className="font-medium text-green-700">
                    +{config.adjustmentPerDay} kcal
                  </span>
                </div>
              </div>
            )}
            {isSelected && dailyCalorieTarget > 0 && (
              <div className="mt-2 p-2 bg-amber-100 rounded text-sm">
                <span className="text-amber-700">
                  Målkalorier: <strong>{getTargetCalories(goal)} kcal/dag</strong>
                </span>
                {config.adjustmentPerDay !== 0 && (
                  <span className="text-amber-600 text-xs ml-2">
                    ({dailyCalorieTarget} {config.adjustmentPerDay > 0 ? '+' : ''}{config.adjustmentPerDay})
                  </span>
                )}
              </div>
            )}
          </div>
          {isSelected && (
            <Check className="w-5 h-5 text-amber-500 flex-shrink-0 ml-2" />
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Välj mål
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Välj om din klient ska gå ner, behålla eller gå upp i vikt
        </p>
      </div>

      {/* Deficit options */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Viktminskning</h3>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <strong>Kom ihåg:</strong> 1 kg kroppsfett = 7 700 kcal
          </div>
        </div>

        {deficitOptions.map(renderGoalCard)}
      </div>

      {/* Maintenance option */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Minus className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Balans</h3>
        </div>
        {maintenanceOptions.map(renderGoalCard)}
      </div>

      {/* Surplus option */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Viktuppgång</h3>
        </div>
        {surplusOptions.map(renderGoalCard)}
      </div>

      <WizardNavigation
        onBack={previousStep}
        onNext={nextStep}
        isNextDisabled={!fatLossRate}
      />
    </div>
  );
}
