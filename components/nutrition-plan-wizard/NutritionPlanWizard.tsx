'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useNutritionPlanWizardStore,
  TOTAL_STEPS,
} from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardProgress } from './WizardProgress';

// Step components
import { Step1ClientSelect } from './steps/Step1ClientSelect';
import { Step2MacroMethod } from './steps/Step2MacroMethod';
import { Step3FatLossRate } from './steps/Step3FatLossRate';
import { Step4DailyCalories } from './steps/Step4DailyCalories';
import { Step5Macros } from './steps/Step5Macros';
import { Step6Summary } from './steps/Step6Summary';
import { Step7TrainingDays } from './steps/Step7TrainingDays';
import { Step8MealsPerDay } from './steps/Step8MealsPerDay';
import { Step9Review } from './steps/Step9Review';
import { Step10PlanDetails } from './steps/Step10PlanDetails';

interface NutritionPlanWizardProps {
  preselectedClientId?: string;
}

export function NutritionPlanWizard({
  preselectedClientId,
}: NutritionPlanWizardProps) {
  const router = useRouter();
  const { currentStep, clientName, reset, recalculateAll } =
    useNutritionPlanWizardStore();

  // Initialize calculations on mount
  useEffect(() => {
    recalculateAll();
  }, [recalculateAll]);

  // Preselect client if provided
  useEffect(() => {
    if (preselectedClientId) {
      // Fetch client data and set it
      fetch(`/api/clients/${preselectedClientId}`)
        .then((res) => res.json())
        .then((client) => {
          if (client && !client.error) {
            useNutritionPlanWizardStore.getState().setClientData({
              id: client.id,
              name: client.name || client.email,
              email: client.email,
              age: client.age,
              height: client.height,
              currentWeight: client.currentWeight,
              gender: client.gender,
            });
            // Skip to step 2 if client is preselected
            useNutritionPlanWizardStore.getState().setStep(2);
          }
        })
        .catch(console.error);
    }
  }, [preselectedClientId]);

  const handleClose = () => {
    reset();
    router.push('/dashboard/nutrition-plans');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1ClientSelect />;
      case 2:
        return <Step2MacroMethod />;
      case 3:
        return <Step3FatLossRate />;
      case 4:
        return <Step4DailyCalories />;
      case 5:
        return <Step5Macros />;
      case 6:
        return <Step6Summary />;
      case 7:
        return <Step7TrainingDays />;
      case 8:
        return <Step8MealsPerDay />;
      case 9:
        return <Step9Review />;
      case 10:
        return <Step10PlanDetails />;
      default:
        return <Step1ClientSelect />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white shadow-xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="text-center flex-1">
              <h1 className="font-semibold text-gray-900">
                Skapa kostplan
              </h1>
              {clientName && (
                <p className="text-sm text-gray-500">{clientName}</p>
              )}
            </div>
            <div className="w-8" /> {/* Spacer for balance */}
          </div>

          {/* Progress bar */}
          <WizardProgress current={currentStep} total={TOTAL_STEPS} />

          {/* Step content */}
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}
