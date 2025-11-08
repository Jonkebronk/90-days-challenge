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

interface ProgramWeek {
  weekNumber: number
  title: string
  description: string
  days: ProgramDay[]
}

export default function CreateWorkoutProgramPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exerciseSearchTerms, setExerciseSearchTerms] = useState<Record<string, string>>({})

  // Program data
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [durationWeeks, setDurationWeeks] = useState<number | null>(null)
  const [published, setPublished] = useState(false)
  const [useMultiWeek, setUseMultiWeek] = useState(false)
  const [weeks, setWeeks] = useState<ProgramWeek[]>([])
  const [days, setDays] = useState<ProgramDay[]>([]) // For non-multi-week programs

  useEffect(() => {
    fetchExercises()
  }, [])

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

  // Week management functions
  const addWeek = () => {
    const newWeek: ProgramWeek = {
      weekNumber: weeks.length + 1,
      title: `Vecka ${weeks.length + 1}`,
      description: '',
      days: []
    }
    setWeeks([...weeks, newWeek])
  }

  const removeWeek = (weekIndex: number) => {
    setWeeks(weeks.filter((_, i) => i !== weekIndex))
  }

  const updateWeek = (weekIndex: number, field: keyof Omit<ProgramWeek, 'days'>, value: any) => {
    const updated = [...weeks]
    updated[weekIndex] = { ...updated[weekIndex], [field]: value }
    setWeeks(updated)
  }

  const addDayToWeek = (weekIndex: number) => {
    const updated = [...weeks]
    const newDay: ProgramDay = {
      dayNumber: updated[weekIndex].days.length + 1,
      name: `Dag ${updated[weekIndex].days.length + 1}`,
      description: '',
      isRestDay: false,
      exercises: []
    }
    updated[weekIndex].days.push(newDay)
    setWeeks(updated)
  }

  const removeDayFromWeek = (weekIndex: number, dayIndex: number) => {
    const updated = [...weeks]
    updated[weekIndex].days = updated[weekIndex].days.filter((_, i) => i !== dayIndex)
    setWeeks(updated)
  }

  const updateDayInWeek = (weekIndex: number, dayIndex: number, field: keyof ProgramDay, value: any) => {
    const updated = [...weeks]
    updated[weekIndex].days[dayIndex] = { ...updated[weekIndex].days[dayIndex], [field]: value }
    setWeeks(updated)
  }

  const addExerciseToDayInWeek = (weekIndex: number, dayIndex: number) => {
    const newExercise: ProgramExercise = {
      exerciseId: '',
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      restSeconds: 60,
      notes: '',
      targetWeight: null
    }
    const updated = [...weeks]
    updated[weekIndex].days[dayIndex].exercises.push(newExercise)
    setWeeks(updated)
  }

  const removeExerciseFromDayInWeek = (weekIndex: number, dayIndex: number, exerciseIndex: number) => {
    const updated = [...weeks]
    updated[weekIndex].days[dayIndex].exercises = updated[weekIndex].days[dayIndex].exercises.filter((_, i) => i !== exerciseIndex)
    setWeeks(updated)
  }

  const updateExerciseInWeek = (weekIndex: number, dayIndex: number, exerciseIndex: number, field: keyof ProgramExercise, value: any) => {
    const updated = [...weeks]
    updated[weekIndex].days[dayIndex].exercises[exerciseIndex] = {
      ...updated[weekIndex].days[dayIndex].exercises[exerciseIndex],
      [field]: value
    }
    setWeeks(updated)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Programnamn krävs')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name,
        description,
        difficulty,
        durationWeeks,
        published,
        useMultiWeek,
        weeks: useMultiWeek ? weeks.map((week, weekIndex) => ({
          weekNumber: week.weekNumber,
          title: week.title,
          description: week.description,
          orderIndex: weekIndex,
          days: week.days.map((day, dayIndex) => ({
            ...day,
            orderIndex: dayIndex,
            exercises: day.exercises.map((ex, exIndex) => ({
              ...ex,
              orderIndex: exIndex
            }))
          }))
        })) : undefined,
        days: !useMultiWeek ? days.map((day, index) => ({
          ...day,
          orderIndex: index,
          exercises: day.exercises.map((ex, exIndex) => ({
            ...ex,
            orderIndex: exIndex
          }))
        })) : undefined
      }

      const response = await fetch('/api/workout-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
            Skapa träningsprogram
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Bygg ett anpassat träningsprogram för dina klienter
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-[rgba(255,215,0,0.2)] text-[rgba(255,255,255,0.7)]"
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          >
            {saving ? 'Sparar...' : 'Spara program'}
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

          <div className="flex flex-col gap-2">
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="multiWeek"
                checked={useMultiWeek}
                onChange={(e) => setUseMultiWeek(e.target.checked)}
                className="w-4 h-4 rounded border-[rgba(255,215,0,0.3)]"
              />
              <Label htmlFor="multiWeek" className="text-[rgba(255,255,255,0.7)] cursor-pointer">
                Flerveckoprogram (organisera dagar i veckor)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Week Structure */}
      {useMultiWeek ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">
              Veckor ({weeks.length})
            </h2>
            <Button
              onClick={addWeek}
              className="bg-[rgba(255,215,0,0.2)] border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.3)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Lägg till vecka
            </Button>
          </div>

          {weeks.map((week, weekIndex) => (
            <Card
              key={weekIndex}
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(139,92,246,0.3)] backdrop-blur-[10px]"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-[rgba(255,255,255,0.9)] mb-3">
                      Vecka {week.weekNumber}
                    </CardTitle>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[rgba(255,255,255,0.7)]">Veckonamn</Label>
                        <Input
                          value={week.title}
                          onChange={(e) => updateWeek(weekIndex, 'title', e.target.value)}
                          placeholder="T.ex. Foundation Week"
                          className="bg-[rgba(255,255,255,0.05)] border-[rgba(139,92,246,0.2)] text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[rgba(255,255,255,0.7)]">Beskrivning</Label>
                        <Input
                          value={week.description}
                          onChange={(e) => updateWeek(weekIndex, 'description', e.target.value)}
                          placeholder="Kort beskrivning"
                          className="bg-[rgba(255,255,255,0.05)] border-[rgba(139,92,246,0.2)] text-white mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWeek(weekIndex)}
                    className="ml-4 text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(139,92,246,0.2)]">
                    <Label className="text-[rgba(255,255,255,0.7)]">
                      Dagar ({week.days.length})
                    </Label>
                    <Button
                      onClick={() => addDayToWeek(weekIndex)}
                      size="sm"
                      className="bg-[rgba(255,215,0,0.2)] border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.3)]"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Lägg till dag
                    </Button>
                  </div>

                  {week.days.length === 0 && (
                    <p className="text-center text-[rgba(255,255,255,0.5)] py-6">Inga dagar i denna vecka ännu</p>
                  )}

                  {week.days.map((day, dayIndex) => (
                    <Card
                      key={dayIndex}
                      className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,215,0,0.2)]"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-md text-[rgba(255,255,255,0.9)]">
                            Dag {day.dayNumber}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDayFromWeek(weekIndex, dayIndex)}
                            className="text-[rgba(255,100,100,0.8)] hover:text-[#ff6464]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Day fields - same as regular day */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-[rgba(255,255,255,0.6)]">Dagnamn</Label>
                            <Input
                              value={day.name}
                              onChange={(e) => updateDayInWeek(weekIndex, dayIndex, 'name', e.target.value)}
                              placeholder="T.ex. Push Day"
                              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[rgba(255,255,255,0.6)]">Beskrivning</Label>
                            <Input
                              value={day.description}
                              onChange={(e) => updateDayInWeek(weekIndex, dayIndex, 'description', e.target.value)}
                              placeholder="Kort beskrivning"
                              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`week-${weekIndex}-day-${dayIndex}-rest`}
                            checked={day.isRestDay}
                            onChange={(e) => updateDayInWeek(weekIndex, dayIndex, 'isRestDay', e.target.checked)}
                            className="w-4 h-4 rounded border-[rgba(255,215,0,0.3)]"
                          />
                          <Label htmlFor={`week-${weekIndex}-day-${dayIndex}-rest`} className="text-xs text-[rgba(255,255,255,0.6)] cursor-pointer">
                            Vilodag
                          </Label>
                        </div>

                        {!day.isRestDay && (
                          <>
                            <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,215,0,0.1)]">
                              <Label className="text-xs text-[rgba(255,255,255,0.6)]">
                                Övningar ({day.exercises.length})
                              </Label>
                              <Button
                                onClick={() => addExerciseToDayInWeek(weekIndex, dayIndex)}
                                size="sm"
                                className="bg-[rgba(255,215,0,0.15)] text-[#FFD700] text-xs px-2 py-1 h-7"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Övning
                              </Button>
                            </div>

                            <div className="space-y-2">
                              {day.exercises.map((exercise, exIndex) => {
                                const selectedExercise = exercises.find(e => e.id === exercise.exerciseId)
                                const exerciseKey = `week-${weekIndex}-day-${dayIndex}-ex-${exIndex}`
                                const searchTerm = exerciseSearchTerms[exerciseKey] || ''
                                const filteredExercises = exercises.filter(ex =>
                                  ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  ex.muscleGroups.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase()))
                                )

                                return (
                                  <div
                                    key={exIndex}
                                    className="p-2 bg-[rgba(255,255,255,0.01)] border border-[rgba(255,215,0,0.05)] rounded space-y-2"
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="flex-1 space-y-2">
                                        <div className="relative">
                                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[rgba(255,255,255,0.4)]" />
                                          <Input
                                            placeholder="Sök övning..."
                                            value={searchTerm}
                                            onChange={(e) => setExerciseSearchTerms(prev => ({
                                              ...prev,
                                              [exerciseKey]: e.target.value
                                            }))}
                                            className="pl-8 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-xs h-8"
                                          />
                                        </div>
                                        <Select
                                          value={exercise.exerciseId}
                                          onValueChange={(value) => updateExerciseInWeek(weekIndex, dayIndex, exIndex, 'exerciseId', value)}
                                        >
                                          <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-xs h-8">
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
                                              <div className="p-2 text-xs text-[rgba(255,255,255,0.5)]">Inga övningar</div>
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeExerciseFromDayInWeek(weekIndex, dayIndex, exIndex)}
                                        className="text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] h-8 w-8"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>

                                    {selectedExercise && (
                                      <div className="flex flex-wrap gap-1">
                                        {selectedExercise.muscleGroups.map(mg => (
                                          <Badge
                                            key={mg}
                                            variant="outline"
                                            className="text-[10px] bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.3)] text-[#FFD700] px-1 py-0"
                                          >
                                            {mg}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}

                                    <div className="grid grid-cols-4 gap-2">
                                      <div>
                                        <Label className="text-[10px] text-[rgba(255,255,255,0.5)]">Sets</Label>
                                        <Input
                                          type="number"
                                          value={exercise.sets}
                                          onChange={(e) => updateExerciseInWeek(weekIndex, dayIndex, exIndex, 'sets', parseInt(e.target.value) || 0)}
                                          className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-xs h-7"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-[rgba(255,255,255,0.5)]">Reps Min</Label>
                                        <Input
                                          type="number"
                                          value={exercise.repsMin || ''}
                                          onChange={(e) => updateExerciseInWeek(weekIndex, dayIndex, exIndex, 'repsMin', e.target.value ? parseInt(e.target.value) : null)}
                                          className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-xs h-7"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-[rgba(255,255,255,0.5)]">Reps Max</Label>
                                        <Input
                                          type="number"
                                          value={exercise.repsMax || ''}
                                          onChange={(e) => updateExerciseInWeek(weekIndex, dayIndex, exIndex, 'repsMax', e.target.value ? parseInt(e.target.value) : null)}
                                          className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-xs h-7"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-[rgba(255,255,255,0.5)]">Vila (s)</Label>
                                        <Input
                                          type="number"
                                          value={exercise.restSeconds}
                                          onChange={(e) => updateExerciseInWeek(weekIndex, dayIndex, exIndex, 'restSeconds', parseInt(e.target.value) || 60)}
                                          className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-xs h-7"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="text-[10px] text-[rgba(255,255,255,0.5)]">Anteckningar</Label>
                                      <Input
                                        value={exercise.notes}
                                        onChange={(e) => updateExerciseInWeek(weekIndex, dayIndex, exIndex, 'notes', e.target.value)}
                                        placeholder="T.ex. Drop set..."
                                        className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-xs h-7 mt-1"
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
                </div>
              </CardContent>
            </Card>
          ))}

          {weeks.length === 0 && (
            <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(139,92,246,0.3)] backdrop-blur-[10px]">
              <CardContent className="py-12 text-center">
                <p className="text-[rgba(255,255,255,0.6)] mb-4">
                  Inga veckor ännu. Lägg till din första vecka!
                </p>
                <Button
                  onClick={addWeek}
                  className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till första veckan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Original flat days structure
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
      )}
    </div>
  )
}
