import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { GripVertical, Trash2 } from 'lucide-react'
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
  return (
    <div
      className={cn(
        "p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,215,0,0.1)] rounded-lg space-y-3 transition-all",
        isDragging && "opacity-50 scale-95",
        supersetColor && "border-l-4",
        isSelected && "ring-2 ring-[rgba(255,215,0,0.5)]"
      )}
      style={supersetColor ? { borderLeftColor: supersetColor } : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing pt-1 touch-none"
        >
          <GripVertical className="w-5 h-5 text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,215,0,0.8)]" />
        </div>

        {/* Exercise Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="text-[rgba(255,255,255,0.9)] font-medium">
                {exerciseData?.name || 'Välj övning'}
              </h4>
              {exerciseData && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {exerciseData.muscleGroups.map(mg => (
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
            </div>

            <div className="flex items-center gap-2">
              {/* Superset Selection */}
              {onToggleSuperset && (
                <div className="flex items-center gap-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggleSuperset}
                    id={`superset-${exercise.exerciseId}`}
                  />
                  <Label
                    htmlFor={`superset-${exercise.exerciseId}`}
                    className="text-xs text-[rgba(255,255,255,0.6)] cursor-pointer whitespace-nowrap"
                  >
                    Superset
                  </Label>
                </div>
              )}

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Sets/Reps Table */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-xs text-[rgba(255,255,255,0.6)]">Sets</Label>
              <Input
                type="number"
                value={exercise.sets}
                onChange={(e) => onChange('sets', parseInt(e.target.value) || 0)}
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-[rgba(255,255,255,0.6)]">Reps Min</Label>
              <Input
                type="number"
                value={exercise.repsMin || ''}
                onChange={(e) => onChange('repsMin', e.target.value ? parseInt(e.target.value) : null)}
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-[rgba(255,255,255,0.6)]">Reps Max</Label>
              <Input
                type="number"
                value={exercise.repsMax || ''}
                onChange={(e) => onChange('repsMax', e.target.value ? parseInt(e.target.value) : null)}
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-[rgba(255,255,255,0.6)]">Vila (s)</Label>
              <Input
                type="number"
                value={exercise.restSeconds}
                onChange={(e) => onChange('restSeconds', parseInt(e.target.value) || 60)}
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-[rgba(255,255,255,0.6)]">Anteckningar</Label>
            <Input
              value={exercise.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="T.ex. Drop set, superset..."
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
