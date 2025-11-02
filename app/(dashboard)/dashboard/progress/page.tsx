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
  const isCoach = session?.user && (session.user as any).role === 'coach'

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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Din Progress</h1>
          <p className="text-muted-foreground">Se hur du utvecklas över tid</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            size="sm"
            variant={timeRange === '7' ? 'default' : 'ghost'}
            onClick={() => setTimeRange('7')}
          >
            7d
          </Button>
          <Button
            size="sm"
            variant={timeRange === '30' ? 'default' : 'ghost'}
            onClick={() => setTimeRange('30')}
          >
            30d
          </Button>
          <Button
            size="sm"
            variant={timeRange === '90' ? 'default' : 'ghost'}
            onClick={() => setTimeRange('90')}
          >
            90d
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Viktförändring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </div>
              {weightChange < 0 && <TrendingDown className="w-5 h-5 text-green-500" />}
              {weightChange > 0 && <TrendingUp className="w-5 h-5 text-red-500" />}
              {weightChange === 0 && <Minus className="w-5 h-5 text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Från {startWeight}kg till {currentWeight}kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Genomsnittlig Energi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {avgEnergy.toFixed(1)} / 5
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {avgEnergy >= 4 ? 'Bra nivåer! 🎉' : avgEnergy >= 3 ? 'Okej nivåer 👍' : 'Försök få mer vila 😴'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Genomsnittlig Sömn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {avgSleep.toFixed(1)}h
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {avgSleep >= 7 ? 'Bra! 😴' : 'Försök sova mer 🌙'}
            </p>
          </CardContent>
        </Card>
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
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold">Ingen data än</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Börja med att göra din första dagliga check-in för att se din progress här!
              </p>
              <Link href="/dashboard/check-in">
                <Button>Gör Check-in</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
