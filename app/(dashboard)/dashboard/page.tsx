'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
  Sparkles,
  MessageSquare,
  HelpCircle,
  Clock,
  Info
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

  // Debug logging
  console.log('[DASHBOARD] Status:', status)
  console.log('[DASHBOARD] Session:', session)
  console.log('[DASHBOARD] User role:', (session?.user as any)?.role)
  console.log('[DASHBOARD] isCoach:', isCoach)

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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Laddar...</p>
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
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mb-6 opacity-20" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-3">
            Dashboard
          </h1>
          <p className="text-gray-400 text-sm tracking-[1px]">
            Översikt över din coaching-verksamhet
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mt-6 opacity-20" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 text-sm font-medium">Aktiva Klienter</span>
              <Users className="h-5 w-5 text-gold-primary" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.clients}</div>
            <p className="text-xs text-gray-500 mt-1">klienter</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 text-sm font-medium">Nya Leads</span>
              <UserPlus className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.leads}</div>
            <p className="text-xs text-gray-500 mt-1">denna vecka</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 text-sm font-medium">Check-ins</span>
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.checkIns}</div>
            <p className="text-xs text-gray-500 mt-1">inväntar granskning</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 text-sm font-medium">Innehåll</span>
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.content}</div>
            <p className="text-xs text-gray-500 mt-1">filer & lektioner</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/clients">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Hantera Team</h3>
                    <p className="text-sm text-gray-600">Se alla klienter</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gold-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/leads">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Leads</h3>
                    <p className="text-sm text-gray-600">Hantera intressenter</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gold-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/articles">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Kunskapsbanken</h3>
                    <p className="text-sm text-gray-600">Läs artiklar</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gold-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/recipes">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recept</h3>
                    <p className="text-sm text-gray-600">Hitta matinspiration</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gold-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/check-in">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Check-ins</h3>
                    <p className="text-sm text-gray-600">Granska klient-data</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gold-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/progress">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Statistik</h3>
                    <p className="text-sm text-gray-600">Översikt & grafer</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gold-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border-2 border-gray-200 rounded-xl">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Senaste Aktivitet</h2>
            <p className="text-gray-600 text-sm mt-1">Vad som händer med dina klienter</p>
          </div>
          <div className="p-8">
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-gold-primary mb-4" />
              <p className="text-gray-600">Ingen aktivitet ännu</p>
              <p className="text-sm text-gray-500 mt-2">Börja genom att bjuda in klienter</p>
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
        <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mb-6 opacity-20" />
        <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-3">
          Välkommen {session?.user?.name?.split(' ')[0] || 'Champion'}!
        </h1>
        <p className="text-gray-400 text-sm tracking-[1px]">
          Din översikt för 90-Dagars Challenge
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mt-6 opacity-20" />
      </div>

      {/* Quick Tips Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl max-w-6xl mx-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Kom Igång</h2>
            <p className="text-gray-600 text-sm mt-1">Tips för att få ut det mesta av programmet</p>
          </div>
          <Link href="/dashboard/onboarding/guide">
            <Button
              size="lg"
              className="bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-bold px-4 py-2 md:px-6 md:py-3 hover:shadow-lg transition-all animate-pulse hover:animate-none text-sm md:text-base"
            >
              <Info className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Läs Introduktion</span>
              <span className="sm:hidden">Introduktion</span>
            </Button>
          </Link>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/onboarding/guide" className="flex items-start gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-gold-primary transition-colors">Läs introduktionen</h4>
                <p className="text-gray-600 text-xs">Viktigt - börja här!</p>
              </div>
            </Link>

            <Link href="/dashboard/check-in" className="flex items-start gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">Gör din start-check in</h4>
                <p className="text-gray-600 text-xs">Dokumentera din startvikt och mål</p>
              </div>
            </Link>

            <Link href="/dashboard/articles" className="flex items-start gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-purple-600 transition-colors">Utforska kunskapsbanken</h4>
                <p className="text-gray-600 text-xs">Lär dig grunderna för framgång</p>
              </div>
            </Link>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Gå igenom dina planer</h4>
              </div>
              <div className="flex flex-col gap-2 ml-10">
                <Link href="/dashboard/meal-plan" className="group flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-orange-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-gray-700 group-hover:text-orange-600 transition-colors">Kostschema</span>
                </Link>
                <Link href="/dashboard/workout" className="group flex items-center gap-2">
                  <Dumbbell className="w-3.5 h-3.5 text-orange-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-gray-700 group-hover:text-orange-600 transition-colors">Träningsplan</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">

        {/* Check-in Card */}
        <Link href="/dashboard/check-in">
          <div className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gold-primary hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Calendar className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Check-in</h3>
            <p className="text-gray-600 text-center text-sm relative z-10">
              Gör din veckocheckning
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-gold-primary group-hover:translate-x-2 transition-all" />
          </div>
        </Link>

        {/* Progress Card */}
        <Link href="/dashboard/progress">
          <div className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gold-primary hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Framsteg</h3>
            <p className="text-gray-600 text-center text-sm relative z-10">
              Se din utveckling & statistik
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-gold-primary group-hover:translate-x-2 transition-all" />
          </div>
        </Link>

        {/* Kunskapsbanken Card */}
        <Link href="/dashboard/articles">
          <div className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gold-primary hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Kunskapsbanken</h3>
            <p className="text-gray-600 text-center text-sm relative z-10">
              Läs artiklar & guider
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-gold-primary group-hover:translate-x-2 transition-all" />
          </div>
        </Link>

        {/* Recept Card */}
        <Link href="/dashboard/recipes">
          <div className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gold-primary hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <ChefHat className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Recept</h3>
            <p className="text-gray-600 text-center text-sm relative z-10">
              Hitta matinspiration
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-gold-primary group-hover:translate-x-2 transition-all" />
          </div>
        </Link>

        {/* Kostschema Card */}
        <Link href="/dashboard/meal-plan">
          <div className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gold-primary hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Utensils className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Kostschema</h3>
            <p className="text-gray-600 text-center text-sm relative z-10">
              Din personliga måltidsplan
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-gold-primary group-hover:translate-x-2 transition-all" />
          </div>
        </Link>

        {/* Träningsprogram Card */}
        <Link href="/dashboard/workout">
          <div className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gold-primary hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Träningsprogram</h3>
            <p className="text-gray-600 text-center text-sm relative z-10">
              Ditt personliga träningsschema
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-gold-primary group-hover:translate-x-2 transition-all" />
          </div>
        </Link>

        {/* Meddelanden Card */}
        <Link href="/dashboard/messages">
          <div className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gold-primary hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Meddelanden</h3>
            <p className="text-gray-600 text-center text-sm relative z-10">
              Kommunicera med din coach
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-gold-primary group-hover:translate-x-2 transition-all" />
          </div>
        </Link>

        {/* Profile Card */}
        <Link href="/dashboard/profile">
          <div className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gold-primary hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Users className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Min Profil</h3>
            <p className="text-gray-600 text-center text-sm relative z-10">
              Hantera dina uppgifter
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-gold-primary group-hover:translate-x-2 transition-all" />
          </div>
        </Link>

        {/* FAQ Card */}
        <Link href="/dashboard/faqs">
          <div className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gold-primary hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden h-[280px] flex flex-col items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <HelpCircle className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Vanliga frågor</h3>
            <p className="text-gray-600 text-center text-sm relative z-10">
              Svar på vanliga frågor
            </p>

            {/* Arrow indicator */}
            <ChevronRight className="absolute bottom-4 right-4 w-6 h-6 text-gold-primary group-hover:translate-x-2 transition-all" />
          </div>
        </Link>

        {/* Recent Activity Card (Coming Soon) */}
        <div className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 overflow-hidden h-[280px] flex flex-col items-center justify-center opacity-60">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-30" />

          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-gray-500" />
          </div>

          {/* Title & Description */}
          <h3 className="text-2xl font-bold text-gray-500 mb-2 relative z-10">Senaste aktivitet</h3>
          <p className="text-gray-400 text-center text-sm relative z-10">
            Coachens uppdateringar
          </p>
        </div>
      </div>
    </div>
  )
}
