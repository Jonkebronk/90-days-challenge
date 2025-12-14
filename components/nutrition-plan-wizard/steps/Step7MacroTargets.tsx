'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';

// Protein options (1.6 - 2.6 g/kg)
const proteinOptions = [
  { value: 1.6, label: '1.6g/kg' },
  { value: 1.8, label: '1.8g/kg' },
  { value: 2.0, label: '2.0g/kg' },
  { value: 2.2, label: '2.2g/kg' },
  { value: 2.4, label: '2.4g/kg' },
  { value: 2.6, label: '2.6g/kg' },
];

// Fat options (min 0.7 g/kg)
const fatOptions = [
  { value: 0.7, label: '0.7g/kg (Minimum)' },
  { value: 0.8, label: '0.8g/kg' },
  { value: 0.9, label: '0.9g/kg' },
  { value: 1.0, label: '1.0g/kg' },
  { value: 1.1, label: '1.1g/kg' },
  { value: 1.2, label: '1.2g/kg' },
];

// Age-based protein recommendations
const proteinRecommendations = [
  { age: '0-30', noDeficit: '1.8-2.2g/kg', deficit: '2.2-2.4g/kg' },
  { age: '35-45', noDeficit: '2.0-2.3g/kg', deficit: '2.4-2.6g/kg' },
  { age: '45-55', noDeficit: '2.2-2.4g/kg', deficit: '2.6-3.0g/kg' },
  { age: '55-65', noDeficit: '2.4-2.6g/kg', deficit: '3.0-3.2g/kg' },
  { age: '65+', noDeficit: '2.6-3.2g/kg', deficit: '3.2-3.6g/kg' },
];

export function Step7MacroTargets() {
  const {
    weight,
    dailyCalorieTarget,
    proteinPerKg,
    fatPerKg,
    proteinGrams,
    fatGrams,
    carbGrams,
    setMacroTargets,
    recalculateAll,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // Recalculate on mount
  useEffect(() => {
    recalculateAll();
  }, [recalculateAll]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Makronutrientmål</h2>
        <p className="text-sm text-gray-600 mt-1">
          Ställ in mål för protein, fett och kolhydrater
        </p>
      </div>

      {/* Macro summary */}
      <Card className="p-4 bg-gray-50">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xs text-gray-500 uppercase">Kalorier</div>
            <div className="text-lg font-bold">{dailyCalorieTarget}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Protein</div>
            <div className="text-lg font-bold text-pink-500">{proteinGrams}g</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Fett</div>
            <div className="text-lg font-bold text-amber-500">{fatGrams}g</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Kolhydrater</div>
            <div className="text-lg font-bold text-teal-500">{carbGrams}g</div>
          </div>
        </div>
      </Card>

      {/* Protein selector */}
      <div className="space-y-3">
        <div>
          <Label>Proteinmål (g/kg kroppsvikt)</Label>
          <p className="text-xs text-gray-500 mt-1">
            {weight} kg × {proteinPerKg}g/kg = {proteinGrams}g protein
          </p>
        </div>
        <Select
          value={proteinPerKg.toString()}
          onValueChange={(value) => setMacroTargets(parseFloat(value), fatPerKg)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {proteinOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Slider
          value={[proteinPerKg]}
          onValueChange={([value]) => setMacroTargets(value, fatPerKg)}
          min={1.6}
          max={2.6}
          step={0.1}
          className="py-2"
        />
      </div>

      {/* Fat selector */}
      <div className="space-y-3">
        <div>
          <Label>Fettmål (g/kg kroppsvikt)</Label>
          <p className="text-xs text-gray-500 mt-1">
            {weight} kg × {fatPerKg}g/kg = {fatGrams}g fett
          </p>
        </div>
        <Select
          value={fatPerKg.toString()}
          onValueChange={(value) =>
            setMacroTargets(proteinPerKg, parseFloat(value))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fatOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Slider
          value={[fatPerKg]}
          onValueChange={([value]) => setMacroTargets(proteinPerKg, value)}
          min={0.7}
          max={1.2}
          step={0.1}
          className="py-2"
        />
      </div>

      {/* Carbs display (auto-calculated) */}
      <div className="p-3 bg-teal-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-teal-700">
            Kolhydratsmål (resterande kalorier)
          </span>
          <span className="font-bold text-teal-700">{carbGrams}g</span>
        </div>
        <p className="text-xs text-teal-600 mt-1">
          Beräknas automatiskt från resterande kalorier efter protein och fett
        </p>
      </div>

      {/* Age recommendations */}
      <div className="mt-4 overflow-x-auto">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Proteinrekommendationer efter ålder
        </p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium text-gray-500">
                Åldersgrupp
              </th>
              <th className="text-center py-2 font-medium text-gray-500">
                Utan underskott
              </th>
              <th className="text-center py-2 font-medium text-gray-500">
                Med underskott
              </th>
            </tr>
          </thead>
          <tbody>
            {proteinRecommendations.map((rec, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2 text-gray-700">{rec.age}</td>
                <td className="text-center py-2 text-gray-600">
                  {rec.noDeficit}
                </td>
                <td className="text-center py-2 text-gray-600">{rec.deficit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <WizardNavigation onBack={previousStep} onNext={nextStep} />
    </div>
  );
}
