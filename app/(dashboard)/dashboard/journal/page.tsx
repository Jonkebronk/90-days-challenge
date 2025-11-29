'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Scale,
  Ruler,
  Camera,
  Minus,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

// Swedish label translations for enum values
const goalLabels: Record<string, string> = {
  build_muscle: 'Bygga muskler',
  lose_fat: 'Gå ner i vikt',
  lose_weight: 'Gå ner i vikt',
  gain_weight: 'Gå upp i vikt',
  maintain: 'Bibehålla vikt',
  recomp: 'Förbättra kroppssammansättning',
  improve_health: 'Förbättra hälsa',
  increase_energy: 'Öka energi',
  get_stronger: 'Bli starkare',
  improve_endurance: 'Förbättra uthållighet',
  other: 'Annat',
}

const genderLabels: Record<string, string> = {
  male: 'Man',
  female: 'Kvinna',
  other: 'Annat',
}

const activityLabels: Record<string, string> = {
  sedentary: 'Stillasittande',
  very_low: 'Mycket låg',
  low: 'Låg',
  light: 'Lätt',
  moderate: 'Måttlig',
  medium: 'Medel',
  active: 'Aktiv',
  high: 'Hög',
  very_high: 'Mycket hög',
  very_active: 'Mycket aktiv',
  extremely_active: 'Extremt aktiv',
}

const experienceLabels: Record<string, string> = {
  beginner: 'Nybörjare',
  some_experience: 'Viss erfarenhet',
  intermediate: 'Medel',
  experienced: 'Erfaren',
  advanced: 'Avancerad',
  very_experienced: 'Mycket erfaren',
  expert: 'Expert',
}

const dayLabels: Record<string, string> = {
  monday: 'Måndag',
  tuesday: 'Tisdag',
  wednesday: 'Onsdag',
  thursday: 'Torsdag',
  friday: 'Fredag',
  saturday: 'Lördag',
  sunday: 'Söndag',
}

const formatLabel = (value: string | null | undefined, labels: Record<string, string>): string => {
  if (!value) return 'Ej angivet'
  return labels[value.toLowerCase()] || value
}

type Client = {
  id: string
  name: string | null
  email: string
  status: string
  createdAt: string
  membershipStartDate: string | null
  firstName: string | null
  lastName: string | null
  birthdate: string | null
  gender: string | null
  phone: string | null
  country: string | null
  tags: string[]
  checkInFrequency: string | null
  checkInPeriod: string | null
  checkInDay: string | null
}

type UserProfile = {
  primaryGoal: string | null
  heightCm: number | null
  currentWeightKg: number | null
  genderAtBirth: string | null
  activityLevelFree: string | null
  activityLevelWork: string | null
  nutritionNotes: string | null
  allergies: string[]
  dietaryPreferences: string[]
  excludedIngredients: string[]
  nutritionMissing: string | null
  trainingDays: string[]
  trainingExperience: string | null
  trainingDetails: string | null
  lifestyleNotes: string | null
}

type Lead = {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  age: number | null
  gender: string | null
  height: number | null
  currentWeight: number | null
  // Training
  trainingGoal: string | null
  currentTraining: string | null
  trainingExperience: string | null
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
  status: string
  tags: string[]
  createdAt: string
}

type CheckIn = {
  id: string
  weekNumber: number | null
  isStartCheckIn: boolean
  statusUpdate: string | null
  weightKg: number | null
  // Daily weights
  mondayWeight: number | null
  tuesdayWeight: number | null
  wednesdayWeight: number | null
  thursdayWeight: number | null
  fridayWeight: number | null
  saturdayWeight: number | null
  sundayWeight: number | null
  // Body measurements
  chest: number | null
  waist: number | null
  hips: number | null
  butt: number | null
  arms: number | null
  thighs: number | null
  calves: number | null
  energyLevel: number | null
  mood: number | null
  dietPlanAdherence: number | null
  workoutPlanAdherence: number | null
  sleepNotes: string | null
  dailySteps: string | null
  // Training and diet adherence
  trainedAllSessions: boolean | null
  trainingComments: string | null
  hadDietDeviations: boolean | null
  dietComments: string | null
  otherComments: string | null
  photoFront: string | null
  photoSide: string | null
  photoBack: string | null
  createdAt: string
}

type JournalData = {
  client: Client
  profile: UserProfile | null
  lead: Lead | null
  checkIns: CheckIn[]
  stats: {
    checkIns: {
      total: number
      thisMonth: number
    }
    currentWeight: number | null
    startWeight: number | null
  }
  progression: {
    weight: Array<{
      date: string
      weight: number
      weekNumber: number | null
    }>
    measurements: Array<{
      date: string
      weekNumber: number | null
      chest: number | null
      waist: number | null
      hips: number | null
      butt: number | null
      arms: number | null
      thighs: number | null
      calves: number | null
    }>
    photos: Array<{
      date: string
      weekNumber: number | null
      photoFront: string | null
      photoSide: string | null
      photoBack: string | null
    }>
  }
}

function ClientJournalContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clients, setClients] = useState<Client[]>([])
  const [journalData, setJournalData] = useState<JournalData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(true)

  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'
  const isClient = (session?.user as any)?.role?.toUpperCase() === 'CLIENT'

  useEffect(() => {
    if (session?.user) {
      if (isCoach) {
        fetchClients()
      } else if (isClient) {
        // For clients, automatically load their own journal
        fetchJournal(session.user.id!)
      }
    }
  }, [session, isCoach, isClient])

  useEffect(() => {
    if (isCoach) {
      const clientId = searchParams.get('client')
      if (clientId) {
        setSelectedClientId(clientId)
        fetchJournal(clientId)
      }
    }
  }, [searchParams, isCoach])

  const fetchClients = async () => {
    try {
      setIsLoadingClients(true)
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      } else {
        toast.error('Kunde inte hämta klienter')
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoadingClients(false)
    }
  }

  const fetchJournal = async (clientId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/client-journal/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setJournalData(data)
      } else {
        toast.error('Kunde inte hämta klientjournal')
      }
    } catch (error) {
      console.error('Error fetching journal:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
    router.push(`/dashboard/journal?client=${clientId}`)
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          {isCoach ? 'Klientjournal' : 'Min Journal'}
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm tracking-[1px]">
          {isCoach
            ? 'Komplett översikt över klientens resa och framsteg'
            : 'Din resa och framsteg i 90-Dagars Challenge'}
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Client Selector - Only for coaches */}
      {isCoach && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <Label className="text-gray-700 mb-2 block text-sm sm:text-base font-medium">
            Välj klient
          </Label>
          <Select value={selectedClientId} onValueChange={handleClientChange}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900 text-sm sm:text-base">
              <SelectValue placeholder="Välj en klient..." />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {isLoadingClients ? (
                <SelectItem value="loading" disabled className="text-gray-500">
                  Laddar...
                </SelectItem>
              ) : clients.length === 0 ? (
                <SelectItem value="none" disabled className="text-gray-500">
                  Inga klienter
                </SelectItem>
              ) : (
                clients.map((client) => (
                  <SelectItem
                    key={client.id}
                    value={client.id}
                    className="text-gray-900 hover:bg-amber-50"
                  >
                    {client.name || client.email}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Laddar klientjournal...</p>
        </div>
      )}

      {/* Journal Content */}
      {!isLoading && journalData && (
        <Tabs defaultValue="application" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-gray-100 border border-gray-200 w-max sm:w-auto">
              <TabsTrigger value="application" className="text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">
                Ansökan
              </TabsTrigger>
              <TabsTrigger value="checkins" className="text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">
                Check-ins
              </TabsTrigger>
              <TabsTrigger value="progress" className="text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">
                Framsteg
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Application Tab */}
          <TabsContent value="application" className="space-y-4 sm:space-y-6">
            {journalData.lead ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    Ursprunglig Intresseanmälan
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    Inskickad {format(new Date(journalData.lead.createdAt), 'PP', { locale: sv })}
                  </p>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Personuppgifter</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-gray-500 text-xs sm:text-sm">Namn</Label>
                        <p className="text-gray-900 text-sm sm:text-base">{journalData.lead.fullName || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-xs sm:text-sm">Ålder</Label>
                        <p className="text-gray-900 text-sm sm:text-base">{journalData.lead.age ? `${journalData.lead.age} år` : '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-xs sm:text-sm">Kön</Label>
                        <p className="text-gray-900 text-sm sm:text-base">{formatLabel(journalData.lead.gender, genderLabels)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-xs sm:text-sm">Stad</Label>
                        <p className="text-gray-900 text-sm sm:text-base">{journalData.lead.city || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-xs sm:text-sm">Land</Label>
                        <p className="text-gray-900 text-sm sm:text-base">{journalData.lead.country || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Physical Stats */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Fysiska Mått</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-gray-500 text-xs sm:text-sm">Längd</Label>
                        <p className="text-gray-900 text-sm sm:text-base">{journalData.lead.height ? `${journalData.lead.height} cm` : '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-xs sm:text-sm">Nuvarande vikt</Label>
                        <p className="text-gray-900 text-sm sm:text-base">{journalData.lead.currentWeight ? `${journalData.lead.currentWeight} kg` : '-'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Goals / Motivation */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Målsättning</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {journalData.lead.whyJoin && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Klientens målsättningar</Label>
                          <p className="text-gray-900 mt-1 text-sm sm:text-base whitespace-pre-wrap">{journalData.lead.whyJoin}</p>
                        </div>
                      )}
                      {journalData.lead.biggestChallenges && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Största utmaningar</Label>
                          <p className="text-gray-900 mt-1 text-sm sm:text-base whitespace-pre-wrap">{journalData.lead.biggestChallenges}</p>
                        </div>
                      )}
                      {journalData.lead.previousCoaching && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Tidigare coaching eller PT</Label>
                          <p className="text-gray-900 mt-1 text-sm sm:text-base whitespace-pre-wrap">{journalData.lead.previousCoaching}</p>
                        </div>
                      )}
                      {!journalData.lead.whyJoin && !journalData.lead.biggestChallenges && !journalData.lead.previousCoaching && (
                        <p className="text-gray-500 text-sm">Ej angivet</p>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Training */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Träningsbakgrund</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {journalData.lead.currentTraining && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Tränar du idag?</Label>
                          <p className="text-gray-900 mt-1 text-sm sm:text-base whitespace-pre-wrap">{journalData.lead.currentTraining}</p>
                        </div>
                      )}
                      {journalData.lead.trainingExperience && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Träningserfarenhet historiskt</Label>
                          <p className="text-gray-900 mt-1 text-sm sm:text-base whitespace-pre-wrap">{journalData.lead.trainingExperience}</p>
                        </div>
                      )}
                      {journalData.lead.injuries && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Skador/Begränsningar</Label>
                          <p className="text-gray-900 mt-1 text-sm sm:text-base whitespace-pre-wrap">{journalData.lead.injuries}</p>
                        </div>
                      )}
                      {!journalData.lead.currentTraining && !journalData.lead.trainingExperience && !journalData.lead.injuries && (
                        <p className="text-gray-500 text-sm">Ej angivet</p>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Nutrition */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Kostbakgrund</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {journalData.lead.dietHistory && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Hur äter du idag?</Label>
                          <p className="text-gray-900 mt-1 text-sm sm:text-base whitespace-pre-wrap">{journalData.lead.dietHistory}</p>
                        </div>
                      )}
                      {journalData.lead.favoriteFood && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Matpreferenser</Label>
                          <p className="text-gray-900 mt-1 text-sm sm:text-base whitespace-pre-wrap">{journalData.lead.favoriteFood}</p>
                        </div>
                      )}
                      {journalData.lead.allergies && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Allergier och intoleranser</Label>
                          <p className="text-gray-900 mt-1 text-sm sm:text-base">{journalData.lead.allergies}</p>
                        </div>
                      )}
                      {!journalData.lead.dietHistory && !journalData.lead.favoriteFood && !journalData.lead.allergies && (
                        <p className="text-gray-500 text-sm">Ej angivet</p>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Lifestyle */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Livsstil</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {journalData.lead.lifestyle && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">En vanlig dag</Label>
                          <p className="text-gray-900 mt-1 text-sm sm:text-base whitespace-pre-wrap">{journalData.lead.lifestyle}</p>
                        </div>
                      )}
                      {!journalData.lead.lifestyle && (
                        <p className="text-gray-500 text-sm">Ej angivet</p>
                      )}
                    </div>
                  </div>

                  {/* Application Photos */}
                  {(journalData.lead.frontPhoto || journalData.lead.sidePhoto || journalData.lead.backPhoto) && (
                    <>
                      <Separator className="bg-gray-200" />
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Bilder från ansökan</h3>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                          {journalData.lead.frontPhoto && (
                            <div>
                              <img
                                src={journalData.lead.frontPhoto}
                                alt="Fram"
                                className="w-full h-auto rounded border-2 border-gray-200"
                              />
                              <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-1">Fram</p>
                            </div>
                          )}
                          {journalData.lead.sidePhoto && (
                            <div>
                              <img
                                src={journalData.lead.sidePhoto}
                                alt="Sida"
                                className="w-full h-auto rounded border-2 border-gray-200"
                              />
                              <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-1">Sida</p>
                            </div>
                          )}
                          {journalData.lead.backPhoto && (
                            <div>
                              <img
                                src={journalData.lead.backPhoto}
                                alt="Bak"
                                className="w-full h-auto rounded border-2 border-gray-200"
                              />
                              <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-1">Bak</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 text-center shadow-sm">
                <p className="text-gray-500 text-sm sm:text-base">Ingen intresseanmälan hittades för denna klient</p>
                <p className="text-gray-500 text-xs mt-2">Klienten kan ha blivit tillagd manuellt utan ansökan</p>
              </div>
            )}
          </TabsContent>

          {/* Check-ins Tab */}
          <TabsContent value="checkins" className="space-y-3 sm:space-y-4">
            {journalData.checkIns.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 sm:p-12 text-center">
                <ClipboardCheck className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">Inga check-ins ännu</p>
              </div>
            ) : (
              <>
                {/* Separate start check-in and show it first with badge */}
                {(() => {
                  const startCheckIn = journalData.checkIns.find((ci: any) => ci.isStartCheckIn === true)
                  const regularCheckIns = journalData.checkIns.filter((ci: any) => !ci.isStartCheckIn)

                  return (
                    <>
                      {startCheckIn && (
                        <div
                          key={startCheckIn.id}
                          className="bg-white border-2 border-amber-300 rounded-xl overflow-hidden shadow-sm"
                        >
                          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                                🎯
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                                  <h3 className="font-bold text-amber-600 text-sm sm:text-lg">
                                    START CHECK-IN
                                  </h3>
                                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a]">
                                    UTGÅNGSPUNKT
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {format(new Date(startCheckIn.createdAt), 'PP', { locale: sv })}
                                </p>
                              </div>
                            </div>
                            {startCheckIn.mondayWeight && (
                              <div className="text-left sm:text-right ml-12 sm:ml-0">
                                <p className="text-xl sm:text-2xl font-bold text-amber-600">
                                  {startCheckIn.mondayWeight} kg
                                </p>
                                <p className="text-xs text-gray-500">Startvikt</p>
                              </div>
                            )}
                          </div>
                          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                            {startCheckIn.statusUpdate && (
                              <div>
                                <Label className="text-gray-500 text-xs sm:text-sm">Berättelse</Label>
                                <p className="text-gray-900 mt-1 text-sm sm:text-base">{startCheckIn.statusUpdate}</p>
                              </div>
                            )}

                            {/* Body measurements for start check-in */}
                            {(startCheckIn.chest || startCheckIn.waist || startCheckIn.hips || startCheckIn.butt || startCheckIn.arms || startCheckIn.thighs || startCheckIn.calves) && (
                              <div>
                                <Label className="text-gray-500 text-xs sm:text-sm mb-2 block">Startmått</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                                  {startCheckIn.chest && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-500">Bröst</p>
                                      <p className="text-gray-900 font-medium text-sm sm:text-base">{startCheckIn.chest} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.waist && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-500">Midja</p>
                                      <p className="text-gray-900 font-medium text-sm sm:text-base">{startCheckIn.waist} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.hips && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-500">Höfter</p>
                                      <p className="text-gray-900 font-medium text-sm sm:text-base">{startCheckIn.hips} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.butt && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-500">Rumpa</p>
                                      <p className="text-gray-900 font-medium text-sm sm:text-base">{startCheckIn.butt} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.arms && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-500">Armar</p>
                                      <p className="text-gray-900 font-medium text-sm sm:text-base">{startCheckIn.arms} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.thighs && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-500">Lår</p>
                                      <p className="text-gray-900 font-medium text-sm sm:text-base">{startCheckIn.thighs} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.calves && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-500">Vader</p>
                                      <p className="text-gray-900 font-medium text-sm sm:text-base">{startCheckIn.calves} cm</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Photos */}
                            {(startCheckIn.photoFront || startCheckIn.photoSide || startCheckIn.photoBack) && (
                              <div>
                                <Label className="text-gray-500 text-xs sm:text-sm mb-2 block">Startbilder</Label>
                                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                  {startCheckIn.photoFront && (
                                    <div>
                                      <img
                                        src={startCheckIn.photoFront}
                                        alt="Front"
                                        className="w-full h-auto rounded border-2 border-gray-200"
                                      />
                                      <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-1">Fram</p>
                                    </div>
                                  )}
                                  {startCheckIn.photoSide && (
                                    <div>
                                      <img
                                        src={startCheckIn.photoSide}
                                        alt="Side"
                                        className="w-full h-auto rounded border-2 border-gray-200"
                                      />
                                      <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-1">Sida</p>
                                    </div>
                                  )}
                                  {startCheckIn.photoBack && (
                                    <div>
                                      <img
                                        src={startCheckIn.photoBack}
                                        alt="Back"
                                        className="w-full h-auto rounded border-2 border-gray-200"
                                      />
                                      <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-1">Bak</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Regular check-ins */}
                      {regularCheckIns.map((checkIn: any) => (
                <div
                  key={checkIn.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                          Vecka {checkIn.weekNumber || 'N/A'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {format(new Date(checkIn.createdAt), 'PP', { locale: sv })}
                        </p>
                      </div>
                    </div>
                    {checkIn.weightKg && (
                      <div className="text-right">
                        <p className="text-xl sm:text-2xl font-bold text-amber-600">
                          {checkIn.weightKg} kg
                        </p>
                        <p className="text-xs text-gray-500">Vikt</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    {checkIn.statusUpdate && (
                      <div>
                        <Label className="text-gray-500 text-xs sm:text-sm">Statusuppdatering</Label>
                        <p className="text-gray-900 mt-1 text-sm sm:text-base">{checkIn.statusUpdate}</p>
                      </div>
                    )}

                    {/* Ratings */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                      {checkIn.energyLevel && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Energi</Label>
                          <p className="text-gray-900 font-medium text-sm sm:text-base">{checkIn.energyLevel}/5</p>
                        </div>
                      )}
                      {checkIn.mood && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Humör</Label>
                          <p className="text-gray-900 font-medium text-sm sm:text-base">{checkIn.mood}/5</p>
                        </div>
                      )}
                      {checkIn.dietPlanAdherence && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Kost</Label>
                          <p className="text-gray-900 font-medium text-sm sm:text-base">{checkIn.dietPlanAdherence}/5</p>
                        </div>
                      )}
                      {checkIn.workoutPlanAdherence && (
                        <div>
                          <Label className="text-gray-500 text-xs sm:text-sm">Träning</Label>
                          <p className="text-gray-900 font-medium text-sm sm:text-base">{checkIn.workoutPlanAdherence}/5</p>
                        </div>
                      )}
                    </div>

                    {/* Sleep & Steps */}
                    {(checkIn.sleepNotes || checkIn.dailySteps) && (
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {checkIn.sleepNotes && (
                          <div>
                            <Label className="text-gray-500 text-xs sm:text-sm">Sömn</Label>
                            <p className="text-gray-900 text-sm sm:text-base">{checkIn.sleepNotes}</p>
                          </div>
                        )}
                        {checkIn.dailySteps && (
                          <div>
                            <Label className="text-gray-500 text-xs sm:text-sm">Steg/dag</Label>
                            <p className="text-gray-900 text-sm sm:text-base">{checkIn.dailySteps}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photos */}
                    {(checkIn.photoFront || checkIn.photoSide || checkIn.photoBack) && (
                      <div>
                        <Label className="text-gray-500 text-xs sm:text-sm mb-2 block">Bilder</Label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                          {checkIn.photoFront && (
                            <div>
                              <img
                                src={checkIn.photoFront}
                                alt="Framsida"
                                className="w-full h-32 sm:h-48 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 text-center">Fram</p>
                            </div>
                          )}
                          {checkIn.photoSide && (
                            <div>
                              <img
                                src={checkIn.photoSide}
                                alt="Sida"
                                className="w-full h-32 sm:h-48 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 text-center">Sida</p>
                            </div>
                          )}
                          {checkIn.photoBack && (
                            <div>
                              <img
                                src={checkIn.photoBack}
                                alt="Baksida"
                                className="w-full h-32 sm:h-48 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 text-center">Bak</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                      ))
                    }
                    </>
                  )
                })()}
              </>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6 sm:space-y-8">
            {(() => {
              // Calculate weight data
              const weightData = journalData.progression.weight
              const startWeight = weightData.length > 0 ? weightData[0].weight : null
              const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : null
              const weightChange = startWeight && currentWeight ? Number(currentWeight) - Number(startWeight) : null

              // Chart data
              const weightChartData = weightData.map((entry, idx) => ({
                name: entry.weekNumber ? `V${entry.weekNumber}` : idx === 0 ? 'Start' : `V${idx}`,
                weight: Number(entry.weight),
              }))

              // Get start and latest measurements
              const measurements = journalData.progression.measurements || []
              const startMeasurements = measurements.length > 0 ? measurements[0] : null
              const latestMeasurements = measurements.length > 1 ? measurements[measurements.length - 1] : null

              // Get start and latest photos
              const photos = journalData.progression.photos
              const startPhotos = photos.length > 0 ? photos[0] : null
              const latestPhotos = photos.length > 1 ? photos[photos.length - 1] : null

              const measurementFields = [
                { label: 'Bröst', field: 'chest' },
                { label: 'Midja', field: 'waist' },
                { label: 'Höfter', field: 'hips' },
                { label: 'Rumpa', field: 'butt' },
                { label: 'Armar', field: 'arms' },
                { label: 'Lår', field: 'thighs' },
                { label: 'Vader', field: 'calves' },
              ]

              return (
                <>
                  {/* Weight Section */}
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center">
                        <Scale className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-amber-500">Viktförändring</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <p className="text-gray-500 text-sm mb-1">Startvikt</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {startWeight ? `${Number(startWeight).toFixed(1)} kg` : '-'}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <p className="text-gray-500 text-sm mb-1">Nuvarande vikt</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {currentWeight ? `${Number(currentWeight).toFixed(1)} kg` : '-'}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <p className="text-gray-500 text-sm mb-1">Förändring</p>
                        <div className="flex items-center gap-2">
                          <p className={`text-2xl font-bold ${weightChange && weightChange < 0 ? 'text-green-400' : weightChange && weightChange > 0 ? 'text-red-400' : 'text-gray-900'}`}>
                            {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '-'}
                          </p>
                          {weightChange !== null && weightChange < 0 && <TrendingDown className="w-5 h-5 text-green-400" />}
                          {weightChange !== null && weightChange > 0 && <TrendingUp className="w-5 h-5 text-red-400" />}
                          {weightChange === 0 && <Minus className="w-5 h-5 text-gray-500" />}
                        </div>
                      </div>
                    </div>

                    {weightChartData.length > 1 && (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={weightChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,215,0,0.1)" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,215,0,0.3)',
                                borderRadius: '8px'
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="weight"
                              stroke="#f59e0b"
                              strokeWidth={3}
                              dot={{ fill: '#f59e0b', r: 5 }}
                              name="Vikt (kg)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </section>

                  {/* Measurements Section */}
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <Ruler className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-purple-400">Mätpunkter</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {measurementFields.map(({ label, field }) => {
                        const startValue = startMeasurements?.[field as keyof typeof startMeasurements] as number | null
                        const currentValue = latestMeasurements?.[field as keyof typeof latestMeasurements] as number | null ?? startValue
                        const change = startValue && currentValue ? Number(currentValue) - Number(startValue) : null

                        return (
                          <div key={field} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                            <p className="text-gray-500 text-sm mb-1">{label}</p>
                            <p className="text-xl font-bold text-gray-900">
                              {currentValue !== null ? `${currentValue} cm` : '-'}
                            </p>
                            {change !== null && change !== 0 && (
                              <p className={`text-sm ${change < 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {change > 0 ? '+' : ''}{change.toFixed(1)} cm
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  {/* Photos Section */}
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-blue-400">Formbilder</h2>
                    </div>

                    {!startPhotos && !latestPhotos ? (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
                        <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500">Inga formbilder uppladdade än</p>
                        <p className="text-gray-500 text-sm mt-1">Ladda upp bilder i nästa check-in</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Start Photos */}
                        {startPhotos && (startPhotos.photoFront || startPhotos.photoSide || startPhotos.photoBack) && (
                          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Start</h3>
                            <div className="grid grid-cols-3 gap-2">
                              {startPhotos.photoFront && (
                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                                  <img
                                    src={startPhotos.photoFront}
                                    alt="Start Fram"
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-gray-900 text-xs px-2 py-0.5 rounded">
                                    Fram
                                  </span>
                                </div>
                              )}
                              {startPhotos.photoSide && (
                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                                  <img
                                    src={startPhotos.photoSide}
                                    alt="Start Sida"
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-gray-900 text-xs px-2 py-0.5 rounded">
                                    Sida
                                  </span>
                                </div>
                              )}
                              {startPhotos.photoBack && (
                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                                  <img
                                    src={startPhotos.photoBack}
                                    alt="Start Bak"
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-gray-900 text-xs px-2 py-0.5 rounded">
                                    Bak
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Latest Photos */}
                        {latestPhotos && (latestPhotos.photoFront || latestPhotos.photoSide || latestPhotos.photoBack) && (
                          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">
                              Vecka {latestPhotos.weekNumber || photos.length}
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                              {latestPhotos.photoFront && (
                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                                  <img
                                    src={latestPhotos.photoFront}
                                    alt="Senaste Fram"
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-gray-900 text-xs px-2 py-0.5 rounded">
                                    Fram
                                  </span>
                                </div>
                              )}
                              {latestPhotos.photoSide && (
                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                                  <img
                                    src={latestPhotos.photoSide}
                                    alt="Senaste Sida"
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-gray-900 text-xs px-2 py-0.5 rounded">
                                    Sida
                                  </span>
                                </div>
                              )}
                              {latestPhotos.photoBack && (
                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                                  <img
                                    src={latestPhotos.photoBack}
                                    alt="Senaste Bak"
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-gray-900 text-xs px-2 py-0.5 rounded">
                                    Bak
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {weightData.length === 0 && measurements.length === 0 && photos.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 sm:p-12 text-center">
                      <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-3 sm:mb-4" />
                      <p className="text-gray-500 text-sm sm:text-base">Ingen framstegsinformation tillgänglig ännu</p>
                    </div>
                  )}
                </>
              )
            })()}
          </TabsContent>
        </Tabs>
      )}

      {/* No Client Selected */}
      {!isLoading && !journalData && selectedClientId === '' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 sm:p-12 text-center">
          <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-3 sm:mb-4" />
          <p className="text-gray-500 text-sm sm:text-base">Välj en klient för att visa journalen</p>
        </div>
      )}
    </div>
  )
}

export default function ClientJournalPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 sm:p-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-sm sm:text-base">Laddar journal...</p>
          </div>
        </div>
      }
    >
      <ClientJournalContent />
    </Suspense>
  )
}
