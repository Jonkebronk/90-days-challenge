'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Dumbbell,
  FileText,
  BookOpen,
  Settings,
  Activity,
  TrendingUp,
  Calendar,
  Award,
  FolderOpen,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Zap
} from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  totalClients: number
  activeClients: number
  totalExercises: number
  totalPrograms: number
  totalArticles: number
  totalRecipes: number
  totalLessons: number
  recentSessions: number
  totalSessions: number
}

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Redirect if not coach
  if (session?.user && (session.user as any).role !== 'COACH') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(220,53,69,0.3)]">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-[#dc3545] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[rgba(255,255,255,0.9)] mb-2">
              Åtkomst nekad
            </h3>
            <p className="text-[rgba(255,255,255,0.6)]">
              Du måste vara coach för att komma åt admin-panelen.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[rgba(255,215,0,0.3)] border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
          Admin Dashboard
        </h1>
        <p className="text-[rgba(255,255,255,0.6)] mt-1">
          Översikt och hantering av systemet
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(59,130,246,0.3)] backdrop-blur-[10px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.7)]">
                Klienter
              </CardTitle>
              <Users className="w-5 h-5 text-[#3b82f6]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {stats?.totalClients || 0}
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">
              {stats?.activeClients || 0} aktiva
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.7)]">
                Övningar
              </CardTitle>
              <Dumbbell className="w-5 h-5 text-[#FFD700]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {stats?.totalExercises || 0}
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">
              I biblioteket
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(139,92,246,0.3)] backdrop-blur-[10px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.7)]">
                Program
              </CardTitle>
              <Calendar className="w-5 h-5 text-[#8b5cf6]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {stats?.totalPrograms || 0}
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">
              Träningsprogram
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(34,197,94,0.3)] backdrop-blur-[10px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.7)]">
                Sessioner
              </CardTitle>
              <Activity className="w-5 h-5 text-[#22c55e]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {stats?.totalSessions || 0}
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">
              {stats?.recentSessions || 0} senaste veckan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-[rgba(255,255,255,0.95)] flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FFD700]" />
            Snabbåtgärder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link href="/dashboard/clients">
              <Button
                variant="outline"
                className="w-full bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)] justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                Hantera klienter
              </Button>
            </Link>
            <Link href="/dashboard/content/exercises">
              <Button
                variant="outline"
                className="w-full bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)] justify-start"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Skapa övning
              </Button>
            </Link>
            <Link href="/dashboard/content/workout-programs">
              <Button
                variant="outline"
                className="w-full bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)] justify-start"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Nytt program
              </Button>
            </Link>
            <Link href="/dashboard/content/articles">
              <Button
                variant="outline"
                className="w-full bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)] justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Skriv artikel
              </Button>
            </Link>
            <Link href="/dashboard/content/recipes">
              <Button
                variant="outline"
                className="w-full bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)] justify-start"
              >
                <Activity className="w-4 h-4 mr-2" />
                Skapa recept
              </Button>
            </Link>
            <Link href="/dashboard/leads">
              <Button
                variant="outline"
                className="w-full bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)] justify-start"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Hantera leads
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Content Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-[rgba(255,255,255,0.95)] flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#FFD700]" />
              Innehållshantering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/content/exercises">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,215,0,0.4)] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Dumbbell className="w-4 h-4 text-[rgba(255,215,0,0.7)]" />
                  <div>
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Övningar</p>
                    <p className="text-xs text-[rgba(255,255,255,0.5)]">{stats?.totalExercises || 0} totalt</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[rgba(255,255,255,0.5)]" />
              </div>
            </Link>

            <Link href="/dashboard/content/workout-programs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,215,0,0.4)] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[rgba(255,215,0,0.7)]" />
                  <div>
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Träningsprogram</p>
                    <p className="text-xs text-[rgba(255,255,255,0.5)]">{stats?.totalPrograms || 0} totalt</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[rgba(255,255,255,0.5)]" />
              </div>
            </Link>

            <Link href="/dashboard/content/articles">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,215,0,0.4)] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[rgba(255,215,0,0.7)]" />
                  <div>
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Artiklar</p>
                    <p className="text-xs text-[rgba(255,255,255,0.5)]">{stats?.totalArticles || 0} totalt</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[rgba(255,255,255,0.5)]" />
              </div>
            </Link>

            <Link href="/dashboard/content/recipes">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,215,0,0.4)] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-[rgba(255,215,0,0.7)]" />
                  <div>
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Recept</p>
                    <p className="text-xs text-[rgba(255,255,255,0.5)]">{stats?.totalRecipes || 0} totalt</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[rgba(255,255,255,0.5)]" />
              </div>
            </Link>

            <Link href="/dashboard/content/lessons">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,215,0,0.4)] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-[rgba(255,215,0,0.7)]" />
                  <div>
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Lektioner</p>
                    <p className="text-xs text-[rgba(255,255,255,0.5)]">{stats?.totalLessons || 0} totalt</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[rgba(255,255,255,0.5)]" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-[rgba(255,255,255,0.95)] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#FFD700]" />
              Systemstatus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                <span className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Database</span>
              </div>
              <Badge className="bg-[rgba(34,197,94,0.2)] text-[#22c55e] border-[rgba(34,197,94,0.3)]">
                Online
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                <span className="text-sm font-medium text-[rgba(255,255,255,0.9)]">API</span>
              </div>
              <Badge className="bg-[rgba(34,197,94,0.2)] text-[#22c55e] border-[rgba(34,197,94,0.3)]">
                Healthy
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[rgba(255,255,255,0.7)]">Aktivitet (7d)</span>
                <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              </div>
              <div className="text-2xl font-bold text-[rgba(255,255,255,0.95)]">
                {stats?.recentSessions || 0}
              </div>
              <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                Träningspass genomförda
              </p>
            </div>

            <Link href="/dashboard/analytics">
              <Button
                variant="outline"
                className="w-full bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)]"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Visa fullständig analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
