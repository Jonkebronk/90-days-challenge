'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { GripVertical, Trash2, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { ProgramExercise, Exercise } from './types'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: ProgramExercise
  exerciseData?: Exercise
  onChange: (field: keyof ProgramExercise, value: any) => void
  onRemove: () => void
  onToggleSuperset?: (selected: boolean) => void
  isSelected?: boolean
  supersetColor?: string
  dragHandleProps?: any
  isDragging?: boolean
}

export function ExerciseCard({
  exercise,
  exerciseData,
  onChange,
  onRemove,
  onToggleSuperset,
  isSelected = false,
  supersetColor,
  dragHandleProps,
  isDragging = false
}: ExerciseCardProps) {
  const [showNotes, setShowNotes] = useState(
    !!(exercise.notes || exercise.coachNotes)
  )

  // Get reps value - use reps string if available, otherwise format from min/max
  const getRepsValue = () => {
    if (exercise.reps) return exercise.reps
    if (exercise.repsMin && exercise.repsMax && exercise.repsMin !== exercise.repsMax) {
      return `${exercise.repsMin}-${exercise.repsMax}`
    }
    return exercise.repsMin?.toString() || ''
  }

  return (
    <div
      className={cn(
        "group bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] rounded-xl transition-all",
        isDragging && "opacity-50 scale-[0.98]",
        supersetColor && "border-l-4",
        isSelected && "ring-2 ring-[rgba(255,215,0,0.4)]"
      )}
      style={supersetColor ? { borderLeftColor: supersetColor } : undefined}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 p-3">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing touch-none opacity-30 group-hover:opacity-60 transition-opacity"
        >
          <GripVertical className="w-5 h-5 text-white" />
        </div>

        {/* Exercise Name */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium truncate">
            {exerciseData?.name || 'Välj övning'}
          </h4>
          {!showNotes && (
            <button
              onClick={() => setShowNotes(true)}
              className="text-xs text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,215,0,0.8)] transition-colors"
            >
              Lägg till anteckning
            </button>
          )}
        </div>

        {/* Compact Stats */}
        <div className="flex items-center gap-4">
          {/* Sets */}
          <div className="text-center">
            <span className="text-sm text-[rgba(255,255,255,0.6)] block mb-1">Sets</span>
            <Input
              type="text"
              value={exercise.sets || ''}
              onChange={(e) => onChange('sets', e.target.value)}
              placeholder="3"
              className="w-24 h-14 text-center text-xl bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white font-medium"
            />
          </div>

          {/* Reps */}
          <div className="text-center">
            <span className="text-sm text-[rgba(255,255,255,0.6)] block mb-1">Reps</span>
            <Input
              type="text"
              value={getRepsValue()}
              onChange={(e) => onChange('reps', e.target.value)}
              placeholder="8-12"
              className="w-28 h-14 text-center text-xl bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white font-medium"
            />
          </div>

          {/* Rest */}
          <div className="text-center">
            <span className="text-sm text-[rgba(255,255,255,0.6)] block mb-1">Vila</span>
            <Input
              type="text"
              value={exercise.restSeconds || ''}
              onChange={(e) => onChange('restSeconds', e.target.value)}
              placeholder="60"
              className="w-24 h-14 text-center text-xl bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white font-medium"
            />
          </div>

          {/* Tempo */}
          <div className="text-center">
            <span className="text-sm text-[rgba(255,255,255,0.6)] block mb-1">Tempo</span>
            <Input
              type="text"
              value={exercise.tempo || ''}
              onChange={(e) => onChange('tempo', e.target.value)}
              placeholder="3-0-1-0"
              className="w-32 h-14 text-center text-xl bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-white font-medium"
            />
          </div>

          {/* Superset Toggle */}
          {onToggleSuperset && (
            <div className="flex items-center gap-2 pl-4 border-l border-[rgba(255,255,255,0.15)]">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onToggleSuperset(checked === true)}
                className="w-6 h-6 border-[rgba(255,215,0,0.4)] data-[state=checked]:bg-[#FFD700] data-[state=checked]:border-[#FFD700]"
              />
              <span className="text-sm text-[rgba(255,255,255,0.6)]">Superset</span>
            </div>
          )}

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="w-8 h-8 text-[rgba(255,255,255,0.3)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expandable Notes Section */}
      {showNotes && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[rgba(255,255,255,0.5)]">Anteckningar</span>
            <button
              onClick={() => setShowNotes(false)}
              className="text-xs text-[rgba(255,255,255,0.3)] hover:text-white"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          <Input
            value={exercise.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="T.ex. Tempo 3-1-2, dropset..."
            className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-white text-sm placeholder:text-[rgba(255,255,255,0.3)]"
          />

          <div>
            <span className="text-xs text-blue-400">Coach Notes</span>
            <Textarea
              value={exercise.coachNotes || ''}
              onChange={(e) => onChange('coachNotes', e.target.value)}
              placeholder="Instruktioner till klienten..."
              className="mt-1 bg-[rgba(255,255,255,0.03)] border-blue-500/20 text-white text-sm min-h-[50px] resize-none placeholder:text-[rgba(255,255,255,0.3)]"
              maxLength={300}
            />
          </div>
        </div>
      )}
    </div>
  )
}
