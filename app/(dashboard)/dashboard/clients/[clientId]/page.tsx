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
import { ArrowLeft, Save, Calculator } from 'lucide-react'
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
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="text-[#FFD700]" size={24} />
                <CardTitle className="text-[#FFD700]">Kaloriplan</CardTitle>
              </div>
              <Link href="/dashboard/tools">
                <Button variant="outline" size="sm" className="border-[#FFD700] text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]">
                  Redigera i verktyg
                </Button>
              </Link>
            </div>
            <CardDescription className="text-[rgba(255,255,255,0.6)]">
              Sparad kaloriinformation för klienten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {caloriePlan.weight && (
                <div className="bg-[rgba(59,130,246,0.1)] p-4 rounded-lg border border-[rgba(59,130,246,0.3)]">
                  <p className="text-sm text-[rgba(255,255,255,0.6)]">Vikt</p>
                  <p className="text-2xl font-bold text-blue-400">{caloriePlan.weight} kg</p>
                </div>
              )}
              {caloriePlan.activityLevel && (
                <div className="bg-[rgba(34,197,94,0.1)] p-4 rounded-lg border border-[rgba(34,197,94,0.3)]">
                  <p className="text-sm text-[rgba(255,255,255,0.6)]">Aktivitetsnivå</p>
                  <p className="text-2xl font-bold text-green-400">x{caloriePlan.activityLevel}</p>
                </div>
              )}
              {caloriePlan.deficit !== null && (
                <div className="bg-[rgba(249,115,22,0.1)] p-4 rounded-lg border border-[rgba(249,115,22,0.3)]">
                  <p className="text-sm text-[rgba(255,255,255,0.6)]">Underskott</p>
                  <p className="text-2xl font-bold text-orange-400">{caloriePlan.deficit} kcal</p>
                </div>
              )}
              {caloriePlan.dailySteps && (
                <div className="bg-[rgba(168,85,247,0.1)] p-4 rounded-lg border border-[rgba(168,85,247,0.3)]">
                  <p className="text-sm text-[rgba(255,255,255,0.6)]">Steg/dag</p>
                  <p className="text-2xl font-bold text-purple-400">{caloriePlan.dailySteps.toLocaleString()}</p>
                </div>
              )}
              {caloriePlan.proteinPerKg && (
                <div className="bg-[rgba(239,68,68,0.1)] p-4 rounded-lg border border-[rgba(239,68,68,0.3)]">
                  <p className="text-sm text-[rgba(255,255,255,0.6)]">Protein</p>
                  <p className="text-2xl font-bold text-red-400">{caloriePlan.proteinPerKg} g/kg</p>
                </div>
              )}
              {caloriePlan.numMeals && (
                <div className="bg-[rgba(34,197,94,0.1)] p-4 rounded-lg border border-[rgba(34,197,94,0.3)]">
                  <p className="text-sm text-[rgba(255,255,255,0.6)]">Antal måltider</p>
                  <p className="text-2xl font-bold text-green-400">{caloriePlan.numMeals}</p>
                </div>
              )}
              {caloriePlan.weight && caloriePlan.activityLevel && (
                <div className="bg-[rgba(255,215,0,0.1)] p-4 rounded-lg border border-[rgba(255,215,0,0.3)]">
                  <p className="text-sm text-[rgba(255,255,255,0.6)]">BMR</p>
                  <p className="text-2xl font-bold text-[#FFD700]">
                    {Math.round(caloriePlan.weight * parseFloat(caloriePlan.activityLevel))} kcal
                  </p>
                </div>
              )}
              {caloriePlan.weight && caloriePlan.activityLevel && caloriePlan.deficit !== null && (
                <div className="bg-[rgba(255,215,0,0.1)] p-4 rounded-lg border border-[rgba(255,215,0,0.3)]">
                  <p className="text-sm text-[rgba(255,255,255,0.6)]">Målintag</p>
                  <p className="text-2xl font-bold text-[#FFD700]">
                    {Math.round(caloriePlan.weight * parseFloat(caloriePlan.activityLevel) - caloriePlan.deficit)} kcal
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Profile Information */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">Basic Information</CardTitle>
            <CardDescription className="text-[rgba(255,255,255,0.6)]">Physical measurements and demographics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthdate" className="text-[rgba(255,255,255,0.8)]">Födelsedatum</Label>
                <Input
                  id="birthdate"
                  type="date"
                  {...register('birthdate')}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[rgba(255,255,255,0.8)]">Kön</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                        <SelectValue placeholder="Välj kön" />
                      </SelectTrigger>
                      <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                        <SelectItem value="male" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Man</SelectItem>
                        <SelectItem value="female" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Kvinna</SelectItem>
                        <SelectItem value="other" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Annat</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heightCm" className="text-[rgba(255,255,255,0.8)]">Längd (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  placeholder="175"
                  {...register('heightCm')}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentWeightKg" className="text-[rgba(255,255,255,0.8)]">Vikt (kg)</Label>
                <Input
                  id="currentWeightKg"
                  type="number"
                  placeholder="75"
                  {...register('currentWeightKg')}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">Mål</CardTitle>
            <CardDescription className="text-[rgba(255,255,255,0.6)]">Vad vill klienten uppnå?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-[rgba(255,255,255,0.8)]">Primärt Mål</Label>
              <Controller
                name="primaryGoal"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value}>
                    <div className="flex items-center space-x-2 p-3 border-2 border-[rgba(255,215,0,0.2)] rounded-lg bg-[rgba(0,0,0,0.2)] hover:border-[rgba(255,215,0,0.4)] transition-colors">
                      <RadioGroupItem value="build_muscle" id="build_muscle" />
                      <Label htmlFor="build_muscle" className="cursor-pointer flex-1 text-white">
                        Bygga muskler
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border-2 border-[rgba(255,215,0,0.2)] rounded-lg bg-[rgba(0,0,0,0.2)] hover:border-[rgba(255,215,0,0.4)] transition-colors">
                      <RadioGroupItem value="get_fit" id="get_fit" />
                      <Label htmlFor="get_fit" className="cursor-pointer flex-1 text-white">
                        Bli mer fit
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border-2 border-[rgba(255,215,0,0.2)] rounded-lg bg-[rgba(0,0,0,0.2)] hover:border-[rgba(255,215,0,0.4)] transition-colors">
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
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">Aktivitet & Träning</CardTitle>
            <CardDescription className="text-[rgba(255,255,255,0.6)]">Daglig aktivitet och träningserfarenhet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[rgba(255,255,255,0.8)]">Aktivitetsnivå (Fritid)</Label>
                <Controller
                  name="activityLevelFree"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                        <SelectValue placeholder="Välj nivå" />
                      </SelectTrigger>
                      <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                        <SelectItem value="very_low" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Mycket låg</SelectItem>
                        <SelectItem value="low" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Låg</SelectItem>
                        <SelectItem value="medium" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Medium</SelectItem>
                        <SelectItem value="active" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Aktiv</SelectItem>
                        <SelectItem value="very_active" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Mycket aktiv</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[rgba(255,255,255,0.8)]">Aktivitetsnivå (Jobb)</Label>
                <Controller
                  name="activityLevelWork"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                        <SelectValue placeholder="Välj nivå" />
                      </SelectTrigger>
                      <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                        <SelectItem value="very_low" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Sittande</SelectItem>
                        <SelectItem value="low" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Lätt aktivitet</SelectItem>
                        <SelectItem value="medium" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Måttlig aktivitet</SelectItem>
                        <SelectItem value="high" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Hög aktivitet</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[rgba(255,255,255,0.8)]">Träningserfarenhet</Label>
                <Controller
                  name="trainingExperience"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                        <SelectValue placeholder="Välj erfarenhet" />
                      </SelectTrigger>
                      <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                        <SelectItem value="beginner" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Nybörjare</SelectItem>
                        <SelectItem value="experienced" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Erfaren</SelectItem>
                        <SelectItem value="very_experienced" className="text-white hover:bg-[rgba(255,215,0,0.1)]">Mycket erfaren</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[rgba(255,255,255,0.8)]">Träningsdagar</Label>
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
                    className={control._formValues.trainingDays?.includes(day) ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold border-0' : 'bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white hover:border-[rgba(255,215,0,0.5)]'}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainingDetails" className="text-[rgba(255,255,255,0.8)]">Träningsdetaljer</Label>
              <Textarea
                id="trainingDetails"
                placeholder="Beskriv klientens träningserfarenhet..."
                {...register('trainingDetails')}
                rows={3}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">Näring</CardTitle>
            <CardDescription className="text-[rgba(255,255,255,0.6)]">Kostpreferenser och allergier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[rgba(255,255,255,0.8)]">Allergier</Label>
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
                    className={control._formValues.allergies?.includes(allergy) ? 'bg-[rgba(239,68,68,0.2)] border-red-400 text-red-300 font-medium' : 'bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white hover:border-[rgba(255,215,0,0.5)]'}
                  >
                    {allergy}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[rgba(255,255,255,0.8)]">Kostpreferenser</Label>
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
                    className={control._formValues.dietaryPreferences?.includes(option) ? 'bg-[rgba(34,197,94,0.2)] border-green-400 text-green-300 font-medium' : 'bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white hover:border-[rgba(255,215,0,0.5)]'}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nutritionNotes" className="text-[rgba(255,255,255,0.8)]">Kostanteckningar</Label>
              <Textarea
                id="nutritionNotes"
                placeholder="Matpreferenser, matvanor, etc..."
                {...register('nutritionNotes')}
                rows={3}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nutritionMissing" className="text-[rgba(255,255,255,0.8)]">Övrig information</Label>
              <Textarea
                id="nutritionMissing"
                placeholder="Annan viktig näringsinformation..."
                {...register('nutritionMissing')}
                rows={2}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">Livsstil</CardTitle>
            <CardDescription className="text-[rgba(255,255,255,0.6)]">Övriga kommentarer och anteckningar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lifestyleNotes" className="text-[rgba(255,255,255,0.8)]">Livsstilsanteckningar</Label>
              <Textarea
                id="lifestyleNotes"
                placeholder="Sömn, stress, arbetsschema, etc..."
                {...register('lifestyleNotes')}
                rows={4}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Sparar...' : 'Spara Profil'}
          </Button>
          <Link href="/dashboard/clients">
            <Button type="button" variant="outline" className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]">
              Avbryt
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
