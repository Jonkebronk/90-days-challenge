'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Dumbbell, TrendingUp, ChevronRight, Star, Search, Filter, ChevronDown, ChevronUp, Trash2, X, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
  workoutProgramDay: WorkoutProgramDay | null
  sets: WorkoutSet[]
}

export default function WorkoutHistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalSets: 0,
    totalVolume: 0,
    avgDuration: 0
  })

  // Filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Expansion state
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  // Delete confirmation state
  const [deletingSession, setDeletingSession] = useState<WorkoutSession | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [sessions, searchQuery, dateFilter])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/workout-sessions?limit=100')
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

  const applyFilters = () => {
    let filtered = [...sessions]

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(session =>
        session.workoutProgramDay?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const daysAgo = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.startedAt)
        return sessionDate >= cutoffDate
      })
    }

    setFilteredSessions(filtered)
  }

  const toggleSessionExpansion = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setExpandedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const deleteSession = async () => {
    if (!deletingSession) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/workout-sessions/${deletingSession.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from local state
        setSessions(prev => prev.filter(s => s.id !== deletingSession.id))
        setDeletingSession(null)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    } finally {
      setIsDeleting(false)
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
    <div className="min-h-screen bg-gray-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/workout')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Tillbaka</span>
        </button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
            Träningshistorik
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
            Följ din utveckling och se dina tidigare pass
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center shadow-md">
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">Pass</div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {stats.totalWorkouts}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shadow-md">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">Set</div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {stats.totalSets}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-md">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">Tid</div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {stats.avgDuration}<span className="text-sm sm:text-base text-gray-500 ml-1">min</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Sök pass..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 h-10 sm:h-12 text-sm sm:text-base focus:border-gold-primary"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 sm:h-12 px-3 sm:px-6 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gold-primary"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline ml-2">Filter</span>
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1 sm:ml-2" /> : <ChevronDown className="w-4 h-4 ml-1 sm:ml-2" />}
            </Button>
          </div>

          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  variant={dateFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setDateFilter('all')}
                  size="sm"
                  className={`text-xs sm:text-sm ${dateFilter === 'all'
                    ? 'bg-gradient-to-r from-gold-light to-orange-500 text-black hover:opacity-90'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Alla
                </Button>
                <Button
                  variant={dateFilter === '7days' ? 'default' : 'outline'}
                  onClick={() => setDateFilter('7days')}
                  size="sm"
                  className={`text-xs sm:text-sm ${dateFilter === '7days'
                    ? 'bg-gradient-to-r from-gold-light to-orange-500 text-black hover:opacity-90'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  7 dagar
                </Button>
                <Button
                  variant={dateFilter === '30days' ? 'default' : 'outline'}
                  onClick={() => setDateFilter('30days')}
                  size="sm"
                  className={`text-xs sm:text-sm ${dateFilter === '30days'
                    ? 'bg-gradient-to-r from-gold-light to-orange-500 text-black hover:opacity-90'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  30 dagar
                </Button>
                <Button
                  variant={dateFilter === '90days' ? 'default' : 'outline'}
                  onClick={() => setDateFilter('90days')}
                  size="sm"
                  className={`text-xs sm:text-sm ${dateFilter === '90days'
                    ? 'bg-gradient-to-r from-gold-light to-orange-500 text-black hover:opacity-90'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  90 dagar
                </Button>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="text-gray-500 text-sm">
            Visar {filteredSessions.length} av {sessions.length} pass
          </div>
        </div>

        {/* Session List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
              <Dumbbell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Ingen träningshistorik ännu
              </h3>
              <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
                Starta ditt första träningspass för att börja spåra din utveckling
              </p>
              <button
                onClick={() => router.push('/dashboard/workout')}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gold-light to-orange-500 text-black font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
              >
                Gå till Träningsprogram
              </button>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isExpanded = expandedSessions.has(session.id)
              const exercisesBySets: Record<string, WorkoutSet[]> = {}
              session.sets.forEach(set => {
                if (!exercisesBySets[set.exercise.name]) {
                  exercisesBySets[set.exercise.name] = []
                }
                exercisesBySets[set.exercise.name].push(set)
              })

              return (
              <div
                key={session.id}
                className="group bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-gold-primary hover:shadow-lg transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-1 truncate">
                      {session.workoutProgramDay?.name || 'Träningspass'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        {formatDate(session.startedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        {formatTime(session.startedAt)}
                      </div>
                      {session.durationMinutes && (
                        <div className="flex items-center gap-1">
                          <span>{session.durationMinutes} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    {session.rating && (
                      <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 bg-gold-50 border border-gold-primary/30 rounded-full">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                              i < session.rating!
                                ? 'fill-[#FFD700] text-gold-light'
                                : 'text-[rgba(255,215,0,0.3)]'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {session.completed ? (
                      <div className="px-2 sm:px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-600 text-xs sm:text-sm font-medium">
                        Klar
                      </div>
                    ) : (
                      <div className="px-2 sm:px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-600 text-xs sm:text-sm font-medium">
                        Påbörjat
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gold-primary/50 group-hover:translate-x-1 group-hover:text-gold-primary transition-all hidden sm:block" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4">
                    <div className="text-gray-500 text-xs sm:text-sm mb-0.5 sm:mb-1">Övningar</div>
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {getUniqueExercises(session.sets).length}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4">
                    <div className="text-gray-500 text-xs sm:text-sm mb-0.5 sm:mb-1">Set</div>
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {session.sets.filter(s => s.completed).length}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {getUniqueExercises(session.sets).slice(0, 3).map((exercise, idx) => (
                    <div
                      key={idx}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-50 border border-purple-200 rounded-full text-purple-600 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none"
                    >
                      {exercise}
                    </div>
                  ))}
                  {getUniqueExercises(session.sets).length > 3 && (
                    <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 rounded-full text-gray-500 text-xs sm:text-sm">
                      +{getUniqueExercises(session.sets).length - 3} till
                    </div>
                  )}
                </div>

                {(session.notes || session.ratingComment) && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 space-y-2 sm:space-y-3">
                    {session.notes && (
                      <div>
                        <div className="text-gray-500 text-xs sm:text-sm mb-0.5 sm:mb-1">Anteckningar</div>
                        <div className="text-gray-700 text-xs sm:text-sm">{session.notes}</div>
                      </div>
                    )}
                    {session.ratingComment && (
                      <div>
                        <div className="text-gray-500 text-xs sm:text-sm mb-0.5 sm:mb-1 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-gold-primary text-gold-primary" />
                          Passkommentar
                        </div>
                        <div className="text-gray-700 text-xs sm:text-sm italic">{session.ratingComment}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Expansion Toggle */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleSessionExpansion(session.id, e)}
                      className="flex items-center gap-1 sm:gap-2 text-gold-primary hover:text-gold-600 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-xs sm:text-sm font-medium">Dölj</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-xs sm:text-sm font-medium">Detaljer</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingSession(session)
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Ta bort pass"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/workout/session/completed/${session.id}`)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 hover:bg-gray-100 border border-gold-primary/30 hover:border-gold-primary rounded-lg text-gray-700 text-xs sm:text-sm font-medium transition-all"
                  >
                    <span className="sm:hidden">Sammanfattning</span>
                    <span className="hidden sm:inline">Se fullständig sammanfattning</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                    {Object.entries(exercisesBySets).map(([exerciseName, sets]) => (
                      <div key={exerciseName} className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <h4 className="text-gray-900 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{exerciseName}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                          {sets.map((set, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200"
                            >
                              <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Set {set.setNumber}</div>
                              <div className="text-gray-900 font-medium text-xs sm:text-sm">
                                {set.reps && set.weightKg && (
                                  <span>{set.reps}×{set.weightKg}kg</span>
                                )}
                                {set.timeSeconds && (
                                  <span>{set.timeSeconds}s</span>
                                )}
                                {!set.reps && !set.weightKg && !set.timeSeconds && (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingSession && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[rgba(10,10,10,0.98)] border-2 border-red-500/30 backdrop-blur-[10px] w-full max-w-md rounded-2xl">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  Ta bort träningspass?
                </h3>
                <button
                  onClick={() => setDeletingSession(null)}
                  className="text-gray-500 hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Är du säker på att du vill ta bort detta pass? Detta kan inte ångras.
              </p>
              <div className="p-3 bg-white/5 rounded-lg mb-6">
                <p className="text-white font-medium text-sm sm:text-base">{deletingSession.workoutProgramDay?.name || 'Träningspass'}</p>
                <p className="text-gray-400 text-xs sm:text-sm">{formatDate(deletingSession.startedAt)}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setDeletingSession(null)}
                  variant="outline"
                  className="flex-1 bg-[rgba(255,255,255,0.05)] border-gray-500/30 text-gray-200 hover:bg-[rgba(255,255,255,0.1)]"
                  disabled={isDeleting}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={deleteSession}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-90"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Tar bort...' : 'Ta bort'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
