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
  Calendar,
  Utensils,
  Loader2,
  Wand2,
  Settings2,
} from 'lucide-react';
import { MealPlanGenerator } from '@/components/meal-plan-generator';
import { MealSettingsEditor } from '@/components/meal-plan-generator/MealSettingsEditor';
import type { MealConfig, DistributionMethod } from '@/lib/types/meal-plan-generator';
import { DEFAULT_MEAL_CONFIGS } from '@/lib/types/meal-plan-generator';

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

interface ExistingMealPlan {
  id: string;
  meals: any[];
  targetMacros: any;
  actualMacros: any;
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
  const [existingMealPlan, setExistingMealPlan] = useState<ExistingMealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showSettingsEditor, setShowSettingsEditor] = useState(false);
  const [mealConfigs, setMealConfigs] = useState<MealConfig[]>(DEFAULT_MEAL_CONFIGS);
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>('auto');
  const [isRecreating, setIsRecreating] = useState(false);
  const [mealPlanKey, setMealPlanKey] = useState(0); // Force re-render of MealPlanGenerator

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

      // Check if meal plan exists
      const mealPlanResponse = await fetch(`/api/meal-plan/by-nutrition-plan/${planId}`);
      if (mealPlanResponse.ok) {
        const mealPlanData = await mealPlanResponse.json();
        if (mealPlanData) {
          setExistingMealPlan(mealPlanData);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  // Handle applying new meal settings
  const handleApplySettings = async (configs: MealConfig[], method: DistributionMethod) => {
    if (!plan) return;

    setIsRecreating(true);
    try {
      // Recreate meal plan with new settings
      const response = await fetch('/api/meal-plan/create-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutritionPlanId: plan.id,
          mealConfigs: configs,
          distributionMethod: method,
          forceRecreate: true,
        }),
      });

      if (response.ok) {
        const newPlan = await response.json();
        setExistingMealPlan(newPlan);
        setMealConfigs(configs);
        setDistributionMethod(method);
        setShowSettingsEditor(false);
        setMealPlanKey((prev) => prev + 1); // Force re-render
      }
    } catch (err) {
      console.error('Error recreating meal plan:', err);
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

  if (showGenerator) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => setShowGenerator(false)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till översikt
        </Button>
        <MealPlanGenerator
          nutritionPlanId={plan.id}
          targetMacros={targetMacros}
          onSave={() => setShowGenerator(false)}
          onCancel={() => setShowGenerator(false)}
        />
      </div>
    );
  }

  // Calculate actual macros from existing meal plan
  const actualMacros = existingMealPlan?.actualMacros || { protein: 0, carbs: 0, fat: 0, kcal: 0 };

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

      {/* Two-column layout on desktop */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left sidebar - sticky on desktop */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
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

          {/* Meal settings */}
          {showSettingsEditor ? (
            <MealSettingsEditor
              initialConfigs={mealConfigs}
              initialMethod={distributionMethod}
              dailyMacros={targetMacros}
              onApply={handleApplySettings}
              onCancel={() => setShowSettingsEditor(false)}
            />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Utensils className="h-5 w-5" />
                    Måltidsinställningar
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettingsEditor(true)}
                    disabled={isRecreating}
                  >
                    <Settings2 className="h-4 w-4 mr-1" />
                    Redigera
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Måltider per dag</span>
                    <p className="font-medium">{mealConfigs.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Träningstid</span>
                    <p className="font-medium">
                      {WORKOUT_TIME_LABELS[plan.workoutTime] || plan.workoutTime}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Näringssystem</span>
                    <p className="font-medium">
                      {NUTRITION_SYSTEM_LABELS[plan.nutritionSystem] || plan.nutritionSystem}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Macro overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Makroöversikt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Protein */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-500 font-medium">Protein</span>
                  <span>
                    {actualMacros.protein.toFixed(1)}g / {targetMacros.protein}g{' '}
                    <span className={actualMacros.protein >= targetMacros.protein ? 'text-green-500' : 'text-red-500'}>
                      ({actualMacros.protein >= targetMacros.protein ? '+' : ''}{(actualMacros.protein - targetMacros.protein).toFixed(1)}g)
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (actualMacros.protein / targetMacros.protein) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-500 font-medium">Kolhydrater</span>
                  <span>
                    {actualMacros.carbs.toFixed(1)}g / {targetMacros.carbs}g{' '}
                    <span className={actualMacros.carbs >= targetMacros.carbs ? 'text-green-500' : 'text-red-500'}>
                      ({actualMacros.carbs >= targetMacros.carbs ? '+' : ''}{(actualMacros.carbs - targetMacros.carbs).toFixed(1)}g)
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (actualMacros.carbs / targetMacros.carbs) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-500 font-medium">Fett</span>
                  <span>
                    {actualMacros.fat.toFixed(1)}g / {targetMacros.fat}g{' '}
                    <span className={actualMacros.fat >= targetMacros.fat ? 'text-green-500' : 'text-red-500'}>
                      ({actualMacros.fat >= targetMacros.fat ? '+' : ''}{(actualMacros.fat - targetMacros.fat).toFixed(1)}g)
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (actualMacros.fat / targetMacros.fat) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Calories */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-500 font-medium">Kalorier</span>
                  <span>
                    {actualMacros.kcal.toFixed(0)}kcal / {targetMacros.kcal}kcal{' '}
                    <span className={actualMacros.kcal >= targetMacros.kcal ? 'text-green-500' : 'text-red-500'}>
                      ({actualMacros.kcal >= targetMacros.kcal ? '+' : ''}{(actualMacros.kcal - targetMacros.kcal).toFixed(0)}kcal)
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (actualMacros.kcal / targetMacros.kcal) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right content - Meal Plan */}
        <div className="flex-1 min-w-0">
          {existingMealPlan ? (
            /* Show existing meal plan */
            <MealPlanGenerator
              key={mealPlanKey}
              nutritionPlanId={plan.id}
              targetMacros={targetMacros}
              onSave={() => {}}
              onCancel={() => {}}
            />
          ) : (
            /* Generate meal plan button */
            <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800">
              <CardContent className="py-8 text-center">
                <Wand2 className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Generera kostschema
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Skapa ett detaljerat kostschema med exakta gramtal baserat på makromålen
                </p>
                <Button
                  onClick={() => setShowGenerator(true)}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generera kostschema
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
