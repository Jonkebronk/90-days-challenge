'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Trash2, MoreVertical, ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExerciseSelector } from './ExerciseSelector'
import { SlotExerciseCard } from './SlotExerciseCard'
import {
  MuscleSlotFormData,
  SlotExerciseFormData,
  PRIORITY_COLORS,
  MUSCLE_GROUP_COLORS,
  Exercise,
  SlotPriority,
  createEmptySlotExercise,
} from './types'

interface MuscleSlotCardProps {
  slot: MuscleSlotFormData
  slotIndex: number
  dayIndex: number
  exercises: Exercise[]
  onUpdateSlot: (updates: Partial<MuscleSlotFormData>) => void
  onRemoveSlot: () => void
  onAddExercise: (exercise: SlotExerciseFormData) => void
  onUpdateExercise: (
    exerciseIndex: number,
    updates: Partial<SlotExerciseFormData>
  ) => void
  onRemoveExercise: (exerciseIndex: number) => void
}

export function MuscleSlotCard({
  slot,
  slotIndex,
  dayIndex,
  exercises,
  onUpdateSlot,
  onRemoveSlot,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
}: MuscleSlotCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isSelectingExercise, setIsSelectingExercise] = useState(false)

  const colors = PRIORITY_COLORS[slot.priority]
  const muscleColor = MUSCLE_GROUP_COLORS[slot.muscleGroup] || '#FFD700'

  // Filter exercises by muscle group
  const filteredExercises = exercises.filter((ex) =>
    ex.muscleGroups.some(
      (mg) => mg.toLowerCase() === slot.muscleGroup.toLowerCase()
    )
  )

  const handleSelectExercise = (exercise: Exercise) => {
    const newExercise = createEmptySlotExercise(exercise.id, exercise)
    onAddExercise(newExercise)
    setIsSelectingExercise(false)
  }

  const togglePriority = () => {
    const newPriority: SlotPriority =
      slot.priority === 'primary' ? 'secondary' : 'primary'
    onUpdateSlot({ priority: newPriority })
  }

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        colors.bg,
        colors.border
      )}
    >
      {/* Slot Header */}
      <div
        className={cn(
          'flex items-center justify-between p-2 cursor-pointer',
          colors.bgHover
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Badge
            className={cn('text-xs font-medium', colors.badge, colors.badgeText)}
            style={{ backgroundColor: slot.priority === 'primary' ? muscleColor : undefined }}
          >
            {slot.muscleGroup.toUpperCase()}
          </Badge>
          {slot.priority === 'secondary' && (
            <span className="text-xs text-zinc-500">secondary</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={togglePriority}>
                Set as {slot.priority === 'primary' ? 'secondary' : 'primary'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onRemoveSlot}
                className="text-red-400 focus:text-red-400"
              >
                Remove muscle group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform text-zinc-500',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-2 pt-0 space-y-2">
          {/* Exercises */}
          {slot.exercises.map((exercise, exerciseIndex) => (
            <SlotExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={exerciseIndex}
              onUpdate={(updates) => onUpdateExercise(exerciseIndex, updates)}
              onRemove={() => onRemoveExercise(exerciseIndex)}
            />
          ))}

          {/* Exercise Selector or Add Button */}
          {isSelectingExercise ? (
            <ExerciseSelector
              exercises={filteredExercises}
              allExercises={exercises}
              muscleGroup={slot.muscleGroup}
              onSelect={handleSelectExercise}
              onCancel={() => setIsSelectingExercise(false)}
            />
          ) : (
            <Button
              variant="ghost"
              className="w-full h-8 text-xs text-zinc-500 hover:text-zinc-300 justify-start"
              onClick={() => setIsSelectingExercise(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Choose an exercise
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
