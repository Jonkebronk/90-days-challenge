'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import type { Gender } from '@/lib/types/client-nutrition-plan';

export function Step4BodyDetails() {
  const {
    weight,
    height,
    age,
    gender,
    lbm,
    bmr,
    setBodyDetails,
    recalculateAll,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // Recalculate on mount
  useEffect(() => {
    recalculateAll();
  }, [recalculateAll]);

  const handleWeightChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setBodyDetails({ weight: num });
    }
  };

  const handleHeightChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setBodyDetails({ height: num });
    }
  };

  const handleAgeChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setBodyDetails({ age: num });
    }
  };

  const handleGenderChange = (value: Gender) => {
    setBodyDetails({ gender: value });
  };

  const isValid = weight >= 30 && height >= 100 && age >= 13;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Vikt, längd och ålder
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Ange uppgifter för Vikt, Längd och Ålder
        </p>
      </div>

      {/* Calculated values display */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Beräknad LBM
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {lbm > 0 ? `${lbm} kg` : '- kg'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Beräknad BMR
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {bmr > 0 ? `${bmr} kcal` : '- kcal'}
          </div>
        </div>
      </div>

      {/* Input fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Vikt</Label>
            <div className="relative">
              <Input
                id="weight"
                type="number"
                value={weight || ''}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder="0"
                min={30}
                max={300}
                step={0.1}
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                kg
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Längd</Label>
            <div className="relative">
              <Input
                id="height"
                type="number"
                value={height || ''}
                onChange={(e) => handleHeightChange(e.target.value)}
                placeholder="0"
                min={100}
                max={250}
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                cm
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Kön</Label>
          <Select value={gender} onValueChange={handleGenderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Välj kön..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Man</SelectItem>
              <SelectItem value="female">Kvinna</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Ålder</Label>
          <div className="relative">
            <Input
              id="age"
              type="number"
              value={age || ''}
              onChange={(e) => handleAgeChange(e.target.value)}
              placeholder="0"
              min={13}
              max={100}
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              år
            </span>
          </div>
        </div>
      </div>

      <WizardNavigation
        onBack={previousStep}
        onNext={nextStep}
        isNextDisabled={!isValid}
      />
    </div>
  );
}
