'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, GripVertical, Dumbbell } from 'lucide-react'
import { MuscleSlotCard } from './MuscleSlotCard'
import { AddMuscleSlotDialog } from './AddMuscleSlotDialog'
import {
  DayFormData,
  MuscleSlotFormData,
  SlotExerciseFormData,
  WEEKDAYS,
  Exercise,
} from './types'

interface DayColumnProps {
  day: DayFormData
  dayIndex: number
  exercises: Exercise[]
  compact?: boolean
  onUpdateDay: (dayIndex: number, updates: Partial<DayFormData>) => void
  onRemoveDay: (dayIndex: number) => void
  onAddMuscleSlot: (dayIndex: number, slot: MuscleSlotFormData) => void
  onUpdateMuscleSlot: (
    dayIndex: number,
    slotIndex: number,
    updates: Partial<MuscleSlotFormData>
  ) => void
  onRemoveMuscleSlot: (dayIndex: number, slotIndex: number) => void
  onAddExercise: (
    dayIndex: number,
    slotIndex: number,
    exercise: SlotExerciseFormData
  ) => void
  onUpdateExercise: (
    dayIndex: number,
    slotIndex: number,
    exerciseIndex: number,
    updates: Partial<SlotExerciseFormData>
  ) => void
  onRemoveExercise: (
    dayIndex: number,
    slotIndex: number,
    exerciseIndex: number
  ) => void
}

export function DayColumn({
  day,
  dayIndex,
  exercises,
  compact = false,
  onUpdateDay,
  onRemoveDay,
  onAddMuscleSlot,
  onUpdateMuscleSlot,
  onRemoveMuscleSlot,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
}: DayColumnProps) {
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false)

  return (
    <div className={`flex flex-col bg-zinc-900/50 rounded-lg border border-zinc-800 ${compact ? 'flex-1' : 'flex-shrink-0 w-[280px] md:w-[320px]'}`}>
      {/* Day Header - hidden in compact mode since we show weekday header above */}
      {!compact && (
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="h-4 w-4 text-zinc-600 cursor-grab" />
            <Select
              value={day.weekday?.toString() ?? ''}
              onValueChange={(value) =>
                onUpdateDay(dayIndex, {
                  weekday: value ? parseInt(value) : null,
                  dayName: value ? WEEKDAYS[parseInt(value)] : day.dayName,
                })
              }
            >
              <SelectTrigger className="flex-1 h-8 bg-zinc-800 border-zinc-700 text-sm">
                <SelectValue placeholder={day.dayName || 'Select day'} />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((weekday, index) => (
                  <SelectItem key={weekday} value={index.toString()}>
                    {weekday}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={() => onRemoveDay(dayIndex)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Muscle Slots */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {day.muscleSlots.map((slot, slotIndex) => (
          <MuscleSlotCard
            key={slot.id}
            slot={slot}
            slotIndex={slotIndex}
            dayIndex={dayIndex}
            exercises={exercises}
            onUpdateSlot={(updates) =>
              onUpdateMuscleSlot(dayIndex, slotIndex, updates)
            }
            onRemoveSlot={() => onRemoveMuscleSlot(dayIndex, slotIndex)}
            onAddExercise={(exercise) =>
              onAddExercise(dayIndex, slotIndex, exercise)
            }
            onUpdateExercise={(exerciseIndex, updates) =>
              onUpdateExercise(dayIndex, slotIndex, exerciseIndex, updates)
            }
            onRemoveExercise={(exerciseIndex) =>
              onRemoveExercise(dayIndex, slotIndex, exerciseIndex)
            }
          />
        ))}

        {day.muscleSlots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
            <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
              <Dumbbell className="h-5 w-5" />
            </div>
            <p className="text-sm">No muscle groups added yet</p>
            <p className="text-xs mt-1 text-zinc-700">Click below to add one</p>
          </div>
        )}
      </div>

      {/* Add Muscle Group Button */}
      <div className="p-2 border-t border-zinc-800">
        <button
          onClick={() => setIsAddSlotOpen(true)}
          className="w-full h-9 rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/60 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          ADD A MUSCLE GROUP
        </button>
      </div>

      {/* Add Muscle Slot Dialog */}
      <AddMuscleSlotDialog
        open={isAddSlotOpen}
        onOpenChange={setIsAddSlotOpen}
        existingMuscleGroups={day.muscleSlots.map((s) => s.muscleGroup)}
        onAdd={(slot) => {
          onAddMuscleSlot(dayIndex, slot)
          setIsAddSlotOpen(false)
        }}
      />
    </div>
  )
}
