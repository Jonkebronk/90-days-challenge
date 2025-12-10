'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Mail, User, X, Trash2, Copy, CheckCircle2, Key, RefreshCw, ChevronDown, ChevronUp, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string | null
  email: string
  status: string
  invitationSentAt: string | null
  createdAt: string
  inviteCode: string | null
  inviteCodeExpiresAt: string | null
}

interface NewClientForm {
  // Personuppgifter
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  country: string
  age: string
  gender: string
  height: string
  currentWeight: string
  // Målsättning
  goals: string
  biggestChallenges: string
  previousCoaching: string
  // Träningsbakgrund
  currentTraining: string
  trainingExperience: string
  injuries: string
  // Kostbakgrund
  dietHistory: string
  foodPreferences: string
  allergies: string
  // Livsstil
  dailyRoutine: string
  // Övrigt
  other: string
}

export default function ClientsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [createdClientData, setCreatedClientData] = useState<{
    name: string
    email: string
    inviteCode: string
    inviteCodeExpiresAt: string
    emailSent?: boolean
  } | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [generatingCodeFor, setGeneratingCodeFor] = useState<string | null>(null)
  const [sendingInvitationFor, setSendingInvitationFor] = useState<string | null>(null)
  const [newClient, setNewClient] = useState<NewClientForm>({
    // Personuppgifter
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: 'Sverige',
    age: '',
    gender: '',
    height: '',
    currentWeight: '',
    // Målsättning
    goals: '',
    biggestChallenges: '',
    previousCoaching: '',
    // Träningsbakgrund
    currentTraining: '',
    trainingExperience: '',
    injuries: '',
    // Kostbakgrund
    dietHistory: '',
    foodPreferences: '',
    allergies: '',
    // Livsstil
    dailyRoutine: '',
    // Övrigt
    other: '',
  })

  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    goals: false,
    training: false,
    nutrition: false,
    lifestyle: false,
    other: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setIsLoading(false)
    }
  }


  const handleInviteClient = async () => {
    if (!newClient.firstName || !newClient.lastName || !newClient.email) {
      toast.error('Vänligen fyll i förnamn, efternamn och e-post')
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch('/api/clients/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      })

      const data = await response.json()

      if (response.ok) {
        // Store the created client data including invite code
        setCreatedClientData({
          name: data.client.name,
          email: data.client.email,
          inviteCode: data.client.inviteCode,
          inviteCodeExpiresAt: data.client.inviteCodeExpiresAt,
          emailSent: data.emailSent,
        })

        // Close invite dialog and open success dialog
        setIsDialogOpen(false)
        setSuccessDialogOpen(true)

        // Reset form
        setNewClient({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          city: '',
          country: 'Sverige',
          age: '',
          gender: '',
          height: '',
          currentWeight: '',
          goals: '',
          biggestChallenges: '',
          previousCoaching: '',
          currentTraining: '',
          trainingExperience: '',
          injuries: '',
          dietHistory: '',
          foodPreferences: '',
          allergies: '',
          dailyRoutine: '',
          other: '',
        })
        // Reset expanded sections
        setExpandedSections({
          personal: true,
          goals: false,
          training: false,
          nutrition: false,
          lifestyle: false,
          other: false,
        })
        fetchClients()
      } else {
        toast.error(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      toast.error('Failed to send invitation')
      console.error('Invite error:', error)
    } finally {
      setIsInviting(false)
    }
  }

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(true)
      toast.success('Kod kopierad!')
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      toast.error('Kunde inte kopiera kod')
    }
  }

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleGenerateInviteCode = async (clientId: string) => {
    setGeneratingCodeFor(clientId)
    try {
      const response = await fetch(`/api/clients/${clientId}/generate-invite-code`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        // Show success dialog with the new code
        setCreatedClientData({
          name: data.client.name,
          email: data.client.email,
          inviteCode: data.inviteCode,
          inviteCodeExpiresAt: data.inviteCodeExpiresAt,
        })
        setSuccessDialogOpen(true)

        // Refresh client list
        fetchClients()
        toast.success('GOLD-kod genererad!')
      } else {
        toast.error(data.error || 'Kunde inte generera kod')
      }
    } catch (error) {
      toast.error('Kunde inte generera kod')
      console.error('Generate code error:', error)
    } finally {
      setGeneratingCodeFor(null)
    }
  }

  const handleResendInvitation = async (clientId: string, clientEmail: string) => {
    setSendingInvitationFor(clientId)
    try {
      const response = await fetch(`/api/clients/${clientId}/resend-invitation`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Inbjudan skickad till ${clientEmail}`)
      } else {
        toast.error(data.error || 'Kunde inte skicka inbjudan')
      }
    } catch (error) {
      toast.error('Kunde inte skicka inbjudan')
      console.error('Resend invitation error:', error)
    } finally {
      setSendingInvitationFor(null)
    }
  }

  const handleDeleteClient = async (clientId: string, clientEmail: string) => {
    if (!confirm(`Are you sure you want to delete ${clientEmail}?`)) {
      return
    }

    setDeletingClientId(clientId)
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Client deleted successfully')
        fetchClients()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete client')
      }
    } catch (error) {
      toast.error('Failed to delete client')
      console.error('Delete error:', error)
    } finally {
      setDeletingClientId(null)
    }
  }


  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
            Klienter
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
            Hantera och bjud in dina klienter
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
        </div>

        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] font-semibold hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4 mr-2" />
                Lägg till klient
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-2 border-gold-primary/30">
            <DialogHeader>
              <DialogTitle className="font-['Orbitron',sans-serif] text-2xl font-black tracking-[2px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                Lägg till ny klient
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Personuppgifter Section */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection('personal')}
                  className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                >
                  <h2 className="text-xl font-bold text-gold-light tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                    Personuppgifter
                  </h2>
                  {expandedSections.personal ? (
                    <ChevronUp className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {expandedSections.personal && (
                  <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-200">Förnamn *</Label>
                        <Input
                          value={newClient.firstName}
                          onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="Förnamn"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-200">Efternamn *</Label>
                        <Input
                          value={newClient.lastName}
                          onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="Efternamn"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-200">E-post *</Label>
                        <Input
                          type="email"
                          value={newClient.email}
                          onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="din@email.se"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-200">Telefon *</Label>
                        <Input
                          value={newClient.phone}
                          onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="070-123 45 67"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-200">Stad</Label>
                        <Input
                          value={newClient.city}
                          onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="Stockholm"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-200">Land</Label>
                        <Input
                          value={newClient.country}
                          onChange={(e) => setNewClient({ ...newClient, country: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="Sverige"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-200">Ålder</Label>
                        <Input
                          type="number"
                          value={newClient.age}
                          onChange={(e) => setNewClient({ ...newClient, age: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="25"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-200">Kön</Label>
                        <Select value={newClient.gender} onValueChange={(value) => setNewClient({ ...newClient, gender: value })}>
                          <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                            <SelectValue placeholder="Välj" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Man</SelectItem>
                            <SelectItem value="female">Kvinna</SelectItem>
                            <SelectItem value="other">Annat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-200">Längd (cm)</Label>
                        <Input
                          type="number"
                          value={newClient.height}
                          onChange={(e) => setNewClient({ ...newClient, height: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="175"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-200">Nuvarande vikt (kg)</Label>
                        <Input
                          type="number"
                          value={newClient.currentWeight}
                          onChange={(e) => setNewClient({ ...newClient, currentWeight: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="80"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Målsättning Section */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection('goals')}
                  className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                >
                  <h2 className="text-xl font-bold text-gold-light tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                    Målsättning
                  </h2>
                  {expandedSections.goals ? (
                    <ChevronUp className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {expandedSections.goals && (
                  <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                    <div>
                      <Label className="text-gray-200">Klientens målsättningar (Stora och små mål)</Label>
                      <Textarea
                        value={newClient.goals}
                        onChange={(e) => setNewClient({ ...newClient, goals: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[120px]"
                        placeholder="Beskriv dina stora mål och små delmål..."
                      />
                    </div>

                    <div>
                      <Label className="text-gray-200">Största utmaningar</Label>
                      <Textarea
                        value={newClient.biggestChallenges}
                        onChange={(e) => setNewClient({ ...newClient, biggestChallenges: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                        placeholder="Vad har hindrat dig från att nå dina mål tidigare?"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-200">Tidigare coaching eller PT</Label>
                      <Textarea
                        value={newClient.previousCoaching}
                        onChange={(e) => setNewClient({ ...newClient, previousCoaching: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[80px]"
                        placeholder="Har du haft personlig tränare eller coach tidigare? Vad funkade/funkade inte?"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Träningsbakgrund Section */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection('training')}
                  className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                >
                  <h2 className="text-xl font-bold text-gold-light tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                    Träningsbakgrund
                  </h2>
                  {expandedSections.training ? (
                    <ChevronUp className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {expandedSections.training && (
                  <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                    <div>
                      <Label className="text-gray-200">Tränar du idag?</Label>
                      <Textarea
                        value={newClient.currentTraining}
                        onChange={(e) => setNewClient({ ...newClient, currentTraining: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                        placeholder="Om du gör det, beskriv vad du gör, gärna så detaljerat som möjligt"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-200">Träningserfarenhet historiskt</Label>
                      <Textarea
                        value={newClient.trainingExperience}
                        onChange={(e) => setNewClient({ ...newClient, trainingExperience: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                        placeholder="Vad har du för träningserfarenhet historiskt?"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-200">Skador/Begränsningar</Label>
                      <Textarea
                        value={newClient.injuries}
                        onChange={(e) => setNewClient({ ...newClient, injuries: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[80px]"
                        placeholder="Eventuella skador, smärtor eller andra begränsningar vi bör veta om"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Kostbakgrund Section */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection('nutrition')}
                  className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                >
                  <h2 className="text-xl font-bold text-gold-light tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                    Kostbakgrund
                  </h2>
                  {expandedSections.nutrition ? (
                    <ChevronUp className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {expandedSections.nutrition && (
                  <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                    <div>
                      <Label className="text-gray-200">Hur äter du idag?</Label>
                      <Textarea
                        value={newClient.dietHistory}
                        onChange={(e) => setNewClient({ ...newClient, dietHistory: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[120px]"
                        placeholder="Beskriv en vanlig dag i ditt liv i matväg, gärna så detaljerat som möjligt"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-200">Matpreferenser</Label>
                      <Textarea
                        value={newClient.foodPreferences}
                        onChange={(e) => setNewClient({ ...newClient, foodPreferences: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                        placeholder="Har du några särskilda matpreferenser? Till exempelvis mat som du gillar mer eller mindre?"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-200">Allergier och intoleranser</Label>
                      <Input
                        value={newClient.allergies}
                        onChange={(e) => setNewClient({ ...newClient, allergies: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white"
                        placeholder="T.ex. gluten, laktos, nötter"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Livsstil Section */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection('lifestyle')}
                  className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                >
                  <h2 className="text-xl font-bold text-gold-light tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                    Livsstil
                  </h2>
                  {expandedSections.lifestyle ? (
                    <ChevronUp className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {expandedSections.lifestyle && (
                  <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                    <div>
                      <Label className="text-gray-200">Ta mig igenom en dag, från när du vaknar till när du går och lägger dig. Hur ser den ut för dig?</Label>
                      <Textarea
                        value={newClient.dailyRoutine}
                        onChange={(e) => setNewClient({ ...newClient, dailyRoutine: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                        placeholder="Beskriv din dag..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Övrigt Section */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection('other')}
                  className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                >
                  <h2 className="text-xl font-bold text-gold-light tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                    Övrigt
                  </h2>
                  {expandedSections.other ? (
                    <ChevronUp className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {expandedSections.other && (
                  <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                    <div>
                      <Label className="text-gray-200">Något annat du vill att jag ska veta?</Label>
                      <Textarea
                        value={newClient.other}
                        onChange={(e) => setNewClient({ ...newClient, other: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[120px]"
                        placeholder="Skriv här om det är något ytterligare du vill dela med dig av..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-gold-primary/20">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gold-primary/30 text-gray-300 hover:bg-gold-primary/10 hover:text-gold-light">
                Avbryt
              </Button>
              <Button
                onClick={handleInviteClient}
                disabled={isInviting}
                className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] font-semibold hover:opacity-90"
              >
                {isInviting ? 'Skickar...' : 'Skicka inbjudan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Dialog with GOLD Code */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-200">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 text-center">
              Klient skapad!
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-center">
              {createdClientData?.name} har bjudits in till programmet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* GOLD Code Display */}
            <div className="bg-amber-50 border-2 border-gray-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-600">GOLD Inbjudningskod</h3>
              </div>

              <div className="flex items-center gap-2 bg-gray-200 border border-amber-300 rounded-lg p-3">
                <code className="flex-1 text-xl font-mono font-bold text-amber-800 tracking-wider">
                  {createdClientData?.inviteCode}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyInviteCode(createdClientData?.inviteCode || '')}
                  className="text-amber-600 hover:bg-gray-200"
                >
                  {copiedCode ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Giltig till: {createdClientData?.inviteCodeExpiresAt && formatExpiryDate(createdClientData.inviteCodeExpiresAt)}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Instruktioner för klienten:</h4>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Gå till inloggningssidan</li>
                <li>Klicka på <span className="inline-flex items-center gap-1 font-medium text-gray-800">nyckel-ikonen 🔑</span> bredvid &quot;Har du en inbjudningskod?&quot;</li>
                <li>Ange GOLD-koden ovan</li>
                <li>Skapa ett lösenord och kom igång!</li>
              </ol>
            </div>

            {/* Email notification */}
            <div className="flex items-center gap-2 text-sm">
              <Mail className={`w-4 h-4 ${createdClientData?.emailSent ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={createdClientData?.emailSent ? 'text-green-600' : 'text-gray-400'}>
                {createdClientData?.emailSent
                  ? `En inbjudan har skickats till ${createdClientData?.email}`
                  : `Inbjudan kunde inte skickas via e-post. Dela GOLD-koden manuellt med klienten.`
                }
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setSuccessDialogOpen(false)
                setCreatedClientData(null)
                setCopiedCode(false)
              }}
              className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] font-semibold hover:opacity-90 w-full"
            >
              Stäng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Alla klienter
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {clients.length} {clients.length === 1 ? 'klient' : 'klienter'}
            </p>
          </div>
          <div className="p-6">
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Inga klienter än</h3>
                <p className="text-gray-400 mb-4">
                  Börja med att bjuda in din första klient till programmet
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] font-semibold hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Bjud in klient
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="border border-gray-200 rounded-lg hover:bg-amber-50/50 hover:border-[rgba(255,215,0,0.4)] transition-all"
                  >
                    <div className="flex items-center justify-between p-4">
                      <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center">
                          <span className="font-bold text-[#0a0a0a] text-lg">
                            {client.name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{client.name || 'Inget namn'}</p>
                            {client.status === 'pending' && (
                              <Badge className="bg-[rgba(255,165,0,0.2)] text-orange-500 border border-[rgba(255,165,0,0.3)] text-xs">
                                Väntande
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        {/* Resend Invitation Email Button */}
                        {client.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvitation(client.id, client.email)}
                            disabled={sendingInvitationFor === client.id}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2"
                          >
                            <Send className={`w-4 h-4 ${sendingInvitationFor === client.id ? 'animate-pulse' : ''}`} />
                            <span className="hidden sm:inline">
                              {sendingInvitationFor === client.id ? 'Skickar...' : 'Skicka inbjudan'}
                            </span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClient(client.id, client.email)}
                          disabled={deletingClientId === client.id}
                          className="text-[rgba(239,68,68,0.8)] hover:text-[rgb(239,68,68)] hover:bg-[rgba(239,68,68,0.1)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
