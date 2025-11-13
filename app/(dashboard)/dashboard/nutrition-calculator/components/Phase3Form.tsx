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
import { usePhase3Form } from '@/lib/hooks/usePhaseForm';
import { useNutritionCalculations } from '@/lib/hooks/useNutritionCalculations';
import { useNutritionStore } from '@/lib/stores/nutrition-calculator-store';
import { ActivityLevel } from '@/lib/types/nutrition';
import { ArrowLeft } from 'lucide-react';

interface Phase3FormProps {
  onNext?: () => void;
  onBack?: () => void;
}

export function Phase3Form({ onNext, onBack }: Phase3FormProps) {
  const { calculatePhase3Data } = useNutritionCalculations();
  const setPhase3Data = useNutritionStore((state) => state.setPhase3Data);
  const phase2Data = useNutritionStore((state) => state.phase2Data);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = usePhase3Form() as any;

  // Watch form values for real-time calculation
  const weight = watch('weight');
  const activity = watch('activity');
  const weightLoss = watch('weightLoss');

  // Auto-calculate when inputs change
  useEffect(() => {
    const weightNum = Number(weight);
    const activityNum = Number(activity);
    const weightLossNum = Number(weightLoss);

    if (weightNum > 0 && activityNum && weightLossNum >= 0 && phase2Data) {
      const calculated = calculatePhase3Data(
        phase2Data.steps,
        weightNum,
        activityNum as ActivityLevel,
        weightLossNum
      );

      // Update calculated fields - convert to strings for consistency
      setValue('steps', calculated.steps.toString());
      setValue('calories', calculated.calories.toString());
      setValue('protein', calculated.protein.toString());
      setValue('fat', calculated.fat.toString());
      setValue('carbs', calculated.carbs.toString());
      setValue('cardioMinutes', calculated.cardioMinutes.toString());
      setValue('cardioDescription', calculated.cardioDescription);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weight, activity, weightLoss, phase2Data]);

  const onSubmit = handleSubmit((data: any) => {
    if (!phase2Data) return;

    // Calculate with schema - convert strings to numbers
    const fullData = calculatePhase3Data(
      phase2Data.steps,
      Number(data.weight),
      Number(data.activity) as ActivityLevel,
      Number(data.weightLoss)
    );
    setPhase3Data(fullData);

    if (onNext) {
      onNext();
    }
  });

  const steps = watch('steps');
  const calories = watch('calories');
  const protein = watch('protein');
  const fat = watch('fat');
  const carbs = watch('carbs');
  const cardioMinutes = watch('cardioMinutes');
  const cardioDescription = watch('cardioDescription');

  if (!phase2Data) {
    return (
      <Card className="bg-black/40 border-[rgba(255,215,0,0.3)]">
        <CardContent className="pt-6">
          <p className="text-gray-400">Du måste slutföra Fas 2 först.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-[rgba(255,215,0,0.3)]">
      <CardHeader>
        <CardTitle className="text-white">Fas 3: Ramp Up 2</CardTitle>
        <CardDescription className="text-gray-400">
          +25% mer steg från Fas 2 och 20 min cardio (12 intervaller + 8 min steady state)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-white">
                Ny vikt (kg)
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
          </div>

          {/* Calculated Results */}
          {calories && (
            <div className="space-y-4">
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

              {/* Activity Updates */}
              <div className="border border-[rgba(255,215,0,0.3)] bg-black/40 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#FFD700] mb-3">
                  Aktivitetsuppdateringar
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-400">Dagliga steg:</p>
                    <p className="text-white font-bold">
                      {steps?.toLocaleString('sv-SE')}
                      <span className="text-green-400 ml-2">
                        (+{Math.round((steps! - phase2Data.steps) / phase2Data.steps * 100)}%)
                      </span>
                    </p>
                  </div>
                  <div className="flex justify-between items-start">
                    <p className="text-gray-400">Cardio:</p>
                    <div className="text-right">
                      <p className="text-white font-bold">{cardioMinutes} min</p>
                      <p className="text-gray-300 text-sm max-w-xs">{cardioDescription}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="bg-transparent border-[rgba(255,215,0,0.3)] text-white hover:bg-[rgba(255,215,0,0.1)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka till Fas 2
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              Spara och fortsätt till Fas 4
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
