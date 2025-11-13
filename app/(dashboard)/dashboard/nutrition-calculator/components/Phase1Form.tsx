'use client';

import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePhase1Form } from '@/lib/hooks/usePhaseForm';
import { useNutritionCalculations } from '@/lib/hooks/useNutritionCalculations';
import { useNutritionStore } from '@/lib/stores/nutrition-calculator-store';
import { ActivityLevel } from '@/lib/types/nutrition';

interface Phase1FormProps {
  onNext?: () => void;
}

export function Phase1Form({ onNext }: Phase1FormProps) {
  const { calculatePhase1Data } = useNutritionCalculations();
  const setPhase1Data = useNutritionStore((state) => state.setPhase1Data);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = usePhase1Form() as any;

  // Watch form values for real-time calculation
  const weight = watch('weight');
  const activity = watch('activity');
  const weightLoss = watch('weightLoss');
  const steps = watch('steps');

  // Auto-calculate when inputs change
  useEffect(() => {
    // Convert to numbers and check if all required values are present
    const weightNum = Number(weight);
    const activityNum = Number(activity);
    const weightLossNum = Number(weightLoss);
    const stepsNum = Number(steps);

    if (weightNum > 0 && activityNum && weightLossNum >= 0 && stepsNum > 0) {
      const calculated = calculatePhase1Data(
        weightNum,
        activityNum as ActivityLevel,
        weightLossNum,
        stepsNum
      );

      // Update calculated fields - convert to strings for consistency
      setValue('calories', calculated.calories.toString());
      setValue('protein', calculated.protein.toString());
      setValue('fat', calculated.fat.toString());
      setValue('carbs', calculated.carbs.toString());
    }
  }, [weight, activity, weightLoss, steps, calculatePhase1Data, setValue]);

  const onSubmit = handleSubmit((data: any) => {
    // Calculate with schema - convert strings to numbers
    const fullData = calculatePhase1Data(
      Number(data.weight),
      data.activity,
      Number(data.weightLoss),
      Number(data.steps)
    );
    setPhase1Data(fullData);

    if (onNext) {
      onNext();
    }
  });

  const calories = watch('calories');
  const protein = watch('protein');
  const fat = watch('fat');
  const carbs = watch('carbs');

  return (
    <Card className="bg-black/40 border-[rgba(255,215,0,0.3)]">
      <CardHeader>
        <CardTitle className="text-white">Fas 1: Basberäkningar</CardTitle>
        <CardDescription className="text-gray-400">
          Utgångsläge med grundkalori, stegmål och eventuellt underskott
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-white">
                Vikt (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                {...register('weight')}
                className="bg-black/60 border-[rgba(255,215,0,0.3)] text-white"
              />
              {errors.weight && (
                <p className="text-sm text-red-400">{errors.weight.message}</p>
              )}
            </div>

            {/* Activity Level */}
            <div className="space-y-2">
              <Label htmlFor="activity" className="text-white">
                Aktivitetsnivå
              </Label>
              <Controller
                name="activity"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value || 30)}
                    onValueChange={(value) => field.onChange(Number(value) as ActivityLevel)}
                  >
                    <SelectTrigger className="bg-black/60 border-[rgba(255,215,0,0.3)] text-white">
                      <SelectValue placeholder="Välj nivå" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 - Låg aktivitet</SelectItem>
                      <SelectItem value="30">30 - Måttlig aktivitet</SelectItem>
                      <SelectItem value="35">35 - Hög aktivitet</SelectItem>
                      <SelectItem value="40">40 - Mycket hög aktivitet</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.activity && (
                <p className="text-sm text-red-400">{errors.activity.message}</p>
              )}
            </div>

            {/* Weight Loss Deficit */}
            <div className="space-y-2">
              <Label htmlFor="weightLoss" className="text-white">
                Viktminskningsunderskott (kcal)
              </Label>
              <Input
                id="weightLoss"
                type="number"
                {...register('weightLoss')}
                className="bg-black/60 border-[rgba(255,215,0,0.3)] text-white"
              />
              {errors.weightLoss && (
                <p className="text-sm text-red-400">{errors.weightLoss.message}</p>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <Label htmlFor="steps" className="text-white">
                Dagliga steg
              </Label>
              <Input
                id="steps"
                type="number"
                {...register('steps')}
                className="bg-black/60 border-[rgba(255,215,0,0.3)] text-white"
              />
              {errors.steps && (
                <p className="text-sm text-red-400">{errors.steps.message}</p>
              )}
            </div>
          </div>

          {/* Calculated Results */}
          {calories && (
            <div className="border border-[rgba(255,215,0,0.3)] bg-black/40 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-[#FFD700] mb-3">
                Beräknade Makron
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Kalorier</p>
                  <p className="text-white text-xl font-bold">{calories} kcal</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Protein</p>
                  <p className="text-white text-xl font-bold">{protein}g</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Fett</p>
                  <p className="text-white text-xl font-bold">{fat}g</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Kolhydrater</p>
                  <p className="text-white text-xl font-bold">{carbs}g</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              Spara och fortsätt till Fas 2
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
