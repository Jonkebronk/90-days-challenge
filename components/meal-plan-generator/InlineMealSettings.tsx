'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Utensils, Check, X, Loader2 } from 'lucide-react';
import type { DistributionMethod } from '@/lib/types/meal-plan-generator';

interface InlineMealSettingsProps {
  mealsPerDay: number;
  workoutTime: string;
  nutritionSystem: string;
  distributionMethod: DistributionMethod;
  onSave: (settings: {
    mealsPerDay: number;
    workoutTime: string;
    nutritionSystem: string;
    distributionMethod: DistributionMethod;
  }) => Promise<void>;
  disabled?: boolean;
}

const WORKOUT_TIME_OPTIONS = [
  { value: 'morning', label: 'Morgon' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'afternoon', label: 'Eftermiddag' },
  { value: 'evening', label: 'Kväll' },
];

const NUTRITION_SYSTEM_OPTIONS = [
  { value: 'low_carb', label: 'Lågkolhydrat' },
  { value: 'balanced', label: 'Balanserad' },
  { value: 'high_carb', label: 'Högkolhydrat' },
  { value: 'carb_cycling', label: 'Kolhydratcykling' },
];

const MEALS_PER_DAY_OPTIONS = [
  { value: '3', label: '3 måltider' },
  { value: '4', label: '4 måltider' },
  { value: '5', label: '5 måltider' },
  { value: '6', label: '6 måltider' },
];

const DISTRIBUTION_OPTIONS = [
  { value: 'auto', label: 'Automatisk' },
  { value: 'even', label: 'Jämn fördelning' },
  { value: 'custom', label: 'Anpassad' },
];

export function InlineMealSettings({
  mealsPerDay,
  workoutTime,
  nutritionSystem,
  distributionMethod,
  onSave,
  disabled = false,
}: InlineMealSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local edit state
  const [editMeals, setEditMeals] = useState(String(mealsPerDay));
  const [editWorkout, setEditWorkout] = useState(workoutTime);
  const [editNutrition, setEditNutrition] = useState(nutritionSystem);
  const [editDistribution, setEditDistribution] = useState<DistributionMethod>(distributionMethod);

  const handleStartEdit = () => {
    setEditMeals(String(mealsPerDay));
    setEditWorkout(workoutTime);
    setEditNutrition(nutritionSystem);
    setEditDistribution(distributionMethod);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        mealsPerDay: parseInt(editMeals),
        workoutTime: editWorkout,
        nutritionSystem: editNutrition,
        distributionMethod: editDistribution,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getLabel = (value: string, options: { value: string; label: string }[]) => {
    return options.find(o => o.value === value)?.label || value;
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Måltidsinställningar
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="text-green-600 hover:text-green-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Meals per day */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Antal måltider</label>
            <Select value={editMeals} onValueChange={setEditMeals}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEALS_PER_DAY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Workout time */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Träningstid</label>
            <Select value={editWorkout} onValueChange={setEditWorkout}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TIME_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nutrition system */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Näringssystem</label>
            <Select value={editNutrition} onValueChange={setEditNutrition}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUTRITION_SYSTEM_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Distribution method */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fördelningsmetod</label>
            <Select
              value={editDistribution}
              onValueChange={(v) => setEditDistribution(v as DistributionMethod)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISTRIBUTION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={disabled ? undefined : handleStartEdit}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          Måltidsinställningar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Antal måltider</span>
            <p className="font-medium">{mealsPerDay}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Träningstid</span>
            <p className="font-medium">{getLabel(workoutTime, WORKOUT_TIME_OPTIONS)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Näringssystem</span>
            <p className="font-medium">{getLabel(nutritionSystem, NUTRITION_SYSTEM_OPTIONS)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Fördelning</span>
            <p className="font-medium">{getLabel(distributionMethod, DISTRIBUTION_OPTIONS)}</p>
          </div>
        </div>
        {!disabled && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Klicka för att redigera
          </p>
        )}
      </CardContent>
    </Card>
  );
}
