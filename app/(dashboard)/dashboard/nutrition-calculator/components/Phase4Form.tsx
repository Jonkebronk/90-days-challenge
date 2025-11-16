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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePhase4Form } from '@/lib/hooks/usePhaseForm';
import { useNutritionCalculations } from '@/lib/hooks/useNutritionCalculations';
import { useNutritionStore } from '@/lib/stores/nutrition-calculator-store';
import { ActivityLevel, CardioOption } from '@/lib/types/nutrition';
import { ArrowLeft } from 'lucide-react';

interface Phase4FormProps {
  onNext?: () => void;
  onBack?: () => void;
}

export function Phase4Form({ onNext, onBack }: Phase4FormProps) {
  const { calculatePhase4Data } = useNutritionCalculations();
  const setPhase4Data = useNutritionStore((state) => state.setPhase4Data);
  const phase3Data = useNutritionStore((state) => state.phase3Data);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = usePhase4Form() as any;

  // Watch form values for real-time calculation
  const weight = watch('weight');
  const activity = watch('activity');
  const activityAdjustment = watch('activityAdjustment') || 0;
  const cardioOption = watch('cardioOption');

  // Auto-calculate when inputs change
  useEffect(() => {
    const weightNum = Number(weight);
    const activityNum = Number(activity);
    const activityAdjustmentNum = Number(activityAdjustment);
    const cardioOptionNum = Number(cardioOption);

    if (weightNum > 0 && activityNum && cardioOptionNum && phase3Data) {
      const calculated = calculatePhase4Data(
        phase3Data.steps,
        weightNum,
        activityNum as ActivityLevel,
        activityAdjustmentNum,
        cardioOptionNum as CardioOption
      );

      // Update calculated fields - convert to strings for consistency
      setValue('steps', calculated.steps.toString());
      setValue('calories', calculated.calories.toString());
      setValue('protein', calculated.protein.toString());
      setValue('fat', calculated.fat.toString());
      setValue('carbs', calculated.carbs.toString());
      if (calculated.cardioMinutes) {
        setValue('cardioMinutes', calculated.cardioMinutes.toString());
      }
      setValue('cardioDescription', calculated.cardioDescription);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weight, activity, activityAdjustment, cardioOption, phase3Data]);

  const onSubmit = handleSubmit((data: any) => {
    if (!phase3Data) return;

    // Calculate with schema - convert strings to numbers
    const fullData = calculatePhase4Data(
      phase3Data.steps,
      Number(data.weight),
      Number(data.activity) as ActivityLevel,
      Number(data.activityAdjustment),
      Number(data.cardioOption) as CardioOption
    );
    setPhase4Data(fullData);

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

  if (!phase3Data) {
    return (
      <Card className="bg-gray-900/40 border-[rgba(255,215,0,0.3)]">
        <CardContent className="pt-6">
          <p className="text-gray-400">Du måste slutföra Fas 3 först.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/40 border-[rgba(255,215,0,0.3)]">
      <CardHeader>
        <CardTitle className="text-white">Fas 4: Din Nya Vardag (Underhåll)</CardTitle>
        <CardDescription className="text-gray-400">
          Hållbart långsiktigt underhåll - inga viktminskningskalorier
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-white">
                Målvikt (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                {...register('weight')}
                className="bg-gray-900/60 border-[rgba(255,215,0,0.3)] text-white"
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
                    <SelectTrigger className="bg-gray-900/60 border-[rgba(255,215,0,0.3)] text-white">
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

            {/* Activity Adjustment */}
            <div className="space-y-2">
              <Label htmlFor="activityAdjustment" className="text-white">
                Aktivitetsjustering (-10 till +10)
              </Label>
              <Input
                id="activityAdjustment"
                type="number"
                {...register('activityAdjustment')}
                className="bg-gray-900/60 border-[rgba(255,215,0,0.3)] text-white"
              />
              {errors.activityAdjustment && (
                <p className="text-sm text-red-400">{errors.activityAdjustment.message}</p>
              )}
            </div>
          </div>

          {/* Cardio Options */}
          <div className="border border-[rgba(255,215,0,0.3)] bg-gray-900/40 p-4 rounded-lg">
            <Label className="text-white text-lg mb-3 block">Välj Cardio-alternativ</Label>
            <Controller
              name="cardioOption"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={String(field.value || 1)}
                  onValueChange={(value) => field.onChange(Number(value) as CardioOption)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,215,0,0.05)]">
                      <RadioGroupItem value="1" id="option-1" className="mt-1" />
                      <Label htmlFor="option-1" className="flex-1 cursor-pointer">
                        <div className="font-semibold text-white">Alternativ 1: Med Cardio</div>
                        <div className="text-gray-400 text-sm">
                          12 intervallvarv efter styrketräning, minska steg med 30%
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,215,0,0.05)]">
                      <RadioGroupItem value="2" id="option-2" className="mt-1" />
                      <Label htmlFor="option-2" className="flex-1 cursor-pointer">
                        <div className="font-semibold text-white">Alternativ 2: Utan Cardio</div>
                        <div className="text-gray-400 text-sm">
                          Ingen cardio, behåll stegmålet från Fas 3
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.cardioOption && (
              <p className="text-sm text-red-400 mt-2">{errors.cardioOption.message}</p>
            )}
          </div>

          {/* Calculated Results */}
          {calories && (
            <div className="space-y-4">
              <div className="border border-[rgba(255,215,0,0.3)] bg-gray-900/40 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#FFD700] mb-3">
                  Underhållsmakron
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

              {/* Activity Summary */}
              <div className="border border-[rgba(255,215,0,0.3)] bg-gray-900/40 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#FFD700] mb-3">
                  Din Nya Vardag
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-400">Dagliga steg:</p>
                    <p className="text-white font-bold">
                      {steps?.toLocaleString('sv-SE')}
                      {cardioOption === 1 && (
                        <span className="text-yellow-400 ml-2">
                          (-{Math.round((phase3Data.steps - steps!) / phase3Data.steps * 100)}%)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between items-start">
                    <p className="text-gray-400">Cardio:</p>
                    <div className="text-right">
                      {cardioMinutes ? (
                        <>
                          <p className="text-white font-bold">{cardioMinutes} min</p>
                          <p className="text-gray-300 text-sm max-w-xs">{cardioDescription}</p>
                        </>
                      ) : (
                        <p className="text-gray-300">{cardioDescription}</p>
                      )}
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
              Tillbaka till Fas 3
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              Slutför Plan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
