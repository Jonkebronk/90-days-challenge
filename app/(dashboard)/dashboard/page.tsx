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
  Footprints,
  CheckCircle2,
  X,
  Scale,
  Moon,
  Brain
} from 'lucide-react'
import { Input } from '@/components/ui/input'

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

  // Habits state
  const [isHabitsOpen, setIsHabitsOpen] = useState(false)

  // Calendar state
  const [workoutProgram, setWorkoutProgram] = useState<any>(null)
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([])
  const [checkIns, setCheckIns] = useState<any[]>([])

  // Daily weight modal state
  const [weightModalOpen, setWeightModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dailyWeightInput, setDailyWeightInput] = useState('')
  const [dailyWeights, setDailyWeights] = useState<Record<string, number>>({})
  const [savingWeight, setSavingWeight] = useState(false)

  // Get started section visibility
  const [hideGetStarted, setHideGetStarted] = useState(false)

  const isCoach = session?.user && (session.user as any).role?.toUpperCase() === 'COACH'
  const userId = (session?.user as any)?.id

  // Load weight, step goal, and getStarted visibility from localStorage on mount
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
    const hiddenGetStarted = localStorage.getItem('hideGetStarted') === 'true'
    setHideGetStarted(hiddenGetStarted)
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

  // Hide "Get Started" section manually
  const handleHideGetStarted = () => {
    setHideGetStarted(true)
    localStorage.setItem('hideGetStarted', 'true')
  }

  // Determine if "Get Started" section should be shown (only manual hide)
  const showGetStarted = !hideGetStarted

  // Calendar helper functions
  const WEEKDAY_NAMES = ['M', 'T', 'O', 'T', 'F', 'L', 'S']
  const WEEKDAY_FULL = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
  const MONTH_NAMES = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

  const getWeekDays = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      days.push(date)
    }
    return days
  }

  const formatDateSwedish = (date: Date) => {
    const weekday = WEEKDAY_FULL[date.getDay() === 0 ? 6 : date.getDay() - 1]
    const day = date.getDate()
    const month = MONTH_NAMES[date.getMonth()]
    return `${weekday.toLowerCase()} ${day} ${month}`
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  // Calculate program day, week, and phase from start date
  const getProgramInfo = () => {
    if (!workoutProgram?.startDate) return null

    const startDate = new Date(workoutProgram.startDate)
    const today = new Date()
    const diffTime = today.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const programDay = diffDays + 1

    if (programDay < 1 || programDay > 90) return null

    const phase = programDay <= 28 ? 1 : programDay <= 56 ? 2 : 3
    const week = Math.ceil(programDay / 7)

    return { programDay, phase, week, startDate }
  }

  // Get training days for current week based on program
  const getTrainingDaysForWeek = () => {
    if (!workoutProgram?.workoutProgram?.days) return []
    return workoutProgram.workoutProgram.days
      .filter((day: any) => !day.isRestDay && day.weekday !== null)
      .map((day: any) => day.weekday)
  }

  // Check if a day has a completed workout
  const hasCompletedWorkout = (date: Date) => {
    return workoutSessions.some((session: any) => {
      if (!session.startedAt || !session.completed) return false
      const sessionDate = new Date(session.startedAt)
      return isSameDay(sessionDate, date)
    })
  }

  // Check if a day has a check-in
  const hasCheckIn = (date: Date) => {
    return checkIns.some((checkIn: any) => {
      const checkInDate = new Date(checkIn.createdAt)
      return isSameDay(checkInDate, date)
    })
  }

  const weekDays = getWeekDays()
  const programInfo = getProgramInfo()
  const trainingDays = getTrainingDaysForWeek()

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
    } else if (userId) {
      fetchClientCalendarData()
    }
    fetchOnboardingGuide()
  }, [isCoach, userId])

  // Fetch workout program and sessions for client calendar
  const fetchClientCalendarData = async () => {
    try {
      // Fetch assigned workout program
      const programRes = await fetch(`/api/clients/${userId}/workout`)
      if (programRes.ok) {
        const data = await programRes.json()
        setWorkoutProgram(data.assignment)
      }

      // Fetch workout sessions
      const sessionsRes = await fetch('/api/workout-sessions?limit=100')
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setWorkoutSessions(data.sessions || [])
      }

      // Fetch check-ins
      const checkInsRes = await fetch(`/api/check-in?userId=${userId}`)
      if (checkInsRes.ok) {
        const data = await checkInsRes.json()
        setCheckIns(data.checkIns || [])
      }

      // Fetch daily weights for current week
      const today = new Date()
      const startOfWeek = new Date(today)
      const dayOfWeek = today.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startOfWeek.setDate(today.getDate() - diff)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const weightsRes = await fetch(
        `/api/daily-weight?startDate=${startOfWeek.toISOString().split('T')[0]}&endDate=${endOfWeek.toISOString().split('T')[0]}`
      )
      if (weightsRes.ok) {
        const data = await weightsRes.json()
        const weightsMap: Record<string, number> = {}
        data.weights?.forEach((w: any) => {
          weightsMap[w.date] = w.weight
        })
        setDailyWeights(weightsMap)
      }

    } catch (error) {
      console.error('Error fetching calendar data:', error)
    }
  }

  // Save daily weight
  const handleSaveDailyWeight = async () => {
    if (!selectedDate || !dailyWeightInput) return

    setSavingWeight(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const response = await fetch('/api/daily-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          weight: parseFloat(dailyWeightInput)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDailyWeights(prev => ({
          ...prev,
          [data.weight.date]: data.weight.weight
        }))
        setWeightModalOpen(false)
        setDailyWeightInput('')
        setSelectedDate(null)
      }
    } catch (error) {
      console.error('Error saving daily weight:', error)
    } finally {
      setSavingWeight(false)
    }
  }

  // Open weight modal for a specific date
  const openWeightModal = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    setSelectedDate(date)
    setDailyWeightInput(dailyWeights[dateStr]?.toString() || '')
    setWeightModalOpen(true)
  }

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
          Hej {session?.user?.name?.split(' ')[0] || 'Champion'}!
        </h1>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Week Calendar Widget */}
      <div className="max-w-6xl mx-auto">
        {/* Header with Day Counter and Phase Info - Outside card */}
        <div className="flex items-center justify-between mb-3 px-1">
          {/* Left: Current Date */}
          <p className="text-gray-400 font-medium capitalize text-sm">
            {formatDateSwedish(new Date())}
          </p>

          {/* Right: Day Counter */}
          {programInfo && (
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-bold text-gray-200">Dag {programInfo.programDay}</span>
                <span className="text-xs sm:text-sm text-gray-500">av 90</span>
              </div>
              <span className={`text-xs font-medium ${
                programInfo.phase === 1 ? 'text-green-500' :
                programInfo.phase === 2 ? 'text-blue-500' :
                'text-amber-500'
              }`}>
                Fas {programInfo.phase} ({programInfo.phase === 1 ? 'dag 1-28' : programInfo.phase === 2 ? 'dag 29-56' : 'dag 57-90'})
              </span>
            </div>
          )}
        </div>

        {/* Week Calendar Grid - Inside card */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date, index) => {
            const isToday = isSameDay(date, new Date())
            const weekdayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1 // Convert to 0=Mon
            const isTrainingDay = trainingDays.includes(weekdayIndex)
            const isSunday = weekdayIndex === 6
            const completedWorkout = hasCompletedWorkout(date)
            const completedCheckIn = hasCheckIn(date)
            const dateStr = date.toISOString().split('T')[0]
            const hasWeight = dailyWeights[dateStr] !== undefined

            return (
              <button
                key={index}
                onClick={() => openWeightModal(date)}
                className={`flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all cursor-pointer ${
                  isToday
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-50 hover:bg-gray-100'
                } hover:scale-105`}
              >
                <span className={`text-xs font-medium mb-1 ${isToday ? 'text-gray-300' : 'text-gray-500'}`}>
                  {WEEKDAY_NAMES[index]}
                </span>
                <span className={`text-lg sm:text-xl font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}>
                  {date.getDate()}
                </span>

                {/* Indicators */}
                <div className="flex gap-1 mt-1 h-4">
                  {hasWeight && (
                    <Scale className={`w-4 h-4 ${isToday ? 'text-purple-300' : 'text-purple-500'}`} />
                  )}
                  {isTrainingDay && (
                    completedWorkout ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Dumbbell className={`w-4 h-4 ${isToday ? 'text-amber-400' : 'text-amber-500'}`} />
                    )
                  )}
                  {isSunday && (
                    completedCheckIn ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Calendar className={`w-4 h-4 ${isToday ? 'text-blue-300' : 'text-blue-500'}`} />
                    )
                  )}
                </div>
              </button>
            )
          })}
        </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Scale className="w-3 h-3 text-purple-500" />
              <span>Vikt</span>
            </div>
            <div className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3 text-amber-500" />
              <span>Träning</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" />
              <span>Check-in</span>
            </div>
          </div>

          {/* Tip text */}
          <p className="text-xs text-gray-400 mt-3 text-center">
            Tryck på en dag för att registrera din vikt
          </p>

          {/* Link to knowledge base */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Läs mer om <Link href="/dashboard/articles/category/mat-dina-resultat" className="text-purple-500 hover:text-purple-700 underline">hur vi mäter dina resultat</Link> i kunskapsbanken
          </p>
        </div>
      </div>

      {/* Daily Weight Modal */}
      <Dialog open={weightModalOpen} onOpenChange={setWeightModalOpen}>
        <DialogContent className="sm:max-w-[340px] bg-white" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-500" />
              Registrera vikt
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-600">
              {selectedDate && selectedDate.toLocaleDateString('sv-SE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Vikt (kg)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="75.5"
                value={dailyWeightInput}
                onChange={(e) => setDailyWeightInput(e.target.value)}
                autoFocus={false}
                className="bg-gray-50 border-gray-200 text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setWeightModalOpen(false)}
                className="flex-1 border-gray-200 text-gray-700"
              >
                Avbryt
              </Button>
              <Button
                onClick={handleSaveDailyWeight}
                disabled={!dailyWeightInput || savingWeight}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {savingWeight ? 'Sparar...' : 'Spara'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Tips Section - Collapsible (hidden when user is active) */}
      {showGetStarted && (
      <div className="bg-white border border-gray-200 rounded-xl max-w-6xl mx-auto">
        <div className="flex items-center">
          <button
            onClick={() => setIsGettingStartedOpen(!isGettingStartedOpen)}
            className="flex-1 p-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-l-xl"
          >
            <h2 className="text-base font-semibold text-gray-900">Kom igång</h2>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isGettingStartedOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={handleHideGetStarted}
            className="p-4 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors rounded-r-xl"
            title="Dölj permanent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
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
      )}

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

      {/* Vanor Widget - Collapsible Card */}
      <div className="bg-white border border-gray-200 rounded-xl max-w-6xl mx-auto">
        <button
          onClick={() => setIsHabitsOpen(!isHabitsOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
        >
          <h2 className="text-base font-semibold text-gray-900">Vanor</h2>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isHabitsOpen ? 'rotate-180' : ''}`} />
        </button>
        {isHabitsOpen && (
        <div className="p-4 sm:p-5 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meal Prep Section */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Meal Prep</h3>
                  <p className="text-sm text-gray-700">Förbered mat för veckan</p>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                Läs mer om <Link href="/dashboard/articles/cmhv5hzfo0002mj0qzja6ns04" className="text-amber-500 hover:text-amber-700 underline">meal prep</Link> i kunskapsbanken
              </p>
            </div>

            {/* Sleep Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Sömn</h3>
                  <p className="text-sm text-gray-700">Skapa en kvällsrutin</p>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                Läs mer om <span className="text-indigo-500">sömn</span> i kunskapsbanken
              </p>
            </div>

            {/* Stress Section */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Stress</h3>
                  <p className="text-sm text-gray-700">Hitta sätt för ditt sinne och din kropp att hantera stress</p>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                Läs mer om <span className="text-teal-500">stress</span> i kunskapsbanken
              </p>
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
