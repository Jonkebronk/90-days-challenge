'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Dumbbell, Calendar, Play, Coffee, ChevronRight, History, Trophy, Plus, Info, ChevronUp, ChevronDown, RotateCcw, Flame, X } from 'lucide-react'
import Link from 'next/link'
import { MDXPreview } from '@/components/mdx-preview'
import { VideoPlayer } from '@/components/ui/video-player'

// Helper to render text with markdown links [text](url)
function renderTextWithLinks(text: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: (string | React.ReactElement)[] = []
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    // Add the link
    parts.push(
      <Link
        key={match.index}
        href={match[2]}
        className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
      >
        {match[1]}
      </Link>
    )
    lastIndex = match.index + match[0].length
  }
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts.length > 0 ? parts : text
}

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
  reps: string | null
  supersetGroupId: string | null
  exercise: {
    id: string
    name: string
    muscleGroups: string[]
    videoUrl: string | null
  }
}

interface WorkoutWeek {
  id: string
  weekNumber: number
  title: string | null
  description: string | null
  days: WorkoutDay[]
}

interface WarmupExercise {
  id: string
  orderIndex: number
  name: string
  reps: string | null
  videoUrl: string | null
}

interface WarmupRoutine {
  id: string
  name: string
  introText: string | null
  outroText: string | null
  exercises: WarmupExercise[]
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
    warmupRoutine?: WarmupRoutine | null
  }
}

export default function WorkoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [assignment, setAssignment] = useState<AssignedWorkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set()) // All days closed by default
  const [warmupExpanded, setWarmupExpanded] = useState(false)
  const [activeWarmupVideo, setActiveWarmupVideo] = useState<string | null>(null) // Track which warmup video is playing
  const [activeExerciseVideo, setActiveExerciseVideo] = useState<string | null>(null) // Track which exercise video is playing
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
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
            Träningsprogram
          </h1>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
        </div>

        <Card className="bg-white border border-gray-200 hover:border-gold-primary hover:shadow-lg transition-all">
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-16 h-16 text-gold-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Inget träningsprogram tilldelat
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Inget träningsprogram har tilldelats ännu.
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
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          {workoutProgram.name}
        </h1>
        {programHasWeeks && currentWeekData && (
          <p className="text-purple-400 font-semibold text-sm sm:text-base">
            {currentWeekData.title || `Vecka ${currentWeek}`}
            {currentWeekData.description && ` - ${currentWeekData.description}`}
          </p>
        )}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2 justify-center">
        {/* Program-specific info button */}
        {workoutProgram.description && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gold-primary/10 hover:border-gold-primary transition-all">
                <Dumbbell className="w-4 h-4 mr-2" />
                Om programmet
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-gold-primary/30 max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-gray-200 flex items-center gap-2">
                  <Dumbbell className="w-6 h-6 text-gold-primary" />
                  {workoutProgram.name}
                </DialogTitle>
              </DialogHeader>
              <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                {workoutProgram.description}
              </div>
            </DialogContent>
          </Dialog>
        )}
        {/* General workout guide button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gold-primary/10 hover:border-gold-primary transition-all">
              <Info className="w-4 h-4 mr-2" />
              Introduktion Träning
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

        {/* Warmup Card - shown first if program has warmup */}
        {workoutProgram.warmupRoutine && (
          <Card
            className="group relative bg-white border-2 border-orange-300 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:border-orange-500"
          >
            <CardHeader
              className="relative cursor-pointer transition-all duration-200 px-3 sm:px-6"
              onClick={() => setWarmupExpanded(!warmupExpanded)}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Warmup Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">
                      UPPVÄRMNING
                    </span>
                  </div>
                  <CardTitle className="text-lg sm:text-2xl font-bold text-gray-900 tracking-[1px] pr-2">
                    {workoutProgram.warmupRoutine.name}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Gör detta innan ditt pass
                  </p>
                </div>

                {/* Expand Button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="p-2 rounded-lg hover:bg-orange-100 transition-colors flex-shrink-0">
                    {warmupExpanded ? (
                      <ChevronUp className="w-5 h-5 text-orange-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-orange-500" />
                    )}
                  </button>
                </div>
              </div>
            </CardHeader>

            {warmupExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Intro text */}
                  {workoutProgram.warmupRoutine.introText && (
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {renderTextWithLinks(workoutProgram.warmupRoutine.introText)}
                    </div>
                  )}

                  {/* Exercise list */}
                  {workoutProgram.warmupRoutine.exercises.length > 0 && (
                    <div className="space-y-2 my-3">
                      {workoutProgram.warmupRoutine.exercises.map((exercise, idx) => (
                        <div
                          key={exercise.id}
                          className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                        >
                          <div className="flex items-center gap-3 p-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{exercise.name}</p>
                              {exercise.reps && (
                                <p className="text-sm text-gray-600">{exercise.reps}</p>
                              )}
                            </div>
                            {exercise.videoUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveWarmupVideo(activeWarmupVideo === exercise.id ? null : exercise.id)
                                }}
                                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                  activeWarmupVideo === exercise.id
                                    ? 'bg-red-600 border border-red-700 text-white'
                                    : 'bg-red-600 border border-red-700 text-white hover:bg-red-700'
                                }`}
                              >
                                {activeWarmupVideo === exercise.id ? (
                                  <>
                                    <X className="w-3 h-3" />
                                    STÄNG
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 fill-white" />
                                    VIDEO
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          {/* Inline video player */}
                          {activeWarmupVideo === exercise.id && exercise.videoUrl && (
                            <div className="px-3 pb-3">
                              <VideoPlayer
                                videoUrl={exercise.videoUrl}
                                title={exercise.name}
                                className="w-full rounded-lg overflow-hidden"
                                autoPlay={true}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Outro text */}
                  {workoutProgram.warmupRoutine.outroText && (
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {renderTextWithLinks(workoutProgram.warmupRoutine.outroText)}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {daysToShow.map((day) => {
          const isExpanded = expandedDays.has(day.id)
          return (
          <Card
            key={day.id}
            className={`group relative bg-white border-2 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm ${
              day.isRestDay
                ? 'border-gray-300 hover:border-gray-400'
                : 'border-gray-300 hover:border-gold-primary'
            }`}
          >

            <CardHeader
              className="relative cursor-pointer transition-all duration-200 px-3 sm:px-6"
              onClick={() => toggleDay(day.id)}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Day Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {day.isRestDay && (
                      <Badge variant="outline" className="bg-gray-100 border-gray-300 text-gray-500 text-xs">
                        <Coffee className="w-3 h-3 mr-1" />
                        Vilodag
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg sm:text-2xl font-bold text-gray-900 tracking-[1px] pr-2">
                    {day.name}
                  </CardTitle>
                  {day.description && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2 pr-2">
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
                    {day.exercises.map((ex, idx) => {
                      const videoKey = `${day.id}-${ex.id}`

                      // Check if this exercise is part of a superset
                      const isSuperset = !!ex.supersetGroupId
                      const supersetExercises = isSuperset
                        ? day.exercises.filter(e => e.supersetGroupId === ex.supersetGroupId)
                        : []
                      const isFirstInSuperset = isSuperset && supersetExercises[0]?.id === ex.id

                      return (
                        <div key={idx}>
                          {/* Superset banner - only show before first exercise */}
                          {isFirstInSuperset && (
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 rounded-lg mb-2 shadow">
                              <p className="font-bold text-sm mb-1">SUPERSET</p>
                              <div className="flex flex-wrap items-center gap-1 mb-1">
                                {supersetExercises.map((ssEx, ssIdx) => (
                                  <span key={ssEx.id} className="flex items-center">
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">{ssEx.exercise.name}</span>
                                    {ssIdx < supersetExercises.length - 1 && <span className="mx-1 text-amber-200">+</span>}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-amber-100">Kör direkt efter varandra utan vila.</p>
                            </div>
                          )}

                        <div
                          className={`bg-gray-50 rounded-lg border overflow-hidden ${
                            isSuperset ? 'border-l-4 border-l-amber-500 border-gray-200' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 p-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{ex.exercise.name}</p>
                              <p className="text-sm text-gray-600">
                                {ex.sets} set × {ex.reps || '-'} reps
                              </p>
                            </div>
                            {ex.exercise.videoUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveExerciseVideo(activeExerciseVideo === videoKey ? null : videoKey)
                                }}
                                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                  activeExerciseVideo === videoKey
                                    ? 'bg-red-600 border border-red-700 text-white'
                                    : 'bg-red-600 border border-red-700 text-white hover:bg-red-700'
                                }`}
                              >
                                {activeExerciseVideo === videoKey ? (
                                  <>
                                    <X className="w-3 h-3" />
                                    STÄNG
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 fill-white" />
                                    VIDEO
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          {/* Inline video player */}
                          {activeExerciseVideo === videoKey && ex.exercise.videoUrl && (
                            <div className="px-3 pb-3">
                              <VideoPlayer
                                videoUrl={ex.exercise.videoUrl}
                                title={ex.exercise.name}
                                className="w-full rounded-lg overflow-hidden"
                                autoPlay={true}
                              />
                            </div>
                          )}
                        </div>
                        </div>
                      )
                    })}
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
