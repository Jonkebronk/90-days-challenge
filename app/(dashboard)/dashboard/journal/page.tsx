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
  User,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Calendar,
  Weight,
  Image as ImageIcon,
  ChevronLeft,
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
  name: string
  email: string | null
  phone: string | null
  status: string
  notes: string | null
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
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          {isCoach
            ? 'Komplett översikt över klientens resa och framsteg'
            : 'Din resa och framsteg i 90-Dagars Challenge'}
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Client Selector - Only for coaches */}
      {isCoach && (
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-4 sm:p-6">
          <Label className="text-gray-200 mb-2 block text-sm sm:text-base">
            Välj klient
          </Label>
          <Select value={selectedClientId} onValueChange={handleClientChange}>
            <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white text-sm sm:text-base">
              <SelectValue placeholder="Välj en klient..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-900/95 border-gold-primary/30">
              {isLoadingClients ? (
                <SelectItem value="loading" disabled className="text-white">
                  Laddar...
                </SelectItem>
              ) : clients.length === 0 ? (
                <SelectItem value="none" disabled className="text-white">
                  Inga klienter
                </SelectItem>
              ) : (
                clients.map((client) => (
                  <SelectItem
                    key={client.id}
                    value={client.id}
                    className="text-white hover:bg-gold-50"
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
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-12 text-center">
          <p className="text-gray-400">Laddar klientjournal...</p>
        </div>
      )}

      {/* Journal Content */}
      {!isLoading && journalData && (
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-black/30 border border-gold-primary/30 w-max sm:w-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-[rgba(255,215,0,0.2)] data-[state=active]:text-gold-light">
                Översikt
              </TabsTrigger>
              <TabsTrigger value="application" className="text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-[rgba(255,215,0,0.2)] data-[state=active]:text-gold-light">
                Ansökan
              </TabsTrigger>
              <TabsTrigger value="checkins" className="text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-[rgba(255,215,0,0.2)] data-[state=active]:text-gold-light">
                Check-ins
              </TabsTrigger>
              <TabsTrigger value="progress" className="text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-[rgba(255,215,0,0.2)] data-[state=active]:text-gold-light">
                Framsteg
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Client Info */}
            <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gold-primary/20">
                <h2 className="text-lg sm:text-xl font-bold text-gold-light flex items-center gap-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Klientinformation
                </h2>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-gray-400 text-xs sm:text-sm">Namn</Label>
                  <p className="text-white font-medium text-sm sm:text-base">
                    {journalData.client.firstName} {journalData.client.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400 text-xs sm:text-sm">Email</Label>
                  <p className="text-white font-medium text-sm sm:text-base truncate">{journalData.client.email}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-xs sm:text-sm">Telefon</Label>
                  <p className="text-white font-medium text-sm sm:text-base">{journalData.client.phone || 'Ej angivet'}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-xs sm:text-sm">Status</Label>
                  <div className="mt-1">
                    <Badge className="bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)] text-xs">
                      {journalData.client.status}
                    </Badge>
                  </div>
                </div>
                {journalData.client.tags.length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-gray-400 text-xs sm:text-sm">Taggar</Label>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                      {journalData.client.tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-[rgba(255,215,0,0.1)] text-gold-light border border-gold-primary/30 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-gray-400 text-xs sm:text-sm">Check-in</Label>
                  <p className="text-white font-medium text-sm sm:text-base">
                    {journalData.client.checkInDay || 'Ej angivet'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400 text-xs sm:text-sm">Medlem sedan</Label>
                  <p className="text-white font-medium text-sm sm:text-base">
                    {journalData.client.membershipStartDate
                      ? format(new Date(journalData.client.membershipStartDate), 'PP', { locale: sv })
                      : format(new Date(journalData.client.createdAt), 'PP', { locale: sv })}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-3 sm:p-6">
                <div className="text-center">
                  <p className="text-xl sm:text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                    {journalData.stats.checkIns.total}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Check-ins</p>
                </div>
              </div>
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-3 sm:p-6">
                <div className="text-center">
                  <p className="text-xl sm:text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                    {journalData.stats.currentWeight || 'N/A'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Vikt (kg)</p>
                </div>
              </div>
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-3 sm:p-6">
                <div className="text-center">
                  <p className="text-xl sm:text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                    {journalData.stats.startWeight && journalData.stats.currentWeight
                      ? (Number(journalData.stats.startWeight) - Number(journalData.stats.currentWeight)).toFixed(1)
                      : 'N/A'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Förändring</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Application Tab */}
          <TabsContent value="application" className="space-y-4 sm:space-y-6">
            {journalData.profile && (
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gold-primary/20">
                  <h2 className="text-lg sm:text-xl font-bold text-gold-light">
                    Ursprunglig Intresseanmälan
                  </h2>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Goals */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Mål</h3>
                    <div>
                      <Label className="text-gray-400 text-xs sm:text-sm">Primärt Mål</Label>
                      <p className="text-white text-sm sm:text-base">{journalData.profile.primaryGoal || 'Ej angivet'}</p>
                    </div>
                  </div>

                  <Separator className="bg-[rgba(255,215,0,0.2)]" />

                  {/* Physical Stats */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Fysiska Mått</h3>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div>
                        <Label className="text-gray-400 text-xs sm:text-sm">Längd</Label>
                        <p className="text-white text-sm sm:text-base">{journalData.profile.heightCm ? `${journalData.profile.heightCm} cm` : '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400 text-xs sm:text-sm">Startvikt</Label>
                        <p className="text-white text-sm sm:text-base">{journalData.profile.currentWeightKg ? `${journalData.profile.currentWeightKg} kg` : '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400 text-xs sm:text-sm">Kön</Label>
                        <p className="text-white text-sm sm:text-base">{journalData.profile.genderAtBirth || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-[rgba(255,215,0,0.2)]" />

                  {/* Activity Level */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Aktivitetsnivå</h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <Label className="text-gray-400 text-xs sm:text-sm">Fritid</Label>
                        <p className="text-white text-sm sm:text-base">{journalData.profile.activityLevelFree || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400 text-xs sm:text-sm">Arbete</Label>
                        <p className="text-white text-sm sm:text-base">{journalData.profile.activityLevelWork || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-[rgba(255,215,0,0.2)]" />

                  {/* Nutrition */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Kost</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {journalData.profile.allergies.length > 0 && (
                        <div>
                          <Label className="text-gray-400 text-xs sm:text-sm">Allergier</Label>
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                            {journalData.profile.allergies.map((allergy) => (
                              <Badge
                                key={allergy}
                                className="bg-[rgba(255,100,0,0.1)] text-orange-300 border border-[rgba(255,100,0,0.3)] text-xs"
                              >
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {journalData.profile.dietaryPreferences.length > 0 && (
                        <div>
                          <Label className="text-gray-400 text-xs sm:text-sm">Kostpreferenser</Label>
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                            {journalData.profile.dietaryPreferences.map((pref) => (
                              <Badge
                                key={pref}
                                className="bg-[rgba(34,197,94,0.1)] text-green-300 border border-[rgba(34,197,94,0.3)] text-xs"
                              >
                                {pref}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {journalData.profile.nutritionNotes && (
                        <div>
                          <Label className="text-gray-400 text-xs sm:text-sm">Kostanteckningar</Label>
                          <p className="text-white mt-1 text-sm sm:text-base">{journalData.profile.nutritionNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-[rgba(255,215,0,0.2)]" />

                  {/* Training */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Träning</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {journalData.profile.trainingDays.length > 0 && (
                        <div>
                          <Label className="text-gray-400 text-xs sm:text-sm">Träningsdagar</Label>
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                            {journalData.profile.trainingDays.map((day) => (
                              <Badge
                                key={day}
                                className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)] text-xs"
                              >
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-400 text-xs sm:text-sm">Träningserfarenhet</Label>
                        <p className="text-white text-sm sm:text-base">{journalData.profile.trainingExperience || 'Ej angivet'}</p>
                      </div>
                      {journalData.profile.trainingDetails && (
                        <div>
                          <Label className="text-gray-400 text-xs sm:text-sm">Träningsdetaljer</Label>
                          <p className="text-white mt-1 text-sm sm:text-base">{journalData.profile.trainingDetails}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {journalData.profile.lifestyleNotes && (
                    <>
                      <Separator className="bg-[rgba(255,215,0,0.2)]" />
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Livsstil</h3>
                        <p className="text-white text-sm sm:text-base">{journalData.profile.lifestyleNotes}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {!journalData.profile && (
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-8 sm:p-12 text-center">
                <p className="text-gray-400 text-sm sm:text-base">Ingen ansökningsinformation tillgänglig</p>
              </div>
            )}
          </TabsContent>

          {/* Check-ins Tab */}
          <TabsContent value="checkins" className="space-y-3 sm:space-y-4">
            {journalData.checkIns.length === 0 ? (
              <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-8 sm:p-12 text-center">
                <ClipboardCheck className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-3 sm:mb-4" />
                <p className="text-gray-400 text-sm sm:text-base">Inga check-ins ännu</p>
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
                          className="bg-white/5 border-2 border-[rgba(255,215,0,0.5)] rounded-xl backdrop-blur-[10px] overflow-hidden shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                        >
                          <div className="p-4 sm:p-6 border-b border-gold-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                                🎯
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                                  <h3 className="font-bold text-gold-light text-sm sm:text-lg">
                                    START CHECK-IN
                                  </h3>
                                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a]">
                                    UTGÅNGSPUNKT
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-400">
                                  {format(new Date(startCheckIn.createdAt), 'PP', { locale: sv })}
                                </p>
                              </div>
                            </div>
                            {startCheckIn.mondayWeight && (
                              <div className="text-left sm:text-right ml-12 sm:ml-0">
                                <p className="text-xl sm:text-2xl font-bold text-gold-light">
                                  {startCheckIn.mondayWeight} kg
                                </p>
                                <p className="text-xs text-gray-400">Startvikt</p>
                              </div>
                            )}
                          </div>
                          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                            {startCheckIn.statusUpdate && (
                              <div>
                                <Label className="text-gray-400 text-xs sm:text-sm">Berättelse</Label>
                                <p className="text-white mt-1 text-sm sm:text-base">{startCheckIn.statusUpdate}</p>
                              </div>
                            )}

                            {/* Body measurements for start check-in */}
                            {(startCheckIn.chest || startCheckIn.waist || startCheckIn.hips || startCheckIn.butt || startCheckIn.arms || startCheckIn.thighs || startCheckIn.calves) && (
                              <div>
                                <Label className="text-gray-400 text-xs sm:text-sm mb-2 block">Startmått</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                                  {startCheckIn.chest && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-400">Bröst</p>
                                      <p className="text-white font-medium text-sm sm:text-base">{startCheckIn.chest} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.waist && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-400">Midja</p>
                                      <p className="text-white font-medium text-sm sm:text-base">{startCheckIn.waist} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.hips && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-400">Höfter</p>
                                      <p className="text-white font-medium text-sm sm:text-base">{startCheckIn.hips} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.butt && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-400">Rumpa</p>
                                      <p className="text-white font-medium text-sm sm:text-base">{startCheckIn.butt} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.arms && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-400">Armar</p>
                                      <p className="text-white font-medium text-sm sm:text-base">{startCheckIn.arms} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.thighs && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-400">Lår</p>
                                      <p className="text-white font-medium text-sm sm:text-base">{startCheckIn.thighs} cm</p>
                                    </div>
                                  )}
                                  {startCheckIn.calves && (
                                    <div>
                                      <p className="text-[10px] sm:text-xs text-gray-400">Vader</p>
                                      <p className="text-white font-medium text-sm sm:text-base">{startCheckIn.calves} cm</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Photos */}
                            {(startCheckIn.photoFront || startCheckIn.photoSide || startCheckIn.photoBack) && (
                              <div>
                                <Label className="text-gray-400 text-xs sm:text-sm mb-2 block">Startbilder</Label>
                                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                  {startCheckIn.photoFront && (
                                    <div>
                                      <img
                                        src={startCheckIn.photoFront}
                                        alt="Front"
                                        className="w-full h-auto rounded border-2 border-gold-primary/30"
                                      />
                                      <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-1">Fram</p>
                                    </div>
                                  )}
                                  {startCheckIn.photoSide && (
                                    <div>
                                      <img
                                        src={startCheckIn.photoSide}
                                        alt="Side"
                                        className="w-full h-auto rounded border-2 border-gold-primary/30"
                                      />
                                      <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-1">Sida</p>
                                    </div>
                                  )}
                                  {startCheckIn.photoBack && (
                                    <div>
                                      <img
                                        src={startCheckIn.photoBack}
                                        alt="Back"
                                        className="w-full h-auto rounded border-2 border-gold-primary/30"
                                      />
                                      <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-1">Bak</p>
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
                  className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] overflow-hidden"
                >
                  <div className="p-4 sm:p-6 border-b border-gold-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-gold-light flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-white text-sm sm:text-base">
                          Vecka {checkIn.weekNumber || 'N/A'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400">
                          {format(new Date(checkIn.createdAt), 'PP', { locale: sv })}
                        </p>
                      </div>
                    </div>
                    {checkIn.weightKg && (
                      <div className="text-right">
                        <p className="text-xl sm:text-2xl font-bold text-gold-light">
                          {checkIn.weightKg} kg
                        </p>
                        <p className="text-xs text-gray-400">Vikt</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    {checkIn.statusUpdate && (
                      <div>
                        <Label className="text-gray-400 text-xs sm:text-sm">Statusuppdatering</Label>
                        <p className="text-white mt-1 text-sm sm:text-base">{checkIn.statusUpdate}</p>
                      </div>
                    )}

                    {/* Ratings */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                      {checkIn.energyLevel && (
                        <div>
                          <Label className="text-gray-400 text-xs sm:text-sm">Energi</Label>
                          <p className="text-white font-medium text-sm sm:text-base">{checkIn.energyLevel}/5</p>
                        </div>
                      )}
                      {checkIn.mood && (
                        <div>
                          <Label className="text-gray-400 text-xs sm:text-sm">Humör</Label>
                          <p className="text-white font-medium text-sm sm:text-base">{checkIn.mood}/5</p>
                        </div>
                      )}
                      {checkIn.dietPlanAdherence && (
                        <div>
                          <Label className="text-gray-400 text-xs sm:text-sm">Kost</Label>
                          <p className="text-white font-medium text-sm sm:text-base">{checkIn.dietPlanAdherence}/5</p>
                        </div>
                      )}
                      {checkIn.workoutPlanAdherence && (
                        <div>
                          <Label className="text-gray-400 text-xs sm:text-sm">Träning</Label>
                          <p className="text-white font-medium text-sm sm:text-base">{checkIn.workoutPlanAdherence}/5</p>
                        </div>
                      )}
                    </div>

                    {/* Sleep & Steps */}
                    {(checkIn.sleepNotes || checkIn.dailySteps) && (
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {checkIn.sleepNotes && (
                          <div>
                            <Label className="text-gray-400 text-xs sm:text-sm">Sömn</Label>
                            <p className="text-white text-sm sm:text-base">{checkIn.sleepNotes}</p>
                          </div>
                        )}
                        {checkIn.dailySteps && (
                          <div>
                            <Label className="text-gray-400 text-xs sm:text-sm">Steg/dag</Label>
                            <p className="text-white text-sm sm:text-base">{checkIn.dailySteps}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photos */}
                    {(checkIn.photoFront || checkIn.photoSide || checkIn.photoBack) && (
                      <div>
                        <Label className="text-gray-400 text-xs sm:text-sm mb-2 block">Bilder</Label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                          {checkIn.photoFront && (
                            <div>
                              <img
                                src={checkIn.photoFront}
                                alt="Framsida"
                                className="w-full h-32 sm:h-48 object-cover rounded-lg border-2 border-gold-primary/20"
                              />
                              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 text-center">Fram</p>
                            </div>
                          )}
                          {checkIn.photoSide && (
                            <div>
                              <img
                                src={checkIn.photoSide}
                                alt="Sida"
                                className="w-full h-32 sm:h-48 object-cover rounded-lg border-2 border-gold-primary/20"
                              />
                              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 text-center">Sida</p>
                            </div>
                          )}
                          {checkIn.photoBack && (
                            <div>
                              <img
                                src={checkIn.photoBack}
                                alt="Baksida"
                                className="w-full h-32 sm:h-48 object-cover rounded-lg border-2 border-gold-primary/20"
                              />
                              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 text-center">Bak</p>
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
                      <h2 className="text-xl font-bold text-white">Viktförändring</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-6">
                        <p className="text-gray-400 text-sm mb-1">Startvikt</p>
                        <p className="text-2xl font-bold text-white">
                          {startWeight ? `${Number(startWeight).toFixed(1)} kg` : '-'}
                        </p>
                      </div>
                      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-6">
                        <p className="text-gray-400 text-sm mb-1">Nuvarande vikt</p>
                        <p className="text-2xl font-bold text-white">
                          {currentWeight ? `${Number(currentWeight).toFixed(1)} kg` : '-'}
                        </p>
                      </div>
                      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-6">
                        <p className="text-gray-400 text-sm mb-1">Förändring</p>
                        <div className="flex items-center gap-2">
                          <p className={`text-2xl font-bold ${weightChange && weightChange < 0 ? 'text-green-400' : weightChange && weightChange > 0 ? 'text-red-400' : 'text-white'}`}>
                            {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '-'}
                          </p>
                          {weightChange !== null && weightChange < 0 && <TrendingDown className="w-5 h-5 text-green-400" />}
                          {weightChange !== null && weightChange > 0 && <TrendingUp className="w-5 h-5 text-red-400" />}
                          {weightChange === 0 && <Minus className="w-5 h-5 text-gray-400" />}
                        </div>
                      </div>
                    </div>

                    {weightChartData.length > 1 && (
                      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-6">
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
                      <h2 className="text-xl font-bold text-white">Mätpunkter</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {measurementFields.map(({ label, field }) => {
                        const startValue = startMeasurements?.[field as keyof typeof startMeasurements] as number | null
                        const currentValue = latestMeasurements?.[field as keyof typeof latestMeasurements] as number | null ?? startValue
                        const change = startValue && currentValue ? Number(currentValue) - Number(startValue) : null

                        return (
                          <div key={field} className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-4">
                            <p className="text-gray-400 text-sm mb-1">{label}</p>
                            <p className="text-xl font-bold text-white">
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
                      <h2 className="text-xl font-bold text-white">Formbilder</h2>
                    </div>

                    {!startPhotos && !latestPhotos ? (
                      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-8 text-center">
                        <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">Inga formbilder uppladdade än</p>
                        <p className="text-gray-500 text-sm mt-1">Ladda upp bilder i nästa check-in</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Start Photos */}
                        {startPhotos && (startPhotos.photoFront || startPhotos.photoSide || startPhotos.photoBack) && (
                          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-4">
                            <h3 className="font-semibold text-white mb-3">Start</h3>
                            <div className="grid grid-cols-3 gap-2">
                              {startPhotos.photoFront && (
                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                                  <img
                                    src={startPhotos.photoFront}
                                    alt="Start Fram"
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
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
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
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
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                    Bak
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Latest Photos */}
                        {latestPhotos && (latestPhotos.photoFront || latestPhotos.photoSide || latestPhotos.photoBack) && (
                          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-4">
                            <h3 className="font-semibold text-white mb-3">
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
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
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
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
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
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
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
                    <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-8 sm:p-12 text-center">
                      <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-3 sm:mb-4" />
                      <p className="text-gray-400 text-sm sm:text-base">Ingen framstegsinformation tillgänglig ännu</p>
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
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-8 sm:p-12 text-center">
          <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-3 sm:mb-4" />
          <p className="text-gray-400 text-sm sm:text-base">Välj en klient för att visa journalen</p>
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
          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] p-8 sm:p-12 text-center">
            <p className="text-gray-400 text-sm sm:text-base">Laddar journal...</p>
          </div>
        </div>
      }
    >
      <ClientJournalContent />
    </Suspense>
  )
}
