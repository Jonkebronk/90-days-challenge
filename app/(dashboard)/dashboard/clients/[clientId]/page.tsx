'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Dumbbell, Calendar, ChevronRight, Heart, Zap, Clock, Flame, Trash2,
  User, Mail, Phone, MapPin, Ruler, Scale, Target, Brain, Utensils, Moon,
  Activity, Sparkles, ChevronDown, ChevronUp, Image, Pencil, X, Save
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
  // Training
  currentTraining: string | null
  trainingExperience: string | null
  trainingGoal: string | null
  injuries: string | null
  availableTime: string | null
  preferredSchedule: string | null
  // Nutrition
  dietHistory: string | null
  macroExperience: string | null
  digestionIssues: string | null
  allergies: string | null
  favoriteFood: string | null
  dislikedFood: string | null
  supplements: string | null
  previousCoaching: string | null
  // Lifestyle
  stressLevel: string | null
  sleepHours: string | null
  occupation: string | null
  lifestyle: string | null
  // Motivation
  whyJoin: string | null
  canFollowPlan: string | null
  expectations: string | null
  biggestChallenges: string | null
  // Photos
  frontPhoto: string | null
  sidePhoto: string | null
  backPhoto: string | null
  // Meta
  createdAt: string
}

interface AssignedWorkout {
  id: string
  workoutProgram: {
    id: string
    name: string
    description: string | null
    difficulty: string | null
    days: {
      id: string
      name: string
      dayNumber: number
      isRestDay: boolean
    }[]
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

// Collapsible section component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  color = 'gold'
}: {
  title: string
  icon: any
  children: React.ReactNode
  defaultOpen?: boolean
  color?: 'gold' | 'blue' | 'green' | 'purple' | 'red' | 'orange'
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const colorClasses = {
    gold: 'border-gold-primary/30 text-gold-light',
    blue: 'border-blue-500/30 text-blue-400',
    green: 'border-green-500/30 text-green-400',
    purple: 'border-purple-500/30 text-purple-400',
    red: 'border-red-500/30 text-red-400',
    orange: 'border-orange-500/30 text-orange-400',
  }

  return (
    <div className="border-2 rounded-xl overflow-hidden bg-white/5 backdrop-blur-[10px]" style={{ borderColor: `var(--${color}-border, rgba(255,215,0,0.3))` }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all ${colorClasses[color]}`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t border-white/10">
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
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-gray-200 whitespace-pre-line">{value}</p>
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
  const [cardioForm, setCardioForm] = useState({
    title: '',
    description: '',
    cardioType: '',
    frequency: '',
    durationMinutes: '',
    intensity: '',
    preferredDays: '',
    timing: '',
    notes: '',
  })
  const [isSavingCardio, setIsSavingCardio] = useState(false)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingClient, setIsSavingClient] = useState(false)
  const [editForm, setEditForm] = useState({
    phone: '',
    city: '',
    country: '',
    age: '',
    gender: '',
    height: '',
    currentWeight: '',
    occupation: '',
    // Training
    currentTraining: '',
    trainingExperience: '',
    trainingGoal: '',
    injuries: '',
    // Nutrition
    dietHistory: '',
    allergies: '',
    favoriteFood: '',
    dislikedFood: '',
    // Lifestyle
    lifestyle: '',
    stressLevel: '',
    sleepHours: '',
    previousCoaching: '',
    // Motivation
    whyJoin: '',
    expectations: '',
    biggestChallenges: '',
  })

  // Helper to get next Monday
  const getNextMonday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    return nextMonday.toISOString().split('T')[0]
  }

  // Check if date is a Monday
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.error('Kunde inte ladda klientdata')
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
        if (data.assignment) {
          setAssignedWorkout(data.assignment)
        }
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
        if (data.cardioProgram) {
          setCardioProgram(data.cardioProgram)
        }
      }
    } catch (error) {
      console.error('Failed to fetch cardio program:', error)
    }
  }

  const handleSaveCardio = async () => {
    if (!cardioForm.title.trim()) {
      toast.error('Titel krävs')
      return
    }

    setIsSavingCardio(true)
    try {
      const payload = {
        userId: clientId,
        title: cardioForm.title,
        description: cardioForm.description || null,
        cardioType: cardioForm.cardioType || null,
        frequency: cardioForm.frequency ? parseInt(cardioForm.frequency) : null,
        durationMinutes: cardioForm.durationMinutes ? parseInt(cardioForm.durationMinutes) : null,
        intensity: cardioForm.intensity || null,
        preferredDays: cardioForm.preferredDays || null,
        timing: cardioForm.timing || null,
        notes: cardioForm.notes || null,
      }

      const response = await fetch('/api/cardio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success('Cardioprogram sparat!')
        setShowCardioForm(false)
        setCardioForm({
          title: '',
          description: '',
          cardioType: '',
          frequency: '',
          durationMinutes: '',
          intensity: '',
          preferredDays: '',
          timing: '',
          notes: '',
        })
        fetchCardioProgram(clientId)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Kunde inte spara cardioprogram')
      }
    } catch (error) {
      console.error('Failed to save cardio:', error)
      toast.error('Kunde inte spara cardioprogram')
    } finally {
      setIsSavingCardio(false)
    }
  }

  const startEditing = () => {
    if (!client) return
    setEditForm({
      phone: client.phone || '',
      city: client.city || '',
      country: client.country || '',
      age: client.age?.toString() || '',
      gender: client.gender || '',
      height: client.height?.toString() || '',
      currentWeight: client.currentWeight?.toString() || '',
      occupation: client.occupation || '',
      currentTraining: client.currentTraining || '',
      trainingExperience: client.trainingExperience || '',
      trainingGoal: client.trainingGoal || '',
      injuries: client.injuries || '',
      dietHistory: client.dietHistory || '',
      allergies: client.allergies || '',
      favoriteFood: client.favoriteFood || '',
      dislikedFood: client.dislikedFood || '',
      lifestyle: client.lifestyle || '',
      stressLevel: client.stressLevel || '',
      sleepHours: client.sleepHours || '',
      previousCoaching: client.previousCoaching || '',
      whyJoin: client.whyJoin || '',
      expectations: client.expectations || '',
      biggestChallenges: client.biggestChallenges || '',
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

  const handleDeleteCardio = async () => {
    if (!cardioProgram) return
    if (!confirm('Är du säker på att du vill ta bort cardioprogrammet?')) return

    try {
      const response = await fetch(`/api/cardio/${cardioProgram.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Cardioprogram borttaget')
        setCardioProgram(null)
      } else {
        toast.error('Kunde inte ta bort cardioprogram')
      }
    } catch (error) {
      console.error('Failed to delete cardio:', error)
      toast.error('Kunde inte ta bort cardioprogram')
    }
  }

  const handleAssignWorkout = async () => {
    if (!selectedProgramId) {
      toast.error('Välj ett program')
      return
    }

    if (!programStartDate) {
      toast.error('Välj ett startdatum')
      return
    }

    if (!isMonday(programStartDate)) {
      toast.error('Startdatum måste vara en måndag')
      return
    }

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
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to assign program')
      }
    } catch (error) {
      console.error('Failed to assign workout:', error)
      toast.error('Failed to assign program')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassignWorkout = async () => {
    if (!assignedWorkout) return

    if (!confirm('Är du säker på att du vill ta bort detta träningsprogram från klienten?')) return

    try {
      const response = await fetch(`/api/workout-programs/${assignedWorkout.workoutProgram.id}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      })

      if (response.ok) {
        toast.success('Workout program unassigned successfully')
        fetchAssignedWorkout(clientId)
      } else {
        toast.error('Failed to unassign program')
      }
    } catch (error) {
      console.error('Failed to unassign workout:', error)
      toast.error('Failed to unassign program')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  const genderLabel = client.gender === 'male' ? 'Man' : client.gender === 'female' ? 'Kvinna' : client.gender

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{client.name || 'Klient'}</h1>
            {client.status === 'pending' && (
              <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Väntande
              </Badge>
            )}
            {client.status === 'active' && (
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                Aktiv
              </Badge>
            )}
          </div>
          <p className="text-gray-400 flex items-center gap-2 mt-1">
            <Mail className="w-4 h-4" />
            {client.email}
          </p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              onClick={handleSaveClient}
              disabled={isSavingClient}
              size="sm"
              className="bg-gradient-to-br from-green-500 to-green-600 text-white"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSavingClient ? 'Sparar...' : 'Spara'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="border-gray-500 text-gray-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={startEditing}
            variant="outline"
            size="sm"
            className="border-gold-primary/30 text-gold-light hover:bg-gold-50"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Redigera
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {client.age && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 uppercase">Ålder</p>
            <p className="text-xl font-bold text-blue-400">{client.age} år</p>
          </div>
        )}
        {client.height && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 uppercase">Längd</p>
            <p className="text-xl font-bold text-green-400">{client.height} cm</p>
          </div>
        )}
        {client.currentWeight && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 uppercase">Vikt</p>
            <p className="text-xl font-bold text-purple-400">{client.currentWeight} kg</p>
          </div>
        )}
        {genderLabel && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 uppercase">Kön</p>
            <p className="text-xl font-bold text-orange-400">{genderLabel}</p>
          </div>
        )}
      </div>

      {/* Program Assignment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Workout Program Card */}
        <Card className="bg-white/5 border-2 border-gold-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="text-gold-light" size={20} />
                <CardTitle className="text-gold-light text-lg">Träningsprogram</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {assignedWorkout ? (
              <div className="space-y-3">
                <div className="bg-gold-primary/5 p-3 rounded-lg border border-gold-primary/30">
                  <h4 className="font-semibold text-gray-100">{assignedWorkout.workoutProgram.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {assignedWorkout.workoutProgram.days.filter(d => !d.isRestDay).length} träningsdagar
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gold-primary/30 text-gold-light hover:bg-gold-50"
                    onClick={() => setShowWorkoutAssign(true)}
                  >
                    Ändra
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={handleUnassignWorkout}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : showWorkoutAssign ? (
              <div className="space-y-3">
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                    <SelectValue placeholder="Välj program" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrograms.map(program => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={programStartDate}
                    onChange={(e) => setProgramStartDate(e.target.value)}
                    className="bg-black/30 border-gold-primary/30 text-white flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProgramStartDate(getNextMonday())}
                    className="border-gold-primary/30 text-gray-200 text-xs whitespace-nowrap"
                  >
                    Nästa mån
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAssignWorkout}
                    disabled={isAssigning}
                    size="sm"
                    className="flex-1 bg-gradient-to-br from-gold-light to-orange-500 text-black font-bold"
                  >
                    {isAssigning ? 'Tilldelar...' : 'Tilldela'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWorkoutAssign(false)}
                    className="border-gold-primary/30"
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowWorkoutAssign(true)}
                variant="outline"
                className="w-full border-gold-light text-gold-light hover:bg-gold-50"
              >
                Tilldela program
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Cardio Program Card */}
        <Card className="bg-white/5 border-2 border-red-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="text-red-400" size={20} />
                <CardTitle className="text-red-400 text-lg">Cardioprogram</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showCardioForm ? (
              <div className="space-y-3">
                <Input
                  value={cardioForm.title}
                  onChange={(e) => setCardioForm({ ...cardioForm, title: e.target.value })}
                  placeholder="Titel (t.ex. LISS Cardio)"
                  className="bg-black/30 border-red-500/30 text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={cardioForm.cardioType}
                    onValueChange={(value) => setCardioForm({ ...cardioForm, cardioType: value })}
                  >
                    <SelectTrigger className="bg-black/30 border-red-500/30 text-white">
                      <SelectValue placeholder="Typ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LISS">LISS</SelectItem>
                      <SelectItem value="MISS">MISS</SelectItem>
                      <SelectItem value="HIIT">HIIT</SelectItem>
                      <SelectItem value="Walking">Promenader</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={cardioForm.frequency}
                    onChange={(e) => setCardioForm({ ...cardioForm, frequency: e.target.value })}
                    placeholder="ggr/vecka"
                    className="bg-black/30 border-red-500/30 text-white"
                  />
                </div>
                <Textarea
                  value={cardioForm.notes}
                  onChange={(e) => setCardioForm({ ...cardioForm, notes: e.target.value })}
                  placeholder="Instruktioner..."
                  rows={2}
                  className="bg-black/30 border-red-500/30 text-white"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveCardio}
                    disabled={isSavingCardio}
                    size="sm"
                    className="flex-1 bg-gradient-to-br from-red-500 to-red-600 text-white font-bold"
                  >
                    {isSavingCardio ? 'Sparar...' : 'Spara'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCardioForm(false)}
                    className="border-red-500/30"
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            ) : cardioProgram ? (
              <div className="space-y-3">
                <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/30">
                  <h4 className="font-semibold text-gray-100">{cardioProgram.title}</h4>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                    {cardioProgram.cardioType && <span>{cardioProgram.cardioType}</span>}
                    {cardioProgram.frequency && <span>• {cardioProgram.frequency}x/vecka</span>}
                    {cardioProgram.durationMinutes && <span>• {cardioProgram.durationMinutes} min</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => {
                      setCardioForm({
                        title: cardioProgram.title,
                        description: cardioProgram.description || '',
                        cardioType: cardioProgram.cardioType || '',
                        frequency: cardioProgram.frequency?.toString() || '',
                        durationMinutes: cardioProgram.durationMinutes?.toString() || '',
                        intensity: cardioProgram.intensity || '',
                        preferredDays: cardioProgram.preferredDays || '',
                        timing: cardioProgram.timing || '',
                        notes: cardioProgram.notes || '',
                      })
                      setShowCardioForm(true)
                    }}
                  >
                    Ändra
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={handleDeleteCardio}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowCardioForm(true)}
                variant="outline"
                className="w-full border-red-400 text-red-400 hover:bg-red-500/10"
              >
                Lägg till cardio
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gold-light flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Ansökningsinformation
          {isEditing && <span className="text-sm font-normal text-gray-400">(redigeringsläge)</span>}
        </h2>

        {/* Contact Info */}
        <CollapsibleSection title="Kontaktuppgifter" icon={User} defaultOpen={true} color="blue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {isEditing ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Telefon</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="bg-black/30 border-blue-500/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Stad</Label>
                  <Input value={editForm.city} onChange={(e) => setEditForm({...editForm, city: e.target.value})} className="bg-black/30 border-blue-500/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Land</Label>
                  <Input value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value})} className="bg-black/30 border-blue-500/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Yrke</Label>
                  <Input value={editForm.occupation} onChange={(e) => setEditForm({...editForm, occupation: e.target.value})} className="bg-black/30 border-blue-500/30" />
                </div>
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
        {(isEditing || client.whyJoin || client.expectations || client.biggestChallenges || client.canFollowPlan) && (
          <CollapsibleSection title="Motivation & Mål" icon={Target} defaultOpen={true} color="gold">
            <div className="space-y-4 pt-4">
              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Varför vill du gå med?</Label>
                    <Textarea value={editForm.whyJoin} onChange={(e) => setEditForm({...editForm, whyJoin: e.target.value})} className="bg-black/30 border-gold-primary/30" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Förväntningar</Label>
                    <Textarea value={editForm.expectations} onChange={(e) => setEditForm({...editForm, expectations: e.target.value})} className="bg-black/30 border-gold-primary/30" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Största utmaningar</Label>
                    <Textarea value={editForm.biggestChallenges} onChange={(e) => setEditForm({...editForm, biggestChallenges: e.target.value})} className="bg-black/30 border-gold-primary/30" rows={2} />
                  </div>
                </>
              ) : (
                <>
                  <InfoField label="Varför vill du gå med?" value={client.whyJoin} />
                  <InfoField label="Förväntningar" value={client.expectations} />
                  <InfoField label="Största utmaningar" value={client.biggestChallenges} />
                  <InfoField label="Kan följa en plan?" value={client.canFollowPlan} />
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Training */}
        {(isEditing || client.currentTraining || client.trainingExperience || client.trainingGoal || client.injuries || client.availableTime || client.preferredSchedule) && (
          <CollapsibleSection title="Träning" icon={Activity} defaultOpen={isEditing} color="green">
            <div className="space-y-4 pt-4">
              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Nuvarande träning</Label>
                    <Textarea value={editForm.currentTraining} onChange={(e) => setEditForm({...editForm, currentTraining: e.target.value})} className="bg-black/30 border-green-500/30" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Träningserfarenhet</Label>
                    <Textarea value={editForm.trainingExperience} onChange={(e) => setEditForm({...editForm, trainingExperience: e.target.value})} className="bg-black/30 border-green-500/30" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Träningsmål</Label>
                    <Textarea value={editForm.trainingGoal} onChange={(e) => setEditForm({...editForm, trainingGoal: e.target.value})} className="bg-black/30 border-green-500/30" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Skador/Begränsningar</Label>
                    <Textarea value={editForm.injuries} onChange={(e) => setEditForm({...editForm, injuries: e.target.value})} className="bg-black/30 border-green-500/30" rows={2} />
                  </div>
                </>
              ) : (
                <>
                  <InfoField label="Nuvarande träning" value={client.currentTraining} />
                  <InfoField label="Träningserfarenhet" value={client.trainingExperience} />
                  <InfoField label="Träningsmål" value={client.trainingGoal} />
                  <InfoField label="Skador/Begränsningar" value={client.injuries} />
                  <InfoField label="Tillgänglig tid" value={client.availableTime} />
                  <InfoField label="Föredraget schema" value={client.preferredSchedule} />
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Nutrition */}
        {(isEditing || client.dietHistory || client.macroExperience || client.favoriteFood || client.dislikedFood || client.allergies || client.supplements || client.digestionIssues) && (
          <CollapsibleSection title="Kost & Näring" icon={Utensils} defaultOpen={isEditing} color="orange">
            <div className="space-y-4 pt-4">
              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Kosthistorik</Label>
                    <Textarea value={editForm.dietHistory} onChange={(e) => setEditForm({...editForm, dietHistory: e.target.value})} className="bg-black/30 border-orange-500/30" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Favoritmat</Label>
                    <Textarea value={editForm.favoriteFood} onChange={(e) => setEditForm({...editForm, favoriteFood: e.target.value})} className="bg-black/30 border-orange-500/30" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Ogillar</Label>
                    <Textarea value={editForm.dislikedFood} onChange={(e) => setEditForm({...editForm, dislikedFood: e.target.value})} className="bg-black/30 border-orange-500/30" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Allergier</Label>
                    <Input value={editForm.allergies} onChange={(e) => setEditForm({...editForm, allergies: e.target.value})} className="bg-black/30 border-orange-500/30" />
                  </div>
                </>
              ) : (
                <>
                  <InfoField label="Kosthistorik" value={client.dietHistory} />
                  <InfoField label="Makroerfarenhet" value={client.macroExperience} />
                  <InfoField label="Favoritmat" value={client.favoriteFood} />
                  <InfoField label="Ogillar" value={client.dislikedFood} />
                  <InfoField label="Allergier" value={client.allergies} />
                  <InfoField label="Kosttillskott" value={client.supplements} />
                  <InfoField label="Matsmältningsproblem" value={client.digestionIssues} />
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Lifestyle */}
        {(isEditing || client.lifestyle || client.stressLevel || client.sleepHours || client.previousCoaching) && (
          <CollapsibleSection title="Livsstil" icon={Moon} defaultOpen={isEditing} color="purple">
            <div className="space-y-4 pt-4">
              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Livsstil</Label>
                    <Textarea value={editForm.lifestyle} onChange={(e) => setEditForm({...editForm, lifestyle: e.target.value})} className="bg-black/30 border-purple-500/30" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Stressnivå</Label>
                    <Input value={editForm.stressLevel} onChange={(e) => setEditForm({...editForm, stressLevel: e.target.value})} className="bg-black/30 border-purple-500/30" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Sömn</Label>
                    <Input value={editForm.sleepHours} onChange={(e) => setEditForm({...editForm, sleepHours: e.target.value})} className="bg-black/30 border-purple-500/30" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 uppercase">Tidigare coaching</Label>
                    <Textarea value={editForm.previousCoaching} onChange={(e) => setEditForm({...editForm, previousCoaching: e.target.value})} className="bg-black/30 border-purple-500/30" rows={2} />
                  </div>
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
          <CollapsibleSection title="Bilder" icon={Image} color="blue">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {client.frontPhoto && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Framifrån</p>
                  <img src={client.frontPhoto} alt="Front" className="rounded-lg w-full object-cover" />
                </div>
              )}
              {client.sidePhoto && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Sidan</p>
                  <img src={client.sidePhoto} alt="Side" className="rounded-lg w-full object-cover" />
                </div>
              )}
              {client.backPhoto && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Bakifrån</p>
                  <img src={client.backPhoto} alt="Back" className="rounded-lg w-full object-cover" />
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Meta info */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-800">
        Klient sedan {new Date(client.createdAt).toLocaleDateString('sv-SE')}
      </div>
    </div>
  )
}
