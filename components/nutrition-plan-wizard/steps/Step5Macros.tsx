'use client';

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import { Info } from 'lucide-react';

export function Step5Macros() {
  const {
    weight,
    dailyCalorieTarget, // Already has deficit applied from store
    proteinPerKg,
    fatPerKg,
    setMacroTargets,
    recalculateMetabolism,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // dailyCalorieTarget already includes deficit from store
  const actualCalorieTarget = dailyCalorieTarget;

  // Calculate macros based on actual calorie target
  const proteinGrams = Math.round(weight * proteinPerKg);
  const fatGrams = Math.round(weight * fatPerKg);
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;
  const remainingCalories = actualCalorieTarget - proteinCalories - fatCalories;
  const carbGrams = Math.max(0, Math.round(remainingCalories / 4));

  // Recalculate when protein changes
  useEffect(() => {
    setMacroTargets(proteinPerKg, fatPerKg);
    recalculateMetabolism();
  }, [proteinPerKg, fatPerKg, setMacroTargets, recalculateMetabolism]);

  const handleProteinChange = (value: number[]) => {
    setMacroTargets(value[0], fatPerKg);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Fördela makronutrienter
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Ställ in proteinmål och se fördelningen
        </p>
      </div>

      {/* Info box - energy values */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <strong>Energivärden:</strong> Protein 4 kcal/g, Kolhydrater 4 kcal/g, Fett 9 kcal/g
        </div>
      </div>

      {/* Protein slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Protein per kg kroppsvikt</Label>
          <span className="text-lg font-bold text-amber-600">
            {proteinPerKg.toFixed(1)}g/kg
          </span>
        </div>
        <Slider
          value={[proteinPerKg]}
          onValueChange={handleProteinChange}
          min={1.6}
          max={2.5}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1.6g/kg</span>
          <span>2.5g/kg</span>
        </div>
      </div>

      {/* Standard distribution info */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
        <div className="text-sm font-medium text-gray-700 mb-3">Standardfördelning:</div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Protein:</span>
          <span className="font-medium">{proteinPerKg.toFixed(1)}g per kg kroppsvikt</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Fett:</span>
          <span className="font-medium">{fatPerKg}g per kg kroppsvikt</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Kolhydrater:</span>
          <span className="font-medium">Resterande kalorier</span>
        </div>
      </div>

      {/* Calculated macros */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
          <div className="text-xs text-red-600 uppercase tracking-wide font-medium">
            Protein
          </div>
          <div className="text-2xl font-bold text-red-700 mt-1">
            {proteinGrams}g
          </div>
          <div className="text-xs text-red-500 mt-1">
            {proteinCalories} kcal
          </div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
          <div className="text-xs text-yellow-600 uppercase tracking-wide font-medium">
            Fett
          </div>
          <div className="text-2xl font-bold text-yellow-700 mt-1">
            {fatGrams}g
          </div>
          <div className="text-xs text-yellow-500 mt-1">
            {fatCalories} kcal
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
          <div className="text-xs text-green-600 uppercase tracking-wide font-medium">
            Kolhydrater
          </div>
          <div className="text-2xl font-bold text-green-700 mt-1">
            {carbGrams}g
          </div>
          <div className="text-xs text-green-500 mt-1">
            {carbGrams * 4} kcal
          </div>
        </div>
      </div>

      {/* Total calories check */}
      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
        <span className="text-sm text-amber-700">
          <strong>Totalt:</strong> {proteinCalories + fatCalories + (carbGrams * 4)} kcal / {actualCalorieTarget} kcal mål
        </span>
      </div>

      <WizardNavigation
        onBack={previousStep}
        onNext={nextStep}
      />
    </div>
  );
}
