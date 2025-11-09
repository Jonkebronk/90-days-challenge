'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface DailyLog {
  id: string
  logDate: string
  weightKg: number
  energyLevel: number
  sleepHours: number
}

export default function ProgressPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30')
  const isCoach = session?.user && (session.user as any).role?.toUpperCase() === 'COACH'

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/check-in?days=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs.reverse()) // Reverse to show oldest first
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Transform data for charts
  const chartData = logs.map(log => ({
    date: new Date(log.logDate).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
    weight: log.weightKg,
    energy: log.energyLevel,
    sleep: log.sleepHours,
  }))

  // Calculate stats
  const currentWeight = logs.length > 0 ? logs[logs.length - 1].weightKg : 0
  const startWeight = logs.length > 0 ? logs[0].weightKg : 0
  const weightChange = currentWeight - startWeight
  const avgEnergy = logs.length > 0
    ? logs.reduce((sum, log) => sum + log.energyLevel, 0) / logs.length
    : 0
  const avgSleep = logs.length > 0
    ? logs.reduce((sum, log) => sum + log.sleepHours, 0) / logs.length
    : 0

  // Coach view - Show overview/statistics
  if (isCoach) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Statistik Översikt</h1>
          <p className="text-muted-foreground text-lg">
            Se statistik över alla klienter
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Klient Översikt</CardTitle>
            <CardDescription>Statistik och progress för alla dina klienter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Ingen statistik tillgänglig ännu</p>
              <p className="text-sm text-muted-foreground mt-2">
                När klienter börjar checka in kommer deras statistik att visas här
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar din progress...</p>
        </div>
      </div>
    )
  }

  // Client view - Show personal progress
  return (
    <div className="space-y-8">
      {/* Header - Centrerad som Kostschema */}
      <div className="relative text-center py-8 bg-gradient-to-br from-[rgba(255,215,0,0.05)] to-transparent border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px]">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
          PROGRESS
        </h1>
        <p className="text-[rgba(255,255,255,0.6)] mt-2">
          Se hur du utvecklas över tid
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Time Range Selector */}
        <div className="flex justify-end">
          <div className="flex gap-2 p-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
            <Button
              size="sm"
              onClick={() => setTimeRange('7')}
              className={timeRange === '7'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold'
                : 'bg-transparent hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.7)]'}
            >
              7d
            </Button>
            <Button
              size="sm"
              onClick={() => setTimeRange('30')}
              className={timeRange === '30'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold'
                : 'bg-transparent hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.7)]'}
            >
              30d
            </Button>
            <Button
              size="sm"
              onClick={() => setTimeRange('90')}
              className={timeRange === '90'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold'
                : 'bg-transparent hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.7)]'}
            >
              90d
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all p-6">
            <p className="text-[rgba(255,215,0,0.8)] text-sm font-medium mb-3">Viktförändring</p>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </div>
              {weightChange < 0 && <TrendingDown className="w-5 h-5 text-[#22c55e]" />}
              {weightChange > 0 && <TrendingUp className="w-5 h-5 text-[#ef4444]" />}
              {weightChange === 0 && <Minus className="w-5 h-5 text-[rgba(255,255,255,0.4)]" />}
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.5)] mt-2">
              Från {startWeight}kg till {currentWeight}kg
            </p>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all p-6">
            <p className="text-[rgba(255,215,0,0.8)] text-sm font-medium mb-3">Genomsnittlig Energi</p>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
              {avgEnergy.toFixed(1)} / 5
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.5)] mt-2">
              {avgEnergy >= 4 ? 'Bra nivåer! 🎉' : avgEnergy >= 3 ? 'Okej nivåer 👍' : 'Försök få mer vila 😴'}
            </p>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all p-6">
            <p className="text-[rgba(255,215,0,0.8)] text-sm font-medium mb-3">Genomsnittlig Sömn</p>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
              {avgSleep.toFixed(1)}h
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.5)] mt-2">
              {avgSleep >= 7 ? 'Bra! 😴' : 'Försök sova mer 🌙'}
            </p>
          </div>
        </div>

      {/* Charts */}
      {logs.length > 0 ? (
        <Tabs defaultValue="weight" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weight">Vikt</TabsTrigger>
            <TabsTrigger value="energy">Energi</TabsTrigger>
            <TabsTrigger value="sleep">Sömn</TabsTrigger>
          </TabsList>

          {/* Weight Chart */}
          <TabsContent value="weight">
            <Card>
              <CardHeader>
                <CardTitle>Viktutveckling</CardTitle>
                <CardDescription>
                  Din vikt över de senaste {timeRange} dagarna
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Vikt (kg)"
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Energy Chart */}
          <TabsContent value="energy">
            <Card>
              <CardHeader>
                <CardTitle>Energinivåer</CardTitle>
                <CardDescription>
                  Hur din energi varierat över de senaste {timeRange} dagarna
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="energy"
                      fill="hsl(var(--primary))"
                      name="Energinivå (1-5)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sleep Chart */}
          <TabsContent value="sleep">
            <Card>
              <CardHeader>
                <CardTitle>Sömnmönster</CardTitle>
                <CardDescription>
                  Dina sömntimmar de senaste {timeRange} dagarna
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 12]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sleep"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="Sömn (timmar)"
                      dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                    />
                    {/* Reference line for 7-9h */}
                    <Line
                      type="monotone"
                      dataKey={() => 7}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      name="Rekommenderat min (7h)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all p-12">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">Ingen data än</h3>
            <p className="text-[rgba(255,255,255,0.6)] max-w-md mx-auto">
              Börja med att göra din första dagliga check-in för att se din progress här!
            </p>
            <Link href="/dashboard/check-in">
              <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold">
                Gör Check-in
              </Button>
            </Link>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
