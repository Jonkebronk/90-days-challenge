'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Dumbbell, Heart, Trash2,
  User, Mail, Target, Utensils, Moon,
  Activity, ChevronDown, ChevronUp, Image, Pencil, X, Save, KeyRound
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Client {
  id: string
  name: string | null
  email: string
  firstName: string | null
  lastName: string | null
  status: string
  phone: string | null
  city: string | null
  country: string | null
  age: number | null
  gender: string | null
  height: number | null
  currentWeight: number | null
  currentTraining: string | null
  trainingExperience: string | null
  trainingGoal: string | null
  injuries: string | null
  availableTime: string | null
  preferredSchedule: string | null
  dietHistory: string | null
  macroExperience: string | null
  digestionIssues: string | null
  allergies: string | null
  favoriteFood: string | null
  dislikedFood: string | null
  supplements: string | null
  previousCoaching: string | null
  stressLevel: string | null
  sleepHours: string | null
  occupation: string | null
  lifestyle: string | null
  whyJoin: string | null
  canFollowPlan: string | null
  expectations: string | null
  biggestChallenges: string | null
  frontPhoto: string | null
  sidePhoto: string | null
  backPhoto: string | null
  createdAt: string
}

interface AssignedWorkout {
  id: string
  workoutProgram: {
    id: string
    name: string
    description: string | null
    difficulty: string | null
    days: { id: string; name: string; dayNumber: number; isRestDay: boolean }[]
  }
  startDate: string
  active: boolean
}

interface WorkoutProgram {
  id: string
  name: string
  description: string | null
  difficulty: string | null
  days: any[]
}

interface CardioProgram {
  id: string
  title: string
  description: string | null
  cardioType: string | null
  frequency: number | null
  durationMinutes: number | null
  intensity: string | null
  preferredDays: string | null
  timing: string | null
  notes: string | null
  active: boolean
}

interface PageProps {
  params: Promise<{ clientId: string }>
}

// Collapsible section component - light theme
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string
  icon: any
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

// Info field component
function InfoField({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-900 uppercase tracking-wide font-bold">{label}</p>
      <p className="text-gray-700 whitespace-pre-line">{value}</p>
    </div>
  )
}

export default function ClientDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [clientId, setClientId] = useState<string>('')
  const [assignedWorkout, setAssignedWorkout] = useState<AssignedWorkout | null>(null)
  const [availablePrograms, setAvailablePrograms] = useState<WorkoutProgram[]>([])
  const [showWorkoutAssign, setShowWorkoutAssign] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [programStartDate, setProgramStartDate] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  // Cardio states
  const [cardioProgram, setCardioProgram] = useState<CardioProgram | null>(null)
  const [showCardioForm, setShowCardioForm] = useState(false)
  const [cardioForm, setCardioForm] = useState({ title: '', notes: '' })
  const [isSavingCardio, setIsSavingCardio] = useState(false)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingClient, setIsSavingClient] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [editForm, setEditForm] = useState({
    phone: '', city: '', country: '', age: '', gender: '', height: '', currentWeight: '', occupation: '',
    currentTraining: '', trainingExperience: '', trainingGoal: '', injuries: '',
    dietHistory: '', allergies: '', favoriteFood: '', dislikedFood: '',
    lifestyle: '', stressLevel: '', sleepHours: '', previousCoaching: '',
    whyJoin: '', expectations: '', biggestChallenges: '',
  })

  const getNextMonday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    return nextMonday.toISOString().split('T')[0]
  }

  const isMonday = (dateString: string) => {
    if (!dateString) return false
    const date = new Date(dateString)
    return date.getDay() === 1
  }

  useEffect(() => {
    const loadClient = async () => {
      const { clientId } = await params
      setClientId(clientId)
      fetchClientData(clientId)
      fetchAssignedWorkout(clientId)
      fetchAvailablePrograms()
      fetchCardioProgram(clientId)
    }
    loadClient()
  }, [])

  const fetchClientData = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
      } else {
        toast.error('Kunde inte ladda klientdata')
        router.push('/dashboard/clients')
      }
    } catch (error) {
      console.error('Failed to fetch client:', error)
      router.push('/dashboard/clients')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAssignedWorkout = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}/workout`)
      if (response.ok) {
        const data = await response.json()
        if (data.assignment) setAssignedWorkout(data.assignment)
      }
    } catch (error) {
      console.error('Failed to fetch assigned workout:', error)
    }
  }

  const fetchAvailablePrograms = async () => {
    try {
      const response = await fetch('/api/workout-programs')
      if (response.ok) {
        const data = await response.json()
        setAvailablePrograms(data.programs || [])
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error)
    }
  }

  const fetchCardioProgram = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}/cardio`)
      if (response.ok) {
        const data = await response.json()
        if (data.cardioProgram) setCardioProgram(data.cardioProgram)
      }
    } catch (error) {
      console.error('Failed to fetch cardio program:', error)
    }
  }

  const startEditing = () => {
    if (!client) return
    setEditForm({
      phone: client.phone || '', city: client.city || '', country: client.country || '',
      age: client.age?.toString() || '', gender: client.gender || '',
      height: client.height?.toString() || '', currentWeight: client.currentWeight?.toString() || '',
      occupation: client.occupation || '', currentTraining: client.currentTraining || '',
      trainingExperience: client.trainingExperience || '', trainingGoal: client.trainingGoal || '',
      injuries: client.injuries || '', dietHistory: client.dietHistory || '',
      allergies: client.allergies || '', favoriteFood: client.favoriteFood || '',
      dislikedFood: client.dislikedFood || '', lifestyle: client.lifestyle || '',
      stressLevel: client.stressLevel || '', sleepHours: client.sleepHours || '',
      previousCoaching: client.previousCoaching || '', whyJoin: client.whyJoin || '',
      expectations: client.expectations || '', biggestChallenges: client.biggestChallenges || '',
    })
    setIsEditing(true)
  }

  const handleSaveClient = async () => {
    setIsSavingClient(true)
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      if (response.ok) {
        toast.success('Klientdata sparad!')
        setIsEditing(false)
        fetchClientData(clientId)
      } else {
        toast.error('Kunde inte spara')
      }
    } catch (error) {
      console.error('Failed to save client:', error)
      toast.error('Kunde inte spara')
    } finally {
      setIsSavingClient(false)
    }
  }

  const handleSaveCardio = async () => {
    if (!cardioForm.title.trim()) {
      toast.error('Titel krävs')
      return
    }
    setIsSavingCardio(true)
    try {
      const response = await fetch('/api/cardio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: clientId, title: cardioForm.title, notes: cardioForm.notes || null })
      })
      if (response.ok) {
        toast.success('Cardioprogram sparat!')
        setShowCardioForm(false)
        setCardioForm({ title: '', notes: '' })
        fetchCardioProgram(clientId)
      } else {
        toast.error('Kunde inte spara cardioprogram')
      }
    } catch (error) {
      toast.error('Kunde inte spara cardioprogram')
    } finally {
      setIsSavingCardio(false)
    }
  }

  const handleDeleteCardio = async () => {
    if (!cardioProgram || !confirm('Är du säker på att du vill ta bort cardioprogrammet?')) return
    try {
      const response = await fetch(`/api/cardio/${cardioProgram.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Cardioprogram borttaget')
        setCardioProgram(null)
      } else {
        toast.error('Kunde inte ta bort cardioprogram')
      }
    } catch (error) {
      toast.error('Kunde inte ta bort cardioprogram')
    }
  }

  const handleResetPassword = async () => {
    if (!confirm('Är du säker på att du vill återställa lösenordet för denna klient? Ett nytt lösenord kommer att skickas till deras e-post.')) return

    setIsResettingPassword(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/reset-password`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        if (data.warning) {
          toast.warning(data.warning)
          // Show temporary password if email failed
          if (data.tempPassword) {
            toast.info(`Temporärt lösenord: ${data.tempPassword}`, { duration: 30000 })
          }
        } else {
          toast.success(data.message || 'Lösenordet har återställts och skickats till klienten')
        }
      } else {
        toast.error(data.error || 'Kunde inte återställa lösenord')
      }
    } catch (error) {
      toast.error('Ett fel uppstod vid återställning av lösenord')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleAssignWorkout = async () => {
    if (!selectedProgramId) { toast.error('Välj ett program'); return }
    if (!programStartDate) { toast.error('Välj ett startdatum'); return }
    if (!isMonday(programStartDate)) { toast.error('Startdatum måste vara en måndag'); return }

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/workout-programs/${selectedProgramId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, startDate: programStartDate })
      })
      if (response.ok) {
        toast.success('Träningsprogram tilldelat!')
        setShowWorkoutAssign(false)
        setSelectedProgramId('')
        setProgramStartDate('')
        fetchAssignedWorkout(clientId)
      } else {
        toast.error('Kunde inte tilldela program')
      }
    } catch (error) {
      toast.error('Kunde inte tilldela program')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassignWorkout = async () => {
    if (!assignedWorkout || !confirm('Är du säker på att du vill ta bort detta träningsprogram?')) return
    try {
      const response = await fetch(`/api/workout-programs/${assignedWorkout.workoutProgram.id}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      })
      if (response.ok) {
        toast.success('Träningsprogram borttaget')
        setAssignedWorkout(null)
      } else {
        toast.error('Kunde inte ta bort program')
      }
    } catch (error) {
      toast.error('Kunde inte ta bort program')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (!client) return null

  const genderLabel = client.gender === 'male' ? 'Man' : client.gender === 'female' ? 'Kvinna' : client.gender

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{client.name || 'Klient'}</h1>
              {client.status === 'pending' && (
                <Badge className="bg-orange-100 text-orange-700 border border-orange-200">Väntande</Badge>
              )}
              {client.status === 'active' && (
                <Badge className="bg-green-100 text-green-700 border border-green-200">Aktiv</Badge>
              )}
            </div>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {client.email}
            </p>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button onClick={handleSaveClient} disabled={isSavingClient} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Save className="w-4 h-4 mr-1" />
                {isSavingClient ? 'Sparar...' : 'Spara'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={startEditing} variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <Pencil className="w-4 h-4 mr-1" />
                Redigera
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <KeyRound className="w-4 h-4 mr-1" />
                {isResettingPassword ? 'Återställer...' : 'Återställ lösenord'}
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {(client.age || client.height || client.currentWeight || genderLabel) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
            {client.age && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Ålder</p>
                <p className="text-xl font-bold text-gray-900">{client.age} år</p>
              </div>
            )}
            {client.height && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Längd</p>
                <p className="text-xl font-bold text-gray-900">{client.height} cm</p>
              </div>
            )}
            {client.currentWeight && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Vikt</p>
                <p className="text-xl font-bold text-gray-900">{client.currentWeight} kg</p>
              </div>
            )}
            {genderLabel && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Kön</p>
                <p className="text-xl font-bold text-gray-900">{genderLabel}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Program Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Workout Program */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Träningsprogram</h3>
          </div>

          {assignedWorkout ? (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-medium text-gray-900">{assignedWorkout.workoutProgram.name}</p>
                <p className="text-sm text-gray-500">{assignedWorkout.workoutProgram.days.filter(d => !d.isRestDay).length} träningsdagar</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-amber-300 text-amber-700" onClick={() => setShowWorkoutAssign(true)}>Ändra</Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleUnassignWorkout}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ) : showWorkoutAssign ? (
            <div className="space-y-3">
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger><SelectValue placeholder="Välj program" /></SelectTrigger>
                <SelectContent>
                  {availablePrograms.map(program => (
                    <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="date" value={programStartDate} onChange={(e) => setProgramStartDate(e.target.value)} className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={() => setProgramStartDate(getNextMonday())} className="text-xs">Nästa mån</Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAssignWorkout} disabled={isAssigning} size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">{isAssigning ? 'Tilldelar...' : 'Tilldela'}</Button>
                <Button variant="outline" size="sm" onClick={() => setShowWorkoutAssign(false)}>Avbryt</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowWorkoutAssign(true)} variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">Tilldela program</Button>
          )}
        </div>

        {/* Cardio Program */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Cardioprogram</h3>
          </div>

          {showCardioForm ? (
            <div className="space-y-3">
              <Input value={cardioForm.title} onChange={(e) => setCardioForm({ ...cardioForm, title: e.target.value })} placeholder="Titel (t.ex. Daglig aktivitet)" />
              <Textarea value={cardioForm.notes} onChange={(e) => setCardioForm({ ...cardioForm, notes: e.target.value })} placeholder="Beskrivning och instruktioner..." rows={4} />
              <div className="flex gap-2">
                <Button onClick={handleSaveCardio} disabled={isSavingCardio} size="sm" className="flex-1 bg-red-500 hover:bg-red-600 text-white">{isSavingCardio ? 'Sparar...' : 'Spara'}</Button>
                <Button variant="outline" size="sm" onClick={() => setShowCardioForm(false)}>Avbryt</Button>
              </div>
            </div>
          ) : cardioProgram ? (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-medium text-gray-900">{cardioProgram.title}</p>
                {cardioProgram.notes && <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{cardioProgram.notes}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-red-300 text-red-700" onClick={() => { setCardioForm({ title: cardioProgram.title, notes: cardioProgram.notes || '' }); setShowCardioForm(true) }}>Ändra</Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDeleteCardio}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowCardioForm(true)} variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50">Lägg till cardio</Button>
          )}
        </div>

        {/* Nutrition Plan */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Kostplan</h3>
          </div>
          <Link href={`/dashboard/nutrition-plans/create?clientId=${clientId}`}>
            <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
              Skapa kostplan
            </Button>
          </Link>
        </div>
      </div>

      {/* Application Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Ansökningsinformation</h2>

        {/* Contact Info */}
        <CollapsibleSection title="Kontaktuppgifter" icon={User} defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {isEditing ? (
              <>
                <div><Label className="text-xs text-gray-500">Telefon</Label><Input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></div>
                <div><Label className="text-xs text-gray-500">Stad</Label><Input value={editForm.city} onChange={(e) => setEditForm({...editForm, city: e.target.value})} /></div>
                <div><Label className="text-xs text-gray-500">Land</Label><Input value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value})} /></div>
                <div><Label className="text-xs text-gray-500">Yrke</Label><Input value={editForm.occupation} onChange={(e) => setEditForm({...editForm, occupation: e.target.value})} /></div>
              </>
            ) : (
              <>
                <InfoField label="Telefon" value={client.phone} />
                <InfoField label="Stad" value={client.city} />
                <InfoField label="Land" value={client.country} />
                <InfoField label="Yrke" value={client.occupation} />
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* Motivation */}
        {(isEditing || client.whyJoin || client.expectations || client.biggestChallenges) && (
          <CollapsibleSection title="Motivation & Mål" icon={Target} defaultOpen={isEditing}>
            <div className="space-y-4 pt-4">
              {isEditing ? (
                <>
                  <div><Label className="text-xs text-gray-500">Varför vill du gå med?</Label><Textarea value={editForm.whyJoin} onChange={(e) => setEditForm({...editForm, whyJoin: e.target.value})} rows={2} /></div>
                  <div><Label className="text-xs text-gray-500">Förväntningar</Label><Textarea value={editForm.expectations} onChange={(e) => setEditForm({...editForm, expectations: e.target.value})} rows={2} /></div>
                  <div><Label className="text-xs text-gray-500">Största utmaningar</Label><Textarea value={editForm.biggestChallenges} onChange={(e) => setEditForm({...editForm, biggestChallenges: e.target.value})} rows={2} /></div>
                </>
              ) : (
                <>
                  <InfoField label="Varför vill du gå med?" value={client.whyJoin} />
                  <InfoField label="Förväntningar" value={client.expectations} />
                  <InfoField label="Största utmaningar" value={client.biggestChallenges} />
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Training */}
        {(isEditing || client.currentTraining || client.trainingExperience || client.trainingGoal || client.injuries) && (
          <CollapsibleSection title="Träning" icon={Activity} defaultOpen={isEditing}>
            <div className="space-y-4 pt-4">
              {isEditing ? (
                <>
                  <div><Label className="text-xs text-gray-500">Nuvarande träning</Label><Textarea value={editForm.currentTraining} onChange={(e) => setEditForm({...editForm, currentTraining: e.target.value})} rows={2} /></div>
                  <div><Label className="text-xs text-gray-500">Träningserfarenhet</Label><Textarea value={editForm.trainingExperience} onChange={(e) => setEditForm({...editForm, trainingExperience: e.target.value})} rows={2} /></div>
                  <div><Label className="text-xs text-gray-500">Träningsmål</Label><Textarea value={editForm.trainingGoal} onChange={(e) => setEditForm({...editForm, trainingGoal: e.target.value})} rows={2} /></div>
                  <div><Label className="text-xs text-gray-500">Skador/Begränsningar</Label><Textarea value={editForm.injuries} onChange={(e) => setEditForm({...editForm, injuries: e.target.value})} rows={2} /></div>
                </>
              ) : (
                <>
                  <InfoField label="Nuvarande träning" value={client.currentTraining} />
                  <InfoField label="Träningserfarenhet" value={client.trainingExperience} />
                  <InfoField label="Träningsmål" value={client.trainingGoal} />
                  <InfoField label="Skador/Begränsningar" value={client.injuries} />
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Nutrition */}
        {(isEditing || client.dietHistory || client.favoriteFood || client.dislikedFood || client.allergies) && (
          <CollapsibleSection title="Kost & Näring" icon={Utensils} defaultOpen={isEditing}>
            <div className="space-y-4 pt-4">
              {isEditing ? (
                <>
                  <div><Label className="text-xs text-gray-500">Kosthistorik</Label><Textarea value={editForm.dietHistory} onChange={(e) => setEditForm({...editForm, dietHistory: e.target.value})} rows={2} /></div>
                  <div><Label className="text-xs text-gray-500">Favoritmat</Label><Textarea value={editForm.favoriteFood} onChange={(e) => setEditForm({...editForm, favoriteFood: e.target.value})} rows={2} /></div>
                  <div><Label className="text-xs text-gray-500">Ogillar</Label><Textarea value={editForm.dislikedFood} onChange={(e) => setEditForm({...editForm, dislikedFood: e.target.value})} rows={2} /></div>
                  <div><Label className="text-xs text-gray-500">Allergier</Label><Input value={editForm.allergies} onChange={(e) => setEditForm({...editForm, allergies: e.target.value})} /></div>
                </>
              ) : (
                <>
                  <InfoField label="Kosthistorik" value={client.dietHistory} />
                  <InfoField label="Favoritmat" value={client.favoriteFood} />
                  <InfoField label="Ogillar" value={client.dislikedFood} />
                  <InfoField label="Allergier" value={client.allergies} />
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Lifestyle */}
        {(isEditing || client.lifestyle || client.stressLevel || client.sleepHours || client.previousCoaching) && (
          <CollapsibleSection title="Livsstil" icon={Moon} defaultOpen={isEditing}>
            <div className="space-y-4 pt-4">
              {isEditing ? (
                <>
                  <div><Label className="text-xs text-gray-500">Livsstil</Label><Textarea value={editForm.lifestyle} onChange={(e) => setEditForm({...editForm, lifestyle: e.target.value})} rows={2} /></div>
                  <div><Label className="text-xs text-gray-500">Stressnivå</Label><Input value={editForm.stressLevel} onChange={(e) => setEditForm({...editForm, stressLevel: e.target.value})} /></div>
                  <div><Label className="text-xs text-gray-500">Sömn</Label><Input value={editForm.sleepHours} onChange={(e) => setEditForm({...editForm, sleepHours: e.target.value})} /></div>
                  <div><Label className="text-xs text-gray-500">Tidigare coaching</Label><Textarea value={editForm.previousCoaching} onChange={(e) => setEditForm({...editForm, previousCoaching: e.target.value})} rows={2} /></div>
                </>
              ) : (
                <>
                  <InfoField label="Livsstil" value={client.lifestyle} />
                  <InfoField label="Stressnivå" value={client.stressLevel} />
                  <InfoField label="Sömn" value={client.sleepHours} />
                  <InfoField label="Tidigare coaching" value={client.previousCoaching} />
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Photos */}
        {(client.frontPhoto || client.sidePhoto || client.backPhoto) && (
          <CollapsibleSection title="Bilder" icon={Image}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {client.frontPhoto && <div><p className="text-xs text-gray-500 uppercase mb-2">Framifrån</p><img src={client.frontPhoto} alt="Front" className="rounded-lg w-full object-cover" /></div>}
              {client.sidePhoto && <div><p className="text-xs text-gray-500 uppercase mb-2">Sidan</p><img src={client.sidePhoto} alt="Side" className="rounded-lg w-full object-cover" /></div>}
              {client.backPhoto && <div><p className="text-xs text-gray-500 uppercase mb-2">Bakifrån</p><img src={client.backPhoto} alt="Back" className="rounded-lg w-full object-cover" /></div>}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Meta info */}
      <div className="text-center text-xs text-gray-400 pt-4">
        Klient sedan {new Date(client.createdAt).toLocaleDateString('sv-SE')}
      </div>
    </div>
  )
}
