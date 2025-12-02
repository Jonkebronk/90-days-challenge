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
  reps: string | null
  restSeconds: number
  tempo: string | null
  notes: string | null
  coachNotes: string | null
  supersetGroupId?: string | null
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

interface WorkoutDay {
  id: string
  name: string
  dayNumber: number
  description: string | null
  exercises: Exercise[]
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
  const [sessionRating, setSessionRating] = useState<number | null>(null)

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

  // Video visibility per exercise
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null)

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
        // Find the actual index of the exercise that was just completed
        const completedExerciseIndex = workoutDay?.exercises.findIndex(ex => ex.exercise.id === exerciseId) ?? -1
        const exercise = completedExerciseIndex >= 0 ? workoutDay?.exercises[completedExerciseIndex] : null

        if (exercise && setLogs[exerciseId]?.length + 1 >= exercise.sets) {
          // All sets complete for this exercise - collapse it immediately
          const newExpanded = new Set(expandedExercises)
          newExpanded.delete(completedExerciseIndex)
          setExpandedExercises(newExpanded)

          // Find the next incomplete exercise
          const nextIncompleteIndex = workoutDay?.exercises.findIndex((ex, idx) => {
            if (idx <= completedExerciseIndex) return false
            const exSets = setLogs[ex.exercise.id] || []
            return exSets.length < ex.sets
          }) ?? -1

          if (nextIncompleteIndex >= 0) {
            // Move to next incomplete exercise after a short delay
            setTimeout(() => {
              setCurrentExerciseIndex(nextIncompleteIndex)
              setExpandedExercises(new Set([nextIncompleteIndex]))
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

    const setToDelete = deletingSet
    setIsUpdatingSet(true)
    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}/sets/${setToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Update local state - remove the set
        setSetLogs(prev => {
          const updated = { ...prev }
          const exerciseSets = updated[setToDelete.exerciseId]
          if (exerciseSets) {
            updated[setToDelete.exerciseId] = exerciseSets.filter(s => s.id !== setToDelete.id)
          }
          return updated
        })
      }
    } catch (error) {
      console.error('Error deleting set:', error)
    } finally {
      setIsUpdatingSet(false)
      setDeletingSet(null) // Always close modal
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
        router.push('/dashboard/workout')
      }
    } catch (error) {
      console.error('Error cancelling session:', error)
    } finally {
      setIsCancelling(false)
      setShowCancelModal(false) // Always close modal
    }
  }

  const completeWorkout = async () => {
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
          rating: sessionRating || null,
          ratingComment: null
        })
      })

      if (response.ok) {
        setIsRunning(false)
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card className="bg-[#1a1a2e] border border-white/10 shadow-lg rounded-lg sm:rounded-xl">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">
              Träningsdag hittades inte
            </p>
            <Link href="/dashboard/workout">
              <Button className="mt-4 bg-gold-primary hover:bg-gold-secondary text-white">Tillbaka till Träning</Button>
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
      <div className="bg-[#1a1a2e] border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard/workout">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 h-10 w-10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                {workoutDay.name}
              </h1>
            </div>
          </div>
          {sessionId && (
            <Button
              onClick={() => setShowCancelModal(true)}
              size="sm"
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 h-10 px-3"
            >
              <X className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Avbryt</span>
            </Button>
          )}
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
          {workoutDay.exercises.map((exercise, index) => {
            const isExpanded = expandedExercises.has(index)
            const isCurrent = index === currentExerciseIndex
            const exerciseSets = setLogs[exercise.exercise.id] || []
            const isExerciseComplete = exerciseSets.length >= exercise.sets

            // Check if this exercise is part of a superset
            const isSuperset = !!exercise.supersetGroupId
            const supersetExercises = isSuperset
              ? workoutDay.exercises.filter(ex => ex.supersetGroupId === exercise.supersetGroupId)
              : []
            const isFirstInSuperset = isSuperset && supersetExercises[0]?.id === exercise.id
            const isLastInSuperset = isSuperset && supersetExercises[supersetExercises.length - 1]?.id === exercise.id

            return (
              <div key={exercise.id}>
                {/* Superset banner - only show before first exercise in superset */}
                {isFirstInSuperset && (
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-xl mb-0 shadow-lg border-2 border-purple-400">
                    <p className="font-bold text-xl tracking-wide mb-3">SUPERSET</p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {supersetExercises.map((ex, idx) => (
                        <span key={ex.id} className="flex items-center">
                          <span className="bg-white/30 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">{ex.exercise.name}</span>
                          {idx < supersetExercises.length - 1 && <span className="mx-2 text-white font-bold text-lg">+</span>}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-purple-200 bg-purple-800/50 p-2 rounded-lg">Kör dessa övningar direkt efter varandra utan vila mellan. Vila först när alla övningar är klara.</p>
                  </div>
                )}

                <Card
              className={`bg-[#1a1a2e] border transition-all shadow-lg ${
                isSuperset
                  ? `border-l-4 border-l-purple-500 ${isFirstInSuperset ? 'rounded-t-none rounded-b-lg sm:rounded-b-xl mt-0' : ''} ${!isFirstInSuperset && !isLastInSuperset ? 'rounded-none' : ''} ${isLastInSuperset && !isFirstInSuperset ? 'rounded-t-none rounded-b-lg sm:rounded-b-xl' : ''}`
                  : 'rounded-lg sm:rounded-xl'
              } ${
                isCurrent && sessionId
                  ? 'border-gold-primary border-l-4'
                  : isExerciseComplete && !isExpanded
                    ? 'border-green-500/50'
                    : isSuperset ? 'border-purple-500/30' : 'border-white/10'
              } ${isExerciseComplete && !isExpanded ? 'opacity-60 scale-[0.98]' : ''}`}
            >
              <CardHeader className={isExerciseComplete && !isExpanded ? 'py-3' : ''}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExercise(index)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className={`${isExerciseComplete && !isExpanded ? 'text-base' : 'text-lg'} text-white transition-all font-bold`}>
                          {exercise.exercise.name}
                        </CardTitle>
                        {isSuperset && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs font-semibold">
                            Superset {supersetExercises.findIndex(ex => ex.id === exercise.id) + 1}/{supersetExercises.length}
                          </Badge>
                        )}
                        {isExerciseComplete && !isExpanded && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Klar
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 space-y-0.5 mt-2">
                        <p>
                          <span className="font-medium text-gray-300">Sets:</span> {exercise.sets}
                        </p>
                        <p>
                          <span className="font-medium text-gray-300">Repetitioner:</span>{' '}
                          {exercise.reps || '-'}
                        </p>
                        {exercise.restSeconds > 0 && (
                          <p>
                            <span className="font-medium text-gray-300">Vila:</span> {exercise.restSeconds}s
                          </p>
                        )}
                        {exercise.tempo && (
                          <p>
                            <span className="font-medium text-gray-300">Tempo:</span> {exercise.tempo}
                          </p>
                        )}
                      </div>

                      {/* Video button + Previous session inline */}
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        {exercise.exercise.videoUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveVideoIndex(activeVideoIndex === index ? null : index)
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                              activeVideoIndex === index
                                ? 'bg-zinc-700 border border-zinc-600 text-white'
                                : 'bg-zinc-800 border border-zinc-600 text-gray-300 hover:bg-zinc-700 hover:text-white'
                            }`}
                          >
                            {activeVideoIndex === index ? (
                              <>
                                <X className="w-3 h-3" />
                                STÄNG
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                VIDEO
                              </>
                            )}
                          </button>
                        )}
                        {/* Previous session data for this exercise */}
                        {previousSessionData && (() => {
                          const prevSets = previousSessionData.sets?.filter(
                            (set: any) => set.exerciseId === exercise.exercise.id
                          ) || []
                          if (prevSets.length === 0) return null
                          return (
                            <span className="text-xs text-gray-500">
                              Föreg:{' '}
                              <span className="text-gold-primary font-semibold">
                                {prevSets.map((set: any, idx: number) => (
                                  <span key={idx}>
                                    {set.setType === 'TIME'
                                      ? `${set.timeSeconds}s`
                                      : `${set.reps || 0}${set.setType === 'WEIGHT' && set.weightKg ? `×${set.weightKg}kg` : ''}`}
                                    {idx < prevSets.length - 1 ? ' • ' : ''}
                                  </span>
                                ))}
                              </span>
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Progress indicator */}
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: exercise.sets }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${
                            idx < exerciseSets.length
                              ? 'bg-green-500'
                              : 'bg-zinc-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400 font-medium">
                      {exerciseSets.length}/{exercise.sets}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Video Player - shown when VIDEO button is clicked */}
              {activeVideoIndex === index && exercise.exercise.videoUrl && (
                <div className="px-4 pb-4">
                  <VideoPlayer
                    videoUrl={exercise.exercise.videoUrl}
                    thumbnailUrl={exercise.exercise.thumbnailUrl}
                    title={exercise.exercise.name}
                    className="w-full rounded-lg overflow-hidden"
                    autoPlay={true}
                  />
                </div>
              )}

              {isExpanded && (
                <CardContent className="space-y-4">

                  {/* Exercise Instructions */}
                  {exercise.exercise.instructions && exercise.exercise.instructions.length > 0 && (
                    <div className="p-3 sm:p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <Label className="text-sm font-bold text-white block mb-3">Instruktioner</Label>
                      <ol className="space-y-2">
                        {exercise.exercise.instructions.map((instruction, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-300 leading-relaxed">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-primary text-white font-bold text-xs flex items-center justify-center mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="flex-1">{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Coach Notes */}
                  {exercise.coachNotes && (
                    <div className="p-3 sm:p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-5 h-5 text-amber-400" />
                          <Label className="text-sm font-bold text-amber-300 block">Coach Notes</Label>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {exercise.coachNotes}
                        </p>
                      </div>
                    </div>
                  )}


                  {/* Logged Sets */}
                  {exerciseSets.length > 0 && (
                    <div className="p-3 sm:p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-2">
                      <Label className="text-sm font-bold text-green-400">Genomförda sets</Label>
                      {exerciseSets.map((set, setIdx) => {
                        const isEditing = editingSet?.id === set.id
                        return (
                          <div
                            key={set.id || setIdx}
                            className="bg-zinc-800/50 border border-green-500/20 rounded-lg overflow-hidden"
                          >
                            {isEditing ? (
                              /* Inline edit mode */
                              <div className="p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                  </div>
                                  <span className="text-sm font-bold text-white">Set {set.setNumber}:</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={editReps}
                                    onChange={(e) => setEditReps(e.target.value)}
                                    placeholder="Reps"
                                    className="w-20 h-10 text-center font-semibold bg-zinc-700 border-zinc-600 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-gray-400">×</span>
                                  <Input
                                    type="text"
                                    value={editWeight}
                                    onChange={(e) => setEditWeight(e.target.value)}
                                    placeholder="Vikt"
                                    className="flex-1 h-10 font-semibold bg-zinc-700 border-zinc-600 text-white"
                                  />
                                  <button
                                    onClick={updateSet}
                                    disabled={isUpdatingSet}
                                    className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                                    title="Spara"
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingSet(null)}
                                    className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-gray-300 transition-colors"
                                    title="Avbryt"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Display mode */
                              <div className="flex items-center gap-3 p-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex items-center gap-2 flex-1 flex-wrap">
                                  <span className="text-sm font-bold text-white">
                                    Set {set.setNumber}:
                                  </span>
                                  {set.setType === 'TIME' ? (
                                    <span className="text-base font-semibold text-gray-200">
                                      {set.timeSeconds}s
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-base font-semibold text-gray-200">
                                        {set.reps || 0} reps
                                      </span>
                                      {set.setType === 'WEIGHT' && (set.weightKg || set.notes) && (
                                        <>
                                          <span className="text-sm text-gray-400">×</span>
                                          <span className="text-base font-semibold text-gray-200">
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
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Log Next Set */}
                  {sessionId && !isExerciseComplete && (
                    <div className="space-y-4 p-3 sm:p-4 bg-amber-900/20 border border-amber-500/40 rounded-lg">
                      <Label className="text-base font-bold text-amber-400">
                        Set {exerciseSets.length + 1} av {exercise.sets}
                      </Label>

                      {/* Input Fields - stacked on mobile, side by side on desktop */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-sm font-medium text-gray-400">Reps</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={currentReps}
                            onChange={(e) => setCurrentReps(e.target.value)}
                            placeholder={exercise.reps || '8-12'}
                            className="h-12 sm:h-14 text-lg sm:text-xl font-semibold bg-zinc-900 border-zinc-500 text-white placeholder:text-gray-500 focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-sm font-medium text-gray-400">Vikt (kg)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={currentWeight}
                            onChange={(e) => setCurrentWeight(e.target.value)}
                            placeholder={exerciseSets.length > 0 ? exerciseSets[exerciseSets.length - 1].weightKg?.toString() : "0"}
                            className="h-12 sm:h-14 text-lg sm:text-xl font-semibold bg-zinc-900 border-zinc-500 text-white placeholder:text-gray-500 focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20 shadow-inner"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={() => logSet(exercise.exercise.id, exercise.id, exerciseSets.length + 1)}
                        disabled={!currentReps}
                        className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gold-primary hover:bg-gold-secondary text-white disabled:opacity-50 shadow-lg active:scale-[0.98] transition-all"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Logga set
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
              </div>
            )
          })}
      </div>

      {/* Workout Complete - Combined card with rating */}
      {sessionId && isWorkoutComplete && (
        <Card className="bg-[#1a1a2e] border border-gold-primary/50 shadow-lg rounded-lg sm:rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold">Bra jobbat! Alla övningar klara</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Star Rating */}
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <Label className="text-gray-300 mb-3 block text-center font-medium">
                Hur var träningen?
              </Label>
              <div className="flex gap-3 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setSessionRating(star)}
                    className="transition-all hover:scale-125 active:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        sessionRating && star <= sessionRating
                          ? 'fill-gold-primary text-gold-primary'
                          : 'text-gray-600 hover:text-gold-primary/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {sessionRating && (
                <p className="text-center text-sm text-gold-primary font-semibold mt-3">
                  {sessionRating === 5 && 'Fantastiskt!'}
                  {sessionRating === 4 && 'Riktigt bra!'}
                  {sessionRating === 3 && 'Bra jobbat!'}
                  {sessionRating === 2 && 'Okej pass'}
                  {sessionRating === 1 && 'Kunde varit bättre'}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label className="text-gray-300 font-medium">
                Anteckningar (valfritt)
              </Label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="Hur kändes passet? Några nya personliga rekord?"
                className="w-full mt-2 p-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-gray-500 focus:border-gold-primary outline-none min-h-[80px] resize-y"
                rows={3}
              />
            </div>

            {/* Complete Button */}
            <Button
              onClick={completeWorkout}
              disabled={isCompleting}
              className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-bold text-base sm:text-lg h-12 sm:h-14 shadow-lg active:scale-[0.98] transition-all"
            >
              <Trophy className="w-5 h-5 mr-2" />
              {isCompleting ? 'Sparar...' : 'Avsluta träning'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Set Confirmation Modal */}
      {deletingSet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-[#1a1a2e] border border-red-500/30 shadow-xl w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  Ta bort Set {deletingSet.setNumber}?
                </CardTitle>
                <button
                  onClick={() => setDeletingSet(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Är du säker på att du vill ta bort detta set? Detta kan inte ångras.
              </p>
              <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
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
                  className="flex-1 bg-zinc-800 border-zinc-600 text-gray-300 hover:bg-zinc-700 hover:text-white"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
          <Card className="bg-[#1a1a2e] border border-red-500/30 shadow-xl w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <X className="w-5 h-5 text-red-400" />
                  Avbryt träningspass?
                </CardTitle>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
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
                  <p className="text-red-400 text-sm">
                    Du har loggat {Object.values(setLogs).flat().length} set som kommer att raderas.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                  className="flex-1 bg-zinc-800 border-zinc-600 text-gray-300 hover:bg-zinc-700 hover:text-white"
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
