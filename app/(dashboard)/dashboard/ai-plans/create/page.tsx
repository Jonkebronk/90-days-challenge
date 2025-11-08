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

export default function CreateAIPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    gender: 'man',
    height: '',
    currentWeight: '',
    trainingGoal: '',
    currentTraining: '',
    trainingExperience: '',
    lifestyle: '',
    sleepHours: '',
    stressLevel: '',
  });

  // Fetch clients on mount
  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    }
    fetchClients();
  }, []);

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);

    if (clientId === 'new') {
      // Reset form for manual entry
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        age: '',
        gender: 'man',
        height: '',
        currentWeight: '',
        trainingGoal: '',
        currentTraining: '',
        trainingExperience: '',
        lifestyle: '',
        sleepHours: '',
        stressLevel: '',
      });
    } else {
      // Find selected client and populate basic info
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData(prev => ({
          ...prev,
          fullName: client.name || '',
          email: client.email || '',
        }));
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.age || !formData.height || !formData.currentWeight) {
      toast.error('Vänligen fyll i alla obligatoriska fält');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ai-coach/process-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email || `manual-${Date.now()}@temporary.com`,
          phone: formData.phone || '',
          age: parseInt(formData.age),
          gender: formData.gender,
          height: parseInt(formData.height),
          currentWeight: parseFloat(formData.currentWeight),
          trainingGoal: formData.trainingGoal,
          currentTraining: formData.currentTraining,
          trainingExperience: formData.trainingExperience,
          lifestyle: formData.lifestyle,
          sleepHours: formData.sleepHours,
          stressLevel: formData.stressLevel,
          city: '',
          country: 'Sverige',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('AI-plan skapad! ');
        router.push(`/dashboard/leads/${data.leadId}/ai-plan`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Kunde inte skapa plan');
      }
    } catch (error) {
      console.error('Error creating AI plan:', error);
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
        {/* Client Selector */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px] mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FFD700]" />
              Välj Klient
            </CardTitle>
            <CardDescription className="text-[rgba(255,255,255,0.5)]">
              Välj en befintlig klient eller skapa en ny manuellt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedClientId} onValueChange={handleClientSelect}>
              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                <SelectValue placeholder="Välj klient eller skapa ny..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Skapa ny (manuell inmatning)
                  </span>
                </SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <span className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-xs text-[rgba(255,255,255,0.5)]">{client.email}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px] mb-6">
          <CardHeader>
            <CardTitle className="text-white">Personuppgifter</CardTitle>
            <CardDescription className="text-[rgba(255,255,255,0.5)]">
              Grundläggande information om klienten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-[rgba(255,255,255,0.9)]">
                  Namn <span className="text-[#FFD700]">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-[rgba(255,255,255,0.9)]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-[rgba(255,255,255,0.9)]">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div>
                <Label htmlFor="age" className="text-[rgba(255,255,255,0.9)]">
                  Ålder <span className="text-[#FFD700]">*</span>
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-[rgba(255,255,255,0.9)]">
                  Kön <span className="text-[#FFD700]">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                  <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="man">Man</SelectItem>
                    <SelectItem value="kvinna">Kvinna</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="height" className="text-[rgba(255,255,255,0.9)]">
                  Längd (cm) <span className="text-[#FFD700]">*</span>
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currentWeight" className="text-[rgba(255,255,255,0.9)]">
                  Nuvarande Vikt (kg) <span className="text-[#FFD700]">*</span>
                </Label>
                <Input
                  id="currentWeight"
                  type="number"
                  step="0.1"
                  value={formData.currentWeight}
                  onChange={(e) => handleChange('currentWeight', e.target.value)}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training & Goals */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px] mb-6">
          <CardHeader>
            <CardTitle className="text-white">Träning & Mål</CardTitle>
            <CardDescription className="text-[rgba(255,255,255,0.5)]">
              Information om träning och mål
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trainingGoal" className="text-[rgba(255,255,255,0.9)]">Träningsmål</Label>
              <Textarea
                id="trainingGoal"
                value={formData.trainingGoal}
                onChange={(e) => handleChange('trainingGoal', e.target.value)}
                placeholder="T.ex. Gå ner 10 kg, bygga muskler, bli starkare..."
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)]"
              />
            </div>

            <div>
              <Label htmlFor="currentTraining" className="text-[rgba(255,255,255,0.9)]">Nuvarande Träning</Label>
              <Textarea
                id="currentTraining"
                value={formData.currentTraining}
                onChange={(e) => handleChange('currentTraining', e.target.value)}
                placeholder="T.ex. 3 gånger per vecka styrketräning..."
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)]"
              />
            </div>

            <div>
              <Label htmlFor="trainingExperience" className="text-[rgba(255,255,255,0.9)]">Träningserfarenhet</Label>
              <Textarea
                id="trainingExperience"
                value={formData.trainingExperience}
                onChange={(e) => handleChange('trainingExperience', e.target.value)}
                placeholder="T.ex. Nybörjare, tränat i 2 år, erfaren..."
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px] mb-6">
          <CardHeader>
            <CardTitle className="text-white">Livsstil</CardTitle>
            <CardDescription className="text-[rgba(255,255,255,0.5)]">
              Information om sömn, stress och livsstil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lifestyle" className="text-[rgba(255,255,255,0.9)]">Livsstil</Label>
              <Textarea
                id="lifestyle"
                value={formData.lifestyle}
                onChange={(e) => handleChange('lifestyle', e.target.value)}
                placeholder="T.ex. Kontorsarbete, aktiv livsstil, mycket stillasittande..."
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sleepHours" className="text-[rgba(255,255,255,0.9)]">Sömn (timmar per natt)</Label>
                <Input
                  id="sleepHours"
                  value={formData.sleepHours}
                  onChange={(e) => handleChange('sleepHours', e.target.value)}
                  placeholder="T.ex. 7-8 timmar"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)]"
                />
              </div>

              <div>
                <Label htmlFor="stressLevel" className="text-[rgba(255,255,255,0.9)]">Stressnivå</Label>
                <Input
                  id="stressLevel"
                  value={formData.stressLevel}
                  onChange={(e) => handleChange('stressLevel', e.target.value)}
                  placeholder="T.ex. Låg, medel, hög..."
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)]"
                />
              </div>
            </div>
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
