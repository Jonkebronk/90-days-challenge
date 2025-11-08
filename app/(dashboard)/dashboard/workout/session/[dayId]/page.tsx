'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dumbbell,
  Clock,
  Check,
  ArrowLeft,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Trophy
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
  exercise: {
    id: string
    name: string
    muscleGroups: string[]
    description: string | null
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
  exerciseId: string
  setNumber: number
  reps: number | null
  weightKg: number | null
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

  // Exercise tracking
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [setLogs, setSetLogs] = useState<Record<string, SetLog[]>>({})
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set([0]))

  // Form state for current set
  const [currentReps, setCurrentReps] = useState<string>('')
  const [currentWeight, setCurrentWeight] = useState<string>('')
  const [workoutNotes, setWorkoutNotes] = useState<string>('')

  // PR tracking
  const [newPRs, setNewPRs] = useState<any[]>([])
  const [showPRCelebration, setShowPRCelebration] = useState(false)

  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { dayId: id } = await params
      setDayId(id)
      await fetchWorkoutDay(id)
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
            // Play sound or notification
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimerSeconds])

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

  const startSession = async () => {
    try {
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutProgramDayId: dayId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSessionId(data.session.id)
        setStartTime(new Date())
        setIsRunning(true)
      }
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  const logSet = async (exerciseId: string, programExerciseId: string, setNumber: number) => {
    if (!sessionId) return

    const reps = parseInt(currentReps) || null
    const weight = parseFloat(currentWeight) || null

    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          workoutProgramExerciseId: programExerciseId,
          setNumber,
          reps,
          weightKg: weight,
          completed: true
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Check for PRs
        if (data.personalRecords && data.personalRecords.length > 0) {
          setNewPRs(data.personalRecords)
          setShowPRCelebration(true)
          // Auto-hide after 5 seconds
          setTimeout(() => setShowPRCelebration(false), 5000)
        }

        // Update local state
        setSetLogs(prev => ({
          ...prev,
          [exerciseId]: [
            ...(prev[exerciseId] || []),
            { exerciseId, setNumber, reps, weightKg: weight, completed: true }
          ]
        }))

        // Clear form
        setCurrentReps('')
        setCurrentWeight('')

        // Check if we should move to next exercise
        const exercise = workoutDay?.exercises[currentExerciseIndex]
        if (exercise && setLogs[exerciseId]?.length + 1 >= exercise.sets) {
          // All sets complete for this exercise
          if (currentExerciseIndex < (workoutDay?.exercises.length || 0) - 1) {
            // Move to next exercise
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
            setIsResting(true)
          }
        }
      }
    } catch (error) {
      console.error('Error logging set:', error)
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
          notes: workoutNotes || null
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[rgba(255,215,0,0.3)] border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  if (!workoutDay) {
    return (
      <div className="space-y-6">
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardContent className="py-12 text-center">
            <p className="text-[rgba(255,255,255,0.6)]">
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
      {/* PR Celebration */}
      {showPRCelebration && newPRs.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(255,215,0,0.6)] border-4 border-[#FFD700]">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <div>
                <div className="text-xl font-bold">🎉 NEW PERSONAL RECORD! 🎉</div>
                {newPRs.map((pr, idx) => (
                  <div key={idx} className="text-sm font-semibold">
                    {pr.recordType === 'max_weight' && `Max Weight: ${pr.newValue}kg`}
                    {pr.recordType === 'max_reps' && `Max Reps: ${pr.newValue}`}
                    {pr.recordType === 'max_volume' && `Max Volume: ${pr.newValue.toFixed(0)}kg`}
                    {pr.recordType === 'max_one_rep_max' && `Est. 1RM: ${pr.newValue.toFixed(1)}kg`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/workout">
            <Button variant="ghost" size="icon" className="text-[rgba(255,255,255,0.7)]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">
              {workoutDay.name}
            </h1>
            <p className="text-sm text-[rgba(255,255,255,0.5)]">
              Dag {workoutDay.dayNumber}
            </p>
          </div>
        </div>

        {!sessionId ? (
          <Button
            onClick={startSession}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          >
            <Play className="w-4 h-4 mr-2" />
            Starta träning
          </Button>
        ) : null}
      </div>

      {/* Timer & Progress */}
      {sessionId && (
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Tid</p>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-[#FFD700]" />
                  <p className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">
                    {formatTime(elapsedSeconds)}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Sets klara</p>
                <p className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">
                  {totalSetsCompleted}/{totalSets}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Övningar</p>
                <p className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">
                  {currentExerciseIndex + 1}/{workoutDay.exercises.length}
                </p>
              </div>
              {isResting && (
                <div className="text-center">
                  <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Vila</p>
                  <div className="flex items-center justify-center gap-2">
                    <Pause className="w-4 h-4 text-[#fb923c]" />
                    <p className="text-2xl font-bold text-[#fb923c]">
                      {formatTime(restTimerSeconds)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {workoutDay.exercises.map((exercise, index) => {
          const isExpanded = expandedExercises.has(index)
          const isCurrent = index === currentExerciseIndex
          const exerciseSets = setLogs[exercise.exercise.id] || []
          const isExerciseComplete = exerciseSets.length >= exercise.sets

          return (
            <Card
              key={exercise.id}
              className={`bg-[rgba(255,255,255,0.03)] border-2 backdrop-blur-[10px] transition-all ${
                isCurrent && sessionId
                  ? 'border-[rgba(255,215,0,0.5)] shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                  : 'border-[rgba(255,215,0,0.2)]'
              } ${isExerciseComplete ? 'opacity-60' : ''}`}
            >
              <CardHeader>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExercise(index)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isExerciseComplete
                        ? 'bg-[rgba(34,197,94,0.2)]'
                        : isCurrent
                        ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500]'
                        : 'bg-[rgba(255,255,255,0.05)]'
                    }`}>
                      {isExerciseComplete ? (
                        <Check className="w-5 h-5 text-[#22c55e]" />
                      ) : (
                        <Dumbbell className={`w-5 h-5 ${isCurrent ? 'text-[#0a0a0a]' : 'text-[rgba(255,255,255,0.5)]'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-[rgba(255,255,255,0.9)]">
                          {exercise.exercise.name}
                        </CardTitle>
                        {isCurrent && sessionId && !isExerciseComplete && (
                          <Badge className="bg-[rgba(255,215,0,0.2)] text-[#FFD700] border-[rgba(255,215,0,0.3)]">
                            Aktiv
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[rgba(255,255,255,0.5)]">
                        {exercise.sets} x {exercise.repsMin}
                        {exercise.repsMax && exercise.repsMax !== exercise.repsMin ? `-${exercise.repsMax}` : ''} reps
                        {exercise.restSeconds > 0 && ` • ${exercise.restSeconds}s vila`}
                      </p>
                      {exercise.exercise.muscleGroups.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exercise.exercise.muscleGroups.map(mg => (
                            <Badge
                              key={mg}
                              variant="outline"
                              className="text-xs bg-[rgba(255,215,0,0.05)] border-[rgba(255,215,0,0.2)] text-[rgba(255,215,0,0.8)]"
                            >
                              {mg}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[rgba(255,255,255,0.5)]">
                      {exerciseSets.length}/{exercise.sets}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[rgba(255,255,255,0.5)]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[rgba(255,255,255,0.5)]" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Logged Sets */}
                  {exerciseSets.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-[rgba(255,255,255,0.6)]">Genomförda sets:</Label>
                      {exerciseSets.map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className="flex items-center gap-3 p-2 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded"
                        >
                          <Check className="w-4 h-4 text-[#22c55e]" />
                          <span className="text-sm text-[rgba(255,255,255,0.8)]">
                            Set {set.setNumber}:
                          </span>
                          <span className="text-sm font-semibold text-[rgba(255,255,255,0.9)]">
                            {set.reps || 0} reps
                          </span>
                          {set.weightKg && (
                            <>
                              <span className="text-sm text-[rgba(255,255,255,0.5)]">@</span>
                              <span className="text-sm font-semibold text-[rgba(255,255,255,0.9)]">
                                {set.weightKg} kg
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Log Next Set */}
                  {sessionId && !isExerciseComplete && (
                    <div className="space-y-3 p-4 bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
                      <Label className="text-[rgba(255,255,255,0.8)]">
                        Logga set {exerciseSets.length + 1}:
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-[rgba(255,255,255,0.6)]">Reps</Label>
                          <Input
                            type="number"
                            value={currentReps}
                            onChange={(e) => setCurrentReps(e.target.value)}
                            placeholder={`${exercise.repsMin || 0}`}
                            className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-[rgba(255,255,255,0.6)]">Vikt (kg)</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={currentWeight}
                            onChange={(e) => setCurrentWeight(e.target.value)}
                            placeholder="0"
                            className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white mt-1"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => logSet(exercise.exercise.id, exercise.id, exerciseSets.length + 1)}
                        disabled={!currentReps}
                        className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Logga set
                      </Button>
                    </div>
                  )}

                  {exercise.exercise.description && (
                    <div className="p-3 bg-[rgba(255,255,255,0.03)] rounded border border-[rgba(255,215,0,0.1)]">
                      <Label className="text-sm text-[rgba(255,255,255,0.6)]">Beskrivning:</Label>
                      <p className="text-sm text-[rgba(255,255,255,0.8)] mt-1">
                        {exercise.exercise.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Workout Notes & Complete */}
      {sessionId && isWorkoutComplete && (
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(34,197,94,0.3)]">
          <CardHeader>
            <CardTitle className="text-[rgba(255,255,255,0.95)] flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#22c55e]" />
              Bra jobbat! Alla övningar klara
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[rgba(255,255,255,0.8)]">
                Anteckningar (valfritt)
              </Label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="Hur kändes passet? Några nya personliga rekord eller observationer?"
                className="w-full mt-2 p-3 bg-[rgba(0,0,0,0.3)] border-2 border-[rgba(255,215,0,0.3)] rounded-xl text-white placeholder-[rgba(255,255,255,0.4)] focus:border-[rgba(255,215,0,0.5)] outline-none min-h-[100px] resize-y"
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
    </div>
  )
}
