'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  TrendingUp,
  Users,
  UserPlus,
  FileText,
  BookOpen,
  ChefHat,
  Utensils,
  Dumbbell,
  ChevronRight,
  Sparkles
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    clients: 0,
    leads: 0,
    checkIns: 0,
    content: 0
  })
  const isCoach = session?.user && (session.user as any).role?.toUpperCase() === 'COACH'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (isCoach) {
      fetchCoachStats()
    }
  }, [isCoach])

  const fetchCoachStats = async () => {
    try {
      // Fetch clients
      const clientsRes = await fetch('/api/clients')
      const clientsData = await clientsRes.json()

      // Fetch leads
      const leadsRes = await fetch('/api/leads')
      const leadsData = await leadsRes.json()

      setStats({
        clients: clientsData.clients?.length || 0,
        leads: leadsData.leads?.length || 0,
        checkIns: 0, // TODO: Implement check-ins count
        content: 0 // TODO: Implement content count
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgba(255,255,255,0.8)]">Laddar...</p>
        </div>
      </div>
    )
  }

  // Coach Dashboard
  if (isCoach) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
            Dashboard
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Översikt över din coaching-verksamhet
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[rgba(255,255,255,0.7)] text-sm font-medium">Aktiva Klienter</span>
              <Users className="h-5 w-5 text-[#FFD700]" />
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">{stats.clients}</div>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">klienter</p>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[rgba(255,255,255,0.7)] text-sm font-medium">Nya Leads</span>
              <UserPlus className="h-5 w-5 text-[#22c55e]" />
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">{stats.leads}</div>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">denna vecka</p>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[rgba(255,255,255,0.7)] text-sm font-medium">Check-ins</span>
              <Calendar className="h-5 w-5 text-[#a855f7]" />
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">{stats.checkIns}</div>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">inväntar granskning</p>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[rgba(255,255,255,0.7)] text-sm font-medium">Innehåll</span>
              <FileText className="h-5 w-5 text-[#FFA500]" />
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">{stats.content}</div>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">filer & lektioner</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/clients">
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#0a0a0a]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[rgba(255,255,255,0.9)]">Hantera Team</h3>
                    <p className="text-sm text-[rgba(255,255,255,0.6)]">Se alla klienter</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[rgba(255,215,0,0.7)] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/leads">
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[rgba(255,255,255,0.9)]">Leads</h3>
                    <p className="text-sm text-[rgba(255,255,255,0.6)]">Hantera intressenter</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[rgba(255,215,0,0.7)] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/articles">
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#a855f7] to-[#7c3aed] flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[rgba(255,255,255,0.9)]">Kunskapsbanken</h3>
                    <p className="text-sm text-[rgba(255,255,255,0.6)]">Läs artiklar</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[rgba(255,215,0,0.7)] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/recipes">
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFA500] to-[#ff8800] flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-[#0a0a0a]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[rgba(255,255,255,0.9)]">Recept</h3>
                    <p className="text-sm text-[rgba(255,255,255,0.6)]">Hitta matinspiration</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[rgba(255,215,0,0.7)] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/check-in">
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[rgba(255,255,255,0.9)]">Check-ins</h3>
                    <p className="text-sm text-[rgba(255,255,255,0.6)]">Granska klient-data</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[rgba(255,215,0,0.7)] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/progress">
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#ec4899] to-[#db2777] flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[rgba(255,255,255,0.9)]">Statistik</h3>
                    <p className="text-sm text-[rgba(255,255,255,0.6)]">Översikt & grafer</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[rgba(255,215,0,0.7)] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px]">
          <div className="p-6 border-b border-[rgba(255,215,0,0.1)]">
            <h2 className="text-xl font-bold text-[rgba(255,255,255,0.9)]">Senaste Aktivitet</h2>
            <p className="text-[rgba(255,255,255,0.6)] text-sm mt-1">Vad som händer med dina klienter</p>
          </div>
          <div className="p-8">
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-[rgba(255,255,255,0.6)]">Ingen aktivitet ännu</p>
              <p className="text-sm text-[rgba(255,255,255,0.4)] mt-2">Börja genom att bjuda in klienter</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Client Dashboard
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
          Välkommen {session?.user?.name?.split(' ')[0] || 'Champion'}!
        </h1>
        <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
          Din översikt för 90-Dagars Challenge
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
      </div>

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">

        {/* Check-in Card */}
        <Link href="/dashboard/check-in">
          <div className="group relative bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-8 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(59,130,246,0.1)] to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(59,130,246,0.4)]">
              <Calendar className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] mb-2 relative z-10">Check-in</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-center text-sm relative z-10">
              Gör din veckocheckning
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-[rgba(255,215,0,0.5)] group-hover:translate-x-2 group-hover:text-[#FFD700] transition-all" />
          </div>
        </Link>

        {/* Progress Card */}
        <Link href="/dashboard/progress">
          <div className="group relative bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-8 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(236,72,153,0.1)] to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ec4899] to-[#db2777] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(236,72,153,0.4)]">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] mb-2 relative z-10">Framsteg</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-center text-sm relative z-10">
              Se din utveckling & statistik
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-[rgba(255,215,0,0.5)] group-hover:translate-x-2 group-hover:text-[#FFD700] transition-all" />
          </div>
        </Link>

        {/* Kunskapsbanken Card */}
        <Link href="/dashboard/articles">
          <div className="group relative bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-8 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(168,85,247,0.1)] to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#a855f7] to-[#7c3aed] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <BookOpen className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] mb-2 relative z-10">Kunskapsbanken</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-center text-sm relative z-10">
              Läs artiklar & guider
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-[rgba(255,215,0,0.5)] group-hover:translate-x-2 group-hover:text-[#FFD700] transition-all" />
          </div>
        </Link>

        {/* Recept Card */}
        <Link href="/dashboard/recipes">
          <div className="group relative bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-8 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,165,0,0.1)] to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FFA500] to-[#ff8800] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,165,0,0.4)]">
              <ChefHat className="w-10 h-10 text-[#0a0a0a]" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] mb-2 relative z-10">Recept</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-center text-sm relative z-10">
              Hitta matinspiration
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-[rgba(255,215,0,0.5)] group-hover:translate-x-2 group-hover:text-[#FFD700] transition-all" />
          </div>
        </Link>

        {/* Kostschema Card */}
        <Link href="/dashboard/meal-plan">
          <div className="group relative bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-8 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(251,146,60,0.1)] to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#fb923c] to-[#f97316] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(251,146,60,0.4)]">
              <Utensils className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] mb-2 relative z-10">Kostschema</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-center text-sm relative z-10">
              Din personliga måltidsplan
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-[rgba(255,215,0,0.5)] group-hover:translate-x-2 group-hover:text-[#FFD700] transition-all" />
          </div>
        </Link>

        {/* Träningsprogram Card */}
        <Link href="/dashboard/workout">
          <div className="group relative bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-8 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(139,92,246,0.1)] to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(139,92,246,0.4)]">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] mb-2 relative z-10">Träningsprogram</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-center text-sm relative z-10">
              Ditt personliga träningsschema
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-[rgba(255,215,0,0.5)] group-hover:translate-x-2 group-hover:text-[#FFD700] transition-all" />
          </div>
        </Link>

        {/* Profile Card */}
        <Link href="/dashboard/profile">
          <div className="group relative bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-8 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(34,197,94,0.1)] to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(34,197,94,0.4)]">
              <Users className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] mb-2 relative z-10">Min Profil</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-center text-sm relative z-10">
              Hantera dina uppgifter
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-[rgba(255,215,0,0.5)] group-hover:translate-x-2 group-hover:text-[#FFD700] transition-all" />
          </div>
        </Link>

        {/* Coming Soon Card */}
        <div className="group relative bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.1)] rounded-2xl p-8 backdrop-blur-[10px] overflow-hidden h-[280px] flex flex-col items-center justify-center opacity-60">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(100,100,100,0.1)] to-transparent opacity-30" />

          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.05)] flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-[rgba(255,215,0,0.5)]" />
          </div>

          {/* Title & Description */}
          <h3 className="text-2xl font-bold text-[rgba(255,255,255,0.5)] mb-2 relative z-10">Mer Kommer</h3>
          <p className="text-[rgba(255,255,255,0.4)] text-center text-sm relative z-10">
            Spännande funktioner på gång!
          </p>
        </div>
      </div>

      {/* Quick Tips Section */}
      <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] max-w-6xl mx-auto">
        <div className="p-6 border-b border-[rgba(255,215,0,0.1)]">
          <h2 className="text-xl font-bold text-[rgba(255,255,255,0.9)]">Kom Igång</h2>
          <p className="text-[rgba(255,255,255,0.6)] text-sm mt-1">Tips för att få ut det mesta av programmet</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-[rgba(255,255,255,0.9)] text-sm mb-1">Gör din första check-in</h4>
                <p className="text-[rgba(255,255,255,0.6)] text-xs">Dokumentera din startvikt och mål</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a855f7] to-[#7c3aed] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-[rgba(255,255,255,0.9)] text-sm mb-1">Utforska kunskapsbanken</h4>
                <p className="text-[rgba(255,255,255,0.6)] text-xs">Lär dig grunderna för framgång</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFA500] to-[#ff8800] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-[rgba(255,255,255,0.9)] text-sm mb-1">Planera dina måltider</h4>
                <p className="text-[rgba(255,255,255,0.6)] text-xs">Använd recepten för inspiration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
