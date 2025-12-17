'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NutritionPlanWizard } from '@/components/nutrition-plan-wizard/NutritionPlanWizard';

function CreateNutritionPlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get('clientId') || undefined;
  const clientName = searchParams.get('clientName') || undefined;
  const [showMethodChoice, setShowMethodChoice] = useState(!clientId);

  // If clientId is provided, go straight to wizard
  if (clientId || !showMethodChoice) {
    return <NutritionPlanWizard preselectedClientId={clientId} />;
  }

  // Show method choice
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Skapa kostplan
            </h1>
            <p className="text-gray-500">
              Valj hur du vill skapa kostplanen
            </p>
          </div>

          <div className="space-y-4">
            {/* Juni AI option */}
            <button
              onClick={() => router.push('/dashboard/nutrition-plans/create-with-juni')}
              className="w-full p-6 rounded-xl border-2 border-[#e07a5f]/30 bg-[#e07a5f]/5 hover:border-[#e07a5f] hover:bg-[#e07a5f]/10 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#e07a5f]/20 group-hover:bg-[#e07a5f]/30 transition-colors">
                  <Sparkles className="h-6 w-6 text-[#e07a5f]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    Med Juni AI
                    <span className="text-xs font-normal px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      Nytt
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    Chatta med Juni for att skapa en personlig kostplan.
                    Hon staller fragor och bygger planen at dig.
                  </p>
                </div>
              </div>
            </button>

            {/* Manual wizard option */}
            <button
              onClick={() => setShowMethodChoice(false)}
              className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Manuell guide
                  </h3>
                  <p className="text-sm text-gray-500">
                    Folj steg-for-steg guiden for att konfigurera
                    kostplanen manuellt.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
