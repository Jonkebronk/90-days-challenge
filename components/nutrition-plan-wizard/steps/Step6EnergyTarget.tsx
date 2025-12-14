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

// Preset options from reference
const presetOptions = [
  { value: -30, label: 'Baseline -30%' },
  { value: -25, label: 'Baseline -25%' },
  { value: -20, label: 'Baseline -20%' },
  { value: -15, label: 'Baseline -15%' },
  { value: -10, label: 'Baseline -10%' },
  { value: -5, label: 'Baseline -5%' },
  { value: 0, label: 'Baseline' },
  { value: 5, label: 'Baseline +5%' },
  { value: 10, label: 'Baseline +10%' },
  { value: 15, label: 'Baseline +15%' },
  { value: 20, label: 'Baseline +20%' },
  { value: 25, label: 'Baseline +25%' },
  { value: 30, label: 'Baseline +30%' },
];

// Training age recommendations from reference
const recommendations = [
  { age: 'Nybörjare (Ingen träning)', conservative: '+/-20%', moderate: '+/-25%', aggressive: '+/-30%' },
  { age: 'Novis (< 1 År träning)', conservative: '+/-15%', moderate: '+/-20%', aggressive: '+/-25%' },
  { age: 'Mellanliggande (1-2 År träning)', conservative: '+/-10%', moderate: '+/-15%', aggressive: '+/-20%' },
  { age: 'Avancerad (2-5 År träning)', conservative: '+/-5%', moderate: '+/-10%', aggressive: '+/-15%' },
  { age: 'Elit (>5 År träning)', conservative: '+/-5%', moderate: '+/-7.5%', aggressive: '+/-10%' },
];

export function Step6EnergyTarget() {
  const {
    tdee,
    dailyCalorieTarget,
    caloricAdjustmentPercent,
    setCaloricAdjustment,
    recalculateAll,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // Recalculate on mount
  useEffect(() => {
    recalculateAll();
  }, [recalculateAll]);

  const getLabel = () => {
    if (caloricAdjustmentPercent === 0) return 'Baseline';
    const sign = caloricAdjustmentPercent > 0 ? '+' : '';
    return `Baseline ${sign}${caloricAdjustmentPercent}%`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Dagligt energimål</h2>
        <p className="text-sm text-gray-600 mt-1">
          Ange målet för kaloriintag i procent
        </p>
      </div>

      {/* Calculation display */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-center gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 uppercase">Beräknad TDEE</div>
            <div className="text-lg font-bold">{tdee} kcal</div>
          </div>
          <div className="text-xl text-gray-400">×</div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Kalorimål</div>
            <div className="text-lg font-bold">
              {caloricAdjustmentPercent >= 0 ? '+' : ''}
              {caloricAdjustmentPercent}%
            </div>
          </div>
          <div className="text-xl text-gray-400">=</div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Energimål</div>
            <div className="text-lg font-bold text-amber-600">
              {dailyCalorieTarget} kcal
            </div>
          </div>
        </div>
      </Card>

      {/* Preset selector */}
      <div className="space-y-2">
        <Label>Kalorimål</Label>
        <Select
          value={caloricAdjustmentPercent.toString()}
          onValueChange={(value) => setCaloricAdjustment(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue>{getLabel()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Slider alternative */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>-30%</span>
          <span className="font-medium text-gray-900">{getLabel()}</span>
          <span>+30%</span>
        </div>
        <Slider
          value={[caloricAdjustmentPercent]}
          onValueChange={([value]) => setCaloricAdjustment(value)}
          min={-30}
          max={30}
          step={5}
          className="py-2"
        />
      </div>

      {/* Recommendations table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium text-gray-500">
                Träningsålder
              </th>
              <th className="text-center py-2 font-medium text-gray-500">
                Konservativ
              </th>
              <th className="text-center py-2 font-medium text-gray-500">
                Moderat
              </th>
              <th className="text-center py-2 font-medium text-gray-500">
                Aggressiv
              </th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rec, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2 text-gray-700">{rec.age}</td>
                <td className="text-center py-2 text-gray-600">
                  {rec.conservative}
                </td>
                <td className="text-center py-2 text-gray-600">
                  {rec.moderate}
                </td>
                <td className="text-center py-2 text-gray-600">
                  {rec.aggressive}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <WizardNavigation onBack={previousStep} onNext={nextStep} />
    </div>
  );
}
