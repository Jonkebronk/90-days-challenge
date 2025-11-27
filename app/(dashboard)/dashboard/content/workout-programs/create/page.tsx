'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProgramInfoStep } from '@/components/workout-builder/ProgramInfoStep'
import { DayBuilderStep } from '@/components/workout-builder/DayBuilderStep'
import {
  ProgramDay,
  ProgramExercise,
  ProgramInfo,
  Exercise
} from '@/components/workout-builder/types'

export default function CreateWorkoutProgramPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)

  // Exercises library
  const [exercises, setExercises] = useState<Exercise[]>([])

  // Program info (Step 1)
  const [programInfo, setProgramInfo] = useState<ProgramInfo>({
    name: '',
    description: '',
    difficulty: '',
    durationWeeks: null,
    published: true
  })

  // Days (Step 2) - Start with one day
  const [days, setDays] = useState<ProgramDay[]>([
    {
      dayNumber: 1,
      name: 'Dag 1',
      description: '',
      isRestDay: false,
      exercises: []
    }
  ])

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

  const handleProgramInfoChange = (field: keyof ProgramInfo, value: any) => {
    setProgramInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleAddDay = () => {
    const newDay: ProgramDay = {
      dayNumber: days.length + 1,
      name: `Session ${days.length + 1}`,
      description: '',
      isRestDay: false,
      exercises: []
    }
    setDays([...days, newDay])
  }

  const handleRemoveDay = (index: number) => {
    setDays(days.filter((_, i) => i !== index))
  }

  const handleUpdateDay = (index: number, field: keyof ProgramDay, value: any) => {
    const updated = [...days]
    updated[index] = { ...updated[index], [field]: value }
    setDays(updated)
  }

  const handleAddExercise = (dayIndex: number, exercise: Exercise) => {
    const newExercise: ProgramExercise = {
      id: `${exercise.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: exercise.id,
      exercise,
      sets: 3,
      reps: '8-12',
      restSeconds: 60,
      tempo: '',
      notes: '',
      coachNotes: '',
      targetWeight: null
    }
    const updated = [...days]
    updated[dayIndex].exercises.push(newExercise)
    setDays(updated)
  }

  const handleUpdateExercise = (dayIndex: number, exerciseIndex: number, field: keyof ProgramExercise, value: any) => {
    const updated = [...days]
    updated[dayIndex].exercises[exerciseIndex] = {
      ...updated[dayIndex].exercises[exerciseIndex],
      [field]: value
    }
    setDays(updated)
  }

  const handleRemoveExercise = (dayIndex: number, exerciseIndex: number) => {
    const updated = [...days]
    updated[dayIndex].exercises = updated[dayIndex].exercises.filter((_, i) => i !== exerciseIndex)
    setDays(updated)
  }

  const handleReorderExercises = (dayIndex: number, oldIndex: number, newIndex: number) => {
    const updated = [...days]
    const [removed] = updated[dayIndex].exercises.splice(oldIndex, 1)
    updated[dayIndex].exercises.splice(newIndex, 0, removed)
    setDays(updated)
  }

  const handleSave = async () => {
    if (!programInfo.name.trim()) {
      alert('Programnamn krävs')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/workout-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...programInfo,
          published: true,
          days: days.map((day, index) => ({
            ...day,
            dayNumber: index + 1,
            orderIndex: index,
            exercises: day.exercises.map((ex, exIndex) => ({
              exerciseId: ex.exerciseId,
              sets: typeof ex.sets === 'string' ? parseInt(ex.sets as string) || 3 : ex.sets,
              reps: ex.reps || null,
              restSeconds: typeof ex.restSeconds === 'string' ? parseInt(ex.restSeconds as string) || 60 : ex.restSeconds,
              tempo: ex.tempo || null,
              notes: ex.notes || null,
              coachNotes: ex.coachNotes || null,
              targetWeight: ex.targetWeight,
              supersetGroupId: ex.supersetGroupId || null,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/content/workout-programs">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-gold-light hover:bg-gold-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-100">
            Skapa träningsprogram
          </h1>
          <p className="text-gray-400 mt-1">
            {currentStep === 1 ? 'Steg 1: Programinformation' : 'Steg 2: Bygg träningsdagar'}
          </p>
        </div>
        {currentStep === 2 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="bg-[rgba(255,255,255,0.05)] border-gold-primary/30 text-gray-100 hover:bg-gold-50 hover:border-[rgba(255,215,0,0.5)]"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] hover:opacity-90"
            >
              {saving ? 'Sparar...' : 'Spara program'}
            </Button>
          </div>
        )}
      </div>

      {/* Step Content */}
      {currentStep === 1 ? (
        <ProgramInfoStep
          data={programInfo}
          onChange={handleProgramInfoChange}
          onNext={() => setCurrentStep(2)}
        />
      ) : (
        <DayBuilderStep
          days={days}
          exercises={exercises}
          onUpdateDay={handleUpdateDay}
          onAddDay={handleAddDay}
          onRemoveDay={handleRemoveDay}
          onAddExercise={handleAddExercise}
          onUpdateExercise={handleUpdateExercise}
          onRemoveExercise={handleRemoveExercise}
          onReorderExercises={handleReorderExercises}
          onPrevious={() => setCurrentStep(1)}
        />
      )}
    </div>
  )
}
