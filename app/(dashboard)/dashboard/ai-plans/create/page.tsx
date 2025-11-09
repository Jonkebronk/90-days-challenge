'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Brain, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  age: number;
  gender: string;
  height: number;
  currentWeight: number;
  trainingGoal: string;
  currentTraining: string;
  trainingExperience: string;
  lifestyle: string;
  sleepHours: string;
  stressLevel: string;
  city: string;
  country: string;
  aiGeneratedPlan?: any;
}

export default function CreateAIPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'client' | 'lead' | 'new'>('new');

  // Fetch clients and leads on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch clients
        const clientsResponse = await fetch('/api/clients');
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData.clients || []);
        }

        // Fetch leads (without AI plans)
        const leadsResponse = await fetch('/api/leads');
        if (leadsResponse.ok) {
          const leadsData = await leadsResponse.json();
          setLeads(leadsData.leads || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, []);

  // Handle selection
  const handleSelect = (value: string) => {
    setSelectedId(value);

    if (value === 'new') {
      setSelectedType('new');
    } else if (value.startsWith('lead-')) {
      setSelectedType('lead');
    } else if (value.startsWith('client-')) {
      setSelectedType('client');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedId) {
      toast.error('Vänligen välj en klient');
      return;
    }

    const clientId = selectedId.replace('client-', '');
    setLoading(true);

    try {
      // Generate AI plan for the selected client
      const response = await fetch('/api/ai-coach/process-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId, // Send client ID to process existing client
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('AI-plan genererad!');
        router.push(`/dashboard/leads/${data.leadId}/ai-plan`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Kunde inte generera plan');
      }
    } catch (error) {
      console.error('Error generating AI plan:', error);
      toast.error('Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/ai-plans')}
          className="text-[rgba(255,215,0,0.8)] hover:text-[#FFD700]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-[#FFD700]" />
            <h1 className="text-3xl font-bold text-white">Skapa AI-Plan Manuellt</h1>
          </div>
          <p className="text-[rgba(255,255,255,0.6)] text-sm">
            Fyll i klientdata så genererar AI en personlig plan
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Lead/Client Selector */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px] mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FFD700]" />
              Välj Klient
            </CardTitle>
            <CardDescription className="text-[rgba(255,255,255,0.5)]">
              Välj en klient för att generera AI-plan baserat på deras data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedId} onValueChange={handleSelect}>
              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                <SelectValue placeholder="Välj klient..." />
              </SelectTrigger>
              <SelectContent>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={`client-${client.id}`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{client.name}</span>
                        <span className="text-xs text-[rgba(255,255,255,0.5)]">{client.email}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-center text-[rgba(255,255,255,0.5)]">
                    Inga klienter hittades
                  </div>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/ai-plans')}
            className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-bold flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Genererar AI-plan...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generera AI-Plan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
