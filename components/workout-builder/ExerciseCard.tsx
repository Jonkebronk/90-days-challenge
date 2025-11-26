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

  // Format reps as "min-max" or just "min" if same
  const getRepsValue = () => {
    if (exercise.repsMin && exercise.repsMax && exercise.repsMin !== exercise.repsMax) {
      return `${exercise.repsMin}-${exercise.repsMax}`
    }
    return exercise.repsMin?.toString() || ''
  }

  // Parse reps input like "12-15" or "10"
  const handleRepsChange = (value: string) => {
    if (value.includes('-')) {
      const [min, max] = value.split('-').map(v => parseInt(v.trim()) || null)
      onChange('repsMin', min)
      onChange('repsMax', max)
    } else {
      const reps = parseInt(value) || null
      onChange('repsMin', reps)
      onChange('repsMax', reps)
    }
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
        <div className="flex items-center gap-2">
          {/* Sets */}
          <div className="text-center">
            <span className="text-[10px] text-[rgba(255,255,255,0.4)] block">Sets</span>
            <Input
              type="number"
              value={exercise.sets}
              onChange={(e) => onChange('sets', parseInt(e.target.value) || 0)}
              className="w-14 h-8 text-center bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-white text-sm px-1"
            />
          </div>

          {/* Reps */}
          <div className="text-center">
            <span className="text-[10px] text-[rgba(255,255,255,0.4)] block">Reps</span>
            <Input
              value={getRepsValue()}
              onChange={(e) => handleRepsChange(e.target.value)}
              placeholder="8-12"
              className="w-16 h-8 text-center bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-white text-sm px-1"
            />
          </div>

          {/* Rest */}
          <div className="text-center">
            <span className="text-[10px] text-[rgba(255,255,255,0.4)] block">Vila</span>
            <Input
              type="number"
              value={exercise.restSeconds}
              onChange={(e) => onChange('restSeconds', parseInt(e.target.value) || 60)}
              className="w-14 h-8 text-center bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-white text-sm px-1"
            />
          </div>

          {/* Superset Toggle */}
          {onToggleSuperset && (
            <div className="flex items-center pl-2 border-l border-[rgba(255,255,255,0.1)]">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onToggleSuperset(checked === true)}
                className="border-[rgba(255,215,0,0.3)] data-[state=checked]:bg-[#FFD700] data-[state=checked]:border-[#FFD700]"
              />
              <span className="text-[10px] text-[rgba(255,255,255,0.4)] ml-1">S</span>
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
