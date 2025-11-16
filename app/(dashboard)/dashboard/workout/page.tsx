'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Calendar, Play, Coffee, ChevronRight, History, Trophy, BarChart3, Plus, Info } from 'lucide-react'
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

interface WorkoutWeek {
  id: string
  weekNumber: number
  title: string | null
  description: string | null
  days: WorkoutDay[]
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
    weeks?: WorkoutWeek[]
    days: WorkoutDay[]
  }
}

export default function WorkoutPage() {
  const router = useRouter()
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
        <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border-2 border-gray-200 rounded-xl">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
            TRÄNINGSPROGRAM
          </h1>
          <p className="text-gray-600 mt-2">
            Ditt personliga träningsprogram
          </p>
        </div>

        <Card className="bg-white border-2 border-gray-200 hover:border-gold-primary hover:shadow-lg transition-all">
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-16 h-16 text-gold-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Inget träningsprogram tilldelat
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Din coach har inte tilldelat ett träningsprogram till dig ännu. Kontakta din coach för att få ett program.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { workoutProgram } = assignment

  // Determine which days to show based on program structure
  const currentWeek = assignment.currentWeek || 1
  const programHasWeeks = workoutProgram.weeks && workoutProgram.weeks.length > 0
  const currentWeekData = programHasWeeks
    ? workoutProgram.weeks?.find((w: any) => w.weekNumber === currentWeek)
    : null
  const daysToShow = programHasWeeks && currentWeekData
    ? currentWeekData.days
    : workoutProgram.days

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border-2 border-gray-200 rounded-xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
          {workoutProgram.name.toUpperCase()}
        </h1>
        {programHasWeeks && currentWeekData && (
          <p className="text-purple-600 font-semibold mt-2">
            {currentWeekData.title || `Vecka ${currentWeek}`}
            {currentWeekData.description && ` - ${currentWeekData.description}`}
          </p>
        )}
        {workoutProgram.description && (
          <p className="text-gray-600 mt-2">
            {workoutProgram.description}
          </p>
        )}

        {/* Introduction Button */}
        <div className="mt-6">
          <Button
            onClick={() => router.push('/dashboard/workout/guide')}
            variant="outline"
            className="bg-white border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all"
          >
            <Info className="w-4 h-4 mr-2" />
            Introduktion till träningsprogram
          </Button>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Link href="/dashboard/workout/builder">
          <Button className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Skapa pass
          </Button>
        </Link>
        <Link href="/dashboard/workout/templates">
          <Button className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gold-primary/10 hover:border-gold-primary transition-all">
            <Dumbbell className="w-4 h-4 mr-2" />
            Mallar
          </Button>
        </Link>
        <Link href="/dashboard/workout/records">
          <Button className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gold-primary/10 hover:border-gold-primary transition-all">
            <Trophy className="w-4 h-4 mr-2" />
            Rekord
          </Button>
        </Link>
        <Link href="/dashboard/analytics">
          <Button className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gold-primary/10 hover:border-gold-primary transition-all">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </Link>
        <Link href="/dashboard/workout/history">
          <Button className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gold-primary/10 hover:border-gold-primary transition-all">
            <History className="w-4 h-4 mr-2" />
            Historik
          </Button>
        </Link>
      </div>

      {/* Program Info Card */}
      <Card className="bg-white border-2 border-gray-200 hover:border-gold-primary hover:shadow-lg transition-all">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {workoutProgram.difficulty && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Nivå</p>
                <Badge className={`${
                  workoutProgram.difficulty === 'BEGINNER'
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : workoutProgram.difficulty === 'INTERMEDIATE'
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    : workoutProgram.difficulty === 'ADVANCED'
                    ? 'bg-red-100 text-red-700 border-red-200'
                    : 'bg-purple-100 text-purple-700 border-purple-200'
                }`}>
                  {workoutProgram.difficulty}
                </Badge>
              </div>
            )}
            {programHasWeeks && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Nuvarande vecka</p>
                <p className="text-2xl font-bold text-gold-primary">
                  {currentWeek} / {workoutProgram.weeks?.length || 0}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">{programHasWeeks ? 'Dagar denna vecka' : 'Totalt dagar'}</p>
              <p className="text-2xl font-bold text-gray-900">
                {daysToShow.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Träningsdagar</p>
              <p className="text-2xl font-bold text-gray-900">
                {daysToShow.filter(d => !d.isRestDay).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Startdatum</p>
              <p className="text-gray-900">
                {new Date(assignment.startDate).toLocaleDateString('sv-SE')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Days List */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-gold-primary" />
          {programHasWeeks ? 'Denna veckans schema' : 'Träningsschema'}
        </h2>

        {daysToShow.map((day) => (
          <Card
            key={day.id}
            className={`bg-white border-2 transition-all ${
              day.isRestDay
                ? 'border-gray-200 hover:border-gray-300'
                : 'border-gray-200 hover:border-gold-primary hover:shadow-lg'
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    day.isRestDay
                      ? 'bg-gray-100'
                      : 'bg-gradient-to-br from-gold-primary to-gold-secondary'
                  }`}>
                    {day.isRestDay ? (
                      <Coffee className="w-6 h-6 text-gray-500" />
                    ) : (
                      <Dumbbell className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Dag {day.dayNumber}
                      </span>
                      {day.isRestDay && (
                        <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-600">
                          Vilodag
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg text-gray-900">
                      {day.name}
                    </CardTitle>
                    {day.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {day.description}
                      </p>
                    )}
                  </div>
                </div>

                {!day.isRestDay && (
                  <Link href={`/dashboard/workout/session/${day.id}`}>
                    <Button className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white">
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
                  <p className="text-sm text-gray-500 mb-2">
                    {day.exercises.length} övningar
                  </p>
                  <div className="space-y-1">
                    {day.exercises.slice(0, 3).map((ex, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <ChevronRight className="w-3 h-3 text-gold-primary" />
                        <span>{ex.exercise.name}</span>
                        <span className="text-gray-500">
                          {ex.sets} x {ex.repsMin}{ex.repsMax && ex.repsMax !== ex.repsMin ? `-${ex.repsMax}` : ''}
                        </span>
                      </div>
                    ))}
                    {day.exercises.length > 3 && (
                      <p className="text-xs text-gray-400 ml-5">
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

      {daysToShow.length === 0 && (
        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">
              {programHasWeeks
                ? `Det finns inga dagar för vecka ${currentWeek} än.`
                : 'Det finns inga dagar i detta träningsprogram än.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
