'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Loader2,
} from 'lucide-react';
import { InlineMealSettings } from '@/components/meal-plan-generator/InlineMealSettings';
import type { MealConfig, DistributionMethod } from '@/lib/types/meal-plan-generator';
import { DEFAULT_MEAL_CONFIGS, generateDefaultMealConfigs } from '@/lib/types/meal-plan-generator';

interface NutritionPlan {
  id: string;
  name: string;
  status: string;
  calculationMethod: string;
  dailyCalorieTarget: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  proteinPerKg: number;
  fatPerKg: number;
  weight: number;
  mealsPerDay: number;
  workoutTime: string;
  nutritionSystem: string;
  createdAt: string;
  bmr: number;
  lifestyleActivity: string;
  calorieGoal: string | null;
  caloricAdjustmentPercent: number;
  client: {
    id: string;
    name: string;
    email: string;
  };
}


const WORKOUT_TIME_LABELS: Record<string, string> = {
  morning: 'Morgon',
  lunch: 'Lunch',
  afternoon: 'Eftermiddag',
  evening: 'Kväll',
};

const NUTRITION_SYSTEM_LABELS: Record<string, string> = {
  low_carb: 'Lågkolhydrat',
  balanced: 'Balanserad',
  high_carb: 'Högkolhydrat',
  carb_cycling: 'Kolhydratcykling',
};

const LIFESTYLE_ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Stillasittande',
  lightly_active: 'Lätt aktiv',
  moderately_active: 'Måttligt aktiv',
  very_active: 'Mycket aktiv',
  extremely_active: 'Extremt aktiv',
};

function getGoalLabel(calorieGoal: string | null, adjustment: number): string {
  // Check calorieGoal first (for metabolism method)
  if (calorieGoal) {
    if (calorieGoal === 'maintenance') return 'Balans';
    if (calorieGoal === 'surplus') return 'Viktuppgång';
    // aggressive, moderate, conservative are all weight loss
    if (['aggressive', 'moderate', 'conservative'].includes(calorieGoal)) return 'Viktnedgång';
  }
  // Fallback to adjustment (for other methods)
  if (adjustment === 0) return 'Balans';
  if (adjustment > 0) return 'Viktuppgång';
  return 'Viktnedgång';
}

export default function NutritionPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealConfigs, setMealConfigs] = useState<MealConfig[]>(DEFAULT_MEAL_CONFIGS);
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>('auto');
  const [workoutTime, setWorkoutTime] = useState<string>('afternoon');
  const [nutritionSystem, setNutritionSystem] = useState<string>('balanced');
  const [isRecreating, setIsRecreating] = useState(false);

  const planId = params.id as string;

  useEffect(() => {
    if (planId) {
      fetchPlan();
    }
  }, [planId]);

  const fetchPlan = async () => {
    try {
      // Fetch nutrition plan
      const response = await fetch(`/api/nutrition-plans/${planId}`);
      if (!response.ok) {
        throw new Error('Kunde inte hämta kostplanen');
      }
      const data = await response.json();
      setPlan(data);

      // Initialize settings from plan
      if (data.workoutTime) setWorkoutTime(data.workoutTime);
      if (data.nutritionSystem) setNutritionSystem(data.nutritionSystem);
      if (data.mealsPerDay) {
        // Use the generateDefaultMealConfigs helper
        const configs = generateDefaultMealConfigs(data.mealsPerDay);
        setMealConfigs(configs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  // Handle applying new meal settings from inline editor
  const handleSaveSettings = async (settings: {
    mealsPerDay: number;
    workoutTime: string;
    nutritionSystem: string;
    distributionMethod: DistributionMethod;
  }) => {
    if (!plan) return;

    setIsRecreating(true);
    try {
      // Update nutrition plan settings
      const updateResponse = await fetch(`/api/nutrition-plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealsPerDay: settings.mealsPerDay,
          workoutTime: settings.workoutTime,
          nutritionSystem: settings.nutritionSystem,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update nutrition plan');
      }

      // Update local state
      const newConfigs = generateDefaultMealConfigs(settings.mealsPerDay);
      setMealConfigs(newConfigs);
      setDistributionMethod(settings.distributionMethod);
      setWorkoutTime(settings.workoutTime);
      setNutritionSystem(settings.nutritionSystem);
    } catch (err) {
      console.error('Error updating meal settings:', err);
      throw err;
    } finally {
      setIsRecreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>
        <Card className="p-6 text-center">
          <p className="text-red-500">{error || 'Kostplanen hittades inte'}</p>
        </Card>
      </div>
    );
  }

  const targetMacros = {
    protein: plan.proteinGrams,
    carbs: plan.carbGrams,
    fat: plan.fatGrams,
    kcal: plan.dailyCalorieTarget,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{plan.name}</h1>
            <p className="text-sm text-muted-foreground">
              Skapad {new Date(plan.createdAt).toLocaleDateString('sv-SE')}
            </p>
          </div>
        </div>
        <Badge variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {plan.status === 'ACTIVE' ? 'Aktiv' : plan.status === 'DRAFT' ? 'Utkast' : 'Arkiverad'}
        </Badge>
      </div>

      {/* Single column layout - just the wizard sidebar */}
      <div className="max-w-md space-y-4">
        {/* Client info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Klient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Namn och email */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-700 font-semibold text-lg">
                  {plan.client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{plan.client.name}</p>
                <p className="text-sm text-muted-foreground">{plan.client.email}</p>
              </div>
            </div>

            <Separator />

            {/* Grunddata */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Vikt</span>
                <p className="font-medium">{plan.weight} kg</p>
              </div>
              <div>
                <span className="text-muted-foreground">Aktivitet</span>
                <p className="font-medium">{LIFESTYLE_ACTIVITY_LABELS[plan.lifestyleActivity] || plan.lifestyleActivity}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Mål</span>
                <p className="font-medium">{getGoalLabel(plan.calorieGoal, plan.caloricAdjustmentPercent)}</p>
              </div>
            </div>

            <Separator />

            {/* Kaloriberäkning */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Ämnesomsättning (BMR)</span>
                <p className="font-medium">{Math.round(plan.bmr)} kcal</p>
              </div>
              <div>
                <span className="text-muted-foreground">Dagligt kaloriintag</span>
                <p className="font-medium">{Math.round(plan.dailyCalorieTarget)} kcal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal settings - inline editable */}
        <InlineMealSettings
          mealsPerDay={mealConfigs.length}
          workoutTime={workoutTime}
          nutritionSystem={nutritionSystem}
          distributionMethod={distributionMethod}
          onSave={handleSaveSettings}
          disabled={isRecreating}
        />

        {/* Macro targets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Makromål</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Protein */}
            <div className="flex justify-between text-sm">
              <span className="text-red-500 font-medium">Protein</span>
              <span className="font-medium">{targetMacros.protein}g</span>
            </div>

            {/* Carbs */}
            <div className="flex justify-between text-sm">
              <span className="text-green-500 font-medium">Kolhydrater</span>
              <span className="font-medium">{targetMacros.carbs}g</span>
            </div>

            {/* Fat */}
            <div className="flex justify-between text-sm">
              <span className="text-amber-500 font-medium">Fett</span>
              <span className="font-medium">{targetMacros.fat}g</span>
            </div>

            {/* Calories */}
            <div className="flex justify-between text-sm">
              <span className="text-blue-500 font-medium">Kalorier</span>
              <span className="font-medium">{targetMacros.kcal} kcal</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
