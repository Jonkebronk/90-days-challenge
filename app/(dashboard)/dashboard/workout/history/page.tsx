'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Dumbbell, TrendingUp, ChevronRight, Star } from 'lucide-react'

interface Exercise {
  name: string
}

interface WorkoutSet {
  id: string
  exerciseId: string
  setNumber: number
  reps: number | null
  weightKg: number | null
  timeSeconds: number | null
  completed: boolean
  exercise: Exercise
}

interface WorkoutProgramDay {
  name: string
  dayNumber: number
}

interface WorkoutSession {
  id: string
  startedAt: string
  completedAt: string | null
  durationMinutes: number | null
  completed: boolean
  notes: string | null
  rating: number | null
  ratingComment: string | null
  workoutProgramDay: WorkoutProgramDay
  sets: WorkoutSet[]
}

export default function WorkoutHistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalSets: 0,
    totalVolume: 0,
    avgDuration: 0
  })

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/workout-sessions?limit=50')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
        calculateStats(data.sessions)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (sessions: WorkoutSession[]) => {
    const completedSessions = sessions.filter(s => s.completed)

    const totalSets = completedSessions.reduce((acc, session) => {
      return acc + session.sets.filter(s => s.completed).length
    }, 0)

    const totalVolume = completedSessions.reduce((acc, session) => {
      return acc + session.sets.reduce((setAcc, set) => {
        if (set.reps && set.weightKg) {
          return setAcc + (set.reps * Number(set.weightKg))
        }
        return setAcc
      }, 0)
    }, 0)

    const durationsWithValue = completedSessions.filter(s => s.durationMinutes)
    const avgDuration = durationsWithValue.length > 0
      ? durationsWithValue.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / durationsWithValue.length
      : 0

    setStats({
      totalWorkouts: completedSessions.length,
      totalSets,
      totalVolume: Math.round(totalVolume),
      avgDuration: Math.round(avgDuration)
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
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

  const getUniqueExercises = (sets: WorkoutSet[]) => {
    const uniqueExercises = new Set(sets.map(s => s.exercise.name))
    return Array.from(uniqueExercises)
  }

  const calculateSessionVolume = (sets: WorkoutSet[]) => {
    return sets.reduce((acc, set) => {
      if (set.reps && set.weightKg) {
        return acc + (set.reps * Number(set.weightKg))
      }
      return acc
    }, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Laddar träningshistorik...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Träningshistorik
          </h1>
          <p className="text-gray-400">
            Följ din utveckling och se dina tidigare pass
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-black" />
              </div>
              <div className="text-gray-400 text-sm">Totalt Pass</div>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.totalWorkouts}
            </div>
          </div>

          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-gray-400 text-sm">Totala Set</div>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.totalSets}
            </div>
          </div>

          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-gray-400 text-sm">Total Volym (kg)</div>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.totalVolume.toLocaleString('sv-SE')}
            </div>
          </div>

          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-gray-400 text-sm">Snitt Tid (min)</div>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.avgDuration}
            </div>
          </div>
        </div>

        {/* Session List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-12 backdrop-blur-[10px] text-center">
              <Dumbbell className="w-16 h-16 text-[rgba(255,255,255,0.3)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-100 mb-2">
                Ingen träningshistorik ännu
              </h3>
              <p className="text-gray-400 mb-6">
                Starta ditt första träningspass för att börja spåra din utveckling
              </p>
              <button
                onClick={() => router.push('/dashboard/workout')}
                className="px-6 py-3 bg-gradient-to-r from-gold-light to-orange-500 text-black font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all"
              >
                Gå till Träningsprogram
              </button>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="group bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all cursor-pointer"
                onClick={() => router.push(`/dashboard/workout/session/completed/${session.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {session.workoutProgramDay.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.startedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(session.startedAt)}
                      </div>
                      {session.durationMinutes && (
                        <div className="flex items-center gap-1">
                          <span>{session.durationMinutes} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {session.rating && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-[rgba(255,215,0,0.1)] border border-gold-primary/30 rounded-full">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < session.rating!
                                ? 'fill-[#FFD700] text-gold-light'
                                : 'text-[rgba(255,215,0,0.3)]'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {session.completed ? (
                      <div className="px-3 py-1 bg-[rgba(34,197,94,0.2)] border border-[rgba(34,197,94,0.4)] rounded-full text-green-500 text-sm font-medium">
                        Genomfört
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-[rgba(251,191,36,0.2)] border border-[rgba(251,191,36,0.4)] rounded-full text-[#fbbf24] text-sm font-medium">
                        Påbörjat
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-[rgba(255,215,0,0.5)] group-hover:translate-x-1 group-hover:text-gold-light transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Övningar</div>
                    <div className="text-lg font-semibold text-white">
                      {getUniqueExercises(session.sets).length}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Totala Set</div>
                    <div className="text-lg font-semibold text-white">
                      {session.sets.filter(s => s.completed).length}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Volym (kg)</div>
                    <div className="text-lg font-semibold text-white">
                      {calculateSessionVolume(session.sets).toLocaleString('sv-SE')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {getUniqueExercises(session.sets).slice(0, 5).map((exercise, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.3)] rounded-full text-[rgba(139,92,246,0.9)] text-sm"
                    >
                      {exercise}
                    </div>
                  ))}
                  {getUniqueExercises(session.sets).length > 5 && (
                    <div className="px-3 py-1 bg-[rgba(255,255,255,0.05)] rounded-full text-gray-400 text-sm">
                      +{getUniqueExercises(session.sets).length - 5} till
                    </div>
                  )}
                </div>

                {(session.notes || session.ratingComment) && (
                  <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)] space-y-3">
                    {session.notes && (
                      <div>
                        <div className="text-gray-400 text-sm mb-1">Anteckningar</div>
                        <div className="text-gray-200 text-sm">{session.notes}</div>
                      </div>
                    )}
                    {session.ratingComment && (
                      <div>
                        <div className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#FFD700] text-gold-light" />
                          Passkommentar
                        </div>
                        <div className="text-gray-200 text-sm italic">{session.ratingComment}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
