'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { VideoPlayer } from '@/components/ui/video-player'
import {
  Dumbbell,
  Clock,
  Check,
  ArrowLeft,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Trophy,
  Star,
  X,
  SkipForward,
  Plus,
  RotateCcw,
  UserCircle,
  Pencil,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

interface Exercise {
  id: string
  exerciseId: string
  sets: number
  repsMin: number | null
  repsMax: number | null
  restSeconds: number
  notes: string | null
  coachNotes: string | null
  exercise: {
    id: string
    name: string
    muscleGroups: string[]
    description: string | null
    videoUrl: string | null
    thumbnailUrl: string | null
    instructions: string[]
  }
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

interface WorkoutDay {
  id: string
  name: string
  dayNumber: number
  description: string | null
  exercises: Exercise[]
  workoutProgram?: {
    warmupRoutine: WarmupRoutine | null
  }
}

interface SetLog {
  id?: string
  exerciseId: string
  setNumber: number
  setType?: 'WEIGHT' | 'TIME' | 'BODYWEIGHT' | 'REPS'
  reps: number | null
  weightKg: number | null
  notes: string | null
  timeSeconds: number | null
  completed: boolean
}

interface PageProps {
  params: Promise<{ dayId: string }>
}

export default function WorkoutSessionPage({ params }: PageProps) {
  const router = useRouter()
  const [dayId, setDayId] = useState('')
  const [workoutDay, setWorkoutDay] = useState<WorkoutDay | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // Rest timer
  const [restTimerSeconds, setRestTimerSeconds] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [originalRestTime, setOriginalRestTime] = useState(0)

  // Exercise tracking
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [setLogs, setSetLogs] = useState<Record<string, SetLog[]>>({})
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set([0]))
  const [previousSessionData, setPreviousSessionData] = useState<any>(null)

  // Form state for current set
  const [currentSetType, setCurrentSetType] = useState<'WEIGHT' | 'TIME' | 'BODYWEIGHT' | 'REPS'>('WEIGHT')
  const [currentReps, setCurrentReps] = useState<string>('')
  const [currentWeight, setCurrentWeight] = useState<string>('')
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<string>('')
  const [workoutNotes, setWorkoutNotes] = useState<string>('')

  // Session rating
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [sessionRating, setSessionRating] = useState<number | null>(null)
  const [sessionRatingComment, setSessionRatingComment] = useState('')

  const [isCompleting, setIsCompleting] = useState(false)

  // Edit/Delete set state
  const [editingSet, setEditingSet] = useState<SetLog | null>(null)
  const [editReps, setEditReps] = useState<string>('')
  const [editWeight, setEditWeight] = useState<string>('')
  const [editNotes, setEditNotes] = useState<string>('')
  const [deletingSet, setDeletingSet] = useState<SetLog | null>(null)
  const [isUpdatingSet, setIsUpdatingSet] = useState(false)

  // Cancel/abandon session state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { dayId: id } = await params
      setDayId(id)
      await fetchWorkoutDay(id)
      // Check for incomplete session first, otherwise start new
      const resumed = await checkAndResumeSession(id)
      if (!resumed) {
        await startSession(id)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date()
        setElapsedSeconds(Math.floor((now.getTime() - startTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, startTime])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds(prev => {
          if (prev <= 1) {
            setIsResting(false)
            // Play sound notification
            playRestCompleteSound()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimerSeconds])

  // Keep inputs empty when changing exercises
  useEffect(() => {
    if (!workoutDay) return

    const currentExercise = workoutDay.exercises[currentExerciseIndex]
    if (!currentExercise) return

    // Always start with empty inputs
    setCurrentReps('')
    setCurrentWeight('')
    setCurrentTimeSeconds('')
  }, [currentExerciseIndex, workoutDay])

  const playRestCompleteSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const fetchWorkoutDay = async (id: string) => {
    try {
      const response = await fetch(`/api/workout-programs/days/${id}`)
      if (response.ok) {
        const data = await response.json()
        setWorkoutDay(data.day)
      }
    } catch (error) {
      console.error('Error fetching workout day:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPreviousSession = async () => {
    try {
      const queryParams = new URLSearchParams({
        dayId: dayId,
        limit: '1'
      })

      if (sessionId) {
        queryParams.append('excludeSessionId', sessionId)
      }

      const response = await fetch(`/api/workout-sessions?${queryParams}`)

      if (response.ok) {
        const data = await response.json()
        if (data.sessions && data.sessions.length > 0) {
          setPreviousSessionData(data.sessions[0])
        }
      }
    } catch (error) {
      console.error('Error fetching previous session:', error)
    }
  }

  // Check for and resume an incomplete session from today
  const checkAndResumeSession = async (programDayId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workout-sessions?dayId=${programDayId}&status=incomplete&limit=1`)

      if (response.ok) {
        const data = await response.json()
        if (data.sessions && data.sessions.length > 0) {
          const incompleteSession = data.sessions[0]

          // Resume the session
          setSessionId(incompleteSession.id)
          setStartTime(new Date(incompleteSession.startedAt))
          setIsRunning(true)

          // Restore logged sets from the incomplete session
          if (incompleteSession.sets && incompleteSession.sets.length > 0) {
            const restoredLogs: Record<string, SetLog[]> = {}

            for (const set of incompleteSession.sets) {
              if (!restoredLogs[set.exerciseId]) {
                restoredLogs[set.exerciseId] = []
              }
              restoredLogs[set.exerciseId].push({
                id: set.id,
                exerciseId: set.exerciseId,
                setNumber: set.setNumber,
                setType: set.setType,
                reps: set.reps,
                weightKg: set.weightKg ? Number(set.weightKg) : null,
                notes: set.notes,
                timeSeconds: set.timeSeconds,
                completed: set.completed
              })
            }

            setSetLogs(restoredLogs)

            // Find current exercise index (first incomplete or first with remaining sets)
            // This is handled by the existing UI logic
          }

          // Fetch previous completed session for reference
          await fetchPreviousSession()

          return true
        }
      }
    } catch (error) {
      console.error('Error checking for incomplete session:', error)
    }
    return false
  }

  const startSession = async (programDayId?: string) => {
    try {
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutProgramDayId: programDayId || dayId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSessionId(data.session.id)
        setStartTime(new Date())
        setIsRunning(true)

        // Fetch previous session data for reference
        await fetchPreviousSession()
      }
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  const logSet = async (exerciseId: string, programExerciseId: string, setNumber: number) => {
    if (!sessionId) return

    const reps = currentSetType !== 'TIME' ? (parseInt(currentReps) || null) : null
    // Parse weight - extract number if possible, keep original text as note
    const weightNum = parseFloat(currentWeight)
    const weight = currentSetType === 'WEIGHT' && !isNaN(weightNum) ? weightNum : null
    // Store the original text if it contains non-numeric characters (like "20+band", "bodyweight")
    const weightNotes = currentSetType === 'WEIGHT' && currentWeight && (isNaN(weightNum) || /[^\d.\s]/.test(currentWeight.replace(String(weightNum), '')))
      ? currentWeight
      : null
    const timeSeconds = currentSetType === 'TIME' ? (parseInt(currentTimeSeconds) || null) : null

    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          workoutProgramExerciseId: programExerciseId,
          setNumber,
          setType: currentSetType,
          reps,
          weightKg: weight,
          notes: weightNotes,
          timeSeconds,
          completed: true
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Update local state with the ID from the server
        setSetLogs(prev => ({
          ...prev,
          [exerciseId]: [
            ...(prev[exerciseId] || []),
            {
              id: data.set.id,
              exerciseId,
              setNumber,
              setType: currentSetType,
              reps,
              weightKg: weight,
              notes: weightNotes,
              timeSeconds,
              completed: true
            }
          ]
        }))

        // Pre-fill form with same values for next set (instead of clearing)
        // Values stay the same, user can adjust if needed
        // setCurrentReps('') - Keep the value
        // setCurrentWeight('') - Keep the value
        // setCurrentTimeSeconds('') - Keep the value

        // Check if we should move to next exercise
        const exercise = workoutDay?.exercises[currentExerciseIndex]
        if (exercise && setLogs[exerciseId]?.length + 1 >= exercise.sets) {
          // All sets complete for this exercise - collapse it immediately
          const newExpanded = new Set(expandedExercises)
          newExpanded.delete(currentExerciseIndex)
          setExpandedExercises(newExpanded)

          if (currentExerciseIndex < (workoutDay?.exercises.length || 0) - 1) {
            // Move to next exercise after a short delay
            setTimeout(() => {
              setCurrentExerciseIndex(prev => prev + 1)
              const newIndex = currentExerciseIndex + 1
              setExpandedExercises(new Set([newIndex]))
            }, 500)
          }
        } else {
          // Start rest timer
          if (exercise && exercise.restSeconds > 0) {
            setRestTimerSeconds(exercise.restSeconds)
            setOriginalRestTime(exercise.restSeconds)
            setIsResting(true)
          }
        }
      }
    } catch (error) {
      console.error('Error logging set:', error)
    }
  }

  // Edit a set
  const openEditModal = (set: SetLog) => {
    setEditingSet(set)
    setEditReps(set.reps?.toString() || '')
    setEditWeight(set.weightKg?.toString() || set.notes || '')
    setEditNotes(set.notes || '')
  }

  const updateSet = async () => {
    if (!sessionId || !editingSet?.id) return

    setIsUpdatingSet(true)
    try {
      const weightNum = parseFloat(editWeight)
      const weight = !isNaN(weightNum) ? weightNum : null
      const weightNotes = editWeight && (isNaN(weightNum) || /[^\d.\s]/.test(editWeight.replace(String(weightNum), '')))
        ? editWeight
        : null

      const response = await fetch(`/api/workout-sessions/${sessionId}/sets/${editingSet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reps: parseInt(editReps) || null,
          weightKg: weight,
          notes: weightNotes
        })
      })

      if (response.ok) {
        // Update local state
        setSetLogs(prev => {
          const updated = { ...prev }
          const exerciseSets = updated[editingSet.exerciseId]
          if (exerciseSets) {
            const idx = exerciseSets.findIndex(s => s.id === editingSet.id)
            if (idx !== -1) {
              exerciseSets[idx] = {
                ...exerciseSets[idx],
                reps: parseInt(editReps) || null,
                weightKg: weight,
                notes: weightNotes
              }
            }
          }
          return updated
        })
        setEditingSet(null)
      }
    } catch (error) {
      console.error('Error updating set:', error)
    } finally {
      setIsUpdatingSet(false)
    }
  }

  // Delete a set
  const deleteSet = async () => {
    if (!sessionId || !deletingSet?.id) return

    setIsUpdatingSet(true)
    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}/sets/${deletingSet.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Update local state - remove the set
        setSetLogs(prev => {
          const updated = { ...prev }
          const exerciseSets = updated[deletingSet.exerciseId]
          if (exerciseSets) {
            updated[deletingSet.exerciseId] = exerciseSets.filter(s => s.id !== deletingSet.id)
          }
          return updated
        })
        setDeletingSet(null)
      }
    } catch (error) {
      console.error('Error deleting set:', error)
    } finally {
      setIsUpdatingSet(false)
    }
  }

  // Cancel/abandon the current session
  const cancelSession = async () => {
    if (!sessionId) return

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShowCancelModal(false)
        router.push('/dashboard/workout')
      }
    } catch (error) {
      console.error('Error cancelling session:', error)
    } finally {
      setIsCancelling(false)
    }
  }

  const completeWorkout = () => {
    // Show rating modal instead of directly completing
    setShowRatingModal(true)
  }

  const submitRating = async (skipRating = false) => {
    if (!sessionId) return

    setIsCompleting(true)
    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: true,
          durationMinutes: Math.floor(elapsedSeconds / 60),
          notes: workoutNotes || null,
          rating: !skipRating && sessionRating ? sessionRating : null,
          ratingComment: !skipRating && sessionRatingComment ? sessionRatingComment : null
        })
      })

      if (response.ok) {
        setIsRunning(false)
        setShowRatingModal(false)
        // Show success and redirect
        setTimeout(() => {
          router.push('/dashboard/workout')
        }, 2000)
      }
    } catch (error) {
      console.error('Error completing workout:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const toggleExercise = (index: number) => {
    const newExpanded = new Set(expandedExercises)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedExercises(newExpanded)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const togglePause = () => {
    setIsRunning(!isRunning)
  }

  const skipRest = () => {
    setRestTimerSeconds(0)
    setIsResting(false)
  }

  const addRestTime = (seconds: number) => {
    setRestTimerSeconds(prev => prev + seconds)
  }

  const resetRestTimer = () => {
    setRestTimerSeconds(originalRestTime)
  }

  const getRestTimerColor = () => {
    if (!originalRestTime) return 'text-[#fb923c]'
    const percentage = (restTimerSeconds / originalRestTime) * 100
    if (percentage > 50) return 'text-green-500'
    if (percentage > 25) return 'text-[#fbbf24]'
    return 'text-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gold-primary/30 border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  if (!workoutDay) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 border-2 border-gold-primary/20">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">
              Workout day not found
            </p>
            <Link href="/dashboard/workout">
              <Button className="mt-4">Back to Workout</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalSetsCompleted = Object.values(setLogs).reduce(
    (sum, sets) => sum + sets.length,
    0
  )
  const totalSets = workoutDay.exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const isWorkoutComplete = totalSetsCompleted >= totalSets

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/workout">
            <Button variant="ghost" size="icon" className="text-gray-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {workoutDay.name}
            </h1>
            <p className="text-sm text-gray-500">
              Dag {workoutDay.dayNumber}
            </p>
          </div>
        </div>
        {sessionId && (
          <Button
            onClick={() => setShowCancelModal(true)}
            className="bg-red-500/20 border-2 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:text-red-300 hover:border-red-400"
          >
            <X className="w-4 h-4 mr-2" />
            Avbryt pass
          </Button>
        )}
      </div>

      {/* Warm-up Instructions - Dynamic from program's warmup routine */}
      {sessionId && workoutDay?.workoutProgram?.warmupRoutine && (
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 backdrop-blur-[10px]">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-400 mb-3 tracking-wide">
                  UPPVÄRMNING
                </h3>
                <div className="space-y-4 text-gray-200">
                  {/* Intro text */}
                  {workoutDay.workoutProgram.warmupRoutine.introText && (
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {workoutDay.workoutProgram.warmupRoutine.introText}
                    </p>
                  )}

                  {/* Exercise list with video buttons */}
                  {workoutDay.workoutProgram.warmupRoutine.exercises.length > 0 && (
                    <div className="space-y-2 my-4">
                      {workoutDay.workoutProgram.warmupRoutine.exercises.map((exercise, idx) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-orange-500/20"
                        >
                          <span className="text-gray-200 flex items-center gap-3">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/30 text-orange-300 font-bold text-sm">
                              {idx + 1}
                            </span>
                            <span>
                              {exercise.name}
                              {exercise.reps && (
                                <span className="text-orange-300 ml-2">{exercise.reps}</span>
                              )}
                            </span>
                          </span>
                          {exercise.videoUrl && (
                            <a
                              href={exercise.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-md text-xs font-semibold hover:bg-purple-500/30 transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              VIDEO
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Outro text */}
                  {workoutDay.workoutProgram.warmupRoutine.outroText && (
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {workoutDay.workoutProgram.warmupRoutine.outroText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Session Data */}
      {sessionId && previousSessionData && workoutDay && (
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-gold-light flex items-center gap-2 text-lg font-bold tracking-[1px]">
              <Clock className="w-5 h-5 text-gold-primary" />
              Föregående Pass
              <span className="text-sm text-gray-400 font-normal tracking-normal">
                {new Date(previousSessionData.startedAt).toLocaleDateString('sv-SE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workoutDay.exercises[currentExerciseIndex] && (() => {
                const currentExercise = workoutDay.exercises[currentExerciseIndex]
                const previousSets = previousSessionData.sets?.filter(
                  (set: any) => set.exerciseId === currentExercise.exercise.id
                ) || []

                if (previousSets.length === 0) {
                  return (
                    <p className="text-sm text-gray-400 italic">
                      Ingen data från förra passet för {currentExercise.exercise.name}
                    </p>
                  )
                }

                return (
                  <>
                    <p className="text-sm text-gray-300 font-medium">
                      {currentExercise.exercise.name}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {previousSets.map((set: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 bg-gold-primary/10 border-2 border-gold-primary/20 rounded-xl text-center hover:bg-gold-primary/15 hover:border-gold-primary/30 transition-all"
                        >
                          <div className="text-xs text-gold-primary/70 font-semibold uppercase tracking-wide mb-2">
                            Set {set.setNumber}
                          </div>
                          {set.setType === 'TIME' ? (
                            <div className="text-xl font-bold text-gold-light">
                              {set.timeSeconds}s
                            </div>
                          ) : (
                            <>
                              <div className="text-xl font-bold text-gold-light">
                                {set.reps || 0} <span className="text-sm text-gray-400">reps</span>
                              </div>
                              {set.setType === 'WEIGHT' && set.weightKg && (
                                <div className="text-sm text-gray-300 mt-1">
                                  @ <span className="font-semibold">{set.weightKg}</span>kg
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercises - Split View on Desktop */}
      <div className="lg:grid lg:grid-cols-[400px_1fr] lg:gap-6">
        {/* Left Column: Video (Desktop only, sticky) */}
        {sessionId && workoutDay.exercises[currentExerciseIndex]?.exercise.videoUrl && (
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <Card className="bg-white/5 border-2 border-gold-primary/20 overflow-hidden">
                <CardContent className="p-0">
                  <VideoPlayer
                    videoUrl={workoutDay.exercises[currentExerciseIndex].exercise.videoUrl}
                    thumbnailUrl={workoutDay.exercises[currentExerciseIndex].exercise.thumbnailUrl}
                    title={workoutDay.exercises[currentExerciseIndex].exercise.name}
                    className="w-full aspect-video"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-100">
                      {workoutDay.exercises[currentExerciseIndex].exercise.name}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Right Column: Exercises List */}
        <div className="space-y-3">
          {workoutDay.exercises.map((exercise, index) => {
            const isExpanded = expandedExercises.has(index)
            const isCurrent = index === currentExerciseIndex
            const exerciseSets = setLogs[exercise.exercise.id] || []
            const isExerciseComplete = exerciseSets.length >= exercise.sets

            return (
            <Card
              key={exercise.id}
              className={`bg-white/5 border-2 backdrop-blur-[10px] transition-all ${
                isCurrent && sessionId
                  ? 'border-[rgba(255,215,0,0.5)] shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                  : 'border-gold-primary/20'
              } ${isExerciseComplete && !isExpanded ? 'opacity-50 scale-95' : isExerciseComplete ? 'opacity-60' : ''}`}
            >
              <CardHeader className={isExerciseComplete && !isExpanded ? 'py-3' : ''}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExercise(index)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className={`${isExerciseComplete && !isExpanded ? 'text-lg' : 'text-xl'} text-gray-100 transition-all font-bold`}>
                          {exercise.exercise.name}
                        </CardTitle>
                        {isExerciseComplete && !isExpanded && (
                          <Badge className="bg-[rgba(34,197,94,0.2)] text-green-400 border-green-500/30 text-xs">
                            Klar
                          </Badge>
                        )}
                      </div>
                      <div className="text-base text-gray-400 space-y-1 mt-2">
                        <p>
                          <span className="font-semibold text-gray-300">Sets:</span> {exercise.sets}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-300">Repetitioner:</span> {exercise.repsMin}
                          {exercise.repsMax && exercise.repsMax !== exercise.repsMin ? `-${exercise.repsMax}` : ''}
                        </p>
                        {exercise.restSeconds > 0 && (
                          <p>
                            <span className="font-semibold text-gray-300">Vila:</span> {exercise.restSeconds}s
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {exerciseSets.length}/{exercise.sets}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Exercise Video - Mobile only (desktop shows in sticky left column) */}
                  {exercise.exercise.videoUrl && (
                    <div className="mb-4 lg:hidden">
                      <VideoPlayer
                        videoUrl={exercise.exercise.videoUrl}
                        thumbnailUrl={exercise.exercise.thumbnailUrl}
                        title={exercise.exercise.name}
                        className="w-full rounded-lg overflow-hidden"
                      />
                    </div>
                  )}

                  {/* Exercise Instructions */}
                  {exercise.exercise.instructions && exercise.exercise.instructions.length > 0 && (
                    <div className="p-5 bg-gradient-to-br from-[rgba(255,215,0,0.12)] to-[rgba(255,140,0,0.08)] border-l-4 border-gold-primary rounded-lg shadow-lg">
                      <div className="w-full space-y-3">
                        <Label className="text-base font-bold text-gold-light block">Instruktioner:</Label>
                        <ol className="space-y-2.5">
                          {exercise.exercise.instructions.map((instruction, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-100 leading-relaxed">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-primary/20 text-gold-light font-semibold text-xs flex items-center justify-center mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="flex-1 pt-0.5">{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Coach Notes */}
                  {exercise.coachNotes && (
                    <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-l-4 border-blue-500 rounded-lg shadow-lg">
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-5 h-5 text-blue-400" />
                          <Label className="text-base font-bold text-blue-300 block">Coach Notes:</Label>
                        </div>
                        <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">
                          {exercise.coachNotes}
                        </p>
                      </div>
                    </div>
                  )}


                  {/* Logged Sets */}
                  {exerciseSets.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base font-bold text-white">Genomförda sets:</Label>
                      {exerciseSets.map((set, setIdx) => (
                        <div
                          key={set.id || setIdx}
                          className="flex items-center gap-4 p-3 bg-gradient-to-r from-[rgba(34,197,94,0.15)] to-[rgba(34,197,94,0.08)] border-l-4 border-green-500/50 rounded-lg shadow"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-sm font-bold text-white">
                              Set {set.setNumber}:
                            </span>
                            {set.setType === 'TIME' ? (
                              <span className="text-base font-semibold text-gray-100">
                                {set.timeSeconds}s
                              </span>
                            ) : (
                              <>
                                <span className="text-base font-semibold text-gray-100">
                                  {set.reps || 0} reps
                                </span>
                                {set.setType === 'WEIGHT' && (set.weightKg || set.notes) && (
                                  <>
                                    <span className="text-sm text-gray-400">×</span>
                                    <span className="text-base font-semibold text-gray-100">
                                      {set.notes || `${set.weightKg} kg`}
                                    </span>
                                  </>
                                )}
                                {set.setType === 'BODYWEIGHT' && (
                                  <span className="text-xs text-gray-400 ml-1">(kroppsvikt)</span>
                                )}
                              </>
                            )}
                          </div>
                          {/* Edit/Delete buttons */}
                          {set.id && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditModal(set)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                title="Redigera set"
                              >
                                <Pencil className="w-4 h-4 text-gray-400 hover:text-white" />
                              </button>
                              <button
                                onClick={() => setDeletingSet(set)}
                                className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                title="Ta bort set"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Log Next Set */}
                  {sessionId && !isExerciseComplete && (
                    <div className="space-y-4 p-6 bg-gradient-to-br from-[rgba(255,215,0,0.1)] to-[rgba(255,140,0,0.05)] border-2 border-gold-primary/30 rounded-xl shadow-lg">
                      <Label className="text-lg font-bold text-white">
                        Set {exerciseSets.length + 1} av {exercise.sets}
                      </Label>

                      {/* Input Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-200">Reps</Label>
                          <Input
                            type="number"
                            value={currentReps}
                            onChange={(e) => setCurrentReps(e.target.value)}
                            placeholder={`${exercise.repsMin}-${exercise.repsMax}`}
                            className="h-12 text-lg font-semibold bg-black/40 border-2 border-gold-primary/40 text-white focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-200">Vikt (kg)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={currentWeight}
                            onChange={(e) => setCurrentWeight(e.target.value)}
                            placeholder={exerciseSets.length > 0 ? exerciseSets[exerciseSets.length - 1].weightKg?.toString() : "0"}
                            className="h-12 text-lg font-semibold bg-black/40 border-2 border-gold-primary/40 text-white focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={() => logSet(exercise.exercise.id, exercise.id, exerciseSets.length + 1)}
                        disabled={!currentReps}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] hover:opacity-90 disabled:opacity-50 shadow-lg"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Logga set
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
            )
          })}
        </div>
      </div>

      {/* Workout Notes & Complete */}
      {sessionId && isWorkoutComplete && (
        <Card className="bg-white/5 border-2 border-[rgba(34,197,94,0.3)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-green-500" />
              Bra jobbat! Alla övningar klara
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-200">
                Anteckningar (valfritt)
              </Label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="Hur kändes passet? Några nya personliga rekord eller observationer?"
                className="w-full mt-2 p-3 bg-black/30 border-2 border-gold-primary/30 rounded-xl text-white placeholder-[rgba(255,255,255,0.4)] focus:border-[rgba(255,215,0,0.5)] outline-none min-h-[100px] resize-y"
                rows={4}
              />
            </div>
            <Button
              onClick={completeWorkout}
              disabled={isCompleting}
              className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white hover:opacity-90 text-lg py-6"
            >
              <Trophy className="w-5 h-5 mr-2" />
              {isCompleting ? 'Avslutar träning...' : 'Avsluta träning'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-[rgba(10,10,10,0.98)] border-2 border-gold-primary/30 backdrop-blur-[10px] w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-gold-light" />
                  Hur var träningen?
                </CardTitle>
                <button
                  onClick={() => submitRating(true)}
                  className="text-gray-500 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Star Rating */}
              <div>
                <Label className="text-gray-200 mb-3 block">
                  Betygsätt ditt pass
                </Label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setSessionRating(star)}
                      className="transition-all hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          sessionRating && star <= sessionRating
                            ? 'fill-[#FFD700] text-gold-light'
                            : 'text-[rgba(255,215,0,0.3)] hover:text-[rgba(255,215,0,0.5)]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {sessionRating && (
                  <p className="text-center text-sm text-gray-400 mt-2">
                    {sessionRating === 5 && '🔥 Fantastiskt!'}
                    {sessionRating === 4 && '💪 Riktigt bra!'}
                    {sessionRating === 3 && '👍 Bra jobbat!'}
                    {sessionRating === 2 && '😊 Okej pass'}
                    {sessionRating === 1 && '😔 Kunde varit bättre'}
                  </p>
                )}
              </div>

              {/* Optional Comment */}
              <div>
                <Label className="text-gray-200">
                  Kommentar (valfritt)
                </Label>
                <textarea
                  value={sessionRatingComment}
                  onChange={(e) => setSessionRatingComment(e.target.value)}
                  placeholder="Vad gjorde passet bra eller dåligt?"
                  className="w-full mt-2 p-3 bg-black/30 border-2 border-gold-primary/30 rounded-xl text-white placeholder-[rgba(255,255,255,0.4)] focus:border-[rgba(255,215,0,0.5)] outline-none min-h-[80px] resize-y"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => submitRating(true)}
                  variant="outline"
                  className="flex-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/30 text-gray-200 hover:bg-[rgba(255,255,255,0.1)]"
                  disabled={isCompleting}
                >
                  Hoppa över
                </Button>
                <Button
                  onClick={() => submitRating(false)}
                  className="flex-1 bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] hover:opacity-90"
                  disabled={isCompleting || !sessionRating}
                >
                  {isCompleting ? 'Sparar...' : 'Spara betyg'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Set Modal */}
      {editingSet && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-[rgba(10,10,10,0.98)] border-2 border-gold-primary/30 backdrop-blur-[10px] w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-gold-light" />
                  Redigera Set {editingSet.setNumber}
                </CardTitle>
                <button
                  onClick={() => setEditingSet(null)}
                  className="text-gray-500 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-200">Reps</Label>
                  <Input
                    type="number"
                    value={editReps}
                    onChange={(e) => setEditReps(e.target.value)}
                    className="h-12 text-lg font-semibold bg-black/40 border-2 border-gold-primary/40 text-white focus:border-gold-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-200">Vikt (kg)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="h-12 text-lg font-semibold bg-black/40 border-2 border-gold-primary/40 text-white focus:border-gold-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setEditingSet(null)}
                  variant="outline"
                  className="flex-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/30 text-gray-200 hover:bg-[rgba(255,255,255,0.1)]"
                  disabled={isUpdatingSet}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={updateSet}
                  className="flex-1 bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] hover:opacity-90"
                  disabled={isUpdatingSet}
                >
                  {isUpdatingSet ? 'Sparar...' : 'Spara'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Set Confirmation Modal */}
      {deletingSet && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-[rgba(10,10,10,0.98)] border-2 border-red-500/30 backdrop-blur-[10px] w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  Ta bort Set {deletingSet.setNumber}?
                </CardTitle>
                <button
                  onClick={() => setDeletingSet(null)}
                  className="text-gray-500 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Är du säker på att du vill ta bort detta set? Detta kan inte ångras.
              </p>
              <div className="p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Set {deletingSet.setNumber}: </span>
                <span className="text-white font-semibold">
                  {deletingSet.reps} reps
                  {deletingSet.weightKg && ` × ${deletingSet.weightKg} kg`}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setDeletingSet(null)}
                  variant="outline"
                  className="flex-1 bg-[rgba(255,255,255,0.05)] border-gray-500/30 text-gray-200 hover:bg-[rgba(255,255,255,0.1)]"
                  disabled={isUpdatingSet}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={deleteSet}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-90"
                  disabled={isUpdatingSet}
                >
                  {isUpdatingSet ? 'Tar bort...' : 'Ta bort'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Session Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
          <Card className="bg-[rgba(10,10,10,0.98)] border-2 border-red-500/30 backdrop-blur-[10px] w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <X className="w-5 h-5 text-red-400" />
                  Avbryt träningspass?
                </CardTitle>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-500 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Är du säker på att du vill avbryta detta pass? Alla loggade sets kommer att tas bort.
              </p>
              {Object.values(setLogs).flat().length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">
                    Du har loggat {Object.values(setLogs).flat().length} set som kommer att raderas.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                  className="flex-1 bg-[rgba(255,255,255,0.05)] border-gray-500/30 text-gray-200 hover:bg-[rgba(255,255,255,0.1)]"
                  disabled={isCancelling}
                >
                  Fortsätt träna
                </Button>
                <Button
                  onClick={cancelSession}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-90"
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Avbryter...' : 'Avbryt pass'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
