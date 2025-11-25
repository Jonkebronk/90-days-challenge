'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Dumbbell, TrendingUp, ChevronRight, Star, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
        session.workoutProgramDay.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">
            Träningshistorik
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Följ din utveckling och se dina tidigare pass
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">Pass</div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {stats.totalWorkouts}
            </div>
          </div>

          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">Set</div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {stats.totalSets}
            </div>
          </div>

          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">Volym</div>
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white">
              {stats.totalVolume.toLocaleString('sv-SE')}
            </div>
          </div>

          <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 backdrop-blur-[10px]">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">Tid</div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {stats.avgDuration}<span className="text-sm sm:text-base text-gray-400 ml-1">min</span>
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
                className="pl-10 sm:pl-12 bg-white/5 border-2 border-gold-primary/20 text-white placeholder:text-gray-500 h-10 sm:h-12 text-sm sm:text-base focus:border-gold-primary/50"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 sm:h-12 px-3 sm:px-6 bg-white/5 border-2 border-gold-primary/20 text-white hover:bg-white/10 hover:border-gold-primary/50"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline ml-2">Filter</span>
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1 sm:ml-2" /> : <ChevronDown className="w-4 h-4 ml-1 sm:ml-2" />}
            </Button>
          </div>

          {showFilters && (
            <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-3 sm:p-4 backdrop-blur-[10px]">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  variant={dateFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setDateFilter('all')}
                  size="sm"
                  className={`text-xs sm:text-sm ${dateFilter === 'all'
                    ? 'bg-gradient-to-r from-gold-light to-orange-500 text-black hover:opacity-90'
                    : 'bg-white/5 border-gold-primary/20 text-white hover:bg-white/10'
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
                    : 'bg-white/5 border-gold-primary/20 text-white hover:bg-white/10'
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
                    : 'bg-white/5 border-gold-primary/20 text-white hover:bg-white/10'
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
                    : 'bg-white/5 border-gold-primary/20 text-white hover:bg-white/10'
                  }`}
                >
                  90 dagar
                </Button>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="text-gray-400 text-sm">
            Visar {filteredSessions.length} av {sessions.length} pass
          </div>
        </div>

        {/* Session List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl sm:rounded-2xl p-8 sm:p-12 backdrop-blur-[10px] text-center">
              <Dumbbell className="w-12 h-12 sm:w-16 sm:h-16 text-[rgba(255,255,255,0.3)] mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-100 mb-2">
                Ingen träningshistorik ännu
              </h3>
              <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
                Starta ditt första träningspass för att börja spåra din utveckling
              </p>
              <button
                onClick={() => router.push('/dashboard/workout')}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gold-light to-orange-500 text-black font-semibold rounded-lg sm:rounded-xl hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all text-sm sm:text-base"
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
                className="group bg-white/5 border-2 border-gold-primary/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-xl font-semibold text-white mb-1 truncate">
                      {session.workoutProgramDay.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
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
                      <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 bg-[rgba(255,215,0,0.1)] border border-gold-primary/30 rounded-full">
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
                      <div className="px-2 sm:px-3 py-1 bg-[rgba(34,197,94,0.2)] border border-[rgba(34,197,94,0.4)] rounded-full text-green-500 text-xs sm:text-sm font-medium">
                        Klar
                      </div>
                    ) : (
                      <div className="px-2 sm:px-3 py-1 bg-[rgba(251,191,36,0.2)] border border-[rgba(251,191,36,0.4)] rounded-full text-[#fbbf24] text-xs sm:text-sm font-medium">
                        Påbörjat
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[rgba(255,215,0,0.5)] group-hover:translate-x-1 group-hover:text-gold-light transition-all hidden sm:block" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-4">
                    <div className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Övningar</div>
                    <div className="text-base sm:text-lg font-semibold text-white">
                      {getUniqueExercises(session.sets).length}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-4">
                    <div className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Set</div>
                    <div className="text-base sm:text-lg font-semibold text-white">
                      {session.sets.filter(s => s.completed).length}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-4">
                    <div className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Volym</div>
                    <div className="text-sm sm:text-lg font-semibold text-white">
                      {calculateSessionVolume(session.sets).toLocaleString('sv-SE')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {getUniqueExercises(session.sets).slice(0, 3).map((exercise, idx) => (
                    <div
                      key={idx}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.3)] rounded-full text-[rgba(139,92,246,0.9)] text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none"
                    >
                      {exercise}
                    </div>
                  ))}
                  {getUniqueExercises(session.sets).length > 3 && (
                    <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[rgba(255,255,255,0.05)] rounded-full text-gray-400 text-xs sm:text-sm">
                      +{getUniqueExercises(session.sets).length - 3} till
                    </div>
                  )}
                </div>

                {(session.notes || session.ratingComment) && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[rgba(255,255,255,0.1)] space-y-2 sm:space-y-3">
                    {session.notes && (
                      <div>
                        <div className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Anteckningar</div>
                        <div className="text-gray-200 text-xs sm:text-sm">{session.notes}</div>
                      </div>
                    )}
                    {session.ratingComment && (
                      <div>
                        <div className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#FFD700] text-gold-light" />
                          Passkommentar
                        </div>
                        <div className="text-gray-200 text-xs sm:text-sm italic">{session.ratingComment}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Expansion Toggle */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[rgba(255,255,255,0.1)] flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => toggleSessionExpansion(session.id, e)}
                    className="flex items-center gap-1 sm:gap-2 text-gold-light hover:text-gold-primary transition-colors"
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
                    onClick={() => router.push(`/dashboard/workout/session/completed/${session.id}`)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 border border-gold-primary/30 hover:border-gold-primary/60 rounded-lg text-white text-xs sm:text-sm font-medium transition-all"
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
                      <div key={exerciseName} className="bg-black/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <h4 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{exerciseName}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                          {sets.map((set, idx) => (
                            <div
                              key={idx}
                              className="bg-white/5 rounded-lg p-2 sm:p-3 border border-gold-primary/20"
                            >
                              <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Set {set.setNumber}</div>
                              <div className="text-white font-medium text-xs sm:text-sm">
                                {set.reps && set.weightKg && (
                                  <span>{set.reps}×{set.weightKg}kg</span>
                                )}
                                {set.timeSeconds && (
                                  <span>{set.timeSeconds}s</span>
                                )}
                                {!set.reps && !set.weightKg && !set.timeSeconds && (
                                  <span className="text-gray-500">-</span>
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
    </div>
  )
}
