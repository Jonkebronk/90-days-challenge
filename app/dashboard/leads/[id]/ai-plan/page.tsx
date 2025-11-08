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
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

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
    <div className="container mx-auto py-8 space-y-6">
      {/* Header med navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/leads')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">AI-Genererad Plan</h1>
          <p className="text-muted-foreground">Granska och godkänn automatiskt genererad plan</p>
        </div>
      </div>

      {/* Lead Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {lead.fullName}
              </CardTitle>
              <CardDescription>Lead ID: {lead.id}</CardDescription>
            </div>
            <Badge variant={
              lead.status === 'NEW' ? 'default' :
              lead.status === 'CONTACTED' ? 'secondary' :
              lead.status === 'CONVERTED' ? 'outline' :
              'outline'
            }>
              {lead.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{lead.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{lead.phone || 'Ej angivet'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{lead.city}, {lead.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Ansökt: {new Date(lead.createdAt).toLocaleDateString('sv-SE')}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Ålder:</span> {lead.age} år
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Längd:</span> {lead.height} cm
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Vikt:</span> {lead.currentWeight} kg
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Kön:</span> {lead.gender}
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
      <Card>
        <CardHeader>
          <CardTitle>Nästa Steg</CardTitle>
          <CardDescription>
            Välj hur du vill fortsätta med denna lead
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleApprovePlan} variant="outline">
            Godkänn Plan
          </Button>
          <Button onClick={handleConvertToClient}>
            Konvertera till Klient & Skicka Plan
          </Button>
          <Button onClick={handleEditPlan} variant="secondary">
            Redigera Plan Manuellt
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/leads/${leadId}`)}
          >
            Visa Fullständig Ansökan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
