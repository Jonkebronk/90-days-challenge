'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MDXPreview } from '@/components/mdx-preview'
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
  ChevronDown,
  Sparkles,
  MessageSquare,
  HelpCircle,
  Clock,
  Info,
  Apple,
  Smartphone,
  Bell,
  Droplets,
  Footprints
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
  const [onboardingGuideContent, setOnboardingGuideContent] = useState<string>('')
  const [isGettingStartedOpen, setIsGettingStartedOpen] = useState(false)
  const [isDailyGoalsOpen, setIsDailyGoalsOpen] = useState(false)
  const [isWaterTipsOpen, setIsWaterTipsOpen] = useState(false)
  const [isStepTipsOpen, setIsStepTipsOpen] = useState(false)
  const [userWeight, setUserWeight] = useState<string>('')
  const [weightInput, setWeightInput] = useState<string>('')
  const [hasCalculated, setHasCalculated] = useState(false)
  const [stepGoal, setStepGoal] = useState<string>('')
  const [stepInput, setStepInput] = useState<string>('')
  const [hasStepGoal, setHasStepGoal] = useState(false)
  const isCoach = session?.user && (session.user as any).role?.toUpperCase() === 'COACH'

  // Load weight and step goal from localStorage on mount
  useEffect(() => {
    const savedWeight = localStorage.getItem('userWeight')
    if (savedWeight) {
      setUserWeight(savedWeight)
      setHasCalculated(true)
    }
    const savedStepGoal = localStorage.getItem('stepGoal')
    if (savedStepGoal) {
      setStepGoal(savedStepGoal)
      setHasStepGoal(true)
    }
  }, [])

  // Calculate water intake
  const weightNum = parseFloat(userWeight)
  const waterLiters = weightNum > 0 && hasCalculated ? (weightNum / 23).toFixed(1) : null

  // Save weight and calculate
  const handleCalculate = () => {
    if (weightInput && parseFloat(weightInput) > 0) {
      setUserWeight(weightInput)
      setHasCalculated(true)
      localStorage.setItem('userWeight', weightInput)
    }
  }

  // Reset to input mode
  const handleResetWeight = () => {
    setWeightInput(userWeight)
    setHasCalculated(false)
  }

  // Save step goal
  const handleSaveStepGoal = () => {
    if (stepInput && parseInt(stepInput) > 0) {
      setStepGoal(stepInput)
      setHasStepGoal(true)
      localStorage.setItem('stepGoal', stepInput)
    }
  }

  // Reset step goal to input mode
  const handleResetStepGoal = () => {
    setStepInput(stepGoal)
    setHasStepGoal(false)
  }

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
    fetchOnboardingGuide()
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

  const fetchOnboardingGuide = async () => {
    try {
      const response = await fetch('/api/guide-content?type=onboarding')
      if (response.ok) {
        const data = await response.json()
        setOnboardingGuideContent(data.guide.content)
      }
    } catch (error) {
      console.error('Error fetching onboarding guide:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
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
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
            Dashboard
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
            Översikt över din coaching-verksamhet
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 text-sm font-medium">Aktiva Klienter</span>
              <Users className="h-5 w-5 text-gold-primary" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.clients}</div>
            <p className="text-xs text-gray-500 mt-1">klienter</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 text-sm font-medium">Nya Leads</span>
              <UserPlus className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.leads}</div>
            <p className="text-xs text-gray-500 mt-1">denna vecka</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 text-sm font-medium">Check-ins</span>
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.checkIns}</div>
            <p className="text-xs text-gray-500 mt-1">inväntar granskning</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg transition-all">
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
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
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
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
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
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
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
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
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
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
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
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-primary hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
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
        <div className="bg-white border border-gray-200 rounded-xl">
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
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Välkommen {session?.user?.name?.split(' ')[0] || 'Champion'}!
        </h1>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Quick Tips Section - Collapsible */}
      <div className="bg-white border border-gray-200 rounded-xl max-w-6xl mx-auto">
        <button
          onClick={() => setIsGettingStartedOpen(!isGettingStartedOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
        >
          <h2 className="text-base font-semibold text-gray-900">Kom igång</h2>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isGettingStartedOpen ? 'rotate-180' : ''}`} />
        </button>
        {isGettingStartedOpen && (
        <div className="p-6 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Installera som app och aktivera notiser */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-start gap-3 group cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-green-600 transition-colors">Installera app & notiser</h4>
                    <p className="text-gray-600 text-xs">Få app-upplevelsen</p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border border-gold-primary/30 max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-gray-200 flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-green-400" />
                    Installera app & aktivera notiser
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 text-gray-300">
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                      <Apple className="w-5 h-5" />
                      iPhone (Safari)
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">1.</span>
                        Öppna denna sida i Safari
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">2.</span>
                        Tryck på dela-ikonen (fyrkant med pil uppåt)
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">3.</span>
                        Scrolla ner och tryck &quot;Lägg till på hemskärmen&quot;
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">4.</span>
                        Tryck &quot;Lägg till&quot;
                      </li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                      <Smartphone className="w-5 h-5" />
                      Android (Chrome)
                    </h3>
                    <ol className="space-y-2 text-sm">
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">1.</span>
                        Öppna denna sida i Chrome
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">2.</span>
                        Tryck på menyn (tre prickar uppe till höger)
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">3.</span>
                        Tryck &quot;Lägg till på startskärmen&quot; eller &quot;Installera app&quot;
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">4.</span>
                        Tryck &quot;Lägg till&quot;
                      </li>
                    </ol>
                  </div>
                  <div className="border-t border-gray-700 pt-4">
                    <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                      <Bell className="w-5 h-5" />
                      Aktivera push-notiser
                    </h3>
                    <p className="text-sm mb-3">
                      För att få notiser när din coach skriver till dig:
                    </p>
                    <ol className="space-y-2 text-sm">
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">1.</span>
                        Gå till <span className="text-green-400">Profil</span> i menyn
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">2.</span>
                        Scrolla ner till &quot;Push-notiser&quot;
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400 font-bold">3.</span>
                        Tryck &quot;Aktivera notiser&quot;
                      </li>
                    </ol>
                  </div>
                  <p className="text-xs text-gray-500 border-t border-gray-700 pt-4">
                    Efter installation öppnas appen i helskärm och du förblir inloggad!
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            {/* 2. Läs introduktionen */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-start gap-3 group cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-gold-primary transition-colors">Läs introduktionen</h4>
                    <p className="text-gray-600 text-xs">Viktigt - börja här!</p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border border-gold-primary/30 max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-gray-200 flex items-center gap-2">
                    <Info className="w-6 h-6 text-blue-400" />
                    Kom Igång Guide
                  </DialogTitle>
                </DialogHeader>
                {onboardingGuideContent ? (
                  <MDXPreview content={onboardingGuideContent} theme="dark" />
                ) : (
                  <p className="text-gray-400">Laddar guide...</p>
                )}
              </DialogContent>
            </Dialog>

            {/* 3. Start check-in */}
            <Link href="/dashboard/check-in" className="flex items-start gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">Gör din start-check in</h4>
                <p className="text-gray-600 text-xs">Dokumentera din startvikt och mål</p>
              </div>
            </Link>

            {/* 4. Kunskapsbanken */}
            <Link href="/dashboard/articles" className="flex items-start gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-purple-600 transition-colors">Utforska kunskapsbanken</h4>
                <p className="text-gray-600 text-xs">Lär dig grunderna för framgång</p>
              </div>
            </Link>

            {/* 5. Dina planer */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">5</span>
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
        )}
      </div>

      {/* Daily Goals Widget - Collapsible Card */}
      <div className="bg-white border border-gray-200 rounded-xl max-w-6xl mx-auto">
        <button
          onClick={() => setIsDailyGoalsOpen(!isDailyGoalsOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
        >
          <h2 className="text-base font-semibold text-gray-900">Dagliga mål</h2>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isDailyGoalsOpen ? 'rotate-180' : ''}`} />
        </button>
        {isDailyGoalsOpen && (
        <div className="p-4 sm:p-5 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Water Section */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Vatten</h3>
                  {waterLiters ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{waterLiters} liter</p>
                      <button
                        onClick={handleResetWeight}
                        className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        Ändra
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Vikt"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value.replace(/[^0-9]/g, ''))}
                        onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                        className="w-16 sm:w-20 px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      />
                      <span className="text-gray-600 text-sm">kg</span>
                      <button
                        onClick={handleCalculate}
                        className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        Beräkna
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-2">
                Läs mer om <Link href="/dashboard/articles/cmhsa0czw000uqf0qke1b3quq" className="text-blue-500 hover:text-blue-700 underline">vatten</Link> i kunskapsbanken
              </p>

              <button
                onClick={() => setIsWaterTipsOpen(!isWaterTipsOpen)}
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span className="font-medium">Tips för att nå ditt mål</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isWaterTipsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isWaterTipsOpen && (
                <div className="mt-3 p-3 bg-white/70 rounded-lg border border-blue-100">
                  <p className="font-semibold text-gray-800 mb-2 text-sm">Ett smart knep - Drick på detta sätt så når du enkelt ditt mål:</p>

                  <div className="space-y-2 text-xs text-gray-700">
                    <div>
                      <p className="font-medium text-blue-700">På morgonen:</p>
                      <p className="ml-3">• Direkt när du vaknar: 1 stort glas vatten (2-3 dl)</p>
                    </div>

                    <div>
                      <p className="font-medium text-blue-700">I samband med måltider:</p>
                      <p className="ml-3">• Vid varje måltid (4-5 st/dag): 2-3 dl vatten</p>
                    </div>

                    <div className="pt-2 border-t border-blue-100">
                      <p className="text-blue-800">
                        <strong>Resultat:</strong> Du kommer upp i ca 1.5 liter bara genom detta!
                        Lägg till vatten före/under/efter träning så är du i mål.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Steps Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Footprints className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Steg</h3>
                  {hasStepGoal ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{parseInt(stepGoal).toLocaleString('sv-SE')} steg</p>
                      <button
                        onClick={handleResetStepGoal}
                        className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        Ändra
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Mål"
                        value={stepInput}
                        onChange={(e) => setStepInput(e.target.value.replace(/[^0-9]/g, ''))}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveStepGoal()}
                        className="w-20 sm:w-24 px-2 py-1 text-sm border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                      />
                      <span className="text-gray-600 text-sm">steg</span>
                      <button
                        onClick={handleSaveStepGoal}
                        className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        Spara
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-2">
                Läs mer om <Link href="/dashboard/articles/cmij19vz00001k30qmlodc7k0" className="text-green-500 hover:text-green-700 underline">daglig aktivitetsnivå (steg)</Link> i kunskapsbanken
              </p>

              <button
                onClick={() => setIsStepTipsOpen(!isStepTipsOpen)}
                className="flex items-center gap-2 text-xs text-green-600 hover:text-green-800 transition-colors"
              >
                <span className="font-medium">Tips för att lyckas med ditt stegmål</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isStepTipsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStepTipsOpen && (
                <div className="mt-3 p-3 bg-white/70 rounded-lg border border-green-100">
                  <p className="font-semibold text-gray-800 mb-2 text-sm">Tips för att lyckas med ditt stegmål:</p>

                  <div className="space-y-2 text-xs text-gray-700">
                    <p>• Spåra dina steg via Apple Watch, Fitbit eller liknande. Du kan använda telefonen, men den är ofta opålitlig och måste alltid vara på dig.</p>
                    <p>• Välj en mer aktiv väg i vardagen – gå av bussen en hållplats tidigare eller ta trapporna istället för hissen.</p>
                    <p>• Stå upp och rör dig lite mellan seten på gymmet. Det är ett underskattat sätt att samla extra steg.</p>
                    <p>• Ta 10 minuters promenader efter måltider. Det hjälper dig samla steg, motverkar trötthet efter maten och underlättar matsmältningen.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">

        {/* Check-in Card */}
        <Link href="/dashboard/check-in">
          <div className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">Check-in</h3>
            <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5 hidden sm:block">Veckocheckning</p>
          </div>
        </Link>

        {/* Progress Card */}
        <Link href="/dashboard/progress">
          <div className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md">
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">Framsteg</h3>
            <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5 hidden sm:block">Din utveckling</p>
          </div>
        </Link>

        {/* Kostschema Card */}
        <Link href="/dashboard/meal-plan">
          <div className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md">
              <Utensils className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">Kostschema</h3>
            <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5 hidden sm:block">Måltidsplan</p>
          </div>
        </Link>

        {/* Träningsprogram Card */}
        <Link href="/dashboard/workout">
          <div className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md">
              <Dumbbell className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">Träning</h3>
            <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5 hidden sm:block">Träningsprogram</p>
          </div>
        </Link>

        {/* Kunskapsbanken Card */}
        <Link href="/dashboard/articles">
          <div className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">Kunskap</h3>
            <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5 hidden sm:block">Artiklar & guider</p>
          </div>
        </Link>

        {/* Recept Card */}
        <Link href="/dashboard/recipes">
          <div className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md">
              <ChefHat className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">Recept</h3>
            <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5 hidden sm:block">Matinspiration</p>
          </div>
        </Link>

        {/* Livsmedelbanken Card */}
        <Link href="/dashboard/content/food-items">
          <div className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md">
              <Apple className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">Livsmedel</h3>
            <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5 hidden sm:block">Näringsinnehåll</p>
          </div>
        </Link>

        {/* Meddelanden Card */}
        <Link href="/dashboard/messages">
          <div className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md">
              <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">Meddelanden</h3>
            <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5 hidden sm:block">Kontakta coach</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
