'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Calculator, Dumbbell, Calendar, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface CaloriePlan {
  weight: number | null
  activityLevel: string | null
  deficit: number | null
  dailySteps: number | null
  proteinPerKg: number | null
  numMeals: number | null
  customDistribution: boolean
  mealCalories: number[]
}

const clientProfileSchema = z.object({
  // Step 1: Profile
  birthdate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.coerce.number().min(120).max(250).optional(),
  currentWeightKg: z.coerce.number().min(30).max(300).optional(),

  // Step 2: Goals
  primaryGoal: z.enum(['build_muscle', 'get_fit', 'healthy_habits']).optional(),

  // Step 3: Activity
  activityLevelFree: z.enum(['very_low', 'low', 'medium', 'active', 'very_active']).optional(),
  activityLevelWork: z.enum(['very_low', 'low', 'medium', 'high']).optional(),
  trainingExperience: z.enum(['beginner', 'experienced', 'very_experienced']).optional(),
  trainingDetails: z.string().optional(),
  trainingDays: z.array(z.string()).default([]),

  // Step 4: Nutrition
  nutritionNotes: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  dietaryPreferences: z.array(z.string()).default([]),
  excludedIngredients: z.array(z.string()).default([]),
  nutritionMissing: z.string().optional(),

  // Step 5: Lifestyle
  lifestyleNotes: z.string().optional(),
})

type ClientProfileForm = z.infer<typeof clientProfileSchema>

interface Client {
  id: string
  name: string | null
  email: string
  firstName: string | null
  lastName: string | null
  status: string
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

interface PageProps {
  params: Promise<{ clientId: string }>
}

export default function ClientDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [clientId, setClientId] = useState<string>('')
  const [caloriePlan, setCaloriePlan] = useState<CaloriePlan | null>(null)
  const [assignedWorkout, setAssignedWorkout] = useState<AssignedWorkout | null>(null)
  const [availablePrograms, setAvailablePrograms] = useState<WorkoutProgram[]>([])
  const [showWorkoutAssign, setShowWorkoutAssign] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm<ClientProfileForm>({
    mode: 'onChange',
    defaultValues: {
      trainingDays: [],
      allergies: [],
      dietaryPreferences: [],
      excludedIngredients: [],
    },
  })

  useEffect(() => {
    const loadClient = async () => {
      const { clientId } = await params
      setClientId(clientId)
      fetchClientData(clientId)
      fetchCaloriePlan(clientId)
      fetchAssignedWorkout(clientId)
      fetchAvailablePrograms()
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

        // Load existing profile data if available
        if (data.profile) {
          Object.keys(data.profile).forEach((key) => {
            if (data.profile[key] !== null) {
              setValue(key as keyof ClientProfileForm, data.profile[key])
            }
          })
        }
      } else {
        toast.error('Failed to load client data')
        router.push('/dashboard/clients')
      }
    } catch (error) {
      console.error('Failed to fetch client:', error)
      toast.error('Failed to load client data')
      router.push('/dashboard/clients')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCaloriePlan = async (id: string) => {
    try {
      const response = await fetch(`/api/calorie-plan?clientId=${id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.caloriePlan) {
          setCaloriePlan(data.caloriePlan)
        }
      }
    } catch (error) {
      console.error('Failed to fetch calorie plan:', error)
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

  const handleAssignWorkout = async () => {
    if (!selectedProgramId) {
      toast.error('Please select a program')
      return
    }

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/workout-programs/${selectedProgramId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      })

      if (response.ok) {
        toast.success('Workout program assigned successfully')
        setShowWorkoutAssign(false)
        setSelectedProgramId('')
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

  const onSubmit = handleSubmit(async (data) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Client profile saved successfully')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  })

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const commonAllergies = ['Gluten', 'Laktos', 'Nötter', 'Skaldjur', 'Ägg', 'Soja']
  const dietaryOptions = ['pescetarian', 'vegan', 'vegetarian', 'halal', 'kosher', 'no_supplements']

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{client.name || 'Client Profile'}</h1>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
      </div>

      {/* Calorie Plan Summary */}
      {caloriePlan && (
        <Card className="bg-white/5 border-2 border-gold-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="text-gold-light" size={24} />
                <CardTitle className="text-gold-light">Kaloriplan</CardTitle>
              </div>
              <Link href="/dashboard/tools">
                <Button variant="outline" size="sm" className="border-gold-light text-gold-light hover:bg-gold-50">
                  Redigera i verktyg
                </Button>
              </Link>
            </div>
            <CardDescription className="text-gray-400">
              Sparad kaloriinformation för klienten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {caloriePlan.weight && (
                <div className="bg-[rgba(59,130,246,0.1)] p-4 rounded-lg border border-[rgba(59,130,246,0.3)]">
                  <p className="text-sm text-gray-400">Vikt</p>
                  <p className="text-2xl font-bold text-blue-400">{caloriePlan.weight} kg</p>
                </div>
              )}
              {caloriePlan.activityLevel && (
                <div className="bg-[rgba(34,197,94,0.1)] p-4 rounded-lg border border-[rgba(34,197,94,0.3)]">
                  <p className="text-sm text-gray-400">Aktivitetsnivå</p>
                  <p className="text-2xl font-bold text-green-400">x{caloriePlan.activityLevel}</p>
                </div>
              )}
              {caloriePlan.deficit !== null && (
                <div className="bg-[rgba(249,115,22,0.1)] p-4 rounded-lg border border-[rgba(249,115,22,0.3)]">
                  <p className="text-sm text-gray-400">Underskott</p>
                  <p className="text-2xl font-bold text-orange-400">{caloriePlan.deficit} kcal</p>
                </div>
              )}
              {caloriePlan.dailySteps && (
                <div className="bg-[rgba(168,85,247,0.1)] p-4 rounded-lg border border-[rgba(168,85,247,0.3)]">
                  <p className="text-sm text-gray-400">Steg/dag</p>
                  <p className="text-2xl font-bold text-purple-400">{caloriePlan.dailySteps.toLocaleString()}</p>
                </div>
              )}
              {caloriePlan.proteinPerKg && (
                <div className="bg-[rgba(239,68,68,0.1)] p-4 rounded-lg border border-[rgba(239,68,68,0.3)]">
                  <p className="text-sm text-gray-400">Protein</p>
                  <p className="text-2xl font-bold text-red-400">{caloriePlan.proteinPerKg} g/kg</p>
                </div>
              )}
              {caloriePlan.numMeals && (
                <div className="bg-[rgba(34,197,94,0.1)] p-4 rounded-lg border border-[rgba(34,197,94,0.3)]">
                  <p className="text-sm text-gray-400">Antal måltider</p>
                  <p className="text-2xl font-bold text-green-400">{caloriePlan.numMeals}</p>
                </div>
              )}
              {caloriePlan.weight && caloriePlan.activityLevel && (
                <div className="bg-[rgba(255,215,0,0.1)] p-4 rounded-lg border border-gold-primary/30">
                  <p className="text-sm text-gray-400">BMR</p>
                  <p className="text-2xl font-bold text-gold-light">
                    {Math.round(caloriePlan.weight * parseFloat(caloriePlan.activityLevel))} kcal
                  </p>
                </div>
              )}
              {caloriePlan.weight && caloriePlan.activityLevel && caloriePlan.deficit !== null && (
                <div className="bg-[rgba(255,215,0,0.1)] p-4 rounded-lg border border-gold-primary/30">
                  <p className="text-sm text-gray-400">Målintag</p>
                  <p className="text-2xl font-bold text-gold-light">
                    {Math.round(caloriePlan.weight * parseFloat(caloriePlan.activityLevel) - caloriePlan.deficit)} kcal
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout Assignment Section */}
      <Card className="bg-white/5 border-2 border-gold-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="text-gold-light" size={24} />
              <CardTitle className="text-gold-light">Träningsprogram</CardTitle>
            </div>
            {!assignedWorkout && !showWorkoutAssign && (
              <Button
                onClick={() => setShowWorkoutAssign(true)}
                variant="outline"
                size="sm"
                className="border-gold-light text-gold-light hover:bg-gold-50"
              >
                Tilldela program
              </Button>
            )}
          </div>
          <CardDescription className="text-gray-400">
            Tilldelade träningsprogram för klienten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedWorkout ? (
            <div className="space-y-4">
              <div className="bg-[rgba(255,215,0,0.05)] p-4 rounded-lg border border-gold-primary/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">
                      {assignedWorkout.workoutProgram.name}
                    </h3>
                    {assignedWorkout.workoutProgram.description && (
                      <p className="text-sm text-gray-400 mt-1">
                        {assignedWorkout.workoutProgram.description}
                      </p>
                    )}
                  </div>
                  {assignedWorkout.workoutProgram.difficulty && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      assignedWorkout.workoutProgram.difficulty === 'beginner'
                        ? 'bg-[rgba(40,167,69,0.2)] text-[#28a745]'
                        : assignedWorkout.workoutProgram.difficulty === 'intermediate'
                        ? 'bg-[rgba(255,193,7,0.2)] text-[#ffc107]'
                        : 'bg-[rgba(220,53,69,0.2)] text-[#dc3545]'
                    }`}>
                      {assignedWorkout.workoutProgram.difficulty}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar className="w-4 h-4 text-gold-light" />
                    <span>{assignedWorkout.workoutProgram.days.length} dagar</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Dumbbell className="w-4 h-4 text-gold-light" />
                    <span>
                      {assignedWorkout.workoutProgram.days.filter(d => !d.isRestDay).length} träningsdagar
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Startdatum: {new Date(assignedWorkout.startDate).toLocaleDateString('sv-SE')}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-gold-primary/30 text-[rgba(255,215,0,0.9)] hover:bg-gold-50"
                  onClick={() => setShowWorkoutAssign(true)}
                >
                  Ändra program
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-[rgba(255,100,100,0.3)] text-[rgba(255,100,100,0.9)] hover:bg-[rgba(255,100,100,0.1)]"
                  onClick={handleUnassignWorkout}
                >
                  Ta bort program
                </Button>
              </div>
            </div>
          ) : showWorkoutAssign ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Välj träningsprogram</Label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                    <SelectValue placeholder="Välj ett program" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrograms.map(program => (
                      <SelectItem key={program.id} value={program.id}>
                        <div className="flex items-center gap-2">
                          <span>{program.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({program.days.length} dagar)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAssignWorkout}
                  disabled={isAssigning || !selectedProgramId}
                  className="flex-1 bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
                >
                  {isAssigning ? 'Tilldelar...' : 'Tilldela program'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWorkoutAssign(false)
                    setSelectedProgramId('')
                  }}
                  className="border-gold-primary/30 text-gray-200 hover:bg-gold-50"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Inget träningsprogram tilldelat ännu</p>
              <Button
                onClick={() => setShowWorkoutAssign(true)}
                variant="outline"
                className="mt-4 border-gold-light text-gold-light hover:bg-gold-50"
              >
                Tilldela program
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Profile Information */}
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-gold-light">Basic Information</CardTitle>
            <CardDescription className="text-gray-400">Physical measurements and demographics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthdate" className="text-gray-200">Födelsedatum</Label>
                <Input
                  id="birthdate"
                  type="date"
                  {...register('birthdate')}
                  className="bg-black/30 border-gold-primary/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Kön</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                        <SelectValue placeholder="Välj kön" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                        <SelectItem value="male" className="text-white hover:bg-gold-50">Man</SelectItem>
                        <SelectItem value="female" className="text-white hover:bg-gold-50">Kvinna</SelectItem>
                        <SelectItem value="other" className="text-white hover:bg-gold-50">Annat</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heightCm" className="text-gray-200">Längd (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  placeholder="175"
                  {...register('heightCm')}
                  className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentWeightKg" className="text-gray-200">Vikt (kg)</Label>
                <Input
                  id="currentWeightKg"
                  type="number"
                  placeholder="75"
                  {...register('currentWeightKg')}
                  className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-gold-light">Mål</CardTitle>
            <CardDescription className="text-gray-400">Vad vill klienten uppnå?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-gray-200">Primärt Mål</Label>
              <Controller
                name="primaryGoal"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value}>
                    <div className="flex items-center space-x-2 p-3 border-2 border-gold-primary/20 rounded-lg bg-[rgba(0,0,0,0.2)] hover:border-[rgba(255,215,0,0.4)] transition-colors">
                      <RadioGroupItem value="build_muscle" id="build_muscle" />
                      <Label htmlFor="build_muscle" className="cursor-pointer flex-1 text-white">
                        Bygga muskler
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border-2 border-gold-primary/20 rounded-lg bg-[rgba(0,0,0,0.2)] hover:border-[rgba(255,215,0,0.4)] transition-colors">
                      <RadioGroupItem value="get_fit" id="get_fit" />
                      <Label htmlFor="get_fit" className="cursor-pointer flex-1 text-white">
                        Bli mer fit
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border-2 border-gold-primary/20 rounded-lg bg-[rgba(0,0,0,0.2)] hover:border-[rgba(255,215,0,0.4)] transition-colors">
                      <RadioGroupItem value="healthy_habits" id="healthy_habits" />
                      <Label htmlFor="healthy_habits" className="cursor-pointer flex-1 text-white">
                        Utveckla hälsosamma vanor
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Activity & Training */}
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-gold-light">Aktivitet & Träning</CardTitle>
            <CardDescription className="text-gray-400">Daglig aktivitet och träningserfarenhet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Aktivitetsnivå (Fritid)</Label>
                <Controller
                  name="activityLevelFree"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                        <SelectValue placeholder="Välj nivå" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                        <SelectItem value="very_low" className="text-white hover:bg-gold-50">Mycket låg</SelectItem>
                        <SelectItem value="low" className="text-white hover:bg-gold-50">Låg</SelectItem>
                        <SelectItem value="medium" className="text-white hover:bg-gold-50">Medium</SelectItem>
                        <SelectItem value="active" className="text-white hover:bg-gold-50">Aktiv</SelectItem>
                        <SelectItem value="very_active" className="text-white hover:bg-gold-50">Mycket aktiv</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Aktivitetsnivå (Jobb)</Label>
                <Controller
                  name="activityLevelWork"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                        <SelectValue placeholder="Välj nivå" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                        <SelectItem value="very_low" className="text-white hover:bg-gold-50">Sittande</SelectItem>
                        <SelectItem value="low" className="text-white hover:bg-gold-50">Lätt aktivitet</SelectItem>
                        <SelectItem value="medium" className="text-white hover:bg-gold-50">Måttlig aktivitet</SelectItem>
                        <SelectItem value="high" className="text-white hover:bg-gold-50">Hög aktivitet</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Träningserfarenhet</Label>
                <Controller
                  name="trainingExperience"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                        <SelectValue placeholder="Välj erfarenhet" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                        <SelectItem value="beginner" className="text-white hover:bg-gold-50">Nybörjare</SelectItem>
                        <SelectItem value="experienced" className="text-white hover:bg-gold-50">Erfaren</SelectItem>
                        <SelectItem value="very_experienced" className="text-white hover:bg-gold-50">Mycket erfaren</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Träningsdagar</Label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map(day => (
                  <Button
                    key={day}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentDays = control._formValues.trainingDays || []
                      if (currentDays.includes(day)) {
                        setValue('trainingDays', currentDays.filter((d: string) => d !== day))
                      } else {
                        setValue('trainingDays', [...currentDays, day])
                      }
                    }}
                    className={control._formValues.trainingDays?.includes(day) ? 'bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold border-0' : 'bg-black/30 border-gold-primary/30 text-white hover:border-[rgba(255,215,0,0.5)]'}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainingDetails" className="text-gray-200">Träningsdetaljer</Label>
              <Textarea
                id="trainingDetails"
                placeholder="Beskriv klientens träningserfarenhet..."
                {...register('trainingDetails')}
                rows={3}
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-gold-light">Näring</CardTitle>
            <CardDescription className="text-gray-400">Kostpreferenser och allergier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Allergier</Label>
              <div className="flex flex-wrap gap-2">
                {commonAllergies.map(allergy => (
                  <Button
                    key={allergy}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentAllergies = control._formValues.allergies || []
                      if (currentAllergies.includes(allergy)) {
                        setValue('allergies', currentAllergies.filter((a: string) => a !== allergy))
                      } else {
                        setValue('allergies', [...currentAllergies, allergy])
                      }
                    }}
                    className={control._formValues.allergies?.includes(allergy) ? 'bg-[rgba(239,68,68,0.2)] border-red-400 text-red-300 font-medium' : 'bg-black/30 border-gold-primary/30 text-white hover:border-[rgba(255,215,0,0.5)]'}
                  >
                    {allergy}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Kostpreferenser</Label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map(option => (
                  <Button
                    key={option}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentPrefs = control._formValues.dietaryPreferences || []
                      if (currentPrefs.includes(option)) {
                        setValue('dietaryPreferences', currentPrefs.filter((p: string) => p !== option))
                      } else {
                        setValue('dietaryPreferences', [...currentPrefs, option])
                      }
                    }}
                    className={control._formValues.dietaryPreferences?.includes(option) ? 'bg-[rgba(34,197,94,0.2)] border-green-400 text-green-300 font-medium' : 'bg-black/30 border-gold-primary/30 text-white hover:border-[rgba(255,215,0,0.5)]'}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nutritionNotes" className="text-gray-200">Kostanteckningar</Label>
              <Textarea
                id="nutritionNotes"
                placeholder="Matpreferenser, matvanor, etc..."
                {...register('nutritionNotes')}
                rows={3}
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nutritionMissing" className="text-gray-200">Övrig information</Label>
              <Textarea
                id="nutritionMissing"
                placeholder="Annan viktig näringsinformation..."
                {...register('nutritionMissing')}
                rows={2}
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle */}
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-gold-light">Livsstil</CardTitle>
            <CardDescription className="text-gray-400">Övriga kommentarer och anteckningar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lifestyleNotes" className="text-gray-200">Livsstilsanteckningar</Label>
              <Textarea
                id="lifestyleNotes"
                placeholder="Sömn, stress, arbetsschema, etc..."
                {...register('lifestyleNotes')}
                rows={4}
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Sparar...' : 'Spara Profil'}
          </Button>
          <Link href="/dashboard/clients">
            <Button type="button" variant="outline" className="border-gold-primary/30 text-gray-200 hover:bg-gold-50">
              Avbryt
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
