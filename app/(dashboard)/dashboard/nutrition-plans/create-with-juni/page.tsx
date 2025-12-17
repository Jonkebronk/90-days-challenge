'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIChatPanelAgent } from '@/components/ai-chat/AIChatPanelAgent';
import Link from 'next/link';

function CreateWithJuniContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get('clientId') || undefined;
  const clientName = searchParams.get('clientName') || undefined;

  const handlePlanCreated = (planId: string) => {
    // Redirect to the new nutrition plan
    router.push(`/dashboard/nutrition-plans/${planId}`);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="bg-[#2f2f2f] border-b border-[#3f3f3f]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/nutrition-plans/create">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Tillbaka
                </Button>
              </Link>
              <div className="h-6 w-px bg-[#3f3f3f]" />
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#e07a5f]" />
                <h1 className="text-lg font-semibold text-white">Skapa kostplan med Juni</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <p className="text-gray-400 text-sm">
            Chatta med Juni for att skapa din kostplan. Hon staller fragor, beraknar dina makromal,
            och skapar en personlig plan baserat pa dina behov.
          </p>
        </div>

        <AIChatPanelAgent
          mode="wizard"
          clientId={clientId}
          clientName={clientName || undefined}
          onPlanCreated={handlePlanCreated}
        />
      </div>
    </div>
  );
}

export default function CreateWithJuniPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[#e07a5f]" />
        </div>
      }
    >
      <CreateWithJuniContent />
    </Suspense>
  );
}
