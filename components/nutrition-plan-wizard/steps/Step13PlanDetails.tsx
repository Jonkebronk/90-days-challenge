'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Home } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { useRouter } from 'next/navigation';
import {
  WORKOUT_TIME_LABELS,
  NUTRITION_SYSTEM_LABELS,
} from '@/lib/types/client-nutrition-plan';

export function Step13PlanDetails() {
  const router = useRouter();

  const {
    clientName,
    dailyCalorieTarget,
    proteinGrams,
    fatGrams,
    carbGrams,
    mealsPerDay,
    workoutTime,
    nutritionSystem,
    createdPlanId,
    reset,
  } = useNutritionPlanWizardStore();

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

  return (
    <div className="space-y-6">
      {/* Success message */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Kostplan skapad!
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Kostplanen för {clientName} har skapats framgångsrikt
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
            <div className="flex justify-between">
              <span className="text-gray-600">Träningstid</span>
              <span>{WORKOUT_TIME_LABELS[workoutTime]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Näringssystem</span>
              <span>{NUTRITION_SYSTEM_LABELS[nutritionSystem]}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleGoToPlans}
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
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
