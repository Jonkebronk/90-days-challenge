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
import { Step4BodyDetails } from './steps/Step4BodyDetails';
import { Step5ActivityFactors } from './steps/Step5ActivityFactors';
import { Step6EnergyTarget } from './steps/Step6EnergyTarget';
import { Step7MacroTargets } from './steps/Step7MacroTargets';
import { Step8TrainingDays } from './steps/Step8TrainingDays';
import { Step9MealsPerDay } from './steps/Step9MealsPerDay';
import { Step10WorkoutTime } from './steps/Step10WorkoutTime';
import { Step11NutritionSystem } from './steps/Step11NutritionSystem';
import { Step12Review } from './steps/Step12Review';
import { Step13PlanDetails } from './steps/Step13PlanDetails';

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
        return <Step4BodyDetails />;
      case 5:
        return <Step5ActivityFactors />;
      case 6:
        return <Step6EnergyTarget />;
      case 7:
        return <Step7MacroTargets />;
      case 8:
        return <Step8TrainingDays />;
      case 9:
        return <Step9MealsPerDay />;
      case 10:
        return <Step10WorkoutTime />;
      case 11:
        return <Step11NutritionSystem />;
      case 12:
        return <Step12Review />;
      case 13:
        return <Step13PlanDetails />;
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
