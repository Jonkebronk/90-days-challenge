/**
 * Coach Dashboard - AI Plans Review
 * app/dashboard/leads/[id]/ai-plan/page.tsx
 *
 * Sida där coach kan granska AI-genererade planer för leads
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AIClientPlanViewer } from '@/components/ai-client-plan-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Brain } from 'lucide-react';

interface LeadData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  age: number;
  gender: string;
  height: number;
  currentWeight: number;
  status: string;
  createdAt: string;
  aiGeneratedPlan: any;
}

export default function LeadAIPlanPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadData();
  }, [leadId]);

  async function fetchLeadData() {
    try {
      const response = await fetch(`/api/leads/${leadId}`);
      if (!response.ok) throw new Error('Kunde inte hämta lead');

      const data = await response.json();
      setLead(data);
    } catch (error) {
      console.error('Fel vid hämtning av lead:', error);
      toast.error('Kunde inte ladda lead-data');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprovePlan() {
    try {
      const response = await fetch(`/api/leads/${leadId}/approve-plan`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Kunde inte godkänna plan');

      toast.success('Plan godkänd! Planen har markerats som godkänd och kan nu skickas till klient.');

      // Uppdatera lead-status
      await fetchLeadData();

    } catch (error) {
      console.error('Fel vid godkännande:', error);
      toast.error('Kunde inte godkänna planen');
    }
  }

  async function handleConvertToClient() {
    try {
      const response = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeAIPlan: true, // Inkludera AI-planen när vi konverterar
        }),
      });

      if (!response.ok) throw new Error('Kunde inte konvertera lead');

      const result = await response.json();

      toast.success('Lead konverterad! Klienten har skapats med AI-genererad plan.');

      router.push(`/dashboard/clients/${result.clientId}`);

    } catch (error) {
      console.error('Fel vid konvertering:', error);
      toast.error('Kunde inte konvertera lead till klient');
    }
  }

  function handleEditPlan() {
    // Navigera till redigeringssida eller öppna modal
    router.push(`/dashboard/leads/${leadId}/edit-plan`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Lead hittades inte</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Gold Gradient */}
      <div className="text-center">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
        <div className="flex items-center justify-center gap-3 mb-3">
          <Brain className="w-10 h-10 text-[#FFD700]" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            AI-Genererad Plan
          </h1>
        </div>
        <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
          Granska och godkänn automatiskt genererad plan
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
      </div>

      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/leads')}
          className="text-[rgba(255,215,0,0.8)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Lead Information Card */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-[#FFD700]" />
                {lead.fullName}
              </CardTitle>
              <CardDescription className="text-[rgba(255,255,255,0.5)]">Lead ID: {lead.id}</CardDescription>
            </div>
            <Badge className={
              lead.status === 'NEW' ? 'bg-[#FFD700] text-[#0a0a0a]' :
              lead.status === 'CONTACTED' ? 'bg-[#007bff] text-white' :
              lead.status === 'CONVERTED' ? 'bg-[#28a745] text-white' :
              'bg-[rgba(255,255,255,0.2)] text-white'
            }>
              {lead.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#FFD700]" />
              <span className="text-sm text-[rgba(255,255,255,0.8)]">{lead.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#FFD700]" />
              <span className="text-sm text-[rgba(255,255,255,0.8)]">{lead.phone || 'Ej angivet'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#FFD700]" />
              <span className="text-sm text-[rgba(255,255,255,0.8)]">{lead.city}, {lead.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#FFD700]" />
              <span className="text-sm text-[rgba(255,255,255,0.8)]">
                Ansökt: {new Date(lead.createdAt).toLocaleDateString('sv-SE')}
              </span>
            </div>
            <div className="text-sm text-[rgba(255,255,255,0.8)]">
              <span className="text-[rgba(255,255,255,0.5)]">Ålder:</span> {lead.age} år
            </div>
            <div className="text-sm text-[rgba(255,255,255,0.8)]">
              <span className="text-[rgba(255,255,255,0.5)]">Längd:</span> {lead.height} cm
            </div>
            <div className="text-sm text-[rgba(255,255,255,0.8)]">
              <span className="text-[rgba(255,255,255,0.5)]">Vikt:</span> {lead.currentWeight} kg
            </div>
            <div className="text-sm text-[rgba(255,255,255,0.8)]">
              <span className="text-[rgba(255,255,255,0.5)]">Kön:</span> {lead.gender}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Plan Viewer */}
      <AIClientPlanViewer
        plan={lead.aiGeneratedPlan}
        clientName={lead.fullName}
        onApprove={handleApprovePlan}
        onEdit={handleEditPlan}
      />

      {/* Action Buttons */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-white">Nästa Steg</CardTitle>
          <CardDescription className="text-[rgba(255,255,255,0.5)]">
            Välj hur du vill fortsätta med denna lead
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={handleApprovePlan}
            className="bg-gradient-to-r from-[#28a745] to-[#20c997] hover:from-[#28a745] hover:to-[#28a745] text-white font-bold"
          >
            Godkänn Plan
          </Button>
          <Button
            onClick={handleConvertToClient}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-bold"
          >
            Konvertera till Klient & Skicka Plan
          </Button>
          <Button
            onClick={handleEditPlan}
            variant="outline"
            className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
          >
            Redigera Plan Manuellt
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/leads/${leadId}`)}
            className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
          >
            Visa Fullständig Ansökan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
