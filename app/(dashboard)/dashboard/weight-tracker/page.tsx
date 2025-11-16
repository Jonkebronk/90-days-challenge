'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Save, TrendingDown, Target, Calendar, Scale, Users, Lock, Unlock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type WeightProfile = {
  startWeight: string
  targetWeight: string
  height: string
  targetDate: string
}

type WeightEntry = {
  id: number
  date: string
  weight: number
}

type WeekData = {
  weekNumber: number
  startDate: Date
  days: Array<{
    date: string
    dayName: string
    weight: number | null
  }>
}

type Client = {
  id: string
  name: string | null
  email: string
}

export default function WeightTrackerPage() {
  const { data: session } = useSession()
  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

  const [activeTab, setActiveTab] = useState<'weekly' | 'graph'>('weekly')
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [profile, setProfile] = useState<WeightProfile>({
    startWeight: '',
    targetWeight: '',
    height: '',
    targetDate: ''
  })
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [lockedWeeks, setLockedWeeks] = useState<Set<number>>(new Set())

  // Fetch clients if coach
  useEffect(() => {
    if (isCoach) {
      fetchClients()
    }
  }, [isCoach])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  // Load data from localStorage when client selection changes
  useEffect(() => {
    const storageKey = isCoach && selectedClientId
      ? `weight-profile-${selectedClientId}`
      : 'weight-profile'

    const entriesKey = isCoach && selectedClientId
      ? `weight-entries-${selectedClientId}`
      : 'weight-entries'

    const lockedWeeksKey = isCoach && selectedClientId
      ? `weight-locked-weeks-${selectedClientId}`
      : 'weight-locked-weeks'

    const savedProfile = localStorage.getItem(storageKey)
    const savedEntries = localStorage.getItem(entriesKey)
    const savedLockedWeeks = localStorage.getItem(lockedWeeksKey)

    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    } else {
      setProfile({
        startWeight: '',
        targetWeight: '',
        height: '',
        targetDate: ''
      })
    }

    if (savedEntries) {
      setEntries(JSON.parse(savedEntries))
    } else {
      setEntries([])
    }

    if (savedLockedWeeks) {
      setLockedWeeks(new Set(JSON.parse(savedLockedWeeks)))
    } else {
      setLockedWeeks(new Set())
    }
  }, [selectedClientId, isCoach])

  // Save profile
  const saveProfile = () => {
    const storageKey = isCoach && selectedClientId
      ? `weight-profile-${selectedClientId}`
      : 'weight-profile'

    localStorage.setItem(storageKey, JSON.stringify(profile))
    alert('Profil sparad!')
  }

  // Toggle week lock
  const toggleWeekLock = (weekNumber: number) => {
    const lockedWeeksKey = isCoach && selectedClientId
      ? `weight-locked-weeks-${selectedClientId}`
      : 'weight-locked-weeks'

    const newLockedWeeks = new Set(lockedWeeks)
    if (newLockedWeeks.has(weekNumber)) {
      newLockedWeeks.delete(weekNumber)
    } else {
      newLockedWeeks.add(weekNumber)
    }

    setLockedWeeks(newLockedWeeks)
    localStorage.setItem(lockedWeeksKey, JSON.stringify(Array.from(newLockedWeeks)))
  }

  // Update weight entry
  const updateWeight = (date: string, weight: string, weekNumber: number) => {
    // Check if week is locked
    if (lockedWeeks.has(weekNumber)) {
      return // Don't allow updates to locked weeks
    }

    const entriesKey = isCoach && selectedClientId
      ? `weight-entries-${selectedClientId}`
      : 'weight-entries'

    const weightNum = parseFloat(weight)

    if (weight === '' || isNaN(weightNum)) {
      // Remove entry
      const newEntries = entries.filter(e => e.date !== date)
      setEntries(newEntries)
      localStorage.setItem(entriesKey, JSON.stringify(newEntries))
      return
    }

    const existingIndex = entries.findIndex(e => e.date === date)
    let newEntries: WeightEntry[]

    if (existingIndex >= 0) {
      // Update existing
      newEntries = [...entries]
      newEntries[existingIndex].weight = weightNum
    } else {
      // Create new
      newEntries = [...entries, {
        id: Date.now(),
        date,
        weight: weightNum
      }]
    }

    // Sort by date
    newEntries.sort((a, b) => a.date.localeCompare(b.date))
    setEntries(newEntries)
    localStorage.setItem(entriesKey, JSON.stringify(newEntries))
  }

  // Calculate statistics
  const stats = calculateStats(profile, entries)
  const weeks = generateWeeks(profile, entries)
  const graphData = prepareGraphData(entries)

  const selectedClient = clients.find(c => c.id === selectedClientId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border-2 border-gray-200 rounded-xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px] flex items-center justify-center gap-3">
          <Scale className="h-10 w-10 text-gold-primary" />
          VIKTSPÅRNING
        </h1>
        {selectedClient && (
          <p className="text-gold-primary font-semibold text-xl mt-2">
            {selectedClient.name || selectedClient.email}
          </p>
        )}
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Client Selector for Coaches */}
        {isCoach && (
          <Card className="bg-white border-2 border-gray-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Users className="h-5 w-5 text-gold-primary" />
                <div className="flex-1">
                  <Label htmlFor="client-select" className="text-gray-900 font-semibold mb-2 block">
                    Välj klient
                  </Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Välj en klient att spåra" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {clients.map((client) => (
                        <SelectItem
                          key={client.id}
                          value={client.id}
                          className="text-gray-900 hover:bg-gray-100"
                        >
                          {client.name || client.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!selectedClientId && (
                <p className="text-gray-600 text-sm mt-2 ml-9">
                  Välj en klient ovan för att hantera deras viktspårning
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Stats */}
          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="bg-white border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="startWeight" className="text-gray-700">Startvikt (kg)</Label>
                  <Input
                    id="startWeight"
                    type="number"
                    step="0.1"
                    value={profile.startWeight}
                    onChange={(e) => setProfile({ ...profile, startWeight: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="targetWeight" className="text-gray-700">Målvikt (kg)</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    step="0.1"
                    value={profile.targetWeight}
                    onChange={(e) => setProfile({ ...profile, targetWeight: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-gray-700">Längd (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height}
                    onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="targetDate" className="text-gray-700">Måldatum</Label>
                  <div className="flex gap-2">
                    <Input
                      id="targetDate"
                      type="date"
                      value={profile.targetDate}
                      onChange={(e) => setProfile({ ...profile, targetDate: e.target.value })}
                      className="bg-white border-gray-300 text-gray-900 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Calculate 90 days (13 weeks) from today
                        const today = new Date()
                        const futureDate = new Date(today)
                        futureDate.setDate(today.getDate() + 91) // 13 weeks = 91 days
                        const dateStr = futureDate.toISOString().split('T')[0]
                        setProfile({ ...profile, targetDate: dateStr })
                      }}
                      className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100 whitespace-nowrap"
                      title="Sätt automatiskt till 90 dagar (13 veckor) från idag"
                    >
                      90 dagar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Knappen sätter automatiskt måldatum till 13 veckor (90 dagar) från idag
                  </p>
                </div>
                <Button
                  onClick={saveProfile}
                  className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Spara profil
                </Button>
              </CardContent>
            </Card>

            {/* Statistics Section */}
            <Card className="bg-white border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatItem label="Nuvarande vikt" value={stats.currentWeight} color="text-gray-900" />
                <StatItem label="Total viktförlust" value={stats.totalWeightLoss} color="text-green-600" />
                <StatItem label="Avvikelse från mål" value={stats.deviationFromTarget} color={stats.deviationColor} />
                <StatItem label="Gram per dag" value={stats.gramsPerDay} color="text-gold-primary" />
                <StatItem label="Kg per vecka" value={stats.kgPerWeek} color="text-gold-primary" />
                <StatItem label="Dagar till mål" value={stats.daysToTarget} color="text-blue-600" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('weekly')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'weekly'
                    ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-white'
                    : 'bg-white text-gray-700 hover:text-gray-900 border-2 border-gray-200'
                }`}
              >
                <Calendar className="h-5 w-5" />
                Veckoöversikt
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'graph'
                    ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-white'
                    : 'bg-white text-gray-700 hover:text-gray-900 border-2 border-gray-200'
                }`}
              >
                <TrendingDown className="h-5 w-5" />
                Graf
              </button>
            </div>

            {/* Weekly View */}
            {activeTab === 'weekly' && (
              <div className="space-y-4">
                {isCoach && !selectedClientId ? (
                  <Card className="bg-white border-2 border-gray-200">
                    <CardContent className="py-12 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gold-primary" />
                      <p className="text-gray-600">Välj en klient ovan för att se deras veckoöversikt.</p>
                    </CardContent>
                  </Card>
                ) : weeks.length === 0 ? (
                  <Card className="bg-white border-2 border-gray-200">
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-600">
                        {profile.targetDate
                          ? 'Klicka "Spara profil" för att generera veckoöversikten.'
                          : 'Fyll i profil med måldatum och klicka "Spara profil" för att se veckoöversikten.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  weeks.map((week) => (
                    <WeekCard
                      key={week.weekNumber}
                      week={week}
                      entries={entries}
                      onUpdateWeight={updateWeight}
                      isLocked={lockedWeeks.has(week.weekNumber)}
                      onToggleLock={() => toggleWeekLock(week.weekNumber)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Graph View */}
            {activeTab === 'graph' && (
              <Card className="bg-white border-2 border-gray-200">
                <CardContent className="py-6">
                  {graphData.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-gray-600">Ingen viktdata att visa. Börja registrera vikter för att se grafen.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={500}>
                      <LineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="date"
                          stroke="#6B7280"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis
                          stroke="#6B7280"
                          domain={['dataMin - 2', 'dataMax + 2']}
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            color: '#111827'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#D4AF37"
                          strokeWidth={3}
                          dot={{ fill: '#D4AF37', r: 4 }}
                        />
                        {profile.targetWeight && (
                          <ReferenceLine
                            y={parseFloat(profile.targetWeight)}
                            stroke="#10B981"
                            strokeDasharray="5 5"
                            label={{ value: 'Mål', fill: '#10B981', fontSize: 12 }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Item Component
function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  )
}

// Week Card Component
function WeekCard({
  week,
  entries,
  onUpdateWeight,
  isLocked,
  onToggleLock
}: {
  week: WeekData
  entries: WeightEntry[]
  onUpdateWeight: (date: string, weight: string, weekNumber: number) => void
  isLocked: boolean
  onToggleLock: () => void
}) {
  const weeklyAverage = calculateWeeklyAverage(week, entries)

  return (
    <Card className={`border-2 overflow-hidden ${isLocked ? 'bg-gray-50 opacity-90 border-gray-300' : 'bg-white border-gray-200'}`}>
      <div className="grid grid-cols-5 bg-gradient-to-r from-gold-primary to-gold-secondary">
        <div className="col-span-1 p-4 flex items-center justify-center border-r border-gold-secondary">
          <span className="text-4xl font-bold text-white">V{week.weekNumber}</span>
        </div>
        <div className="col-span-2 p-4 border-r border-gold-secondary">
          <div className="text-white font-semibold text-sm flex items-center gap-2">
            Vecka {week.weekNumber}
            {isLocked && <Lock className="h-3 w-3" />}
          </div>
          <div className="text-white text-xs opacity-90">
            {formatDate(week.startDate)} - {formatDate(addDays(week.startDate, 6))}
          </div>
        </div>
        <div className="col-span-1 p-4 flex items-center justify-center border-r border-gold-secondary">
          <div className="text-center">
            <div className="text-white text-xs font-semibold">Weekly Average</div>
            <div className="text-white text-2xl font-bold">{weeklyAverage}</div>
          </div>
        </div>
        <div className="col-span-1 p-4 flex items-center justify-center">
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleLock}
            className="text-white hover:bg-gold-secondary"
            title={isLocked ? 'Lås upp vecka' : 'Lås vecka'}
          >
            {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <CardContent className="p-0">
        <table className="w-full">
          <tbody>
            {week.days.map((day, index) => {
              const entry = entries.find(e => e.date === day.date)
              return (
                <tr key={day.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-700 w-32">{day.dayName}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{formatDisplayDate(day.date)}</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="--"
                      value={entry?.weight || ''}
                      onChange={(e) => onUpdateWeight(day.date, e.target.value, week.weekNumber)}
                      disabled={isLocked}
                      className={`border-gray-300 text-gray-900 text-center focus:ring-gold-primary ${
                        isLocked
                          ? 'bg-gray-100 cursor-not-allowed opacity-70'
                          : 'bg-white'
                      }`}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// Helper Functions
function calculateStats(profile: WeightProfile, entries: WeightEntry[]) {
  const startWeight = parseFloat(profile.startWeight)
  const targetWeight = parseFloat(profile.targetWeight)
  const targetDate = profile.targetDate

  if (entries.length === 0 || !startWeight) {
    return {
      currentWeight: '--',
      totalWeightLoss: '--',
      deviationFromTarget: '--',
      deviationColor: 'text-gray-400',
      gramsPerDay: '--',
      kgPerWeek: '--',
      daysToTarget: '--'
    }
  }

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const firstEntry = sortedEntries[0]
  const lastEntry = sortedEntries[sortedEntries.length - 1]

  const currentWeight = lastEntry.weight
  const totalWeightLoss = startWeight - currentWeight
  const deviationFromTarget = targetWeight ? currentWeight - targetWeight : 0

  // Calculate days since start
  const firstDate = new Date(firstEntry.date)
  const lastDate = new Date(lastEntry.date)
  const daysSinceStart = Math.max(1, Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)))

  const gramsPerDay = (totalWeightLoss * 1000) / daysSinceStart
  const kgPerWeek = (gramsPerDay * 7) / 1000

  // Days to target
  let daysToTarget = '--'
  if (targetDate) {
    const today = new Date()
    const target = new Date(targetDate)
    const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    daysToTarget = days > 0 ? `${days} dagar` : 'Passerat'
  }

  return {
    currentWeight: `${currentWeight.toFixed(1)} kg`,
    totalWeightLoss: totalWeightLoss > 0 ? `${totalWeightLoss.toFixed(1)} kg` : '0 kg',
    deviationFromTarget: targetWeight ? `${Math.abs(deviationFromTarget).toFixed(1)} kg ${deviationFromTarget > 0 ? 'över' : 'under'}` : '--',
    deviationColor: deviationFromTarget > 0 ? 'text-red-400' : 'text-green-400',
    gramsPerDay: `${gramsPerDay.toFixed(0)} g`,
    kgPerWeek: `${kgPerWeek.toFixed(2)} kg`,
    daysToTarget
  }
}

function generateWeeks(profile: WeightProfile, entries: WeightEntry[]): WeekData[] {
  if (!profile.targetDate) {
    return []
  }

  // Start from first entry OR today if no entries yet
  let startDate: Date
  if (entries.length > 0) {
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    const firstEntry = sortedEntries[0]
    startDate = getMonday(new Date(firstEntry.date))
  } else {
    startDate = getMonday(new Date())
  }

  const endDate = new Date(profile.targetDate)

  const weeks: WeekData[] = []
  let currentDate = new Date(startDate)
  let weekNumber = 1

  while (currentDate <= endDate) {
    const days = []
    const weekStart = new Date(currentDate)

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate)
      days.push({
        date: formatDateISO(date),
        dayName: getDayName(date.getDay()),
        weight: null
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    weeks.push({
      weekNumber,
      startDate: weekStart,
      days
    })

    weekNumber++
  }

  return weeks
}

function calculateWeeklyAverage(week: WeekData, entries: WeightEntry[]): string {
  const weights = week.days
    .map(day => entries.find(e => e.date === day.date)?.weight)
    .filter(w => w !== undefined) as number[]

  if (weights.length === 0) return '#DIV/0!'

  const average = weights.reduce((sum, w) => sum + w, 0) / weights.length
  return `${average.toFixed(1)} kg`
}

function prepareGraphData(entries: WeightEntry[]) {
  return entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(entry => ({
      date: formatDisplayDate(entry.date),
      weight: entry.weight
    }))
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(d.setDate(diff))
}

function getDayName(dayIndex: number): string {
  const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
  return days[dayIndex]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
