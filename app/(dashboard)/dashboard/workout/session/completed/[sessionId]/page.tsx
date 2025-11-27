'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, Dumbbell, CheckCircle2, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  reps: string | null
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
  const [sessionId, setSessionId] = useState<string>('')

  // Edit/Delete set state
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null)
  const [editReps, setEditReps] = useState<string>('')
  const [editWeight, setEditWeight] = useState<string>('')
  const [deletingSet, setDeletingSet] = useState<WorkoutSet | null>(null)
  const [isUpdatingSet, setIsUpdatingSet] = useState(false)

  useEffect(() => {
    const loadSession = async () => {
      const { sessionId: id } = await params
      setSessionId(id)
      fetchSession(id)
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

  // Edit a set
  const openEditModal = (set: WorkoutSet) => {
    setEditingSet(set)
    setEditReps(set.reps?.toString() || '')
    setEditWeight(set.weightKg?.toString() || set.notes || '')
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
        // Refresh session data
        await fetchSession(sessionId)
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
        // Refresh session data
        await fetchSession(sessionId)
        setDeletingSet(null)
      }
    } catch (error) {
      console.error('Error deleting set:', error)
    } finally {
      setIsUpdatingSet(false)
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
        <div className="text-gray-400">Laddar träningspass...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Träningspass hittades inte</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/workout/history')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Tillbaka</span>
        </button>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center shadow-md">
                <Dumbbell className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
              </div>
              <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl md:text-3xl font-black tracking-[1px] sm:tracking-[2px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                {session.workoutProgramDay.name}
              </h1>
              {session.completed && (
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 border border-green-200 rounded-full text-green-600 font-semibold flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  Genomfört
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center gap-1 sm:gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                {formatDate(session.startedAt)}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                {formatTime(session.startedAt)}
              </div>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center shadow-md">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">Tid</div>
            </div>
            <div className="text-xl sm:text-3xl font-bold text-gray-900">
              {session.durationMinutes ? `${session.durationMinutes}` : '-'}<span className="text-xs sm:text-sm text-gray-500 ml-1">min</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-gold-primary hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shadow-md">
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">Set</div>
            </div>
            <div className="text-xl sm:text-3xl font-bold text-gray-900">
              {session.sets.filter(s => s.completed).length}
            </div>
          </div>
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Anteckningar</h3>
            <p className="text-gray-600 text-sm sm:text-base">{session.notes}</p>
          </div>
        )}

        {/* Exercises */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Övningar</h2>

          {getUniqueExercises().map((exercise) => {
            const sets = getExerciseSets(exercise.id)

            return (
              <div
                key={exercise.id}
                className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-gold-primary hover:shadow-lg transition-all"
              >
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
                    {exercise.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {exercise.muscleGroups.map((muscle: string, idx: number) => (
                      <div
                        key={idx}
                        className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-50 border border-purple-200 rounded-full text-purple-600 text-xs sm:text-sm"
                      >
                        {muscle}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {sets.map((set) => (
                    <div
                      key={set.id}
                      className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm sm:text-base">{set.setNumber}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 sm:gap-8 flex-1 min-w-0">
                          {set.reps !== null && (
                            <div>
                              <div className="text-gray-500 text-xs sm:text-sm">Reps</div>
                              <div className="text-gray-900 font-semibold text-sm sm:text-base">{set.reps}</div>
                            </div>
                          )}
                          {set.weightKg !== null && (
                            <div>
                              <div className="text-gray-500 text-xs sm:text-sm">Vikt</div>
                              <div className="text-gray-900 font-semibold text-sm sm:text-base">{set.notes || set.weightKg}kg</div>
                            </div>
                          )}
                          {set.timeSeconds !== null && (
                            <div>
                              <div className="text-gray-500 text-xs sm:text-sm">Tid</div>
                              <div className="text-gray-900 font-semibold text-sm sm:text-base">
                                {formatDuration(set.timeSeconds)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {set.notes && !set.weightKg && (
                          <div className="text-gray-500 text-xs sm:text-sm italic mr-1 sm:mr-2 hidden sm:block">
                            {set.notes}
                          </div>
                        )}
                        <button
                          onClick={() => openEditModal(set)}
                          className="p-1.5 sm:p-2 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 hover:bg-gray-200 transition-all"
                          title="Redigera set"
                        >
                          <Pencil className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                        </button>
                        <button
                          onClick={() => setDeletingSet(set)}
                          className="p-1.5 sm:p-2 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-100 transition-all"
                          title="Ta bort set"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
    </div>
  )
}
