'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, GripVertical, Search } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  equipmentNeeded: string[]
}

interface ProgramExercise {
  exerciseId: string
  exercise?: Exercise
  sets: number
  repsMin: number | null
  repsMax: number | null
  restSeconds: number
  notes: string
  targetWeight: number | null
}

interface ProgramDay {
  dayNumber: number
  name: string
  description: string
  isRestDay: boolean
  exercises: ProgramExercise[]
}

export default function EditWorkoutProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [programId, setProgramId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exerciseSearchTerms, setExerciseSearchTerms] = useState<Record<string, string>>({})

  // Program data
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [durationWeeks, setDurationWeeks] = useState<number | null>(null)
  const [published, setPublished] = useState(false)
  const [days, setDays] = useState<ProgramDay[]>([])

  useEffect(() => {
    const loadData = async () => {
      const { id } = await params
      setProgramId(id)
      await Promise.all([fetchProgram(id), fetchExercises()])
    }
    loadData()
  }, [])

  const fetchProgram = async (id: string) => {
    try {
      const response = await fetch(`/api/workout-programs/${id}`)
      if (response.ok) {
        const data = await response.json()
        const program = data.program

        setName(program.name)
        setDescription(program.description || '')
        setDifficulty(program.difficulty || '')
        setDurationWeeks(program.durationWeeks)
        setPublished(program.published)

        // Map days with exercises
        setDays(program.days.map((day: any) => ({
          dayNumber: day.dayNumber,
          name: day.name,
          description: day.description || '',
          isRestDay: day.isRestDay,
          exercises: day.exercises.map((ex: any) => ({
            exerciseId: ex.exerciseId,
            exercise: ex.exercise,
            sets: ex.sets,
            repsMin: ex.repsMin,
            repsMax: ex.repsMax,
            restSeconds: ex.restSeconds,
            notes: ex.notes || '',
            targetWeight: ex.targetWeight
          }))
        })))
      }
    } catch (error) {
      console.error('Error fetching program:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises || [])
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  const addDay = () => {
    const newDay: ProgramDay = {
      dayNumber: days.length + 1,
      name: `Dag ${days.length + 1}`,
      description: '',
      isRestDay: false,
      exercises: []
    }
    setDays([...days, newDay])
  }

  const removeDay = (index: number) => {
    setDays(days.filter((_, i) => i !== index))
  }

  const updateDay = (index: number, field: keyof ProgramDay, value: any) => {
    const updated = [...days]
    updated[index] = { ...updated[index], [field]: value }
    setDays(updated)
  }

  const addExerciseToDay = (dayIndex: number) => {
    const newExercise: ProgramExercise = {
      exerciseId: '',
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      restSeconds: 60,
      notes: '',
      targetWeight: null
    }
    const updated = [...days]
    updated[dayIndex].exercises.push(newExercise)
    setDays(updated)
  }

  const removeExerciseFromDay = (dayIndex: number, exerciseIndex: number) => {
    const updated = [...days]
    updated[dayIndex].exercises = updated[dayIndex].exercises.filter((_, i) => i !== exerciseIndex)
    setDays(updated)
  }

  const updateExercise = (dayIndex: number, exerciseIndex: number, field: keyof ProgramExercise, value: any) => {
    const updated = [...days]
    updated[dayIndex].exercises[exerciseIndex] = {
      ...updated[dayIndex].exercises[exerciseIndex],
      [field]: value
    }
    setDays(updated)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Programnamn krävs')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/workout-programs/${programId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          difficulty,
          durationWeeks,
          published,
          days: days.map((day, index) => ({
            ...day,
            orderIndex: index,
            exercises: day.exercises.map((ex, exIndex) => ({
              ...ex,
              orderIndex: exIndex
            }))
          }))
        })
      })

      if (response.ok) {
        router.push('/dashboard/content/workout-programs')
      } else {
        alert('Kunde inte spara programmet')
      }
    } catch (error) {
      console.error('Error saving program:', error)
      alert('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[rgba(255,215,0,0.3)] border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/content/workout-programs">
          <Button
            variant="ghost"
            size="icon"
            className="text-[rgba(255,255,255,0.7)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
            Redigera träningsprogram
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Uppdatera ditt träningsprogram
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,215,0,0.1)] hover:border-[rgba(255,215,0,0.5)]"
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          >
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </Button>
        </div>
      </div>

      {/* Program Info */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl text-[rgba(255,255,255,0.9)]">
            Programinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-[rgba(255,255,255,0.7)]">Programnamn *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Full Body Beginner"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
            />
          </div>

          <div>
            <Label className="text-[rgba(255,255,255,0.7)]">Beskrivning</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv programmet och dess mål..."
              rows={3}
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Svårighetsgrad</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="mt-1 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                  <SelectValue placeholder="Välj nivå" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Varaktighet (veckor)</Label>
              <Input
                type="number"
                value={durationWeeks || ''}
                onChange={(e) => setDurationWeeks(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="T.ex. 8"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(255,215,0,0.3)]"
            />
            <Label htmlFor="published" className="text-[rgba(255,255,255,0.7)] cursor-pointer">
              Publicera direkt
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Days */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">
            Träningsdagar ({days.length})
          </h2>
          <Button
            onClick={addDay}
            className="bg-[rgba(255,215,0,0.2)] border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.3)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lägg till dag
          </Button>
        </div>

        {days.map((day, dayIndex) => (
          <Card
            key={dayIndex}
            className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-[rgba(255,255,255,0.3)]" />
                  <CardTitle className="text-lg text-[rgba(255,255,255,0.9)]">
                    Dag {day.dayNumber}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDay(dayIndex)}
                  className="text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[rgba(255,255,255,0.7)]">Dagnamn</Label>
                  <Input
                    value={day.name}
                    onChange={(e) => updateDay(dayIndex, 'name', e.target.value)}
                    placeholder="T.ex. Push Day"
                    className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[rgba(255,255,255,0.7)]">Beskrivning</Label>
                  <Input
                    value={day.description}
                    onChange={(e) => updateDay(dayIndex, 'description', e.target.value)}
                    placeholder="Kort beskrivning"
                    className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`restDay-${dayIndex}`}
                  checked={day.isRestDay}
                  onChange={(e) => updateDay(dayIndex, 'isRestDay', e.target.checked)}
                  className="w-4 h-4 rounded border-[rgba(255,215,0,0.3)]"
                />
                <Label htmlFor={`restDay-${dayIndex}`} className="text-[rgba(255,255,255,0.7)] cursor-pointer">
                  Vilodag
                </Label>
              </div>

              {!day.isRestDay && (
                <>
                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,215,0,0.1)]">
                    <Label className="text-[rgba(255,255,255,0.7)]">
                      Övningar ({day.exercises.length})
                    </Label>
                    <Button
                      onClick={() => addExerciseToDay(dayIndex)}
                      size="sm"
                      className="bg-[rgba(255,215,0,0.2)] border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.3)]"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Lägg till övning
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {day.exercises.map((exercise, exIndex) => {
                      const selectedExercise = exercises.find(e => e.id === exercise.exerciseId)
                      const exerciseKey = `${dayIndex}-${exIndex}`
                      const searchTerm = exerciseSearchTerms[exerciseKey] || ''
                      const filteredExercises = exercises.filter(ex =>
                        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ex.muscleGroups.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase()))
                      )

                      return (
                        <div
                          key={exIndex}
                          className="p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,215,0,0.1)] rounded-lg space-y-3"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.4)]" />
                                <Input
                                  placeholder="Sök övning..."
                                  value={searchTerm}
                                  onChange={(e) => setExerciseSearchTerms(prev => ({
                                    ...prev,
                                    [exerciseKey]: e.target.value
                                  }))}
                                  className="pl-8 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                                />
                              </div>
                              <Select
                                value={exercise.exerciseId}
                                onValueChange={(value) => updateExercise(dayIndex, exIndex, 'exerciseId', value)}
                              >
                                <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                                  <SelectValue placeholder="Välj övning" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredExercises.length > 0 ? (
                                    filteredExercises.map(ex => (
                                      <SelectItem key={ex.id} value={ex.id}>
                                        {ex.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="p-2 text-sm text-[rgba(255,255,255,0.5)]">Inga övningar hittades</div>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeExerciseFromDay(dayIndex, exIndex)}
                              className="ml-2 text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {selectedExercise && (
                            <div className="flex flex-wrap gap-1">
                              {selectedExercise.muscleGroups.map(mg => (
                                <Badge
                                  key={mg}
                                  variant="outline"
                                  className="text-xs bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.3)] text-[#FFD700]"
                                >
                                  {mg}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <Label className="text-xs text-[rgba(255,255,255,0.6)]">Sets</Label>
                              <Input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', parseInt(e.target.value) || 0)}
                                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[rgba(255,255,255,0.6)]">Reps Min</Label>
                              <Input
                                type="number"
                                value={exercise.repsMin || ''}
                                onChange={(e) => updateExercise(dayIndex, exIndex, 'repsMin', e.target.value ? parseInt(e.target.value) : null)}
                                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[rgba(255,255,255,0.6)]">Reps Max</Label>
                              <Input
                                type="number"
                                value={exercise.repsMax || ''}
                                onChange={(e) => updateExercise(dayIndex, exIndex, 'repsMax', e.target.value ? parseInt(e.target.value) : null)}
                                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[rgba(255,255,255,0.6)]">Vila (s)</Label>
                              <Input
                                type="number"
                                value={exercise.restSeconds}
                                onChange={(e) => updateExercise(dayIndex, exIndex, 'restSeconds', parseInt(e.target.value) || 60)}
                                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-[rgba(255,255,255,0.6)]">Anteckningar</Label>
                            <Input
                              value={exercise.notes}
                              onChange={(e) => updateExercise(dayIndex, exIndex, 'notes', e.target.value)}
                              placeholder="T.ex. Drop set, superset..."
                              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {days.length === 0 && (
          <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
            <CardContent className="py-12 text-center">
              <p className="text-[rgba(255,255,255,0.6)] mb-4">
                Inga träningsdagar ännu. Lägg till din första dag!
              </p>
              <Button
                onClick={addDay}
                className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lägg till första dagen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
