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
import { Plus, Mail, User, X, Trash2, Copy, CheckCircle2, Key, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

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
    checkInDay: 'Måndag',
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
          checkInDay: 'Måndag',
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
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto p-6 space-y-8 max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[rgba(255,215,0,0.1)] rounded w-1/4"></div>
            <div className="h-64 bg-[rgba(255,215,0,0.1)] rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3">
            Klienter
          </h1>
          <p className="text-gray-400 text-sm tracking-[1px]">
            Hantera och bjud in dina klienter
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] font-semibold hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4 mr-2" />
                Lägg till klient
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900/95 border-2 border-gold-primary/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gold-light">Lägg till ny klient</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Klientinformation */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gold-light">Klientinformation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-200">Förnamn <span className="text-red-400">*</span></Label>
                    <Input
                      id="firstName"
                      value={newClient.firstName}
                      onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                      className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-200">Efternamn <span className="text-red-400">*</span></Label>
                    <Input
                      id="lastName"
                      value={newClient.lastName}
                      onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                      className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">E-post <span className="text-red-400">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-200">Telefon</Label>
                  <Input
                    id="phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="070 123 45 67"
                    className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Taggar</Label>
                  <Select>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white">
                      <SelectValue placeholder="Välj taggar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.map(tag => (
                        <div
                          key={tag}
                          className="px-2 py-1.5 cursor-pointer hover:bg-gold-50 flex items-center gap-2"
                          onClick={() => toggleArrayItem('tags', tag)}
                        >
                          <input
                            type="checkbox"
                            checked={newClient.tags.includes(tag)}
                            readOnly
                          />
                          {tag}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  {newClient.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newClient.tags.map(tag => (
                        <Badge key={tag} className="bg-[rgba(255,215,0,0.1)] border border-gold-primary/30 text-[rgba(255,215,0,0.9)] gap-1">
                          {tag}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => toggleArrayItem('tags', tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-[rgba(255,215,0,0.2)]" />

              {/* Fysiskt tillstånd & Mål */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gold-light">Fysiskt tillstånd & Demografia</h3>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-gray-200">Födelsedatum</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newClient.birthDate}
                    onChange={(e) => setNewClient({ ...newClient, birthDate: e.target.value })}
                    className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heightCm" className="text-gray-200">Längd (cm)</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      value={newClient.heightCm}
                      onChange={(e) => setNewClient({ ...newClient, heightCm: e.target.value })}
                      placeholder="175"
                      className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentWeightKg" className="text-gray-200">Vikt (kg)</Label>
                    <Input
                      id="currentWeightKg"
                      type="number"
                      value={newClient.currentWeightKg}
                      onChange={(e) => setNewClient({ ...newClient, currentWeightKg: e.target.value })}
                      placeholder="75"
                      className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genderAtBirth" className="text-gray-200">Kön</Label>
                    <Select value={newClient.genderAtBirth} onValueChange={(value) => setNewClient({ ...newClient, genderAtBirth: value })}>
                      <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white">
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

                <div className="space-y-2">
                  <Label className="text-gray-200">Primärt mål</Label>
                  <Select value={newClient.primaryGoal} onValueChange={(value) => setNewClient({ ...newClient, primaryGoal: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white">
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

              <Separator className="bg-[rgba(255,215,0,0.2)]" />

              {/* Aktivitet & Träning */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gold-light">Aktivitet & Träning</h3>

                <div className="space-y-2">
                  <Label className="text-gray-200">Aktivitetsnivå (Fritid)</Label>
                  <Select value={newClient.activityLevelFree} onValueChange={(value) => setNewClient({ ...newClient, activityLevelFree: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white">
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

                <div className="space-y-2">
                  <Label className="text-gray-200">Aktivitetsnivå (Jobb)</Label>
                  <Select value={newClient.activityLevelWork} onValueChange={(value) => setNewClient({ ...newClient, activityLevelWork: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white">
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

                <div className="space-y-2">
                  <Label className="text-gray-200">Träningsdagar</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleArrayItem('trainingDays', day)}
                        className={`px-4 py-2 rounded-lg border font-semibold transition-all ${
                          newClient.trainingDays.includes(day)
                            ? 'bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] border-gold-light'
                            : 'bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-gray-200 hover:border-gold-light'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Träningserfarenhet</Label>
                  <Select value={newClient.trainingExperience} onValueChange={(value) => setNewClient({ ...newClient, trainingExperience: value })}>
                    <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white">
                      <SelectValue placeholder="Välj erfarenhet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Nybörjare</SelectItem>
                      <SelectItem value="experienced">Erfaren</SelectItem>
                      <SelectItem value="very_experienced">Mycket erfaren</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trainingDetails" className="text-gray-200">Träningsdetaljer</Label>
                  <Textarea
                    id="trainingDetails"
                    value={newClient.trainingDetails}
                    onChange={(e) => setNewClient({ ...newClient, trainingDetails: e.target.value })}
                    placeholder="Beskriv dina träningsvanor..."
                    rows={3}
                    className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>

              <Separator className="bg-[rgba(255,215,0,0.2)]" />

              {/* Näring */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gold-light">Näring</h3>

                <div className="space-y-2">
                  <Label htmlFor="nutritionNotes" className="text-gray-200">Nutritionsanteckningar</Label>
                  <Textarea
                    id="nutritionNotes"
                    value={newClient.nutritionNotes}
                    onChange={(e) => setNewClient({ ...newClient, nutritionNotes: e.target.value })}
                    placeholder="Matpreferenser, vanor, etc..."
                    rows={3}
                    className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Allergier</Label>
                  <div className="flex flex-wrap gap-2">
                    {allergiesList.map(allergy => (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => toggleArrayItem('allergies', allergy)}
                        className={`px-3 py-2 rounded-full border text-sm transition-all ${
                          newClient.allergies.includes(allergy)
                            ? 'bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] border-gold-light'
                            : 'bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-gray-200 hover:border-gold-light'
                        }`}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Kostpreferenser</Label>
                  <div className="flex flex-wrap gap-2">
                    {dietPreferencesList.map(pref => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => toggleArrayItem('dietaryPreferences', pref)}
                        className={`px-3 py-2 rounded-full border text-sm transition-all ${
                          newClient.dietaryPreferences.includes(pref)
                            ? 'bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] border-gold-light'
                            : 'bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-gray-200 hover:border-gold-light'
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excludedIngredients" className="text-gray-200">Exkluderade ingredienser</Label>
                  <Input
                    id="excludedIngredients"
                    value={newClient.excludedIngredients}
                    onChange={(e) => setNewClient({ ...newClient, excludedIngredients: e.target.value })}
                    placeholder="T.ex. broccoli, paprika..."
                    className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nutritionMissing" className="text-gray-200">Övrig nutritionsinformation</Label>
                  <Textarea
                    id="nutritionMissing"
                    value={newClient.nutritionMissing}
                    onChange={(e) => setNewClient({ ...newClient, nutritionMissing: e.target.value })}
                    placeholder="Något vi har missat?"
                    rows={2}
                    className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>

              <Separator className="bg-[rgba(255,215,0,0.2)]" />

              {/* Livsstil */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gold-light">Livsstil</h3>

                <div className="space-y-2">
                  <Label htmlFor="lifestyleNotes" className="text-gray-200">Livsstilsanteckningar</Label>
                  <Textarea
                    id="lifestyleNotes"
                    value={newClient.lifestyleNotes}
                    onChange={(e) => setNewClient({ ...newClient, lifestyleNotes: e.target.value })}
                    placeholder="Vanor, utmaningar, mål..."
                    rows={3}
                    className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>

              <Separator className="bg-[rgba(255,215,0,0.2)]" />

              {/* Check-in */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gold-light">Check-in</h3>
                <p className="text-sm text-gray-400">Skicka påminnelse om check-in varje gång:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-200">Check-in-period</Label>
                    <Select value={newClient.checkInPeriod} onValueChange={(value) => setNewClient({ ...newClient, checkInPeriod: value })}>
                      <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dag">Dag</SelectItem>
                        <SelectItem value="Vecka">Vecka</SelectItem>
                        <SelectItem value="Månad">Månad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-200">Dag</Label>
                    <Select value={newClient.checkInDay} onValueChange={(value) => setNewClient({ ...newClient, checkInDay: value })}>
                      <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-gold-primary/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Måndag">Måndag</SelectItem>
                        <SelectItem value="Tisdag">Tisdag</SelectItem>
                        <SelectItem value="Onsdag">Onsdag</SelectItem>
                        <SelectItem value="Torsdag">Torsdag</SelectItem>
                        <SelectItem value="Fredag">Fredag</SelectItem>
                        <SelectItem value="Lördag">Lördag</SelectItem>
                        <SelectItem value="Söndag">Söndag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gold-primary/30 text-gray-100 hover:bg-gold-50">
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
        <DialogContent className="max-w-md bg-gray-900/95 border-2 border-gold-primary/30">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#0a0a0a]" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-gold-light text-center">
              Klient skapad!
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-center">
              {createdClientData?.name} har bjudits in till programmet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* GOLD Code Display */}
            <div className="bg-[rgba(255,215,0,0.1)] border-2 border-gold-primary/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-gold-light" />
                <h3 className="font-semibold text-gold-light">GOLD Inbjudningskod</h3>
              </div>

              <div className="flex items-center gap-2 bg-black/30 border border-gold-primary/30 rounded-lg p-3">
                <code className="flex-1 text-xl font-mono font-bold text-white tracking-wider">
                  {createdClientData?.inviteCode}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyInviteCode(createdClientData?.inviteCode || '')}
                  className="text-gold-light hover:bg-[rgba(255,215,0,0.2)]"
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
            <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-4">
              <h4 className="font-semibold text-gray-100 mb-2">Instruktioner för klienten:</h4>
              <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                <li>Gå till inloggningssidan</li>
                <li>Klicka på &quot;Har du en inbjudningskod?&quot;</li>
                <li>Ange GOLD-koden ovan</li>
                <li>Skapa ett lösenord och kom igång!</li>
              </ol>
            </div>

            {/* Email notification */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mail className="w-4 h-4 text-gold-light" />
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

        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px]">
          <div className="p-6 border-b border-gold-primary/10">
            <h2 className="text-xl font-bold text-gray-100">
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
                <h3 className="text-lg font-semibold mb-2 text-gray-100">Inga klienter än</h3>
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
                    className="border border-gold-primary/20 rounded-lg hover:bg-[rgba(255,215,0,0.05)] hover:border-[rgba(255,215,0,0.4)] transition-all"
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
                            <p className="font-semibold text-gray-100">{client.name || 'Inget namn'}</p>
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
                            className="text-gold-light hover:text-orange-500 hover:bg-gold-50 gap-2"
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
                        <div className="bg-[rgba(255,215,0,0.1)] border border-gold-primary/30 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <Key className="w-4 h-4 text-gold-light" />
                              <div>
                                <p className="text-xs text-gray-400 mb-1">GOLD-kod</p>
                                <code className="text-sm font-mono font-bold text-gold-light tracking-wide">
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
                              className="text-gold-light hover:bg-[rgba(255,215,0,0.2)]"
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
    </div>
  )
}
