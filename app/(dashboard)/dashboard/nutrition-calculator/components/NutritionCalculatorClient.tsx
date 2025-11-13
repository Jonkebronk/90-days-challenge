'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNutritionStore } from '@/lib/stores/nutrition-calculator-store';
import { Phase1Form } from './Phase1Form';
import { Phase2Form } from './Phase2Form';
import { Phase3Form } from './Phase3Form';
import { Phase4Form } from './Phase4Form';
import { Save, FileText, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface NutritionCalculatorClientProps {
  clients: Client[];
}

export function NutritionCalculatorClient({ clients }: NutritionCalculatorClientProps) {
  const [selectedTab, setSelectedTab] = useState('phase-1');
  const [isSaving, setIsSaving] = useState(false);

  const planId = useNutritionStore((state) => state.planId);
  const clientId = useNutritionStore((state) => state.clientId);
  const clientName = useNutritionStore((state) => state.clientName);
  const status = useNutritionStore((state) => state.status);
  const currentPhase = useNutritionStore((state) => state.currentPhase);
  const phase1Data = useNutritionStore((state) => state.phase1Data);
  const phase2Data = useNutritionStore((state) => state.phase2Data);
  const phase3Data = useNutritionStore((state) => state.phase3Data);
  const phase4Data = useNutritionStore((state) => state.phase4Data);
  const isDirty = useNutritionStore((state) => state.isDirty);

  const setClientId = useNutritionStore((state) => state.setClientId);
  const setCurrentPhase = useNutritionStore((state) => state.setCurrentPhase);
  const reset = useNutritionStore((state) => state.reset);

  // Sync tab with current phase
  useEffect(() => {
    setSelectedTab(`phase-${currentPhase}`);
  }, [currentPhase]);

  const handleClientSelect = async (newClientId: string) => {
    if (isDirty) {
      const confirmed = confirm(
        'Du har osparade ändringar. Vill du byta klient och förlora ändringarna?'
      );
      if (!confirmed) return;
    }

    const client = clients.find((c) => c.id === newClientId);
    if (client) {
      reset();
      setClientId(newClientId, client.name);
      toast.success(`Vald klient: ${client.name}`);

      // Try to load existing plan for this client
      const { getNutritionPlanByClientId } = await import('@/app/actions/nutrition-plans');
      const result = await getNutritionPlanByClientId(newClientId);

      if (result.success && result.plan) {
        const { loadPlan } = useNutritionStore.getState();
        loadPlan({
          id: result.plan.id,
          clientId: result.plan.clientId,
          clientName: result.plan.clientName,
          status: result.plan.status as any,
          phase1Data: result.plan.phase1Data as any,
          phase2Data: result.plan.phase2Data as any,
          phase3Data: result.plan.phase3Data as any,
          phase4Data: result.plan.phase4Data as any,
        });
        toast.success('Befintlig plan laddad');
      }
    }
  };

  const handleTabChange = (value: string) => {
    const phaseNum = parseInt(value.split('-')[1]) as 1 | 2 | 3 | 4;
    setSelectedTab(value);
    setCurrentPhase(phaseNum);
  };

  const handlePhaseComplete = (nextPhase: 1 | 2 | 3 | 4) => {
    setCurrentPhase(nextPhase);
    setSelectedTab(`phase-${nextPhase}`);
    toast.success(`Fas ${nextPhase - 1} klar! Gå vidare till Fas ${nextPhase}.`);
  };

  const handleSave = async () => {
    if (!clientId) {
      toast.error('Välj en klient först');
      return;
    }

    if (!phase1Data) {
      toast.error('Du måste minst slutföra Fas 1 innan du sparar');
      return;
    }

    setIsSaving(true);
    try {
      const { saveNutritionPlan } = await import('@/app/actions/nutrition-plans');
      const { planId, status, setPlanId, markSaved } = useNutritionStore.getState();

      const result = await saveNutritionPlan({
        planId,
        clientId,
        clientName,
        status,
        phase1Data,
        phase2Data: phase2Data || undefined,
        phase3Data: phase3Data || undefined,
        phase4Data: phase4Data || undefined,
      });

      if (result.success) {
        // If new plan, store the planId
        const resultWithPlanId = result as any;
        if (resultWithPlanId.planId && !planId) {
          setPlanId(resultWithPlanId.planId);
        }
        markSaved();
        toast.success('Plan sparad!');
      } else {
        toast.error(result.message || 'Kunde inte spara planen');
      }
    } catch (error) {
      toast.error('Kunde inte spara planen');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!clientId || !phase1Data) {
      toast.error('Skapa en komplett plan först');
      return;
    }

    try {
      toast.loading('Genererar PDF...', { id: 'pdf-export' });

      const response = await fetch('/api/nutrition-calculator/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          phase1Data,
          phase2Data: phase2Data || undefined,
          phase3Data: phase3Data || undefined,
          phase4Data: phase4Data || undefined,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kostschema_${clientName.replace(/[^a-zA-Z0-9-_]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF exporterad!', { id: 'pdf-export' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Kunde inte exportera PDF', { id: 'pdf-export' });
    }
  };

  const handleReset = () => {
    const confirmed = confirm(
      'Är du säker på att du vill nollställa kalkylatorn? All data kommer att raderas.'
    );
    if (confirmed) {
      reset();
      setSelectedTab('phase-1');
      toast.success('Kalkylator nollställd');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Card className="bg-black/40 border-[rgba(255,215,0,0.3)]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Välj Klient</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Select value={clientId || undefined} onValueChange={handleClientSelect}>
                  <SelectTrigger className="bg-black/60 border-[rgba(255,215,0,0.3)] text-white">
                    <SelectValue placeholder="Välj en klient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientName && (
                  <p className="text-sm text-gray-400">
                    Skapar plan för: <span className="text-[#FFD700]">{clientName}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 ml-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || !clientId || !phase1Data}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FFD700] text-black"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Sparar...' : 'Spara Plan'}
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={!clientId || !phase1Data}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Exportera PDF
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="bg-transparent border-[rgba(255,215,0,0.3)] text-white hover:bg-[rgba(255,215,0,0.1)]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Nollställ
          </Button>
        </div>
      </div>

      {/* Phase Tabs */}
      <Tabs value={selectedTab} onValueChange={handleTabChange}>
        <TabsList className="bg-black/60 border border-[rgba(255,215,0,0.3)] w-full justify-start">
          <TabsTrigger
            value="phase-1"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-black"
          >
            Fas 1: Bas
            {phase1Data && <span className="ml-2">✓</span>}
          </TabsTrigger>
          <TabsTrigger
            value="phase-2"
            disabled={!phase1Data}
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-black"
          >
            Fas 2: Ramp Up 1
            {phase2Data && <span className="ml-2">✓</span>}
          </TabsTrigger>
          <TabsTrigger
            value="phase-3"
            disabled={!phase2Data}
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-black"
          >
            Fas 3: Ramp Up 2
            {phase3Data && <span className="ml-2">✓</span>}
          </TabsTrigger>
          <TabsTrigger
            value="phase-4"
            disabled={!phase3Data}
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-black"
          >
            Fas 4: Underhåll
            {phase4Data && <span className="ml-2">✓</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phase-1">
          <Phase1Form onNext={() => handlePhaseComplete(2)} />
        </TabsContent>

        <TabsContent value="phase-2">
          <Phase2Form
            onNext={() => handlePhaseComplete(3)}
            onBack={() => setCurrentPhase(1)}
          />
        </TabsContent>

        <TabsContent value="phase-3">
          <Phase3Form
            onNext={() => handlePhaseComplete(4)}
            onBack={() => setCurrentPhase(2)}
          />
        </TabsContent>

        <TabsContent value="phase-4">
          <Phase4Form
            onNext={handleSave}
            onBack={() => setCurrentPhase(3)}
          />
        </TabsContent>
      </Tabs>

      {/* Status Indicator */}
      {isDirty && (
        <div className="fixed bottom-4 right-4 bg-yellow-500/90 text-black px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Osparade ändringar</p>
        </div>
      )}
    </div>
  );
}
