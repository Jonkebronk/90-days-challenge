'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Save, TrendingDown, Target, Calendar, Scale } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

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

export default function WeightTrackerPage() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'graph'>('weekly')
  const [profile, setProfile] = useState<WeightProfile>({
    startWeight: '',
    targetWeight: '',
    height: '',
    targetDate: ''
  })
  const [entries, setEntries] = useState<WeightEntry[]>([])

  // Load data from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('weight-profile')
    const savedEntries = localStorage.getItem('weight-entries')

    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    }
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries))
    }
  }, [])

  // Save profile
  const saveProfile = () => {
    localStorage.setItem('weight-profile', JSON.stringify(profile))
    alert('Profil sparad!')
  }

  // Update weight entry
  const updateWeight = (date: string, weight: string) => {
    const weightNum = parseFloat(weight)

    if (weight === '' || isNaN(weightNum)) {
      // Remove entry
      const newEntries = entries.filter(e => e.date !== date)
      setEntries(newEntries)
      localStorage.setItem('weight-entries', JSON.stringify(newEntries))
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
    localStorage.setItem('weight-entries', JSON.stringify(newEntries))
  }

  // Calculate statistics
  const stats = calculateStats(profile, entries)
  const weeks = generateWeeks(profile, entries)
  const graphData = prepareGraphData(entries)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <Scale className="h-8 w-8 text-yellow-400" />
          Viktspårning
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Stats */}
          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="startWeight" className="text-gray-400">Startvikt (kg)</Label>
                  <Input
                    id="startWeight"
                    type="number"
                    step="0.1"
                    value={profile.startWeight}
                    onChange={(e) => setProfile({ ...profile, startWeight: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="targetWeight" className="text-gray-400">Målvikt (kg)</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    step="0.1"
                    value={profile.targetWeight}
                    onChange={(e) => setProfile({ ...profile, targetWeight: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-gray-400">Längd (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height}
                    onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="targetDate" className="text-gray-400">Måldatum</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={profile.targetDate}
                    onChange={(e) => setProfile({ ...profile, targetDate: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button
                  onClick={saveProfile}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Spara profil
                </Button>
              </CardContent>
            </Card>

            {/* Statistics Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatItem label="Nuvarande vikt" value={stats.currentWeight} color="text-white" />
                <StatItem label="Total viktförlust" value={stats.totalWeightLoss} color="text-green-400" />
                <StatItem label="Avvikelse från mål" value={stats.deviationFromTarget} color={stats.deviationColor} />
                <StatItem label="Gram per dag" value={stats.gramsPerDay} color="text-yellow-400" />
                <StatItem label="Kg per vecka" value={stats.kgPerWeek} color="text-yellow-400" />
                <StatItem label="Kalorier/dag" value={stats.caloriesPerDay} color="text-orange-400" />
                <StatItem label="Kalorier/vecka" value={stats.caloriesPerWeek} color="text-orange-400" />
                <StatItem label="Dagar till mål" value={stats.daysToTarget} color="text-blue-400" />
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
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                <Calendar className="h-5 w-5" />
                Veckoöversikt
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === 'graph'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                <TrendingDown className="h-5 w-5" />
                Graf
              </button>
            </div>

            {/* Weekly View */}
            {activeTab === 'weekly' && (
              <div className="space-y-4">
                {weeks.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-400">Fyll i din profil och börja registrera vikter för att se veckoöversikten.</p>
                    </CardContent>
                  </Card>
                ) : (
                  weeks.map((week) => (
                    <WeekCard
                      key={week.weekNumber}
                      week={week}
                      entries={entries}
                      onUpdateWeight={updateWeight}
                    />
                  ))
                )}
              </div>
            )}

            {/* Graph View */}
            {activeTab === 'graph' && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="py-6">
                  {graphData.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-gray-400">Ingen viktdata att visa. Börja registrera vikter för att se grafen.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={500}>
                      <LineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          domain={['dataMin - 2', 'dataMax + 2']}
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#FBBF24"
                          strokeWidth={3}
                          dot={{ fill: '#FBBF24', r: 4 }}
                        />
                        {profile.targetWeight && (
                          <ReferenceLine
                            y={parseFloat(profile.targetWeight)}
                            stroke="#4ADE80"
                            strokeDasharray="5 5"
                            label={{ value: 'Mål', fill: '#4ADE80', fontSize: 12 }}
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
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  )
}

// Week Card Component
function WeekCard({
  week,
  entries,
  onUpdateWeight
}: {
  week: WeekData
  entries: WeightEntry[]
  onUpdateWeight: (date: string, weight: string) => void
}) {
  const weeklyAverage = calculateWeeklyAverage(week, entries)

  return (
    <Card className="bg-gray-800 border-gray-700 overflow-hidden">
      <div className="grid grid-cols-5 bg-yellow-400">
        <div className="col-span-1 p-4 flex items-center justify-center border-r border-yellow-500">
          <span className="text-4xl font-bold text-black">V{week.weekNumber}</span>
        </div>
        <div className="col-span-2 p-4 border-r border-yellow-500">
          <div className="text-black font-semibold text-sm">Vecka {week.weekNumber}</div>
          <div className="text-black text-xs opacity-75">
            {formatDate(week.startDate)} - {formatDate(addDays(week.startDate, 6))}
          </div>
        </div>
        <div className="col-span-2 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-black text-xs font-semibold">Weekly Average</div>
            <div className="text-black text-2xl font-bold">{weeklyAverage}</div>
          </div>
        </div>
      </div>
      <CardContent className="p-0">
        <table className="w-full">
          <tbody>
            {week.days.map((day, index) => {
              const entry = entries.find(e => e.date === day.date)
              return (
                <tr key={day.date} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                  <td className="px-4 py-3 text-gray-400 w-32">{day.dayName}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDisplayDate(day.date)}</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="--"
                      value={entry?.weight || ''}
                      onChange={(e) => onUpdateWeight(day.date, e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-center focus:ring-yellow-400"
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
      caloriesPerDay: '--',
      caloriesPerWeek: '--',
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
  const caloriesPerDay = gramsPerDay * 7
  const caloriesPerWeek = kgPerWeek * 7000

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
    caloriesPerDay: `${caloriesPerDay.toFixed(0)} kcal`,
    caloriesPerWeek: `${caloriesPerWeek.toFixed(0)} kcal`,
    daysToTarget
  }
}

function generateWeeks(profile: WeightProfile, entries: WeightEntry[]): WeekData[] {
  if (!profile.targetDate || entries.length === 0) {
    return []
  }

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const firstEntry = sortedEntries[0]
  const startDate = getMonday(new Date(firstEntry.date))
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
