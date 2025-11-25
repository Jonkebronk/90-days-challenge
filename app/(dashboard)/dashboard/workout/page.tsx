'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Dumbbell, Calendar, Play, Coffee, ChevronRight, History, Trophy, Plus, Info, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { MDXPreview } from '@/components/mdx-preview'

interface WorkoutDay {
  id: string
  dayNumber: number
  name: string
  description: string | null
  isRestDay: boolean
  orderIndex: number
  exercises: WorkoutExercise[]
}

interface WorkoutExercise {
  id: string
  sets: number
  repsMin: number | null
  repsMax: number | null
  exercise: {
    id: string
    name: string
    muscleGroups: string[]
  }
}

interface WorkoutWeek {
  id: string
  weekNumber: number
  title: string | null
  description: string | null
  days: WorkoutDay[]
}

interface AssignedWorkout {
  id: string
  startDate: string
  currentWeek: number
  currentDayNumber: number
  workoutProgram: {
    id: string
    name: string
    description: string | null
    difficulty: string | null
    durationWeeks: number | null
    weeks?: WorkoutWeek[]
    days: WorkoutDay[]
  }
}

export default function WorkoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [assignment, setAssignment] = useState<AssignedWorkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set()) // All days closed by default
  const [workoutGuideContent, setWorkoutGuideContent] = useState<string>('')
  const [incompleteSessions, setIncompleteSessions] = useState<Record<string, boolean>>({}) // dayId -> has incomplete session

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dayId)) {
        newSet.delete(dayId)
      } else {
        newSet.add(dayId)
      }
      return newSet
    })
  }

  useEffect(() => {
    if (session?.user) {
      fetchAssignment()
      fetchWorkoutGuide()
      fetchIncompleteSessions()
    } else if (session === null) {
      // Session loaded but no user, stop loading
      setLoading(false)
    }
  }, [session])

  const fetchAssignment = async () => {
    try {
      const userId = (session?.user as any)?.id
      if (!userId) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/clients/${userId}/workout`)
      if (response.ok) {
        const data = await response.json()
        setAssignment(data.assignment)
      }
    } catch (error) {
      console.error('Error fetching workout:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkoutGuide = async () => {
    try {
      const response = await fetch('/api/guide-content?type=workout')
      if (response.ok) {
        const data = await response.json()
        setWorkoutGuideContent(data.guide.content)
      }
    } catch (error) {
      console.error('Error fetching workout guide:', error)
    }
  }

  const fetchIncompleteSessions = async () => {
    try {
      const response = await fetch('/api/workout-sessions?status=incomplete&limit=50')
      if (response.ok) {
        const data = await response.json()
        const incomplete: Record<string, boolean> = {}
        for (const session of data.sessions || []) {
          if (session.workoutProgramDayId) {
            incomplete[session.workoutProgramDayId] = true
          }
        }
        setIncompleteSessions(incomplete)
      }
    } catch (error) {
      console.error('Error fetching incomplete sessions:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border border-gray-200 rounded-xl">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
            TRÄNINGSPROGRAM
          </h1>
          <p className="text-gray-600 mt-2">
            Ditt personliga träningsprogram
          </p>
        </div>

        <Card className="bg-white border border-gray-200 hover:border-gold-primary hover:shadow-lg transition-all">
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-16 h-16 text-gold-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Inget träningsprogram tilldelat
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Din coach har inte tilldelat ett träningsprogram till dig ännu. Kontakta din coach för att få ett program.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { workoutProgram } = assignment

  // Determine which days to show based on program structure
  const currentWeek = assignment.currentWeek || 1
  const programHasWeeks = workoutProgram.weeks && workoutProgram.weeks.length > 0
  const currentWeekData = programHasWeeks
    ? workoutProgram.weeks?.find((w: any) => w.weekNumber === currentWeek)
    : null
  const daysToShow = programHasWeeks && currentWeekData
    ? currentWeekData.days
    : workoutProgram.days

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border border-gray-200 rounded-xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
          {workoutProgram.name.toUpperCase()}
        </h1>
        {programHasWeeks && currentWeekData && (
          <p className="text-purple-600 font-semibold mt-2">
            {currentWeekData.title || `Vecka ${currentWeek}`}
            {currentWeekData.description && ` - ${currentWeekData.description}`}
          </p>
        )}
        {workoutProgram.description && (
          <p className="text-gray-600 mt-2">
            {workoutProgram.description}
          </p>
        )}

        {/* Introduction Button */}
        <div className="mt-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-bold hover:shadow-lg transition-all animate-pulse hover:animate-none"
              >
                <Info className="w-4 h-4 mr-2" />
                Introduktion till träningsprogram
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-gold-primary/30 max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-gray-200 flex items-center gap-2">
                  <Info className="w-6 h-6 text-blue-400" />
                  Träningsprogram Guide
                </DialogTitle>
              </DialogHeader>
              {workoutGuideContent ? (
                <MDXPreview content={workoutGuideContent} theme="dark" />
              ) : (
                <p className="text-gray-400">Laddar guide...</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Link href="/dashboard/workout/records">
          <Button className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gold-primary/10 hover:border-gold-primary transition-all">
            <Trophy className="w-4 h-4 mr-2" />
            Personbästa
          </Button>
        </Link>
        <Link href="/dashboard/workout/history">
          <Button className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gold-primary/10 hover:border-gold-primary transition-all">
            <History className="w-4 h-4 mr-2" />
            Historik
          </Button>
        </Link>
      </div>

      {/* Days List */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-gold-primary" />
          {programHasWeeks ? 'Denna veckans schema' : 'Träningsschema'}
        </h2>

        {daysToShow.map((day) => {
          const isExpanded = expandedDays.has(day.id)
          return (
          <Card
            key={day.id}
            className={`group relative bg-white/5 border-2 transition-all duration-300 cursor-pointer backdrop-blur-[10px] overflow-hidden ${
              day.isRestDay
                ? 'border-gray-400/30 hover:border-gray-400/50 hover:bg-white/10'
                : 'border-gold-primary/20 hover:border-gold-primary/60 hover:bg-white/10'
            }`}
          >
            {/* Gradient Overlay */}
            <div
              className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity ${
                day.isRestDay ? '' : 'bg-gradient-to-br from-gold-primary/30 to-transparent'
              }`}
            />

            <CardHeader
              className="relative cursor-pointer transition-all duration-200 px-3 sm:px-6"
              onClick={() => toggleDay(day.id)}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Day Number Icon Container */}
                <div className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl shadow-lg group-hover:scale-110 transition-transform ${
                  day.isRestDay
                    ? 'bg-gray-400/20 text-gray-400'
                    : 'bg-gold-primary/20 text-gold-primary'
                }`}>
                  {day.dayNumber}
                </div>

                {/* Day Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Dag {day.dayNumber}
                    </span>
                    {day.isRestDay && (
                      <Badge variant="outline" className="bg-gray-400/10 border-gray-400/30 text-gray-400 text-xs">
                        <Coffee className="w-3 h-3 mr-1" />
                        Vilodag
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base sm:text-xl font-bold text-gold-light tracking-[1px] pr-2">
                    {day.name}
                  </CardTitle>
                  {day.description && (
                    <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2 pr-2">
                      {day.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                {!day.isRestDay && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Link href={`/dashboard/workout/session/${day.id}`}>
                        {incompleteSessions[day.id] ? (
                          <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all text-sm py-2 px-3 animate-pulse hover:animate-none">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white shadow-lg hover:shadow-xl transition-all text-sm py-2 px-3">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                      </Link>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-gold-primary/10 transition-colors flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gold-primary" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gold-primary" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>

            {isExpanded && !day.isRestDay && day.exercises && day.exercises.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-3 font-semibold">
                    {day.exercises.length} övningar
                  </p>
                  <div className="space-y-2">
                    {day.exercises.map((ex, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{ex.exercise.name}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {ex.sets} set × {ex.repsMin}{ex.repsMax && ex.repsMax !== ex.repsMin ? `-${ex.repsMax}` : ''} reps
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
          )
        })}
      </div>

      {daysToShow.length === 0 && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">
              {programHasWeeks
                ? `Det finns inga dagar för vecka ${currentWeek} än.`
                : 'Det finns inga dagar i detta träningsprogram än.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
