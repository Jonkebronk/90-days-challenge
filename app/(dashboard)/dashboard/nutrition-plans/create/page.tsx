'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { NutritionPlanWizard } from '@/components/nutrition-plan-wizard/NutritionPlanWizard';

function CreateNutritionPlanContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId') || undefined;

  return <NutritionPlanWizard preselectedClientId={clientId} />;
}

export default function CreateNutritionPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Laddar...</div>
        </div>
      }
    >
      <CreateNutritionPlanContent />
    </Suspense>
  );
}
