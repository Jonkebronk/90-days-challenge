'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Home, Wand2, Loader2 } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { useRouter } from 'next/navigation';
import { MealPlanGenerator } from '@/components/meal-plan-generator';
import type {
  WorkoutTime,
  NutritionSystem,
} from '@/lib/types/client-nutrition-plan';

type ViewMode = 'summary' | 'generator';

interface PlanData {
  clientName: string;
  dailyCalorieTarget: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  mealsPerDay: number;
  workoutTime: WorkoutTime;
  nutritionSystem: NutritionSystem;
}

export function Step10PlanDetails() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('generator');
  const [generatedMealPlanId, setGeneratedMealPlanId] = useState<string | null>(null);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    clientName: storeClientName,
    dailyCalorieTarget: storeDailyCalorieTarget,
    proteinGrams: storeProteinGrams,
    fatGrams: storeFatGrams,
    carbGrams: storeCarbGrams,
    mealsPerDay: storeMealsPerDay,
    workoutTime: storeWorkoutTime,
    nutritionSystem: storeNutritionSystem,
    createdPlanId,
    reset,
  } = useNutritionPlanWizardStore();

  // Fetch the actual saved plan data from the API
  useEffect(() => {
    async function fetchPlan() {
      if (!createdPlanId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/nutrition-plans/${createdPlanId}`);
        if (response.ok) {
          const plan = await response.json();
          setPlanData({
            clientName: plan.client?.name || storeClientName,
            dailyCalorieTarget: plan.dailyCalorieTarget,
            proteinGrams: plan.proteinGrams,
            fatGrams: plan.fatGrams,
            carbGrams: plan.carbGrams,
            mealsPerDay: plan.mealsPerDay,
            workoutTime: plan.workoutTime || storeWorkoutTime,
            nutritionSystem: plan.nutritionSystem,
          });
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlan();
  }, [createdPlanId, storeClientName, storeWorkoutTime]);

  // Use fetched data or fall back to store values
  const clientName = planData?.clientName || storeClientName;
  const dailyCalorieTarget = planData?.dailyCalorieTarget || storeDailyCalorieTarget;
  const proteinGrams = planData?.proteinGrams || storeProteinGrams;
  const fatGrams = planData?.fatGrams || storeFatGrams;
  const carbGrams = planData?.carbGrams || storeCarbGrams;
  const mealsPerDay = planData?.mealsPerDay || storeMealsPerDay;
  const workoutTime = planData?.workoutTime || storeWorkoutTime;
  const nutritionSystem = planData?.nutritionSystem || storeNutritionSystem;

  const handleCreateAnother = () => {
    reset();
  };

  const handleGoToPlans = () => {
    reset();
    router.push('/dashboard/nutrition-plans');
  };

  const handleGoToDashboard = () => {
    reset();
    router.push('/dashboard');
  };

  const handleGenerateMealPlan = () => {
    setViewMode('generator');
  };

  const handleMealPlanSaved = (planId: string) => {
    setGeneratedMealPlanId(planId);
    setViewMode('summary');
  };

  const handleCancelGenerator = () => {
    setViewMode('summary');
  };

  // Target macros for the generator
  const targetMacros = {
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
    kcal: dailyCalorieTarget,
  };

  // Show loading state while fetching plan data
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
        <p className="text-sm text-gray-500">Laddar plandata...</p>
      </div>
    );
  }

  // If in generator mode, show the meal plan generator
  if (viewMode === 'generator' && createdPlanId) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Generera kostschema
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Skapa ett detaljerat kostschema baserat på {clientName}s makromål
          </p>
        </div>

        <MealPlanGenerator
          nutritionPlanId={createdPlanId}
          targetMacros={targetMacros}
          onSave={handleMealPlanSaved}
          onCancel={handleCancelGenerator}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success message */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {generatedMealPlanId ? 'Kostschema sparat!' : 'Kostplan skapad!'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {generatedMealPlanId
            ? `Kostschemat för ${clientName} har sparats`
            : `Kostplanen för ${clientName} har skapats framgångsrikt`}
        </p>
      </div>

      {/* Plan summary */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          {clientName}s kostplan
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {mealsPerDay} måltider ({dailyCalorieTarget} kcal)
        </p>

        {/* Macros */}
        <div className="mb-4">
          <h4 className="text-xs text-gray-500 uppercase mb-2">
            Makronutrientmål
          </h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-xs text-gray-400">Beräknat</div>
              <div className="font-medium">{dailyCalorieTarget}</div>
            </div>
            <div>
              <div className="text-xs text-pink-400">Protein</div>
              <div className="font-medium text-pink-500">{proteinGrams}g</div>
            </div>
            <div>
              <div className="text-xs text-teal-400">Kolhydrater</div>
              <div className="font-medium text-teal-500">{carbGrams}g</div>
            </div>
            <div>
              <div className="text-xs text-amber-400">Fett</div>
              <div className="font-medium text-amber-500">{fatGrams}g</div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div>
          <h4 className="text-xs text-gray-500 uppercase mb-2">
            Planinställningar
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Måltider per dag</span>
              <span>{mealsPerDay}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Generate meal plan button - primary action if no meal plan yet */}
        {!generatedMealPlanId && createdPlanId && (
          <Button
            onClick={handleGenerateMealPlan}
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generera kostschema
          </Button>
        )}

        <Button
          onClick={handleGoToPlans}
          className={`w-full h-12 ${
            generatedMealPlanId
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
              : ''
          }`}
          variant={generatedMealPlanId ? 'default' : 'outline'}
        >
          Visa alla kostplaner
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <Button
          variant="outline"
          onClick={handleCreateAnother}
          className="w-full h-12"
        >
          Skapa en till kostplan
        </Button>

        <Button
          variant="ghost"
          onClick={handleGoToDashboard}
          className="w-full h-12"
        >
          <Home className="w-4 h-4 mr-2" />
          Tillbaka till dashboard
        </Button>
      </div>
    </div>
  );
}
