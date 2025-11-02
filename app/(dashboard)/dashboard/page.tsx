'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Calendar,
  TrendingUp,
  Target,
  Flame,
  Award,
  ChevronRight
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentDay, setCurrentDay] = useState(1)
  const [currentPhase, setCurrentPhase] = useState(1)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Calculate current day (mock - will be from database later)
    // For now, use a mock start date
    const mockStartDate = new Date('2025-01-01')
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - mockStartDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const day = Math.min(diffDays, 90)

    setCurrentDay(day)

    // Calculate phase
    if (day <= 30) setCurrentPhase(1)
    else if (day <= 60) setCurrentPhase(2)
    else setCurrentPhase(3)
  }, [])

  const progress = (currentDay / 90) * 100

  const getPhaseInfo = (phase: number) => {
    switch (phase) {
      case 1:
        return {
          title: 'Fas 1: BYGG GRUNDEN',
          description: 'Dag 1-30: Lär dig grunderna och bygg din basplan',
          color: 'from-blue-500 to-cyan-500'
        }
      case 2:
        return {
          title: 'Fas 2: VÄXLA UPP',
          description: 'Dag 31-60: Optimera och justera din plan',
          color: 'from-purple-500 to-pink-500'
        }
      case 3:
        return {
          title: 'Fas 3: SISTA PUSHEN',
          description: 'Dag 61-90: Maximera resultat och planera framåt',
          color: 'from-orange-500 to-red-500'
        }
      default:
        return {
          title: 'Fas 1: BYGG GRUNDEN',
          description: 'Dag 1-30',
          color: 'from-blue-500 to-cyan-500'
        }
    }
  }

  const phaseInfo = getPhaseInfo(currentPhase)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Välkommen tillbaka, {session?.user?.name?.split(' ')[0] || 'Champion'}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Här är din översikt för idag
        </p>
      </div>

      {/* Day Counter Card */}
      <Card className="overflow-hidden border-2">
        <div className={`h-2 bg-gradient-to-r ${phaseInfo.color}`} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{phaseInfo.title}</CardTitle>
              <CardDescription className="text-base mt-1">
                {phaseInfo.description}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {currentDay}
              </div>
              <div className="text-sm text-muted-foreground">av 90 dagar</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Övergripande progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start</span>
              <span>{90 - currentDay} dagar kvar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dagens Kalorier</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 / 2000</div>
            <p className="text-xs text-muted-foreground">kcal</p>
            <Progress value={0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veckans Träning</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 / 4</div>
            <p className="text-xs text-muted-foreground">pass genomförda</p>
            <Progress value={0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-in Streak</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 dagar</div>
            <p className="text-xs text-muted-foreground">i rad</p>
            <Progress value={0} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <Link href="/dashboard/check-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Dagens Check-in</CardTitle>
                    <CardDescription>Logga vikt, energi & sömn</CardDescription>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <Link href="/dashboard/progress">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Se Din Progress</CardTitle>
                    <CardDescription>Grafer och statistik</CardDescription>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Today's Focus */}
      <Card>
        <CardHeader>
          <CardTitle>Dagens Fokus</CardTitle>
          <CardDescription>Vad du bör tänka på idag</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-foreground text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Gör din dagliga check-in</p>
                <p className="text-sm text-muted-foreground">Logga din vikt och hur du mår</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-foreground text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Håll koll på dina måltider</p>
                <p className="text-sm text-muted-foreground">Försök hålla dig inom ditt kaloriintag</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-foreground text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Reflektera över veckan</p>
                <p className="text-sm text-muted-foreground">Se över din progress och planera för nästa vecka</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
