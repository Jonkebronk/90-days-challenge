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
  Timer,
  StickyNote,
  Pin,
  MoreHorizontal,
  MoreVertical,
  List,
  Layers,
  Trash2
} from 'lucide-react'
import { RestTimerDialog, MinimizedRestBar } from '@/components/workout/rest-timer-dialog'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'

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
  const [showRestDialog, setShowRestDialog] = useState(false)
  const [restEndTime, setRestEndTime] = useState<Date | null>(null)
  const [isRestMinimized, setIsRestMinimized] = useState(false)

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

  // Edit set state
  const [editingSet, setEditingSet] = useState<SetLog | null>(null)
  const [editReps, setEditReps] = useState<string>('')
  const [editWeight, setEditWeight] = useState<string>('')
  const [editNotes, setEditNotes] = useState<string>('')
  const [isUpdatingSet, setIsUpdatingSet] = useState(false)

  // Set menu state
  const [activeSetMenu, setActiveSetMenu] = useState<string | null>(null)
  const [isLoggingSet, setIsLoggingSet] = useState(false)

  // Cancel/abandon session state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  // Video visibility per exercise
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null)

  // View mode: 'list' (accordion) or 'slider' (one exercise at a time)
  const [viewMode, setViewMode] = useState<'list' | 'slider'>('list')

  // User exercise notes (personal memory notes)
  const [userExerciseNotes, setUserExerciseNotes] = useState<Record<string, string>>({})
  const [editingNoteExerciseId, setEditingNoteExerciseId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { dayId: id } = await params
      setDayId(id)
      await fetchWorkoutDay(id)
      await fetchUserNotes() // Load personal exercise notes
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

  // Rest timer effect - uses endTime for accurate timing even when app is backgrounded
  useEffect(() => {
    if (!isResting || !restEndTime) return

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((restEndTime.getTime() - now) / 1000))
      setRestTimerSeconds(remaining)

      if (remaining <= 0) {
        setIsResting(false)
        setShowRestDialog(false)
        setIsRestMinimized(false)
        playRestCompleteSound()
      }
    }

    updateTimer() // Update immediately (catches time passed while in background)
    const interval = setInterval(updateTimer, 100) // 100ms for smoother countdown

    return () => clearInterval(interval)
  }, [isResting, restEndTime])

  // Helper function for API error handling
  const handleApiResponse = async (response: Response, errorMessage: string): Promise<Response | null> => {
    if (response.status === 401) {
      toast.error('Din session har löpt ut. Du loggas in igen.')
      signOut({ callbackUrl: '/login' })
      return null
    }

    if (!response.ok) {
      toast.error(errorMessage)
      return null
    }

    return response
  }

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

  // Start rest timer with dialog (uses endTime for accurate timing)
  const startRestTimer = (seconds: number) => {
    // Blur any focused input to prevent iOS "Shake to Undo" dialog
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    const endTime = new Date(Date.now() + seconds * 1000)
    setRestEndTime(endTime)
    setRestTimerSeconds(seconds)
    setOriginalRestTime(seconds)
    setIsResting(true)
    setShowRestDialog(true)
    setIsRestMinimized(false)
  }

  // Stop rest timer and close dialog
  const stopRestTimer = () => {
    setIsResting(false)
    setRestTimerSeconds(0)
    setRestEndTime(null)
    setShowRestDialog(false)
    setIsRestMinimized(false)
  }

  // Add time to rest timer
  const addRestTime = (seconds: number) => {
    if (restEndTime) {
      setRestEndTime(new Date(restEndTime.getTime() + seconds * 1000))
      setOriginalRestTime(prev => prev + seconds)
    }
  }

  // Minimize rest timer
  const minimizeRestTimer = () => {
    setShowRestDialog(false)
    setIsRestMinimized(true)
  }

  // Expand rest timer from minimized
  const expandRestTimer = () => {
    setIsRestMinimized(false)
    setShowRestDialog(true)
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

  const fetchPreviousSession = async (programDayId?: string, excludeId?: string) => {
    const effectiveDayId = programDayId || dayId
    if (!effectiveDayId) return

    try {
      const queryParams = new URLSearchParams({
        dayId: effectiveDayId,
        limit: '1'
      })

      const effectiveExcludeId = excludeId || sessionId
      if (effectiveExcludeId) {
        queryParams.append('excludeSessionId', effectiveExcludeId)
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

  // Fetch user's personal exercise notes
  const fetchUserNotes = async () => {
    try {
      const response = await fetch('/api/user-exercise-notes')
      if (response.ok) {
        const data = await response.json()
        const notesMap: Record<string, string> = {}
        data.notes?.forEach((n: any) => {
          notesMap[n.workoutProgramExerciseId] = n.notes
        })
        setUserExerciseNotes(notesMap)
      }
    } catch (error) {
      console.error('Error fetching user notes:', error)
    }
  }

  // Save personal exercise note
  const saveExerciseNote = async (exerciseId: string) => {
    setIsSavingNote(true)
    try {
      const response = await fetch('/api/user-exercise-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutProgramExerciseId: exerciseId,
          notes: noteText
        })
      })
      if (response.ok) {
        setUserExerciseNotes(prev => ({ ...prev, [exerciseId]: noteText }))
        setEditingNoteExerciseId(null)
        setNoteText('')
        toast.success('Anteckning sparad')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Kunde inte spara anteckning')
    } finally {
      setIsSavingNote(false)
    }
  }

  // Open note editor
  const openNoteEditor = (exerciseId: string) => {
    setNoteText(userExerciseNotes[exerciseId] || '')
    setEditingNoteExerciseId(exerciseId)
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

          // Fetch previous completed session for reference (exclude current session)
          await fetchPreviousSession(programDayId, incompleteSession.id)

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

        // Fetch previous session data for reference (exclude current session)
        await fetchPreviousSession(programDayId || dayId, data.session.id)
      }
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  const logSet = async (exerciseId: string, programExerciseId: string, setNumber: number) => {
    if (!sessionId) return

    // Blur any focused input to prevent iOS "Shake to Undo" dialog
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

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

      const validResponse = await handleApiResponse(response, 'Kunde inte logga set')
      if (!validResponse) return

      const data = await validResponse.json()

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

      // Check if we should move to next exercise
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
          setTimeout(() => {
            setCurrentExerciseIndex(nextIncompleteIndex)
            setExpandedExercises(new Set([nextIncompleteIndex]))
          }, 500)
        }
      }
    } catch (error) {
      console.error('Error logging set:', error)
      toast.error('Kunde inte logga set')
    }
  }

  // Add extra set
  const addExtraSet = async (exerciseId: string, programExerciseId: string) => {
    if (!sessionId || isLoggingSet) return
    setActiveSetMenu(null)
    setIsLoggingSet(true)

    const currentSets = setLogs[exerciseId] || []
    const newSetNumber = currentSets.length + 1

    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          workoutProgramExerciseId: programExerciseId,
          setNumber: newSetNumber,
          setType: 'WEIGHT',
          reps: null,
          weightKg: null,
          notes: null,
          timeSeconds: null,
          completed: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add set')
      }

      const data = await response.json()

      const newSet: SetLog = {
        id: data.set.id,
        exerciseId,
        setNumber: newSetNumber,
        setType: 'WEIGHT',
        reps: null,
        weightKg: null,
        notes: null,
        timeSeconds: null,
        completed: true
      }

      setSetLogs(prev => ({
        ...prev,
        [exerciseId]: [
          ...(prev[exerciseId] || []),
          newSet
        ]
      }))

      // Open edit modal for the new set so user can fill in values
      setEditingSet(newSet)
      setEditReps('')
      setEditWeight('')
      setEditNotes('')

      toast.success('Set tillagt - fyll i värden')
    } catch (error) {
      console.error('Error adding set:', error)
      toast.error('Kunde inte lägga till set')
    } finally {
      setIsLoggingSet(false)
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

      const validResponse = await handleApiResponse(response, 'Kunde inte uppdatera set')
      if (!validResponse) return

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
    } catch (error) {
      console.error('Error updating set:', error)
      toast.error('Kunde inte uppdatera set')
    } finally {
      setIsUpdatingSet(false)
    }
  }

  // Delete a set directly (no confirmation)
  const deleteSetDirectly = async (setToDelete: SetLog) => {
    if (!sessionId || !setToDelete?.id) return

    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}/sets/${setToDelete.id}`, {
        method: 'DELETE'
      })

      const validResponse = await handleApiResponse(response, 'Kunde inte ta bort set')
      if (!validResponse) return

      // Update local state - remove the set
      setSetLogs(prev => {
        const updated = { ...prev }
        const exerciseSets = updated[setToDelete.exerciseId]
        if (exerciseSets) {
          updated[setToDelete.exerciseId] = exerciseSets.filter(s => s.id !== setToDelete.id)
        }
        return updated
      })
    } catch (error) {
      console.error('Error deleting set:', error)
      toast.error('Kunde inte ta bort set')
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

      const validResponse = await handleApiResponse(response, 'Kunde inte avbryta passet')
      if (!validResponse) return

      router.push('/dashboard/workout')
    } catch (error) {
      console.error('Error cancelling session:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsCancelling(false)
      setShowCancelModal(false)
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

      const validResponse = await handleApiResponse(response, 'Kunde inte spara träningspasset')
      if (!validResponse) return

      setIsRunning(false)
      toast.success('Träningspass avslutat!')
      setTimeout(() => {
        router.push('/dashboard/workout')
      }, 2000)
    } catch (error) {
      console.error('Error completing workout:', error)
      toast.error('Ett fel uppstod')
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

  // Format time as HH:MM:SS for header display
  const formatTimeHMS = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get Swedish day abbreviation and day of month
  const getDayInfo = () => {
    const now = new Date()
    const days = ['SÖN', 'MÅN', 'TIS', 'ONS', 'TOR', 'FRE', 'LÖR']
    const dayAbbr = days[now.getDay()]
    const dayOfMonth = now.getDate()

    return { dayAbbr, dayOfMonth }
  }

  const togglePause = () => {
    setIsRunning(!isRunning)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!workoutDay) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card className="bg-white border-2 border-dashed border-pink-400 shadow-lg rounded-lg sm:rounded-xl">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              Träningsdag hittades inte
            </p>
            <Link href="/dashboard/workout">
              <Button className="mt-4 bg-pink-500 hover:bg-pink-600 text-white">Tillbaka till Träning</Button>
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

  const { dayAbbr, dayOfMonth } = getDayInfo()

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24">
      {/* Compact Header */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          {/* Left: Back + Day box + Info */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/dashboard/workout">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>

            {/* Day indicator box - dark navy */}
            <div className="bg-slate-800 text-white px-3 py-2 rounded-xl text-center min-w-[48px]">
              <span className="text-[11px] font-semibold block leading-none tracking-wide">{dayAbbr}</span>
              <span className="text-xl font-bold block leading-tight">{dayOfMonth}</span>
            </div>

            {/* Workout name + timer */}
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight">
                {workoutDay.name}
              </h1>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium tabular-nums">{formatTimeHMS(elapsedSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Right: View toggle + Cancel */}
          <div className="flex items-center gap-2">
            {/* List/Slider toggle */}
            <div className="hidden sm:flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('slider')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'slider'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layers className="w-4 h-4" />
                Slider
              </button>
            </div>

            {/* Mobile view toggle */}
            <div className="flex sm:hidden bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('slider')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'slider'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>

            {sessionId && (
              <Button
                onClick={() => setShowCancelModal(true)}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-9 w-9 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
          {workoutDay.exercises
            .filter((_, index) => viewMode === 'list' || index === currentExerciseIndex)
            .map((exercise, filteredIndex) => {
            // Get the actual index in the full array
            const index = viewMode === 'slider' ? currentExerciseIndex : filteredIndex
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
                  <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-4 rounded-xl mb-0 shadow-lg border-2 border-pink-400">
                    <p className="font-bold text-xl tracking-wide mb-3">SUPERSET</p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {supersetExercises.map((ex, idx) => (
                        <span key={ex.id} className="flex items-center">
                          <span className="bg-white/30 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">{ex.exercise.name}</span>
                          {idx < supersetExercises.length - 1 && <span className="mx-2 text-white font-bold text-lg">+</span>}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-pink-100 bg-pink-700/50 p-2 rounded-lg">Kör dessa övningar direkt efter varandra utan vila mellan. Vila först när alla övningar är klara.</p>
                  </div>
                )}

                <Card
              className={`bg-white transition-all ${
                isSuperset
                  ? `border-l-4 border-l-blue-400 shadow-lg ${isFirstInSuperset ? 'rounded-t-none rounded-b-xl mt-0' : ''} ${!isFirstInSuperset && !isLastInSuperset ? 'rounded-none border-t-0' : ''} ${isLastInSuperset && !isFirstInSuperset ? 'rounded-t-none rounded-b-xl border-t-0' : ''}`
                  : 'rounded-xl shadow-md hover:shadow-lg border border-gray-200'
              } ${isExerciseComplete && !isExpanded ? 'opacity-70 scale-[0.98]' : ''}`}
            >
              {/* Slider mode: Navigation inside card */}
              {viewMode === 'slider' && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                  <button
                    onClick={() => setViewMode('list')}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Tillbaka
                  </button>
                  <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    Övning {currentExerciseIndex + 1} av {workoutDay.exercises.length}
                  </span>
                </div>
              )}

              <CardHeader className={`${isExerciseComplete && !isExpanded ? 'py-2' : 'py-3'} px-4`}>
                <div
                  className="flex items-center justify-between cursor-pointer gap-3"
                  onClick={() => toggleExercise(index)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Video/thumbnail preview on left */}
                    {(exercise.exercise.videoUrl || exercise.exercise.thumbnailUrl) ? (
                      <div
                        className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer"
                        onClick={(e) => {
                          if (exercise.exercise.videoUrl) {
                            e.stopPropagation()
                            setActiveVideoIndex(activeVideoIndex === index ? null : index)
                          }
                        }}
                      >
                        {exercise.exercise.thumbnailUrl ? (
                          <img
                            src={exercise.exercise.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        {/* Play button overlay - YouTube style */}
                        {exercise.exercise.videoUrl && (
                          <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="w-8 h-5 rounded-sm bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-colors">
                              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="flex-1 min-w-0">
                      {/* Title row with badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className={`${isExerciseComplete && !isExpanded ? 'text-base' : 'text-base'} text-gray-900 transition-all font-bold leading-tight`}>
                          {exercise.exercise.name}
                        </CardTitle>
                        {isSuperset && (
                          <Badge className="bg-pink-100 text-pink-600 border-pink-300 text-[10px] px-1.5 py-0 font-semibold">
                            SS {supersetExercises.findIndex(ex => ex.id === exercise.id) + 1}/{supersetExercises.length}
                          </Badge>
                        )}
                        {isExerciseComplete && !isExpanded && (
                          <Badge className="bg-green-100 text-green-600 border-green-300 text-[10px] px-1.5 py-0">
                            Klar
                          </Badge>
                        )}
                      </div>

                      {/* TEMPO - only show when expanded and has tempo */}
                      {isExpanded && exercise.tempo && (
                        <div className="mt-1">
                          <span className="text-xs text-teal-600 font-semibold">TEMPO {exercise.tempo}</span>
                        </div>
                      )}
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
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
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

              {/* Video Player - shown when VIDEO button is clicked */}
              {activeVideoIndex === index && exercise.exercise.videoUrl && (
                <div className="px-4 pb-4">
                  <VideoPlayer
                    videoUrl={exercise.exercise.videoUrl}
                    thumbnailUrl={exercise.exercise.thumbnailUrl}
                    title={exercise.exercise.name}
                    className="w-full rounded-lg overflow-hidden"
                    autoPlay={true}
                    onClose={() => setActiveVideoIndex(null)}
                  />
                </div>
              )}

              {isExpanded && (
                <CardContent className="space-y-4">

                  {/* Exercise Instructions */}
                  {exercise.exercise.instructions && exercise.exercise.instructions.length > 0 && (
                    <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <Label className="text-sm font-bold text-gray-800 block mb-3">Instruktioner</Label>
                      <ol className="space-y-2">
                        {exercise.exercise.instructions.map((instruction, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="flex-1">{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Coach Notes - Pinned note style */}
                  {exercise.coachNotes && (
                    <div className="flex items-start gap-3 px-3 py-2.5 bg-amber-100 rounded-lg">
                      <Pencil className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="flex-1 text-sm text-amber-900 leading-snug whitespace-pre-line">
                        {exercise.coachNotes}
                      </p>
                      <Pin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    </div>
                  )}

                  {/* User Exercise Notes - Pinned note style (above sets) */}
                  {editingNoteExerciseId === exercise.id ? (
                    <div className="p-3 bg-amber-50/80 rounded-lg space-y-3" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Skriv ner det du vill komma ihåg – som maskininställning, eller något att tänka på nästa gång."
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400/20 focus:outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveExerciseNote(exercise.id)}
                          disabled={isSavingNote}
                          className="bg-gray-800 hover:bg-gray-900 text-white"
                        >
                          {isSavingNote ? 'Sparar...' : 'Spara'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingNoteExerciseId(null)
                            setNoteText('')
                          }}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          Avbryt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-3 px-4 py-2.5 bg-amber-50/80 rounded-lg cursor-pointer hover:bg-amber-100/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        openNoteEditor(exercise.id)
                      }}
                    >
                      <StickyNote className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <p className="flex-1 text-sm text-gray-700 leading-snug">
                        {userExerciseNotes[exercise.id] || (
                          <span className="text-gray-400 italic">Lägg till en anteckning...</span>
                        )}
                      </p>
                      <Pin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  )}

                  {/* Logged Sets - with table layout */}
                  {exerciseSets.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-visible">
                      {/* Table header */}
                      <div className="grid grid-cols-[28px_32px_48px_1fr_1fr_44px_44px] sm:grid-cols-[32px_44px_64px_1fr_1fr_52px_52px] gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 bg-gray-50 border-b border-gray-200 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span className="text-center"></span>
                        <span className="text-center">SET</span>
                        <span className="text-center">FÖREG</span>
                        <span className="text-center">REPS</span>
                        <span className="text-center">KG</span>
                        <span className="text-center">VILA</span>
                        <span className="text-center"></span>
                      </div>
                      {exerciseSets.map((set, setIdx) => {
                        const isEditing = editingSet?.id === set.id
                        // Get previous session data for this set
                        const prevSets = previousSessionData?.sets?.filter(
                          (s: any) => s.exerciseId === exercise.exercise.id
                        ) || []
                        const prevSet = prevSets[setIdx]

                        return (
                          <div key={set.id || setIdx}>
                            {isEditing ? (
                              /* Inline edit mode */
                              <div className="p-3 bg-gray-100 rounded-lg border border-gray-300 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={editReps}
                                    onChange={(e) => setEditReps(e.target.value)}
                                    placeholder="Reps"
                                    className="w-16 h-9 text-center text-sm font-medium bg-white border-gray-300 text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-gray-500 text-sm">×</span>
                                  <Input
                                    type="text"
                                    value={editWeight}
                                    onChange={(e) => setEditWeight(e.target.value)}
                                    placeholder="Vikt"
                                    className="w-20 h-9 text-sm font-medium bg-white border-gray-300 text-gray-800"
                                  />
                                  <button
                                    onClick={updateSet}
                                    disabled={isUpdatingSet}
                                    className="p-1.5 rounded bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                                    title="Spara"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingSet(null)}
                                    className="p-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
                                    title="Avbryt"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Display mode - table row - click to edit */
                              <div
                                className="grid grid-cols-[28px_32px_48px_1fr_1fr_44px_44px] sm:grid-cols-[32px_44px_64px_1fr_1fr_52px_52px] gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-white border border-gray-200 rounded-xl items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => set.id && openEditModal(set)}
                              >
                                {/* Kebab menu - first column */}
                                <div className="relative flex items-center justify-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setActiveSetMenu(activeSetMenu === set.id ? null : set.id || null)
                                    }}
                                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  {activeSetMenu === set.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-[100]"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setActiveSetMenu(null)
                                        }}
                                      />
                                      <div className="absolute left-0 top-0 mt-8 bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-[101] min-w-[150px]">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            addExtraSet(exercise.exercise.id, exercise.id)
                                          }}
                                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                                        >
                                          <Plus className="w-4 h-4" /> Lägg till set
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setActiveSetMenu(null)
                                            deleteSetDirectly(set)
                                          }}
                                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4" /> Ta bort set
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <span className="text-center text-sm font-bold text-gray-700">{set.setNumber}</span>
                                <span className="text-center text-xs sm:text-sm text-gray-600 font-medium truncate">
                                  {prevSet ? (prevSet.setType === 'TIME' ? `${prevSet.timeSeconds}s` : `${prevSet.reps || 0}×${prevSet.weightKg || 0}`) : '-'}
                                </span>
                                <span className="text-center text-sm font-semibold text-gray-800">
                                  {set.setType === 'TIME' ? `${set.timeSeconds}s` : (set.reps || 0)}
                                </span>
                                <span className="text-center text-sm font-semibold text-gray-800">
                                  {set.setType === 'WEIGHT' ? (set.notes || `${set.weightKg || 0}`) : '-'}
                                </span>
                                <div className="flex items-center justify-center">
                                  {exercise.restSeconds > 0 ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        startRestTimer(exercise.restSeconds)
                                      }}
                                      className="w-10 h-10 aspect-square rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-all active:scale-95 flex-shrink-0 border border-emerald-200 shadow-sm"
                                    >
                                      <Timer className="w-5 h-5" />
                                    </button>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-center">
                                  <div className="w-10 h-10 aspect-square rounded-xl bg-green-500 flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Check className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Log Next Set - Table style */}
                  {sessionId && !isExerciseComplete && (
                    <div className="space-y-3">
                      {/* Table header if no sets logged yet */}
                      {exerciseSets.length === 0 && (
                        <div className="grid grid-cols-[32px_48px_1fr_1fr_44px_44px] sm:grid-cols-[44px_64px_1fr_1fr_52px_52px] gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gray-100 rounded-t-lg text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <span className="text-center">SET</span>
                          <span className="text-center">FÖREG</span>
                          <span className="text-center">REPS</span>
                          <span className="text-center">KG</span>
                          <span className="text-center">VILA</span>
                          <span className="text-center"></span>
                        </div>
                      )}

                      {/* Current set input row */}
                      <div className="grid grid-cols-[32px_48px_1fr_1fr_44px_44px] sm:grid-cols-[44px_64px_1fr_1fr_52px_52px] gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-white border-2 border-blue-200 rounded-xl items-center">
                        <span className="text-center text-sm font-bold text-blue-600">{exerciseSets.length + 1}</span>
                        <span className="text-center text-xs sm:text-sm text-gray-600 font-medium truncate">
                          {(() => {
                            const prevSets = previousSessionData?.sets?.filter(
                              (s: any) => s.exerciseId === exercise.exercise.id
                            ) || []
                            const prevSet = prevSets[exerciseSets.length]
                            return prevSet ? (prevSet.setType === 'TIME' ? `${prevSet.timeSeconds}s` : `${prevSet.reps || 0}×${prevSet.weightKg || 0}`) : '-'
                          })()}
                        </span>
                        <div>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={currentReps}
                            onChange={(e) => setCurrentReps(e.target.value)}
                            placeholder={exercise.reps || '12'}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            className="h-10 px-1 text-center text-sm font-semibold bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 placeholder:text-[10px] placeholder:whitespace-nowrap focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={currentWeight}
                            onChange={(e) => setCurrentWeight(e.target.value)}
                            placeholder={exerciseSets.length > 0 ? exerciseSets[exerciseSets.length - 1].weightKg?.toString() : "0"}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            className="h-10 text-center text-sm font-semibold bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20"
                          />
                        </div>
                        <div className="flex justify-center">
                          {exercise.restSeconds > 0 ? (
                            <button
                              onClick={() => startRestTimer(exercise.restSeconds)}
                              className="w-10 h-10 aspect-square rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-all active:scale-95 flex-shrink-0 border border-emerald-200 shadow-sm"
                              title={`Vila ${exercise.restSeconds}s`}
                            >
                              <Timer className="w-5 h-5" />
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => logSet(exercise.exercise.id, exercise.id, exerciseSets.length + 1)}
                            disabled={!currentReps}
                            className="w-10 h-10 aspect-square rounded-xl bg-green-500 hover:bg-green-600 text-white disabled:opacity-40 disabled:bg-gray-200 flex items-center justify-center transition-all active:scale-95 shadow-sm flex-shrink-0"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Remaining sets to show */}
                      {Array.from({ length: exercise.sets - exerciseSets.length - 1 }).map((_, idx) => {
                        const setNum = exerciseSets.length + 2 + idx
                        const prevSets = previousSessionData?.sets?.filter(
                          (s: any) => s.exerciseId === exercise.exercise.id
                        ) || []
                        const prevSet = prevSets[exerciseSets.length + 1 + idx]
                        return (
                          <div key={idx} className="grid grid-cols-[32px_48px_1fr_1fr_44px_44px] sm:grid-cols-[44px_64px_1fr_1fr_52px_52px] gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl items-center">
                            <span className="text-center text-sm font-bold text-gray-400">{setNum}</span>
                            <span className="text-center text-xs sm:text-sm text-gray-500 font-medium truncate">
                              {prevSet ? (prevSet.setType === 'TIME' ? `${prevSet.timeSeconds}s` : `${prevSet.reps || 0}×${prevSet.weightKg || 0}`) : '-'}
                            </span>
                            <span className="text-center text-sm text-gray-300">-</span>
                            <span className="text-center text-sm text-gray-300">-</span>
                            <span className="text-center text-sm text-gray-300">-</span>
                            <div className="flex justify-center">
                              <div className="w-10 h-10 aspect-square rounded-xl border-2 border-gray-200 bg-gray-50 flex-shrink-0"></div>
                            </div>
                          </div>
                        )
                      })}
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
        <Card className="bg-white border-2 border-dashed border-green-400 shadow-lg rounded-lg sm:rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold">Bra jobbat! Alla övningar klara</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Star Rating */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <Label className="text-gray-700 mb-3 block text-center font-medium">
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
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {sessionRating && (
                <p className="text-center text-sm text-green-600 font-semibold mt-3">
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
              <Label className="text-gray-700 font-medium">
                Anteckningar (valfritt)
              </Label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="Hur kändes passet? Några nya personliga rekord?"
                className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:border-green-500 outline-none min-h-[80px] resize-y"
                rows={3}
              />
            </div>

            {/* Complete Button */}
            <Button
              onClick={completeWorkout}
              disabled={isCompleting}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-base sm:text-lg h-12 sm:h-14 shadow-lg active:scale-[0.98] transition-all"
            >
              <Trophy className="w-5 h-5 mr-2" />
              {isCompleting ? 'Sparar...' : 'Avsluta träning'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancel Session Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
          <Card className="bg-white border border-red-200 shadow-xl w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-500" />
                  Avbryt träningspass?
                </CardTitle>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Är du säker på att du vill avbryta detta pass? Alla loggade sets kommer att tas bort.
              </p>
              {Object.values(setLogs).flat().length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">
                    Du har loggat {Object.values(setLogs).flat().length} set som kommer att raderas.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                  className="flex-1 bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
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

      {/* Rest Timer Dialog */}
      <RestTimerDialog
        isOpen={showRestDialog}
        totalSeconds={originalRestTime}
        remainingSeconds={restTimerSeconds}
        onStop={stopRestTimer}
        onAddTime={addRestTime}
        onMinimize={minimizeRestTimer}
      />

      {/* Minimized Rest Timer Bar */}
      {isRestMinimized && isResting && (
        <MinimizedRestBar
          totalSeconds={originalRestTime}
          remainingSeconds={restTimerSeconds}
          onStop={stopRestTimer}
          onAddTime={addRestTime}
          onExpand={expandRestTimer}
        />
      )}

      {/* Slider mode: Bottom bar with next exercise */}
      {viewMode === 'slider' && !isWorkoutComplete && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-4xl mx-auto p-3 sm:p-4">
            {/* REST Timer Display - Show when resting */}
            {isResting ? (
              <div className="flex items-center justify-between">
                {/* Timer display */}
                <div className="flex-1">
                  {/* Overtime indicator (negative time) */}
                  {restTimerSeconds <= 0 && (
                    <p className="text-xs text-pink-500 font-medium">
                      {restTimerSeconds < 0 ? `-${formatTimeHMS(Math.abs(restTimerSeconds))}` : '00:00:00'}
                    </p>
                  )}
                  {/* Main timer */}
                  <div className="flex items-center gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-blue-500 tabular-nums tracking-tight">
                      {formatTimeHMS(Math.max(0, restTimerSeconds))}
                    </span>
                    <button
                      onClick={() => {
                        const currentExercise = workoutDay.exercises[currentExerciseIndex]
                        if (currentExercise) {
                          setRestTimerSeconds(currentExercise.restSeconds)
                          setOriginalRestTime(currentExercise.restSeconds)
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pause button */}
                <button
                  onClick={() => {
                    setIsResting(false)
                    setRestTimerSeconds(0)
                  }}
                  className="p-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Pause className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {/* Previous button */}
                <button
                  onClick={() => {
                    if (currentExerciseIndex > 0) {
                      setCurrentExerciseIndex(currentExerciseIndex - 1)
                      setExpandedExercises(new Set([currentExerciseIndex - 1]))
                    }
                  }}
                  disabled={currentExerciseIndex === 0}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Next exercise preview */}
                <div className="flex-1 mx-3">
                  {currentExerciseIndex < workoutDay.exercises.length - 1 ? (
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      {workoutDay.exercises[currentExerciseIndex + 1].exercise.thumbnailUrl ? (
                        <img
                          src={workoutDay.exercises[currentExerciseIndex + 1].exercise.thumbnailUrl || ''}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Dumbbell className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Nästa</p>
                        <p className="font-semibold text-gray-900 truncate">
                          {workoutDay.exercises[currentExerciseIndex + 1].exercise.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Sista övningen!</p>
                    </div>
                  )}
                </div>

                {/* Next/Pause button */}
                {currentExerciseIndex < workoutDay.exercises.length - 1 ? (
                  <button
                    onClick={() => {
                      setCurrentExerciseIndex(currentExerciseIndex + 1)
                      setExpandedExercises(new Set([currentExerciseIndex + 1]))
                    }}
                    className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>
                ) : (
                  <button
                    onClick={togglePause}
                    className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
