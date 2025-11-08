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
  Calendar,
  Weight,
  Image as ImageIcon,
  ChevronLeft,
} from 'lucide-react'
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
  statusUpdate: string | null
  weightKg: number | null
  energyLevel: number | null
  mood: number | null
  dietPlanAdherence: number | null
  workoutPlanAdherence: number | null
  sleepNotes: string | null
  dailySteps: string | null
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

  useEffect(() => {
    if (session?.user) {
      fetchClients()
    }
  }, [session])

  useEffect(() => {
    const clientId = searchParams.get('client')
    if (clientId) {
      setSelectedClientId(clientId)
      fetchJournal(clientId)
    }
  }, [searchParams])

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

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-[rgba(255,255,255,0.7)]">
            Du har inte behörighet att se denna sida.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px] flex items-center gap-2">
          <FileText className="h-8 w-8 text-[#FFD700]" />
          Klientjournal
        </h1>
        <p className="text-[rgba(255,255,255,0.6)] mt-1">
          Komplett översikt över klientens resa och framsteg
        </p>
      </div>

      {/* Client Selector */}
      <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] p-6">
        <Label className="text-[rgba(255,255,255,0.8)] mb-2 block">
          Välj klient
        </Label>
        <Select value={selectedClientId} onValueChange={handleClientChange}>
          <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
            <SelectValue placeholder="Välj en klient..." />
          </SelectTrigger>
          <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
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
                  className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                >
                  {client.name || client.email}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] p-12 text-center">
          <p className="text-[rgba(255,255,255,0.6)]">Laddar klientjournal...</p>
        </div>
      )}

      {/* Journal Content */}
      {!isLoading && journalData && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[rgba(255,215,0,0.2)] data-[state=active]:text-[#FFD700]">
              Översikt
            </TabsTrigger>
            <TabsTrigger value="application" className="data-[state=active]:bg-[rgba(255,215,0,0.2)] data-[state=active]:text-[#FFD700]">
              Ansökan
            </TabsTrigger>
            <TabsTrigger value="checkins" className="data-[state=active]:bg-[rgba(255,215,0,0.2)] data-[state=active]:text-[#FFD700]">
              Check-ins
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-[rgba(255,215,0,0.2)] data-[state=active]:text-[#FFD700]">
              Framsteg
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Client Info */}
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden">
              <div className="p-6 border-b border-[rgba(255,215,0,0.2)]">
                <h2 className="text-xl font-bold text-[#FFD700] flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Klientinformation
                </h2>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-[rgba(255,255,255,0.6)] text-sm">Namn</Label>
                  <p className="text-white font-medium">
                    {journalData.client.firstName} {journalData.client.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-[rgba(255,255,255,0.6)] text-sm">Email</Label>
                  <p className="text-white font-medium">{journalData.client.email}</p>
                </div>
                <div>
                  <Label className="text-[rgba(255,255,255,0.6)] text-sm">Telefon</Label>
                  <p className="text-white font-medium">{journalData.client.phone || 'Ej angivet'}</p>
                </div>
                <div>
                  <Label className="text-[rgba(255,255,255,0.6)] text-sm">Status</Label>
                  <div className="mt-1">
                    <Badge className="bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)]">
                      {journalData.client.status}
                    </Badge>
                  </div>
                </div>
                {journalData.client.tags.length > 0 && (
                  <div>
                    <Label className="text-[rgba(255,255,255,0.6)] text-sm">Taggar</Label>
                    <div className="flex gap-2 mt-1">
                      {journalData.client.tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-[rgba(255,215,0,0.1)] text-[#FFD700] border border-[rgba(255,215,0,0.3)]"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-[rgba(255,255,255,0.6)] text-sm">Check-in Schema</Label>
                  <p className="text-white font-medium">
                    {journalData.client.checkInPeriod || 'Ej angivet'} - {journalData.client.checkInDay || 'Ej angivet'}
                  </p>
                </div>
                <div>
                  <Label className="text-[rgba(255,255,255,0.6)] text-sm">Medlem sedan</Label>
                  <p className="text-white font-medium">
                    {journalData.client.membershipStartDate
                      ? format(new Date(journalData.client.membershipStartDate), 'PPP', { locale: sv })
                      : format(new Date(journalData.client.createdAt), 'PPP', { locale: sv })}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                    {journalData.stats.checkIns.total}
                  </p>
                  <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">Totalt Check-ins</p>
                </div>
              </div>
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                    {journalData.stats.currentWeight || 'N/A'} kg
                  </p>
                  <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">Aktuell Vikt</p>
                </div>
              </div>
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                    {journalData.stats.startWeight && journalData.stats.currentWeight
                      ? (Number(journalData.stats.startWeight) - Number(journalData.stats.currentWeight)).toFixed(1)
                      : 'N/A'} kg
                  </p>
                  <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">Viktförändring</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Application Tab */}
          <TabsContent value="application" className="space-y-6">
            {journalData.profile && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden">
                <div className="p-6 border-b border-[rgba(255,215,0,0.2)]">
                  <h2 className="text-xl font-bold text-[#FFD700]">
                    Ursprunglig Ansökan
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* Goals */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Mål</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[rgba(255,255,255,0.6)] text-sm">Primärt Mål</Label>
                        <p className="text-white">{journalData.profile.primaryGoal || 'Ej angivet'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-[rgba(255,215,0,0.2)]" />

                  {/* Physical Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Fysiska Mått</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-[rgba(255,255,255,0.6)] text-sm">Längd</Label>
                        <p className="text-white">{journalData.profile.heightCm ? `${journalData.profile.heightCm} cm` : 'Ej angivet'}</p>
                      </div>
                      <div>
                        <Label className="text-[rgba(255,255,255,0.6)] text-sm">Startvikt</Label>
                        <p className="text-white">{journalData.profile.currentWeightKg ? `${journalData.profile.currentWeightKg} kg` : 'Ej angivet'}</p>
                      </div>
                      <div>
                        <Label className="text-[rgba(255,255,255,0.6)] text-sm">Kön</Label>
                        <p className="text-white">{journalData.profile.genderAtBirth || 'Ej angivet'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-[rgba(255,215,0,0.2)]" />

                  {/* Activity Level */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Aktivitetsnivå</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[rgba(255,255,255,0.6)] text-sm">Fritid</Label>
                        <p className="text-white">{journalData.profile.activityLevelFree || 'Ej angivet'}</p>
                      </div>
                      <div>
                        <Label className="text-[rgba(255,255,255,0.6)] text-sm">Arbete</Label>
                        <p className="text-white">{journalData.profile.activityLevelWork || 'Ej angivet'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-[rgba(255,215,0,0.2)]" />

                  {/* Nutrition */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Kost</h3>
                    <div className="space-y-4">
                      {journalData.profile.allergies.length > 0 && (
                        <div>
                          <Label className="text-[rgba(255,255,255,0.6)] text-sm">Allergier</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {journalData.profile.allergies.map((allergy) => (
                              <Badge
                                key={allergy}
                                className="bg-[rgba(255,100,0,0.1)] text-orange-300 border border-[rgba(255,100,0,0.3)]"
                              >
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {journalData.profile.dietaryPreferences.length > 0 && (
                        <div>
                          <Label className="text-[rgba(255,255,255,0.6)] text-sm">Kostpreferenser</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {journalData.profile.dietaryPreferences.map((pref) => (
                              <Badge
                                key={pref}
                                className="bg-[rgba(34,197,94,0.1)] text-green-300 border border-[rgba(34,197,94,0.3)]"
                              >
                                {pref}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {journalData.profile.nutritionNotes && (
                        <div>
                          <Label className="text-[rgba(255,255,255,0.6)] text-sm">Kostanteckningar</Label>
                          <p className="text-white mt-1">{journalData.profile.nutritionNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-[rgba(255,215,0,0.2)]" />

                  {/* Training */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Träning</h3>
                    <div className="space-y-4">
                      {journalData.profile.trainingDays.length > 0 && (
                        <div>
                          <Label className="text-[rgba(255,255,255,0.6)] text-sm">Träningsdagar</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {journalData.profile.trainingDays.map((day) => (
                              <Badge
                                key={day}
                                className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)]"
                              >
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <Label className="text-[rgba(255,255,255,0.6)] text-sm">Träningserfarenhet</Label>
                        <p className="text-white">{journalData.profile.trainingExperience || 'Ej angivet'}</p>
                      </div>
                      {journalData.profile.trainingDetails && (
                        <div>
                          <Label className="text-[rgba(255,255,255,0.6)] text-sm">Träningsdetaljer</Label>
                          <p className="text-white mt-1">{journalData.profile.trainingDetails}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {journalData.profile.lifestyleNotes && (
                    <>
                      <Separator className="bg-[rgba(255,215,0,0.2)]" />
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Livsstil</h3>
                        <p className="text-white">{journalData.profile.lifestyleNotes}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {!journalData.profile && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] p-12 text-center">
                <p className="text-[rgba(255,255,255,0.6)]">Ingen ansökningsinformation tillgänglig</p>
              </div>
            )}
          </TabsContent>

          {/* Check-ins Tab */}
          <TabsContent value="checkins" className="space-y-4">
            {journalData.checkIns.length === 0 ? (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] p-12 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
                <p className="text-[rgba(255,255,255,0.6)]">Inga check-ins ännu</p>
              </div>
            ) : (
              journalData.checkIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden"
                >
                  <div className="p-6 border-b border-[rgba(255,215,0,0.2)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="h-5 w-5 text-[#FFD700]" />
                      <div>
                        <h3 className="font-bold text-white">
                          Vecka {checkIn.weekNumber || 'N/A'}
                        </h3>
                        <p className="text-sm text-[rgba(255,255,255,0.6)]">
                          {format(new Date(checkIn.createdAt), 'PPP', { locale: sv })}
                        </p>
                      </div>
                    </div>
                    {checkIn.weightKg && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#FFD700]">
                          {checkIn.weightKg} kg
                        </p>
                        <p className="text-xs text-[rgba(255,255,255,0.6)]">Vikt</p>
                      </div>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    {checkIn.statusUpdate && (
                      <div>
                        <Label className="text-[rgba(255,255,255,0.6)] text-sm">Statusuppdatering</Label>
                        <p className="text-white mt-1">{checkIn.statusUpdate}</p>
                      </div>
                    )}

                    {/* Ratings */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {checkIn.energyLevel && (
                        <div>
                          <Label className="text-[rgba(255,255,255,0.6)] text-sm">Energinivå</Label>
                          <p className="text-white font-medium">{checkIn.energyLevel}/5</p>
                        </div>
                      )}
                      {checkIn.mood && (
                        <div>
                          <Label className="text-[rgba(255,255,255,0.6)] text-sm">Humör</Label>
                          <p className="text-white font-medium">{checkIn.mood}/5</p>
                        </div>
                      )}
                      {checkIn.dietPlanAdherence && (
                        <div>
                          <Label className="text-[rgba(255,255,255,0.6)] text-sm">Kost</Label>
                          <p className="text-white font-medium">{checkIn.dietPlanAdherence}/5</p>
                        </div>
                      )}
                      {checkIn.workoutPlanAdherence && (
                        <div>
                          <Label className="text-[rgba(255,255,255,0.6)] text-sm">Träning</Label>
                          <p className="text-white font-medium">{checkIn.workoutPlanAdherence}/5</p>
                        </div>
                      )}
                    </div>

                    {/* Sleep & Steps */}
                    {(checkIn.sleepNotes || checkIn.dailySteps) && (
                      <div className="grid md:grid-cols-2 gap-4">
                        {checkIn.sleepNotes && (
                          <div>
                            <Label className="text-[rgba(255,255,255,0.6)] text-sm">Sömn</Label>
                            <p className="text-white">{checkIn.sleepNotes}</p>
                          </div>
                        )}
                        {checkIn.dailySteps && (
                          <div>
                            <Label className="text-[rgba(255,255,255,0.6)] text-sm">Steg/dag</Label>
                            <p className="text-white">{checkIn.dailySteps}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photos */}
                    {(checkIn.photoFront || checkIn.photoSide || checkIn.photoBack) && (
                      <div>
                        <Label className="text-[rgba(255,255,255,0.6)] text-sm mb-2 block">Bilder</Label>
                        <div className="grid grid-cols-3 gap-4">
                          {checkIn.photoFront && (
                            <div>
                              <img
                                src={checkIn.photoFront}
                                alt="Framsida"
                                className="w-full h-48 object-cover rounded-lg border-2 border-[rgba(255,215,0,0.2)]"
                              />
                              <p className="text-xs text-[rgba(255,255,255,0.6)] mt-1 text-center">Framsida</p>
                            </div>
                          )}
                          {checkIn.photoSide && (
                            <div>
                              <img
                                src={checkIn.photoSide}
                                alt="Sida"
                                className="w-full h-48 object-cover rounded-lg border-2 border-[rgba(255,215,0,0.2)]"
                              />
                              <p className="text-xs text-[rgba(255,255,255,0.6)] mt-1 text-center">Sida</p>
                            </div>
                          )}
                          {checkIn.photoBack && (
                            <div>
                              <img
                                src={checkIn.photoBack}
                                alt="Baksida"
                                className="w-full h-48 object-cover rounded-lg border-2 border-[rgba(255,215,0,0.2)]"
                              />
                              <p className="text-xs text-[rgba(255,255,255,0.6)] mt-1 text-center">Baksida</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            {/* Weight Progression */}
            {journalData.progression.weight.length > 0 && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden">
                <div className="p-6 border-b border-[rgba(255,215,0,0.2)]">
                  <h2 className="text-xl font-bold text-[#FFD700] flex items-center gap-2">
                    <Weight className="h-5 w-5" />
                    Viktutveckling
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {journalData.progression.weight.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,215,0,0.2)]"
                      >
                        <div>
                          <p className="text-white font-medium">
                            Vecka {entry.weekNumber || 'N/A'}
                          </p>
                          <p className="text-sm text-[rgba(255,255,255,0.6)]">
                            {format(new Date(entry.date), 'PPP', { locale: sv })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#FFD700]">
                            {entry.weight} kg
                          </p>
                          {index > 0 && (
                            <p className="text-sm text-[rgba(255,255,255,0.6)]">
                              {Number(entry.weight) - Number(journalData.progression.weight[index - 1].weight) > 0 ? '+' : ''}
                              {(Number(entry.weight) - Number(journalData.progression.weight[index - 1].weight)).toFixed(1)} kg
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Photo Timeline */}
            {journalData.progression.photos.length > 0 && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden">
                <div className="p-6 border-b border-[rgba(255,215,0,0.2)]">
                  <h2 className="text-xl font-bold text-[#FFD700] flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Bildtidslinje
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {journalData.progression.photos.map((entry, index) => (
                    <div key={index}>
                      <div className="mb-3">
                        <h3 className="text-white font-semibold">
                          Vecka {entry.weekNumber || 'N/A'}
                        </h3>
                        <p className="text-sm text-[rgba(255,255,255,0.6)]">
                          {format(new Date(entry.date), 'PPP', { locale: sv })}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {entry.photoFront && (
                          <div>
                            <img
                              src={entry.photoFront}
                              alt="Framsida"
                              className="w-full h-64 object-cover rounded-lg border-2 border-[rgba(255,215,0,0.2)]"
                            />
                            <p className="text-xs text-[rgba(255,255,255,0.6)] mt-1 text-center">Framsida</p>
                          </div>
                        )}
                        {entry.photoSide && (
                          <div>
                            <img
                              src={entry.photoSide}
                              alt="Sida"
                              className="w-full h-64 object-cover rounded-lg border-2 border-[rgba(255,215,0,0.2)]"
                            />
                            <p className="text-xs text-[rgba(255,255,255,0.6)] mt-1 text-center">Sida</p>
                          </div>
                        )}
                        {entry.photoBack && (
                          <div>
                            <img
                              src={entry.photoBack}
                              alt="Baksida"
                              className="w-full h-64 object-cover rounded-lg border-2 border-[rgba(255,215,0,0.2)]"
                            />
                            <p className="text-xs text-[rgba(255,255,255,0.6)] mt-1 text-center">Baksida</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {journalData.progression.weight.length === 0 && journalData.progression.photos.length === 0 && (
              <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
                <p className="text-[rgba(255,255,255,0.6)]">Ingen framstegsinformation tillgänglig ännu</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* No Client Selected */}
      {!isLoading && !journalData && selectedClientId === '' && (
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
          <p className="text-[rgba(255,255,255,0.6)]">Välj en klient för att visa journalen</p>
        </div>
      )}
    </div>
  )
}

export default function ClientJournalPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] p-12 text-center">
          <p className="text-[rgba(255,255,255,0.6)]">Laddar...</p>
        </div>
      </div>
    }>
      <ClientJournalContent />
    </Suspense>
  )
}
