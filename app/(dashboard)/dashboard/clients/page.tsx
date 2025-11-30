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
import { Plus, Mail, User, X, Trash2, Copy, CheckCircle2, Key, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
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
  firstName: string
  lastName: string
  email: string
  phone: string
  tags: string[]
  checkInPeriod: string
  checkInDay: string
  // Onboarding fields
  primaryGoal: string
  heightCm: string
  currentWeightKg: string
  genderAtBirth: string
  birthDate: string
  activityLevelFree: string
  activityLevelWork: string
  nutritionNotes: string
  allergies: string[]
  dietaryPreferences: string[]
  excludedIngredients: string
  nutritionMissing: string
  trainingDays: string[]
  trainingExperience: string
  trainingDetails: string
  lifestyleNotes: string
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
  } | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [generatingCodeFor, setGeneratingCodeFor] = useState<string | null>(null)
  const [newClient, setNewClient] = useState<NewClientForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tags: [],
    checkInPeriod: 'Vecka',
    checkInDay: 'Söndag',
    // Onboarding defaults
    primaryGoal: '',
    heightCm: '',
    currentWeightKg: '',
    genderAtBirth: '',
    birthDate: '',
    activityLevelFree: '',
    activityLevelWork: '',
    nutritionNotes: '',
    allergies: [],
    dietaryPreferences: [],
    excludedIngredients: '',
    nutritionMissing: '',
    trainingDays: [],
    trainingExperience: '',
    trainingDetails: '',
    lifestyleNotes: '',
  })

  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    physical: false,
    training: false,
    nutrition: false,
    lifestyle: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const availableTags = ['Nutrition Only', 'VIP', 'Workout Only']

  const allergiesList = [
    'Gluten', 'Laktos', 'Nötter', 'Skaldjur', 'Ägg', 'Soja'
  ]

  const dietPreferencesList = [
    'pescetarian', 'vegan', 'vegetarian', 'halal', 'kosher', 'no_supplements'
  ]

  const daysOfWeek = ['MÅN', 'TIS', 'ONS', 'TORS', 'FRE', 'LÖR', 'SÖN']

  const toggleArrayItem = (field: 'tags' | 'allergies' | 'dietaryPreferences' | 'trainingDays', value: string) => {
    setNewClient(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item: string) => item !== value)
        : [...prev[field], value]
    }))
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
          tags: [],
          checkInPeriod: 'Vecka',
          checkInDay: 'Söndag',
          primaryGoal: '',
          heightCm: '',
          currentWeightKg: '',
          genderAtBirth: '',
          birthDate: '',
          activityLevelFree: '',
          activityLevelWork: '',
          nutritionNotes: '',
          allergies: [],
          dietaryPreferences: [],
          excludedIngredients: '',
          nutritionMissing: '',
          trainingDays: [],
          trainingExperience: '',
          trainingDetails: '',
          lifestyleNotes: '',
        })
        // Reset expanded sections
        setExpandedSections({
          personal: true,
          physical: false,
          training: false,
          nutrition: false,
          lifestyle: false,
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
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
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
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-200">Telefon</Label>
                        <Input
                          value={newClient.phone}
                          onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="070-123 45 67"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-200">Taggar</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {availableTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleArrayItem('tags', tag)}
                            className={`px-3 py-2 rounded-full border text-sm transition-all ${
                              newClient.tags.includes(tag)
                                ? 'bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] border-gold-light'
                                : 'bg-black/30 border-gold-primary/30 text-gray-300 hover:border-[rgba(255,215,0,0.5)]'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fysiskt tillstånd & Demografia Section */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection('physical')}
                  className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                >
                  <h2 className="text-xl font-bold text-gold-light tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                    Fysiskt tillstånd & Demografia
                  </h2>
                  {expandedSections.physical ? (
                    <ChevronUp className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {expandedSections.physical && (
                  <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                    <div>
                      <Label className="text-gray-200">Födelsedatum</Label>
                      <Input
                        type="date"
                        value={newClient.birthDate}
                        onChange={(e) => setNewClient({ ...newClient, birthDate: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-200">Längd (cm)</Label>
                        <Input
                          type="number"
                          value={newClient.heightCm}
                          onChange={(e) => setNewClient({ ...newClient, heightCm: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="175"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-200">Vikt (kg)</Label>
                        <Input
                          type="number"
                          value={newClient.currentWeightKg}
                          onChange={(e) => setNewClient({ ...newClient, currentWeightKg: e.target.value })}
                          className="bg-black/30 border-gold-primary/30 text-white"
                          placeholder="75"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-200">Kön</Label>
                        <Select value={newClient.genderAtBirth} onValueChange={(value) => setNewClient({ ...newClient, genderAtBirth: value })}>
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

                    <div>
                      <Label className="text-gray-200">Primärt mål</Label>
                      <Select value={newClient.primaryGoal} onValueChange={(value) => setNewClient({ ...newClient, primaryGoal: value })}>
                        <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                          <SelectValue placeholder="Välj mål" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="build_muscle">Bygga muskler</SelectItem>
                          <SelectItem value="get_fit">Komma i form</SelectItem>
                          <SelectItem value="healthy_habits">Bygga hälsosamma vanor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Aktivitet & Träning Section */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection('training')}
                  className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                >
                  <h2 className="text-xl font-bold text-gold-light tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                    Aktivitet & Träning
                  </h2>
                  {expandedSections.training ? (
                    <ChevronUp className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gold-light group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {expandedSections.training && (
                  <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-200">Aktivitetsnivå (Fritid)</Label>
                        <Select value={newClient.activityLevelFree} onValueChange={(value) => setNewClient({ ...newClient, activityLevelFree: value })}>
                          <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                            <SelectValue placeholder="Välj nivå" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="very_low">Mycket låg</SelectItem>
                            <SelectItem value="low">Låg</SelectItem>
                            <SelectItem value="medium">Medel</SelectItem>
                            <SelectItem value="active">Aktiv</SelectItem>
                            <SelectItem value="very_active">Mycket aktiv</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-200">Aktivitetsnivå (Jobb)</Label>
                        <Select value={newClient.activityLevelWork} onValueChange={(value) => setNewClient({ ...newClient, activityLevelWork: value })}>
                          <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                            <SelectValue placeholder="Välj nivå" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="very_low">Mycket låg</SelectItem>
                            <SelectItem value="low">Låg</SelectItem>
                            <SelectItem value="medium">Medel</SelectItem>
                            <SelectItem value="high">Hög</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-200">Träningsdagar</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {daysOfWeek.map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleArrayItem('trainingDays', day)}
                            className={`px-4 py-2 rounded-lg border font-semibold transition-all ${
                              newClient.trainingDays.includes(day)
                                ? 'bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] border-gold-light'
                                : 'bg-black/30 border-gold-primary/30 text-gray-300 hover:border-[rgba(255,215,0,0.5)]'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-200">Träningserfarenhet</Label>
                      <Select value={newClient.trainingExperience} onValueChange={(value) => setNewClient({ ...newClient, trainingExperience: value })}>
                        <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                          <SelectValue placeholder="Välj erfarenhet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Nybörjare</SelectItem>
                          <SelectItem value="experienced">Erfaren</SelectItem>
                          <SelectItem value="very_experienced">Mycket erfaren</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-200">Träningsdetaljer</Label>
                      <Textarea
                        value={newClient.trainingDetails}
                        onChange={(e) => setNewClient({ ...newClient, trainingDetails: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                        placeholder="Beskriv dina träningsvanor..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Näring Section */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection('nutrition')}
                  className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                >
                  <h2 className="text-xl font-bold text-gold-light tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                    Näring
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
                      <Label className="text-gray-200">Nutritionsanteckningar</Label>
                      <Textarea
                        value={newClient.nutritionNotes}
                        onChange={(e) => setNewClient({ ...newClient, nutritionNotes: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                        placeholder="Matpreferenser, vanor, etc..."
                      />
                    </div>

                    <div>
                      <Label className="text-gray-200">Allergier</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {allergiesList.map(allergy => (
                          <button
                            key={allergy}
                            type="button"
                            onClick={() => toggleArrayItem('allergies', allergy)}
                            className={`px-3 py-2 rounded-full border text-sm transition-all ${
                              newClient.allergies.includes(allergy)
                                ? 'bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] border-gold-light'
                                : 'bg-black/30 border-gold-primary/30 text-gray-300 hover:border-[rgba(255,215,0,0.5)]'
                            }`}
                          >
                            {allergy}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-200">Kostpreferenser</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dietPreferencesList.map(pref => (
                          <button
                            key={pref}
                            type="button"
                            onClick={() => toggleArrayItem('dietaryPreferences', pref)}
                            className={`px-3 py-2 rounded-full border text-sm transition-all ${
                              newClient.dietaryPreferences.includes(pref)
                                ? 'bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] border-gold-light'
                                : 'bg-black/30 border-gold-primary/30 text-gray-300 hover:border-[rgba(255,215,0,0.5)]'
                            }`}
                          >
                            {pref}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-200">Exkluderade ingredienser</Label>
                      <Input
                        value={newClient.excludedIngredients}
                        onChange={(e) => setNewClient({ ...newClient, excludedIngredients: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white"
                        placeholder="T.ex. broccoli, paprika..."
                      />
                    </div>

                    <div>
                      <Label className="text-gray-200">Övrig nutritionsinformation</Label>
                      <Textarea
                        value={newClient.nutritionMissing}
                        onChange={(e) => setNewClient({ ...newClient, nutritionMissing: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[80px]"
                        placeholder="Något vi har missat?"
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
                      <Label className="text-gray-200">Livsstilsanteckningar</Label>
                      <Textarea
                        value={newClient.lifestyleNotes}
                        onChange={(e) => setNewClient({ ...newClient, lifestyleNotes: e.target.value })}
                        className="bg-black/30 border-gold-primary/30 text-white min-h-[100px]"
                        placeholder="Vanor, utmaningar, mål..."
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
                <li>Klicka på &quot;Har du en inbjudningskod?&quot;</li>
                <li>Ange GOLD-koden ovan</li>
                <li>Skapa ett lösenord och kom igång!</li>
              </ol>
            </div>

            {/* Email notification */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mail className="w-4 h-4 text-amber-600" />
              <span>En inbjudan har också skickats till {createdClientData?.email}</span>
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
                      <Link href={`/dashboard/journal?client=${client.id}`} className="flex items-center gap-4 flex-1">
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
                        {/* Generate/Regenerate GOLD Code Button */}
                        {(!client.inviteCode || client.status === 'pending') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateInviteCode(client.id)}
                            disabled={generatingCodeFor === client.id}
                            className="text-amber-600 hover:text-orange-500 hover:bg-gold-50 gap-2"
                          >
                            <RefreshCw className={`w-4 h-4 ${generatingCodeFor === client.id ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">
                              {client.inviteCode ? 'Ny kod' : 'Generera kod'}
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

                    {/* Show GOLD code for pending clients */}
                    {client.status === 'pending' && client.inviteCode && (
                      <div className="px-4 pb-4">
                        <div className="bg-amber-50 border border-gray-300 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <Key className="w-4 h-4 text-amber-600" />
                              <div>
                                <p className="text-xs text-gray-400 mb-1">GOLD-kod</p>
                                <code className="text-sm font-mono font-bold text-amber-600 tracking-wide">
                                  {client.inviteCode}
                                </code>
                                {client.inviteCodeExpiresAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Giltig till: {formatExpiryDate(client.inviteCodeExpiresAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyInviteCode(client.inviteCode || '')}
                              className="text-amber-600 hover:bg-gray-200"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
