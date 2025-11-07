'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, Trash2, Search, UserCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Lead = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  status: string
  notes?: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<string, string> = {
  new: 'Ny',
  contacted: 'Kontaktad',
  in_dialog: 'I Dialog',
  paused: 'Pausad',
  won: 'Vunnen',
  lost: 'Förlorad',
}

const statusColors: Record<string, string> = {
  new: 'bg-[rgba(59,130,246,0.2)] text-[rgb(96,165,250)] border border-[rgba(59,130,246,0.3)]',
  contacted: 'bg-[rgba(168,85,247,0.2)] text-[rgb(192,132,252)] border border-[rgba(168,85,247,0.3)]',
  in_dialog: 'bg-[rgba(255,215,0,0.2)] text-[rgb(255,215,0)] border border-[rgba(255,215,0,0.3)]',
  paused: 'bg-[rgba(156,163,175,0.2)] text-[rgb(209,213,219)] border border-[rgba(156,163,175,0.3)]',
  won: 'bg-[rgba(34,197,94,0.2)] text-[rgb(74,222,128)] border border-[rgba(34,197,94,0.3)]',
  lost: 'bg-[rgba(239,68,68,0.2)] text-[rgb(248,113,113)] border border-[rgba(239,68,68,0.3)]',
}

export default function LeadsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [viewingLead, setViewingLead] = useState<Lead | null>(null)
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    photos: false,
    training: false,
    nutrition: false,
    lifestyle: false,
    motivation: false,
    agreement: false
  })

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    city: '',
    country: 'Sverige',

    // Physical Stats
    age: '',
    gender: '',
    height: '',
    currentWeight: '',
    goalWeight: '',

    // Current Photos
    frontPhoto: null as File | null,
    backPhoto: null as File | null,
    sidePhoto: null as File | null,

    // Training
    currentTraining: '',
    trainingExperience: '',
    trainingGoals: '',
    injuries: '',
    availableTime: '',
    workoutSchedule: '',

    // Nutrition
    dietHistory: '',
    macroTracking: '',
    digestion: '',
    allergies: '',
    favoriteFoods: '',
    foodsDislikes: '',
    supplements: '',
    previousCoaching: '',

    // Lifestyle
    stressLevel: '',
    sleepHours: '',
    occupation: '',
    lifestyle: '',

    // Motivation
    whyApply: '',
    commitment: '',
    expectations: '',
    challenges: '',

    // Agreement
    termsAccepted: false,
    signature: '',

    status: 'new',
  })

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'coach') {
      fetchLeads()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    filterLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, searchQuery, statusFilter])

  const fetchLeads = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
      } else {
        toast.error('Kunde inte hämta ansökningar')
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const filterLeads = () => {
    let filtered = [...leads]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.phone?.includes(query)
      )
    }

    setFilteredLeads(filtered)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Vänligen fyll i alla obligatoriska fält')
      return
    }

    try {
      // Create detailed lead notes
      const leadNotes = `
ANSÖKAN - 90-Dagars Challenge

=== PERSONUPPGIFTER ===
Ålder: ${formData.age || 'Ej angivet'}
Kön: ${formData.gender || 'Ej angivet'}
Stad: ${formData.city || 'Ej angivet'}
Land: ${formData.country || 'Ej angivet'}

=== FYSISKA MÅTT ===
Längd: ${formData.height || 'Ej angivet'} cm
Nuvarande vikt: ${formData.currentWeight || 'Ej angivet'} kg
Målvikt: ${formData.goalWeight || 'Ej angivet'} kg

=== AKTUELLA BILDER ===
Framsida: ${formData.frontPhoto ? formData.frontPhoto.name : 'Ej bifogad'}
Baksida: ${formData.backPhoto ? formData.backPhoto.name : 'Ej bifogad'}
Sida: ${formData.sidePhoto ? formData.sidePhoto.name : 'Ej bifogad'}

=== TRÄNING ===
Nuvarande träning: ${formData.currentTraining || 'Ej angivet'}
Erfarenhet: ${formData.trainingExperience || 'Ej angivet'}
Mål: ${formData.trainingGoals || 'Ej angivet'}
Skador/Begränsningar: ${formData.injuries || 'Ej angivet'}
Tillgänglig tid: ${formData.availableTime || 'Ej angivet'}
Träningsschema: ${formData.workoutSchedule || 'Ej angivet'}

=== NÄRING ===
Kost historik: ${formData.dietHistory || 'Ej angivet'}
Makro tracking: ${formData.macroTracking || 'Ej angivet'}
Matsmältning: ${formData.digestion || 'Ej angivet'}
Allergier: ${formData.allergies || 'Ej angivet'}
Favoritmat: ${formData.favoriteFoods || 'Ej angivet'}
Mat ogillar: ${formData.foodsDislikes || 'Ej angivet'}
Kosttillskott: ${formData.supplements || 'Ej angivet'}
Tidigare coaching: ${formData.previousCoaching || 'Ej angivet'}

=== LIVSSTIL ===
Stressnivå: ${formData.stressLevel || 'Ej angivet'}
Sömn: ${formData.sleepHours || 'Ej angivet'} timmar
Yrke: ${formData.occupation || 'Ej angivet'}
Livsstil: ${formData.lifestyle || 'Ej angivet'}

=== MOTIVATION ===
Varför ansöker du?
${formData.whyApply || 'Ej angivet'}

Åtagande:
${formData.commitment || 'Ej angivet'}

Förväntningar:
${formData.expectations || 'Ej angivet'}

Utmaningar:
${formData.challenges || 'Ej angivet'}

=== AVTAL & SIGNATUR ===
Villkor accepterade: ${formData.termsAccepted ? 'Ja' : 'Nej'}
Signatur: ${formData.signature || 'Ej angivet'}
Datum: ${new Date().toLocaleDateString('sv-SE')}
      `.trim()

      // Create new lead
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          notes: leadNotes,
          tags: ['manual-entry', 'coach-added']
        }),
      })

      if (response.ok) {
        toast.success('Ansökning skapad!')
        fetchLeads()
        setIsAddDialogOpen(false)
      } else {
        toast.error('Kunde inte skapa ansökning')
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        city: '',
        country: 'Sverige',
        age: '',
        gender: '',
        height: '',
        currentWeight: '',
        goalWeight: '',
        frontPhoto: null,
        backPhoto: null,
        sidePhoto: null,
        currentTraining: '',
        trainingExperience: '',
        trainingGoals: '',
        injuries: '',
        availableTime: '',
        workoutSchedule: '',
        dietHistory: '',
        macroTracking: '',
        digestion: '',
        allergies: '',
        favoriteFoods: '',
        foodsDislikes: '',
        supplements: '',
        previousCoaching: '',
        stressLevel: '',
        sleepHours: '',
        occupation: '',
        lifestyle: '',
        whyApply: '',
        commitment: '',
        expectations: '',
        challenges: '',
        termsAccepted: false,
        signature: '',
        status: 'new',
      })
    } catch (error) {
      console.error('Error saving lead:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna ansökning?')) return

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Ansökning borttagen!')
        fetchLeads()
      } else {
        toast.error('Kunde inte ta bort ansökning')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleConvertToClient = async (lead: Lead) => {
    if (!confirm(`Konvertera ${lead.name} till klient?`)) return

    try {
      setConvertingLeadId(lead.id)
      const response = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${lead.name} konverterad till klient!`, {
          description: `Inbjudningskod: ${data.inviteCode}`,
          duration: 10000,
        })
        fetchLeads()
        // Navigate to clients page after a short delay
        setTimeout(() => {
          router.push('/dashboard/clients')
        }, 2000)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Kunde inte konvertera till klient')
      }
    } catch (error) {
      console.error('Error converting to client:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setConvertingLeadId(null)
    }
  }

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Status uppdaterad!')
        fetchLeads()
        setViewingLead(null)
      } else {
        toast.error('Kunde inte uppdatera status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const getStatusCount = (status: string) => {
    return leads.filter((lead) => lead.status === status).length
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Du har inte behörighet att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a]">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
            Ansökningar
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Inkomna ansökningar från potentiella klienter
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Alla {leads.length > 0 && <span className="ml-1">({leads.length})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('new')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'new'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Ny {getStatusCount('new') > 0 && <span className="ml-1">({getStatusCount('new')})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('contacted')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'contacted'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Kontaktad {getStatusCount('contacted') > 0 && <span className="ml-1">({getStatusCount('contacted')})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('in_dialog')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'in_dialog'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            I Dialog {getStatusCount('in_dialog') > 0 && <span className="ml-1">({getStatusCount('in_dialog')})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'paused'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Pausad {getStatusCount('paused') > 0 && <span className="ml-1">({getStatusCount('paused')})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('won')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'won'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Vunnen {getStatusCount('won') > 0 && <span className="ml-1">({getStatusCount('won')})</span>}
          </button>
          <button
            onClick={() => setStatusFilter('lost')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'lost'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]'
            }`}
          >
            Förlorad {getStatusCount('lost') > 0 && <span className="ml-1">({getStatusCount('lost')})</span>}
          </button>
        </div>

      <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px]">
        <div className="p-6 border-b border-[rgba(255,215,0,0.1)]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[rgba(255,255,255,0.9)]">
              Visar {filteredLeads.length} ansökning{filteredLeads.length !== 1 ? 'ar' : ''}
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(255,215,0,0.5)]" />
                <Input
                  placeholder="Sök..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold hover:opacity-90 transition-opacity">
                    Lägg till ansökning
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a] border-2 border-[rgba(255,215,0,0.3)]">
                  <DialogHeader className="border-b border-[rgba(255,215,0,0.2)] pb-4">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent font-['Orbitron',sans-serif]">
                      Lägg till ansökning
                    </DialogTitle>
                    <p className="text-[rgba(255,255,255,0.6)] text-sm mt-2">
                      Fyll i formuläret för att skapa en ny klientansökan
                    </p>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Personal Information */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => toggleSection('personal')}
                        className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                      >
                        <h3 className="text-lg font-bold text-[#FFD700] tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                          Personuppgifter
                        </h3>
                        {expandedSections.personal ? (
                          <ChevronUp className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        )}
                      </button>

                      {expandedSections.personal && (
                        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-4 backdrop-blur-[10px] space-y-4">
                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Fullständigt namn *</Label>
                            <Input
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                              placeholder="För- och efternamn"
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-[rgba(255,255,255,0.8)]">E-post *</Label>
                              <Input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                                placeholder="email@example.com"
                              />
                            </div>
                            <div>
                              <Label className="text-[rgba(255,255,255,0.8)]">Telefon *</Label>
                              <Input
                                required
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                                placeholder="070-123 45 67"
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-[rgba(255,255,255,0.8)]">Stad</Label>
                              <Input
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                                placeholder="Stockholm"
                              />
                            </div>
                            <div>
                              <Label className="text-[rgba(255,255,255,0.8)]">Land</Label>
                              <Input
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                                placeholder="Sverige"
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-[rgba(255,255,255,0.8)]">Ålder</Label>
                              <Input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                                placeholder="25"
                              />
                            </div>
                            <div>
                              <Label className="text-[rgba(255,255,255,0.8)]">Kön</Label>
                              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                                <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
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

                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-[rgba(255,255,255,0.8)]">Längd (cm)</Label>
                              <Input
                                type="number"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                                placeholder="175"
                              />
                            </div>
                            <div>
                              <Label className="text-[rgba(255,255,255,0.8)]">Nuvarande vikt (kg)</Label>
                              <Input
                                type="number"
                                value={formData.currentWeight}
                                onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                                placeholder="80"
                              />
                            </div>
                            <div>
                              <Label className="text-[rgba(255,255,255,0.8)]">Målvikt (kg)</Label>
                              <Input
                                type="number"
                                value={formData.goalWeight}
                                onChange={(e) => setFormData({ ...formData, goalWeight: e.target.value })}
                                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                                placeholder="70"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Training */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => toggleSection('training')}
                        className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                      >
                        <h3 className="text-lg font-bold text-[#FFD700] tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                          Träning
                        </h3>
                        {expandedSections.training ? (
                          <ChevronUp className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        )}
                      </button>

                      {expandedSections.training && (
                        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-4 backdrop-blur-[10px] space-y-4">
                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Nuvarande träning</Label>
                            <Textarea
                              value={formData.currentTraining}
                              onChange={(e) => setFormData({ ...formData, currentTraining: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[80px]"
                              placeholder="Beskriv nuvarande träningsrutin"
                            />
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Träningserfarenhet</Label>
                            <Select value={formData.trainingExperience} onValueChange={(value) => setFormData({ ...formData, trainingExperience: value })}>
                              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                                <SelectValue placeholder="Välj erfarenhetsnivå" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">Nybörjare (0-6 månader)</SelectItem>
                                <SelectItem value="intermediate">Medel (6 månader - 2 år)</SelectItem>
                                <SelectItem value="advanced">Avancerad (2+ år)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Träningsmål</Label>
                            <Textarea
                              value={formData.trainingGoals}
                              onChange={(e) => setFormData({ ...formData, trainingGoals: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[60px]"
                              placeholder="Vad vill du uppnå?"
                            />
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Skador/begränsningar</Label>
                            <Textarea
                              value={formData.injuries}
                              onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[60px]"
                              placeholder="Eventuella skador eller begränsningar"
                            />
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Tillgänglig tid</Label>
                            <Select value={formData.availableTime} onValueChange={(value) => setFormData({ ...formData, availableTime: value })}>
                              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                                <SelectValue placeholder="Hur många dagar/vecka?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-2">1-2 dagar/vecka</SelectItem>
                                <SelectItem value="3-4">3-4 dagar/vecka</SelectItem>
                                <SelectItem value="5-6">5-6 dagar/vecka</SelectItem>
                                <SelectItem value="7">7 dagar/vecka</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Träningsschema</Label>
                            <Input
                              value={formData.workoutSchedule}
                              onChange={(e) => setFormData({ ...formData, workoutSchedule: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                              placeholder="T.ex. 'Morgon 06:00'"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nutrition */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => toggleSection('nutrition')}
                        className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                      >
                        <h3 className="text-lg font-bold text-[#FFD700] tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                          Näring
                        </h3>
                        {expandedSections.nutrition ? (
                          <ChevronUp className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        )}
                      </button>

                      {expandedSections.nutrition && (
                        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-4 backdrop-blur-[10px] space-y-4">
                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Kost historik</Label>
                            <Textarea
                              value={formData.dietHistory}
                              onChange={(e) => setFormData({ ...formData, dietHistory: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[80px]"
                              placeholder="Tidigare erfarenheter av kostförändringar"
                            />
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Makroräkning</Label>
                            <Select value={formData.macroTracking} onValueChange={(value) => setFormData({ ...formData, macroTracking: value })}>
                              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                                <SelectValue placeholder="Erfarenhet av makroräkning?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="never">Aldrig</SelectItem>
                                <SelectItem value="some">Lite erfarenhet</SelectItem>
                                <SelectItem value="experienced">Mycket erfarenhet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Allergier</Label>
                            <Input
                              value={formData.allergies}
                              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                              placeholder="T.ex. gluten, laktos"
                            />
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Favoritmat</Label>
                            <Input
                              value={formData.favoriteFoods}
                              onChange={(e) => setFormData({ ...formData, favoriteFoods: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                              placeholder="Mat du älskar"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lifestyle */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => toggleSection('lifestyle')}
                        className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                      >
                        <h3 className="text-lg font-bold text-[#FFD700] tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                          Livsstil
                        </h3>
                        {expandedSections.lifestyle ? (
                          <ChevronUp className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        )}
                      </button>

                      {expandedSections.lifestyle && (
                        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-4 backdrop-blur-[10px] space-y-4">
                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Stressnivå</Label>
                            <Select value={formData.stressLevel} onValueChange={(value) => setFormData({ ...formData, stressLevel: value })}>
                              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                                <SelectValue placeholder="Hur stressad känner du dig?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Låg stress</SelectItem>
                                <SelectItem value="medium">Måttlig stress</SelectItem>
                                <SelectItem value="high">Hög stress</SelectItem>
                                <SelectItem value="very-high">Mycket hög stress</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Sömn per natt</Label>
                            <Select value={formData.sleepHours} onValueChange={(value) => setFormData({ ...formData, sleepHours: value })}>
                              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                                <SelectValue placeholder="Hur många timmar?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="<5">Mindre än 5 timmar</SelectItem>
                                <SelectItem value="5-6">5-6 timmar</SelectItem>
                                <SelectItem value="6-7">6-7 timmar</SelectItem>
                                <SelectItem value="7-8">7-8 timmar</SelectItem>
                                <SelectItem value=">8">Mer än 8 timmar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Yrke</Label>
                            <Input
                              value={formData.occupation}
                              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                              placeholder="Vad arbetar du med?"
                            />
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Livsstil</Label>
                            <Textarea
                              value={formData.lifestyle}
                              onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[80px]"
                              placeholder="Beskriv din vardag"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Motivation */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => toggleSection('motivation')}
                        className="w-full flex items-center justify-between p-4 bg-[rgba(255,215,0,0.1)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg hover:border-[rgba(255,215,0,0.5)] transition-all group"
                      >
                        <h3 className="text-lg font-bold text-[#FFD700] tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                          Motivation
                        </h3>
                        {expandedSections.motivation ? (
                          <ChevronUp className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        )}
                      </button>

                      {expandedSections.motivation && (
                        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-4 backdrop-blur-[10px] space-y-4">
                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Varför ansöker du?</Label>
                            <Textarea
                              value={formData.whyApply}
                              onChange={(e) => setFormData({ ...formData, whyApply: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[100px]"
                              placeholder="Dina mål och motivation"
                            />
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Åtagande</Label>
                            <Select value={formData.commitment} onValueChange={(value) => setFormData({ ...formData, commitment: value })}>
                              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                                <SelectValue placeholder="Kan du följa planen?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes-100">Ja, 100% committed</SelectItem>
                                <SelectItem value="yes-mostly">Ja, men behöver flexibilitet</SelectItem>
                                <SelectItem value="unsure">Osäker</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-[rgba(255,255,255,0.8)]">Förväntningar</Label>
                            <Textarea
                              value={formData.expectations}
                              onChange={(e) => setFormData({ ...formData, expectations: e.target.value })}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white min-h-[80px]"
                              placeholder="Vad förväntar du dig?"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,215,0,0.2)]">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false)
                          setFormData({
                            name: '',
                            email: '',
                            phone: '',
                            city: '',
                            country: 'Sverige',
                            age: '',
                            gender: '',
                            height: '',
                            currentWeight: '',
                            goalWeight: '',
                            frontPhoto: null,
                            backPhoto: null,
                            sidePhoto: null,
                            currentTraining: '',
                            trainingExperience: '',
                            trainingGoals: '',
                            injuries: '',
                            availableTime: '',
                            workoutSchedule: '',
                            dietHistory: '',
                            macroTracking: '',
                            digestion: '',
                            allergies: '',
                            favoriteFoods: '',
                            foodsDislikes: '',
                            supplements: '',
                            previousCoaching: '',
                            stressLevel: '',
                            sleepHours: '',
                            occupation: '',
                            lifestyle: '',
                            whyApply: '',
                            commitment: '',
                            expectations: '',
                            challenges: '',
                            termsAccepted: false,
                            signature: '',
                            status: 'new',
                          })
                        }}
                        className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,215,0,0.1)]"
                      >
                        Avbryt
                      </Button>
                      <Button type="submit" className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold hover:opacity-90">
                        Skapa ansökning
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-[rgba(255,255,255,0.5)] text-center py-8">Laddar...</p>
          ) : filteredLeads.length === 0 ? (
            <p className="text-[rgba(255,255,255,0.5)] text-center py-8">Inga ansökningar hittades.</p>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 pb-3 border-b border-[rgba(255,215,0,0.2)] font-semibold text-sm text-[rgba(255,215,0,0.8)]">
                <div className="col-span-3">Namn</div>
                <div className="col-span-3">Telefon</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Skapad den</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table rows */}
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="grid grid-cols-12 gap-4 py-3 border-b border-[rgba(255,215,0,0.1)] items-center hover:bg-[rgba(255,215,0,0.05)] transition-colors rounded-lg px-2"
                >
                  <div className="col-span-3 font-medium text-[rgba(255,255,255,0.9)]">{lead.name}</div>
                  <div className="col-span-3 text-[rgba(255,255,255,0.6)]">
                    {lead.phone || '-'}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[lead.status]
                      }`}
                    >
                      {statusLabels[lead.status]}
                    </span>
                  </div>
                  <div className="col-span-3 text-[rgba(255,255,255,0.6)] text-sm">
                    {new Date(lead.createdAt).toLocaleDateString('sv-SE')}
                  </div>
                  <div className="col-span-1 flex gap-2 justify-end">
                    <Dialog open={viewingLead?.id === lead.id} onOpenChange={(open) => !open && setViewingLead(null)}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setViewingLead(lead)}
                          className="p-2 hover:bg-[rgba(255,215,0,0.1)] rounded transition-colors text-[rgba(255,215,0,0.8)] hover:text-[#FFD700]"
                          title="Visa ansökning"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a] border-2 border-[rgba(255,215,0,0.3)]">
                        <DialogHeader className="border-b border-[rgba(255,215,0,0.2)] pb-4">
                          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                            Ansökning - {lead.name}
                          </DialogTitle>
                          <p className="text-[rgba(255,255,255,0.5)] text-sm mt-2">
                            Mottagen {new Date(lead.createdAt).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </DialogHeader>
                        <div className="space-y-4 py-6">
                          {/* Contact Info */}
                          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-5">
                            <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center gap-2">
                              📞 Kontaktinformation
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-[rgba(255,215,0,0.7)] mb-1">Namn</p>
                                <p className="text-[rgba(255,255,255,0.9)] font-medium">{lead.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[rgba(255,215,0,0.7)] mb-1">E-post</p>
                                <p className="text-[rgba(255,255,255,0.9)]">{lead.email || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[rgba(255,215,0,0.7)] mb-1">Telefon</p>
                                <p className="text-[rgba(255,255,255,0.9)]">{lead.phone || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[rgba(255,215,0,0.7)] mb-1">Status</p>
                                <Select
                                  value={lead.status}
                                  onValueChange={(value) => handleUpdateStatus(lead.id, value)}
                                >
                                  <SelectTrigger className="bg-[rgba(0,0,0,0.5)] border-[rgba(255,215,0,0.3)] text-white h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(statusLabels).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Application Details - Formatted */}
                          {lead.notes && lead.notes.includes('===') && (
                            <>
                              {/* Personal Info */}
                              {lead.notes.match(/=== PERSONUPPGIFTER ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center gap-2">
                                    👤 Personuppgifter
                                  </h3>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    {lead.notes.match(/Ålder: (.*)/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Ålder:</span>
                                        <span className="text-[rgba(255,255,255,0.9)] ml-2">{lead.notes.match(/Ålder: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Kön: (.*)/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Kön:</span>
                                        <span className="text-[rgba(255,255,255,0.9)] ml-2">{lead.notes.match(/Kön: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Stad: (.*)/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Stad:</span>
                                        <span className="text-[rgba(255,255,255,0.9)] ml-2">{lead.notes.match(/Stad: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Land: (.*)/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Land:</span>
                                        <span className="text-[rgba(255,255,255,0.9)] ml-2">{lead.notes.match(/Land: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Hittade oss via: (.*)/)?.[1] && (
                                      <div className="col-span-2">
                                        <span className="text-[rgba(255,215,0,0.7)]">Hittade oss via:</span>
                                        <span className="text-[rgba(255,255,255,0.9)] ml-2">{lead.notes.match(/Hittade oss via: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Physical Stats */}
                              {lead.notes.match(/=== FYSISKA MÅTT ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center gap-2">
                                    📏 Fysiska mått
                                  </h3>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    {lead.notes.match(/Längd: (.*?) cm/)?.[1] && (
                                      <div className="bg-[rgba(0,0,0,0.3)] p-3 rounded-lg border border-[rgba(255,215,0,0.1)]">
                                        <p className="text-[rgba(255,215,0,0.7)] text-xs mb-1">Längd</p>
                                        <p className="text-[rgba(255,255,255,0.9)] font-semibold text-lg">{lead.notes.match(/Längd: (.*?) cm/)?.[1]} cm</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Nuvarande vikt: (.*?) kg/)?.[1] && (
                                      <div className="bg-[rgba(0,0,0,0.3)] p-3 rounded-lg border border-[rgba(255,215,0,0.1)]">
                                        <p className="text-[rgba(255,215,0,0.7)] text-xs mb-1">Nuvarande vikt</p>
                                        <p className="text-[rgba(255,255,255,0.9)] font-semibold text-lg">{lead.notes.match(/Nuvarande vikt: (.*?) kg/)?.[1]} kg</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Målvikt: (.*?) kg/)?.[1] && (
                                      <div className="bg-[rgba(0,0,0,0.3)] p-3 rounded-lg border border-[rgba(255,215,0,0.1)]">
                                        <p className="text-[rgba(255,215,0,0.7)] text-xs mb-1">Målvikt</p>
                                        <p className="text-[rgba(34,197,94,0.9)] font-semibold text-lg">{lead.notes.match(/Målvikt: (.*?) kg/)?.[1]} kg</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Training */}
                              {lead.notes.match(/=== TRÄNING ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center gap-2">
                                    💪 Träning
                                  </h3>
                                  <div className="space-y-3 text-sm">
                                    {lead.notes.match(/Nuvarande träning: (.*)/)?.[1] && lead.notes.match(/Nuvarande träning: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Nuvarande träning</p>
                                        <p className="text-[rgba(255,255,255,0.9)]">{lead.notes.match(/Nuvarande träning: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Erfarenhet: (.*)/)?.[1] && lead.notes.match(/Erfarenhet: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Erfarenhet</p>
                                        <p className="text-[rgba(255,255,255,0.9)]">{lead.notes.match(/Erfarenhet: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Mål: (.*)/)?.[1] && lead.notes.match(/Mål: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Träningsmål</p>
                                        <p className="text-[rgba(255,255,255,0.9)]">{lead.notes.match(/Mål: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Skador\/Begränsningar: (.*)/)?.[1] && lead.notes.match(/Skador\/Begränsningar: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Skador/Begränsningar</p>
                                        <p className="text-[rgba(255,255,255,0.9)]">{lead.notes.match(/Skador\/Begränsningar: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Nutrition */}
                              {lead.notes.match(/=== NÄRING ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center gap-2">
                                    🍎 Näring & Kost
                                  </h3>
                                  <div className="space-y-3 text-sm">
                                    {lead.notes.match(/Kost historik: (.*)/)?.[1] && lead.notes.match(/Kost historik: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Kost historik</p>
                                        <p className="text-[rgba(255,255,255,0.9)]">{lead.notes.match(/Kost historik: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Allergier: (.*)/)?.[1] && lead.notes.match(/Allergier: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Allergier</p>
                                        <p className="text-[rgba(255,255,255,0.9)]">{lead.notes.match(/Allergier: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Tidigare coaching: (.*)/)?.[1] && lead.notes.match(/Tidigare coaching: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-1">Tidigare coaching</p>
                                        <p className="text-[rgba(255,255,255,0.9)]">{lead.notes.match(/Tidigare coaching: (.*)/)?.[1]}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Lifestyle */}
                              {lead.notes.match(/=== LIVSSTIL ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center gap-2">
                                    🌟 Livsstil
                                  </h3>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    {lead.notes.match(/Stressnivå: (.*)/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Stressnivå:</span>
                                        <span className="text-[rgba(255,255,255,0.9)] ml-2">{lead.notes.match(/Stressnivå: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Sömn: (.*?) timmar/)?.[1] && (
                                      <div>
                                        <span className="text-[rgba(255,215,0,0.7)]">Sömn:</span>
                                        <span className="text-[rgba(255,255,255,0.9)] ml-2">{lead.notes.match(/Sömn: (.*?) timmar/)?.[1]} timmar</span>
                                      </div>
                                    )}
                                    {lead.notes.match(/Yrke: (.*)/)?.[1] && lead.notes.match(/Yrke: (.*)/)?.[1] !== 'Ej angivet' && (
                                      <div className="col-span-2">
                                        <span className="text-[rgba(255,215,0,0.7)]">Yrke:</span>
                                        <span className="text-[rgba(255,255,255,0.9)] ml-2">{lead.notes.match(/Yrke: (.*)/)?.[1]}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Motivation */}
                              {lead.notes.match(/=== MOTIVATION ===([\s\S]*?)===/)?.[1] && (
                                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-5">
                                  <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center gap-2">
                                    🎯 Motivation & Mål
                                  </h3>
                                  <div className="space-y-4 text-sm">
                                    {lead.notes.match(/Varför ansöker du\?([\s\S]*?)(?=Åtagande:|===|$)/)?.[1]?.trim() && lead.notes.match(/Varför ansöker du\?([\s\S]*?)(?=Åtagande:|===|$)/)?.[1]?.trim() !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-2 font-medium">Varför ansöker du?</p>
                                        <p className="text-[rgba(255,255,255,0.9)] bg-[rgba(0,0,0,0.3)] p-3 rounded-lg border border-[rgba(255,215,0,0.1)] whitespace-pre-wrap">
                                          {lead.notes.match(/Varför ansöker du\?([\s\S]*?)(?=Åtagande:|===|$)/)?.[1]?.trim()}
                                        </p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Åtagande:([\s\S]*?)(?=Förväntningar:|===|$)/)?.[1]?.trim() && lead.notes.match(/Åtagande:([\s\S]*?)(?=Förväntningar:|===|$)/)?.[1]?.trim() !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-2 font-medium">Åtagande</p>
                                        <p className="text-[rgba(255,255,255,0.9)] bg-[rgba(0,0,0,0.3)] p-3 rounded-lg border border-[rgba(255,215,0,0.1)] whitespace-pre-wrap">
                                          {lead.notes.match(/Åtagande:([\s\S]*?)(?=Förväntningar:|===|$)/)?.[1]?.trim()}
                                        </p>
                                      </div>
                                    )}
                                    {lead.notes.match(/Förväntningar:([\s\S]*?)(?=Utmaningar:|===|$)/)?.[1]?.trim() && lead.notes.match(/Förväntningar:([\s\S]*?)(?=Utmaningar:|===|$)/)?.[1]?.trim() !== 'Ej angivet' && (
                                      <div>
                                        <p className="text-[rgba(255,215,0,0.7)] mb-2 font-medium">Förväntningar</p>
                                        <p className="text-[rgba(255,255,255,0.9)] bg-[rgba(0,0,0,0.3)] p-3 rounded-lg border border-[rgba(255,215,0,0.1)] whitespace-pre-wrap">
                                          {lead.notes.match(/Förväntningar:([\s\S]*?)(?=Utmaningar:|===|$)/)?.[1]?.trim()}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {/* Fallback for simple notes */}
                          {lead.notes && !lead.notes.includes('===') && (
                            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-5">
                              <h3 className="text-lg font-semibold text-[#FFD700] mb-4">Anteckningar</h3>
                              <div className="text-[rgba(255,255,255,0.8)] whitespace-pre-wrap text-sm leading-relaxed">
                                {lead.notes}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-5">
                              <h3 className="text-lg font-semibold text-[#FFD700] mb-3">Taggar</h3>
                              <div className="flex flex-wrap gap-2">
                                {lead.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-gradient-to-r from-[rgba(255,215,0,0.1)] to-[rgba(255,165,0,0.1)] border border-[rgba(255,215,0,0.3)] rounded-full text-sm text-[#FFD700] font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-end gap-3 pt-6 border-t border-[rgba(255,215,0,0.2)]">
                            <Button
                              variant="outline"
                              onClick={() => setViewingLead(null)}
                              className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,215,0,0.1)] hover:border-[rgba(255,215,0,0.5)]"
                            >
                              Stäng
                            </Button>
                            <Button
                              onClick={() => {
                                handleConvertToClient(lead)
                                setViewingLead(null)
                              }}
                              disabled={lead.status === 'won'}
                              className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[rgba(34,197,94,0.2)]"
                            >
                              {lead.status === 'won' ? 'Redan konverterad' : 'Konvertera till klient'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <button
                      onClick={() => handleConvertToClient(lead)}
                      disabled={convertingLeadId === lead.id || lead.status === 'won'}
                      className="p-2 hover:bg-[rgba(34,197,94,0.1)] rounded transition-colors text-[rgba(34,197,94,0.8)] hover:text-[rgb(34,197,94)] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Skapa klient"
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="p-2 hover:bg-[rgba(239,68,68,0.1)] rounded transition-colors text-[rgba(239,68,68,0.8)] hover:text-[rgb(239,68,68)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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
