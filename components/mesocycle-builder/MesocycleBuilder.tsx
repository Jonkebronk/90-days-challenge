'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DayColumnsLayout } from './DayColumnsLayout'
import {
  DayFormData,
  MuscleSlotFormData,
  SlotExerciseFormData,
  MesocycleFormData,
  Exercise,
  Mesocycle,
  MESOCYCLE_GOALS,
  createEmptyDay,
} from './types'

interface MesocycleBuilderProps {
  initialData?: Mesocycle
  exercises: Exercise[]
  onSave: (data: {
    mesocycle: MesocycleFormData
    days: DayFormData[]
  }) => Promise<void>
}

export function MesocycleBuilder({
  initialData,
  exercises,
  onSave,
}: MesocycleBuilderProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Mesocycle metadata
  const [mesocycle, setMesocycle] = useState<MesocycleFormData>(() => ({
    name: initialData?.name || 'Untitled mesocycle',
    description: initialData?.description || '',
    goal: initialData?.goal || '',
    durationWeeks: initialData?.durationWeeks || 4,
    startingRIR: initialData?.startingRIR ?? 3,
    endingRIR: initialData?.endingRIR ?? 0,
    macrocycleId: initialData?.macrocycleId || null,
  }))

  // Days state
  const [days, setDays] = useState<DayFormData[]>(() => {
    if (initialData?.days && initialData.days.length > 0) {
      return initialData.days.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        dayName: day.dayName || '',
        weekday: day.weekday,
        isRestDay: day.isRestDay,
        muscleSlots: day.muscleSlots.map((slot) => ({
          id: slot.id,
          muscleGroup: slot.muscleGroup,
          priority: slot.priority as 'primary' | 'secondary',
          setsMin: slot.setsMin,
          setsMax: slot.setsMax,
          exercises: slot.exercises.map((ex) => ({
            id: ex.id,
            exerciseId: ex.exerciseId,
            exercise: ex.exercise,
            sets: ex.sets,
            reps: ex.reps || '',
            restSeconds: ex.restSeconds,
            tempo: ex.tempo || '',
            targetRPE: ex.targetRPE,
            targetRIR: ex.targetRIR,
            notes: ex.notes || '',
            coachNotes: ex.coachNotes || '',
          })),
        })),
      }))
    }
    // Start with 3 empty days
    return [createEmptyDay(1), createEmptyDay(2), createEmptyDay(3)]
  })

  // Track changes
  useEffect(() => {
    setHasChanges(true)
  }, [mesocycle, days])

  // Mesocycle handlers
  const updateMesocycle = useCallback(
    (updates: Partial<MesocycleFormData>) => {
      setMesocycle((prev) => ({ ...prev, ...updates }))
    },
    []
  )

  // Day handlers
  const addDay = useCallback(() => {
    setDays((prev) => [...prev, createEmptyDay(prev.length + 1)])
  }, [])

  const updateDay = useCallback(
    (dayIndex: number, updates: Partial<DayFormData>) => {
      setDays((prev) =>
        prev.map((day, i) => (i === dayIndex ? { ...day, ...updates } : day))
      )
    },
    []
  )

  const removeDay = useCallback((dayIndex: number) => {
    setDays((prev) => {
      const newDays = prev.filter((_, i) => i !== dayIndex)
      // Renumber days
      return newDays.map((day, i) => ({ ...day, dayNumber: i + 1 }))
    })
  }, [])

  // Muscle slot handlers
  const addMuscleSlot = useCallback(
    (dayIndex: number, slot: MuscleSlotFormData) => {
      setDays((prev) =>
        prev.map((day, i) =>
          i === dayIndex
            ? { ...day, muscleSlots: [...day.muscleSlots, slot] }
            : day
        )
      )
    },
    []
  )

  const updateMuscleSlot = useCallback(
    (
      dayIndex: number,
      slotIndex: number,
      updates: Partial<MuscleSlotFormData>
    ) => {
      setDays((prev) =>
        prev.map((day, i) =>
          i === dayIndex
            ? {
                ...day,
                muscleSlots: day.muscleSlots.map((slot, j) =>
                  j === slotIndex ? { ...slot, ...updates } : slot
                ),
              }
            : day
        )
      )
    },
    []
  )

  const removeMuscleSlot = useCallback(
    (dayIndex: number, slotIndex: number) => {
      setDays((prev) =>
        prev.map((day, i) =>
          i === dayIndex
            ? {
                ...day,
                muscleSlots: day.muscleSlots.filter((_, j) => j !== slotIndex),
              }
            : day
        )
      )
    },
    []
  )

  // Exercise handlers
  const addExercise = useCallback(
    (
      dayIndex: number,
      slotIndex: number,
      exercise: SlotExerciseFormData
    ) => {
      setDays((prev) =>
        prev.map((day, i) =>
          i === dayIndex
            ? {
                ...day,
                muscleSlots: day.muscleSlots.map((slot, j) =>
                  j === slotIndex
                    ? { ...slot, exercises: [...slot.exercises, exercise] }
                    : slot
                ),
              }
            : day
        )
      )
    },
    []
  )

  const updateExercise = useCallback(
    (
      dayIndex: number,
      slotIndex: number,
      exerciseIndex: number,
      updates: Partial<SlotExerciseFormData>
    ) => {
      setDays((prev) =>
        prev.map((day, i) =>
          i === dayIndex
            ? {
                ...day,
                muscleSlots: day.muscleSlots.map((slot, j) =>
                  j === slotIndex
                    ? {
                        ...slot,
                        exercises: slot.exercises.map((ex, k) =>
                          k === exerciseIndex ? { ...ex, ...updates } : ex
                        ),
                      }
                    : slot
                ),
              }
            : day
        )
      )
    },
    []
  )

  const removeExercise = useCallback(
    (dayIndex: number, slotIndex: number, exerciseIndex: number) => {
      setDays((prev) =>
        prev.map((day, i) =>
          i === dayIndex
            ? {
                ...day,
                muscleSlots: day.muscleSlots.map((slot, j) =>
                  j === slotIndex
                    ? {
                        ...slot,
                        exercises: slot.exercises.filter(
                          (_, k) => k !== exerciseIndex
                        ),
                      }
                    : slot
                ),
              }
            : day
        )
      )
    },
    []
  )

  // Save handler
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({ mesocycle, days })
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            value={mesocycle.name}
            onChange={(e) => updateMesocycle({ name: e.target.value })}
            className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 w-64"
            placeholder="Mesocycle name"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              CREATE MESOCYCLE
            </>
          )}
        </Button>
      </div>

      {/* Settings Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-b border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">Goal:</label>
          <Select
            value={mesocycle.goal}
            onValueChange={(value) => updateMesocycle({ goal: value })}
          >
            <SelectTrigger className="w-32 h-8 text-xs bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Select goal" />
            </SelectTrigger>
            <SelectContent>
              {MESOCYCLE_GOALS.map((goal) => (
                <SelectItem key={goal} value={goal} className="capitalize">
                  {goal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">Duration:</label>
          <Select
            value={mesocycle.durationWeeks.toString()}
            onValueChange={(value) =>
              updateMesocycle({ durationWeeks: parseInt(value) })
            }
          >
            <SelectTrigger className="w-24 h-8 text-xs bg-zinc-800 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3, 4, 5, 6, 8].map((weeks) => (
                <SelectItem key={weeks} value={weeks.toString()}>
                  {weeks} weeks
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">RIR:</label>
          <Input
            type="number"
            value={mesocycle.startingRIR ?? ''}
            onChange={(e) =>
              updateMesocycle({
                startingRIR: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="w-14 h-8 text-xs bg-zinc-800 border-zinc-700"
            placeholder="Start"
            min={0}
            max={5}
          />
          <span className="text-xs text-zinc-500">→</span>
          <Input
            type="number"
            value={mesocycle.endingRIR ?? ''}
            onChange={(e) =>
              updateMesocycle({
                endingRIR: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="w-14 h-8 text-xs bg-zinc-800 border-zinc-700"
            placeholder="End"
            min={0}
            max={5}
          />
        </div>
      </div>

      {/* Day Columns */}
      <div className="flex-1 p-4 overflow-hidden">
        <DayColumnsLayout
          days={days}
          exercises={exercises}
          onAddDay={addDay}
          onUpdateDay={updateDay}
          onRemoveDay={removeDay}
          onAddMuscleSlot={addMuscleSlot}
          onUpdateMuscleSlot={updateMuscleSlot}
          onRemoveMuscleSlot={removeMuscleSlot}
          onAddExercise={addExercise}
          onUpdateExercise={updateExercise}
          onRemoveExercise={removeExercise}
        />
      </div>
    </div>
  )
}
