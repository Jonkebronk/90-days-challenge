'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Calendar,
  Utensils,
  Loader2,
  Wand2,
} from 'lucide-react';
import { MealPlanGenerator } from '@/components/meal-plan-generator';

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

export default function NutritionPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [existingMealPlan, setExistingMealPlan] = useState<ExistingMealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
            <p className="text-sm text-gray-500">
              Skapad {new Date(plan.createdAt).toLocaleDateString('sv-SE')}
            </p>
          </div>
        </div>
        <Badge variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {plan.status === 'ACTIVE' ? 'Aktiv' : plan.status === 'DRAFT' ? 'Utkast' : 'Arkiverad'}
        </Badge>
      </div>

      {/* Client info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Klient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-amber-700 font-semibold text-lg">
                {plan.client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{plan.client.name}</p>
              <p className="text-sm text-gray-500">{plan.client.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Måltidsinställningar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Måltider per dag</span>
              <p className="font-medium">{plan.mealsPerDay}</p>
            </div>
            <div>
              <span className="text-gray-500">Träningstid</span>
              <p className="font-medium">
                {WORKOUT_TIME_LABELS[plan.workoutTime] || plan.workoutTime}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Näringssystem</span>
              <p className="font-medium">
                {NUTRITION_SYSTEM_LABELS[plan.nutritionSystem] || plan.nutritionSystem}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Plan Section */}
      {existingMealPlan ? (
        /* Show existing meal plan */
        <MealPlanGenerator
          nutritionPlanId={plan.id}
          targetMacros={targetMacros}
          onSave={() => {}}
          onCancel={() => {}}
        />
      ) : (
        /* Generate meal plan button */
        <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
          <CardContent className="py-8 text-center">
            <Wand2 className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generera kostschema
            </h3>
            <p className="text-sm text-gray-600 mb-4">
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
  );
}
