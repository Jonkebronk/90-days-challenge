'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, Dumbbell, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
}

interface WorkoutSet {
  id: string
  exerciseId: string
  setNumber: number
  reps: number | null
  weightKg: number | null
  timeSeconds: number | null
  completed: boolean
  notes: string | null
  exercise: Exercise
}

interface WorkoutProgramExercise {
  id: string
  sets: number
  repsMin: number | null
  repsMax: number | null
  restSeconds: number
  notes: string | null
  exercise: Exercise
}

interface WorkoutProgramDay {
  name: string
  dayNumber: number
  exercises: WorkoutProgramExercise[]
}

interface WorkoutSession {
  id: string
  startedAt: string
  completedAt: string | null
  durationMinutes: number | null
  completed: boolean
  notes: string | null
  workoutProgramDay: WorkoutProgramDay
  sets: WorkoutSet[]
}

export default function CompletedSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      const { sessionId } = await params
      fetchSession(sessionId)
    }
    loadSession()
  }, [params])

  const fetchSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSession(data.session)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getExerciseSets = (exerciseId: string) => {
    return session?.sets.filter(s => s.exerciseId === exerciseId && s.completed) || []
  }

  const calculateTotalVolume = () => {
    if (!session) return 0
    return session.sets.reduce((acc, set) => {
      if (set.reps && set.weightKg) {
        return acc + (set.reps * Number(set.weightKg))
      }
      return acc
    }, 0)
  }

  const getUniqueExercises = () => {
    if (!session) return []
    const exerciseMap = new Map()
    session.sets.forEach(set => {
      if (!exerciseMap.has(set.exerciseId)) {
        exerciseMap.set(set.exerciseId, set.exercise)
      }
    })
    return Array.from(exerciseMap.values())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-[rgba(255,255,255,0.6)]">Laddar träningspass...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-[rgba(255,255,255,0.6)]">Träningspass hittades inte</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/workout/history')}
            className="mb-4 text-[rgba(255,255,255,0.7)] hover:text-[rgba(255,255,255,0.9)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till historik
          </Button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-black" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-[rgba(255,255,255,0.95)] mb-2">
                {session.workoutProgramDay.name}
              </h1>
              <div className="flex items-center gap-4 text-[rgba(255,255,255,0.6)]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(session.startedAt)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(session.startedAt)}
                </div>
              </div>
            </div>
            {session.completed && (
              <div className="px-4 py-2 bg-[rgba(34,197,94,0.2)] border-2 border-[rgba(34,197,94,0.4)] rounded-xl text-[#22c55e] font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Genomfört
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                <Clock className="w-5 h-5 text-black" />
              </div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm">Tid</div>
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {session.durationMinutes ? `${session.durationMinutes} min` : '-'}
            </div>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm">Totala Set</div>
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {session.sets.filter(s => s.completed).length}
            </div>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm">Total Volym</div>
            </div>
            <div className="text-3xl font-bold text-[rgba(255,255,255,0.95)]">
              {calculateTotalVolume().toLocaleString('sv-SE')} kg
            </div>
          </div>
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-6 backdrop-blur-[10px] mb-8">
            <h3 className="text-lg font-semibold text-[rgba(255,255,255,0.9)] mb-3">Anteckningar</h3>
            <p className="text-[rgba(255,255,255,0.7)]">{session.notes}</p>
          </div>
        )}

        {/* Exercises */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[rgba(255,255,255,0.95)]">Övningar</h2>

          {getUniqueExercises().map((exercise) => {
            const sets = getExerciseSets(exercise.id)

            return (
              <div
                key={exercise.id}
                className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-6 backdrop-blur-[10px]"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-[rgba(255,255,255,0.95)] mb-2">
                    {exercise.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {exercise.muscleGroups.map((muscle: string, idx: number) => (
                      <div
                        key={idx}
                        className="px-3 py-1 bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.3)] rounded-full text-[rgba(139,92,246,0.9)] text-sm"
                      >
                        {muscle}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {sets.map((set) => (
                    <div
                      key={set.id}
                      className="bg-[rgba(255,255,255,0.02)] rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center">
                          <span className="text-white font-bold">{set.setNumber}</span>
                        </div>
                        <div className="flex gap-8">
                          {set.reps !== null && (
                            <div>
                              <div className="text-[rgba(255,255,255,0.5)] text-sm">Reps</div>
                              <div className="text-[rgba(255,255,255,0.9)] font-semibold">{set.reps}</div>
                            </div>
                          )}
                          {set.weightKg !== null && (
                            <div>
                              <div className="text-[rgba(255,255,255,0.5)] text-sm">Vikt (kg)</div>
                              <div className="text-[rgba(255,255,255,0.9)] font-semibold">{set.weightKg}</div>
                            </div>
                          )}
                          {set.timeSeconds !== null && (
                            <div>
                              <div className="text-[rgba(255,255,255,0.5)] text-sm">Tid</div>
                              <div className="text-[rgba(255,255,255,0.9)] font-semibold">
                                {formatDuration(set.timeSeconds)}
                              </div>
                            </div>
                          )}
                          {set.reps && set.weightKg && (
                            <div>
                              <div className="text-[rgba(255,255,255,0.5)] text-sm">Volym</div>
                              <div className="text-[rgba(255,255,255,0.9)] font-semibold">
                                {(set.reps * Number(set.weightKg)).toFixed(0)} kg
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {set.notes && (
                        <div className="text-[rgba(255,255,255,0.6)] text-sm italic">
                          {set.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
