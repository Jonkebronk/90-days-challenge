'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  Dumbbell,
  Calendar,
  Clock,
  BarChart3
} from 'lucide-react'

interface AnalyticsData {
  summary: {
    totalWorkouts: number
    totalSets: number
    totalVolume: number
    avgSessionDuration: number
    avgWorkoutsPerWeek: string
  }
  volumeProgression: Array<{
    date: string
    volume: number
    workoutName: string
  }>
  frequencyData: Array<{
    week: string
    workouts: number
  }>
  muscleDistribution: Array<{
    name: string
    value: number
  }>
  prProgression: Record<string, Array<{
    date: string
    weight: number
  }>>
}

const COLORS = ['#FFD700', '#FFA500', '#8b5cf6', '#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#ec4899']

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(90)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?days=${timeRange}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[rgba(255,215,0,0.3)] border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-[rgba(255,255,255,0.6)]">Ingen data tillgänglig</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)] flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-[#FFD700]" />
            Analytics Dashboard
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Spåra din utveckling och prestationer
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2">
          {[30, 90, 180, 365].map(days => (
            <Button
              key={days}
              variant={timeRange === days ? 'default' : 'outline'}
              onClick={() => setTimeRange(days)}
              className={
                timeRange === days
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black'
                  : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)]'
              }
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-black" />
              </div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm">Totalt Pass</div>
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {data.summary.totalWorkouts}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm">Totala Set</div>
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {data.summary.totalSets}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm">Total Volym</div>
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {data.summary.totalVolume.toLocaleString('sv-SE')}
              <span className="text-sm text-[rgba(255,255,255,0.5)] ml-1">kg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm">Snitt Tid</div>
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {data.summary.avgSessionDuration}
              <span className="text-sm text-[rgba(255,255,255,0.5)] ml-1">min</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm">Pass/Vecka</div>
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {data.summary.avgWorkoutsPerWeek}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Progression Chart */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardHeader>
            <CardTitle className="text-[rgba(255,255,255,0.95)]">Volymprogression</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.volumeProgression}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10,10,10,0.95)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.9)' }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#FFD700"
                  strokeWidth={2}
                  dot={{ fill: '#FFD700', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workout Frequency Chart */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardHeader>
            <CardTitle className="text-[rgba(255,255,255,0.95)]">Träningsfrekvens (per vecka)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.frequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="week"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10,10,10,0.95)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.9)' }}
                />
                <Bar dataKey="workouts" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Muscle Group Distribution */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardHeader>
            <CardTitle className="text-[rgba(255,255,255,0.95)]">Volymfördelning per muskelgrupp</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.muscleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.muscleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10,10,10,0.95)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PR Progression */}
        {Object.keys(data.prProgression).length > 0 && (
          <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
            <CardHeader>
              <CardTitle className="text-[rgba(255,255,255,0.95)]">Personliga rekord (vikt)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10,10,10,0.95)',
                      border: '1px solid rgba(255,215,0,0.3)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {Object.entries(data.prProgression).slice(0, 3).map(([exerciseName, prData], index) => (
                    <Line
                      key={exerciseName}
                      type="monotone"
                      data={prData}
                      dataKey="weight"
                      name={exerciseName}
                      stroke={COLORS[index]}
                      strokeWidth={2}
                      dot={{ fill: COLORS[index], r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
