'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Calendar, Play, Coffee, ChevronRight, History, Trophy, BarChart3 } from 'lucide-react'
import Link from 'next/link'

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
  repsMin: number | null
  repsMax: number | null
  exercise: {
    id: string
    name: string
    muscleGroups: string[]
  }
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
    days: WorkoutDay[]
  }
}

export default function WorkoutPage() {
  const { data: session } = useSession()
  const [assignment, setAssignment] = useState<AssignedWorkout | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignment()
  }, [])

  const fetchAssignment = async () => {
    try {
      const userId = (session?.user as any)?.id
      if (!userId) return

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[rgba(255,215,0,0.3)] border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
              Träningsprogram
            </h1>
            <p className="text-[rgba(255,255,255,0.6)] mt-1">
              Ditt personliga träningsprogram
            </p>
          </div>
          <Link href="/dashboard/workout/history">
            <Button variant="outline" className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)]">
              <History className="w-4 h-4 mr-2" />
              Historik
            </Button>
          </Link>
        </div>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-16 h-16 text-[rgba(255,215,0,0.3)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[rgba(255,255,255,0.9)] mb-2">
              Inget träningsprogram tilldelat
            </h3>
            <p className="text-[rgba(255,255,255,0.6)] max-w-md mx-auto">
              Din coach har inte tilldelat ett träningsprogram till dig ännu. Kontakta din coach för att få ett program.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { workoutProgram } = assignment

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
            {workoutProgram.name}
          </h1>
          {workoutProgram.description && (
            <p className="text-[rgba(255,255,255,0.6)] mt-1">
              {workoutProgram.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/workout/records">
            <Button variant="outline" className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)]">
              <Trophy className="w-4 h-4 mr-2" />
              Rekord
            </Button>
          </Link>
          <Link href="/dashboard/analytics">
            <Button variant="outline" className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)]">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link href="/dashboard/workout/history">
            <Button variant="outline" className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,215,0,0.5)]">
              <History className="w-4 h-4 mr-2" />
              Historik
            </Button>
          </Link>
        </div>
      </div>

      {/* Program Info Card */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {workoutProgram.difficulty && (
              <div>
                <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Nivå</p>
                <Badge className={`${
                  workoutProgram.difficulty === 'beginner'
                    ? 'bg-[rgba(40,167,69,0.2)] text-[#28a745] border-[rgba(40,167,69,0.3)]'
                    : workoutProgram.difficulty === 'intermediate'
                    ? 'bg-[rgba(255,193,7,0.2)] text-[#ffc107] border-[rgba(255,193,7,0.3)]'
                    : 'bg-[rgba(220,53,69,0.2)] text-[#dc3545] border-[rgba(220,53,69,0.3)]'
                }`}>
                  {workoutProgram.difficulty}
                </Badge>
              </div>
            )}
            <div>
              <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Totalt dagar</p>
              <p className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">
                {workoutProgram.days.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Träningsdagar</p>
              <p className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">
                {workoutProgram.days.filter(d => !d.isRestDay).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-[rgba(255,255,255,0.5)] mb-1">Startdatum</p>
              <p className="text-[rgba(255,255,255,0.9)]">
                {new Date(assignment.startDate).toLocaleDateString('sv-SE')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Days List */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#FFD700]" />
          Träningsschema
        </h2>

        {workoutProgram.days.map((day) => (
          <Card
            key={day.id}
            className={`bg-[rgba(255,255,255,0.03)] border-2 backdrop-blur-[10px] transition-all ${
              day.isRestDay
                ? 'border-[rgba(100,100,100,0.2)] hover:border-[rgba(100,100,100,0.3)]'
                : 'border-[rgba(255,215,0,0.2)] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]'
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    day.isRestDay
                      ? 'bg-[rgba(100,100,100,0.2)]'
                      : 'bg-gradient-to-br from-[#FFD700] to-[#FFA500]'
                  }`}>
                    {day.isRestDay ? (
                      <Coffee className="w-6 h-6 text-[rgba(255,255,255,0.6)]" />
                    ) : (
                      <Dumbbell className="w-6 h-6 text-[#0a0a0a]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[rgba(255,255,255,0.5)]">
                        Dag {day.dayNumber}
                      </span>
                      {day.isRestDay && (
                        <Badge variant="outline" className="bg-[rgba(100,100,100,0.1)] border-[rgba(100,100,100,0.3)] text-[rgba(255,255,255,0.6)]">
                          Vilodag
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg text-[rgba(255,255,255,0.9)]">
                      {day.name}
                    </CardTitle>
                    {day.description && (
                      <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">
                        {day.description}
                      </p>
                    )}
                  </div>
                </div>

                {!day.isRestDay && (
                  <Link href={`/dashboard/workout/session/${day.id}`}>
                    <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90">
                      <Play className="w-4 h-4 mr-2" />
                      Starta
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>

            {!day.isRestDay && day.exercises && day.exercises.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-[rgba(255,255,255,0.5)] mb-2">
                    {day.exercises.length} övningar
                  </p>
                  <div className="space-y-1">
                    {day.exercises.slice(0, 3).map((ex, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.7)]"
                      >
                        <ChevronRight className="w-3 h-3 text-[rgba(255,215,0,0.5)]" />
                        <span>{ex.exercise.name}</span>
                        <span className="text-[rgba(255,255,255,0.5)]">
                          {ex.sets} x {ex.repsMin}{ex.repsMax && ex.repsMax !== ex.repsMin ? `-${ex.repsMax}` : ''}
                        </span>
                      </div>
                    ))}
                    {day.exercises.length > 3 && (
                      <p className="text-xs text-[rgba(255,255,255,0.4)] ml-5">
                        +{day.exercises.length - 3} fler övningar
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {workoutProgram.days.length === 0 && (
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="py-12 text-center">
            <p className="text-[rgba(255,255,255,0.6)]">
              Det finns inga dagar i detta träningsprogram än.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
