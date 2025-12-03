'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { MesocycleBuilder } from '@/components/mesocycle-builder'
import {
  Exercise,
  Mesocycle,
  DayFormData,
  MesocycleFormData,
} from '@/components/mesocycle-builder/types'

export default function EditMesocyclePage() {
  const router = useRouter()
  const params = useParams()
  const mesocycleId = params.id as string

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchExercises(), fetchMesocycle()])
      .finally(() => setLoading(false))
  }, [mesocycleId])

  const fetchExercises = async () => {
    try {
      const res = await fetch('/api/exercises')
      if (res.ok) {
        const data = await res.json()
        setExercises(data)
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
    }
  }

  const fetchMesocycle = async () => {
    try {
      const res = await fetch(`/api/mesocycles/${mesocycleId}`)
      if (res.ok) {
        const data = await res.json()
        setMesocycle(data)
      } else {
        router.push('/dashboard/content/mesocycles')
      }
    } catch (error) {
      console.error('Failed to fetch mesocycle:', error)
      router.push('/dashboard/content/mesocycles')
    }
  }

  const handleSave = async (data: {
    mesocycle: MesocycleFormData
    days: DayFormData[]
  }) => {
    try {
      const res = await fetch(`/api/mesocycles/${mesocycleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data.mesocycle,
          days: data.days.map((day, dayIndex) => ({
            dayNumber: day.dayNumber,
            dayName: day.dayName,
            weekday: day.weekday,
            isRestDay: day.isRestDay,
            muscleSlots: day.muscleSlots.map((slot, slotIndex) => ({
              muscleGroup: slot.muscleGroup,
              priority: slot.priority,
              setsMin: slot.setsMin,
              setsMax: slot.setsMax,
              exercises: slot.exercises.map((ex, exIndex) => ({
                exerciseId: ex.exerciseId,
                sets: ex.sets,
                reps: ex.reps || null,
                restSeconds: ex.restSeconds,
                tempo: ex.tempo || null,
                targetRPE: ex.targetRPE,
                targetRIR: ex.targetRIR,
                notes: ex.notes || null,
                coachNotes: ex.coachNotes || null,
              })),
            })),
          })),
        }),
      })

      if (res.ok) {
        router.push('/dashboard/content/mesocycles')
      } else {
        throw new Error('Failed to update mesocycle')
      }
    } catch (error) {
      console.error('Failed to save mesocycle:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!mesocycle) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-zinc-500">Mesocycle not found</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      <MesocycleBuilder
        initialData={mesocycle}
        exercises={exercises}
        onSave={handleSave}
      />
    </div>
  )
}
