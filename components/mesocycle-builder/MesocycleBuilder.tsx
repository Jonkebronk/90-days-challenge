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
import { ArrowLeft, Save, Loader2, LayoutGrid, Columns } from 'lucide-react'
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
  const [viewMode, setViewMode] = useState<'scroll' | 'week'>('scroll')

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
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <Input
              value={mesocycle.name}
              onChange={(e) => updateMesocycle({ name: e.target.value })}
              className="text-xl font-bold bg-zinc-800 border-2 border-amber-500/30 hover:border-amber-500/50 focus:border-amber-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-1.5 h-auto text-amber-400 placeholder:text-zinc-500 rounded-lg w-80"
              placeholder="Enter mesocycle name..."
            />
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-zinc-800 bg-zinc-900/30">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-1.5">
            <label className="text-xs text-zinc-400 font-medium">Goal</label>
          <Select
            value={mesocycle.goal}
            onValueChange={(value) => updateMesocycle({ goal: value })}
          >
            <SelectTrigger className="w-28 h-7 text-xs bg-zinc-900 border-zinc-700 rounded-md text-white">
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

        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-1.5">
          <label className="text-xs text-zinc-400 font-medium">Duration</label>
          <Select
            value={mesocycle.durationWeeks.toString()}
            onValueChange={(value) =>
              updateMesocycle({ durationWeeks: parseInt(value) })
            }
          >
            <SelectTrigger className="w-24 h-7 text-xs bg-zinc-900 border-zinc-700 rounded-md text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((weeks) => (
                <SelectItem key={weeks} value={weeks.toString()}>
                  {weeks} weeks
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-1.5">
          <label className="text-xs text-zinc-400 font-medium">RIR</label>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              value={mesocycle.startingRIR ?? ''}
              onChange={(e) =>
                updateMesocycle({
                  startingRIR: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="w-12 h-7 text-xs text-center bg-zinc-900 border-zinc-700 rounded-md text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="3"
            />
            <span className="text-zinc-500 text-xs">→</span>
            <Input
              type="number"
              value={mesocycle.endingRIR ?? ''}
              onChange={(e) =>
                updateMesocycle({
                  endingRIR: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="w-12 h-7 text-xs text-center bg-zinc-900 border-zinc-700 rounded-md text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
          </div>
        </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('scroll')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'scroll'
                ? 'bg-amber-500 text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Scroll view"
          >
            <Columns className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'week'
                ? 'bg-amber-500 text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Week overview (Mon-Sun)"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day Columns */}
      <div className="flex-1 p-4 overflow-hidden">
        <DayColumnsLayout
          days={days}
          exercises={exercises}
          viewMode={viewMode}
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
