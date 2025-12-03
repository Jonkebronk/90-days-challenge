'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Dumbbell, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SlotExerciseFormData } from './types'

interface SlotExerciseCardProps {
  exercise: SlotExerciseFormData
  exerciseIndex: number
  onUpdate: (updates: Partial<SlotExerciseFormData>) => void
  onRemove: () => void
}

export function SlotExerciseCard({
  exercise,
  exerciseIndex,
  onUpdate,
  onRemove,
}: SlotExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-zinc-800/80 rounded border border-zinc-700/50 overflow-hidden">
      {/* Exercise Header */}
      <div
        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-zinc-700/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="h-7 w-7 rounded bg-zinc-700 flex items-center justify-center flex-shrink-0">
          {exercise.exercise?.thumbnailUrl ? (
            <img
              src={exercise.exercise.thumbnailUrl}
              alt={exercise.exercise.name}
              className="h-7 w-7 rounded object-cover"
            />
          ) : (
            <Dumbbell className="h-3 w-3 text-zinc-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-zinc-200 truncate">
            {exercise.exercise?.name || 'Unknown exercise'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {exercise.sets} sets × {exercise.reps || '?'} reps
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-zinc-500 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="p-2 pt-0 border-t border-zinc-700/50 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Sets */}
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Sets</label>
              <Input
                type="number"
                value={exercise.sets}
                onChange={(e) =>
                  onUpdate({ sets: parseInt(e.target.value) || 1 })
                }
                className="h-7 text-xs bg-zinc-900 border-zinc-700"
                min={1}
                max={10}
              />
            </div>
            {/* Reps */}
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Reps</label>
              <Input
                value={exercise.reps}
                onChange={(e) => onUpdate({ reps: e.target.value })}
                placeholder="8-12"
                className="h-7 text-xs bg-zinc-900 border-zinc-700"
              />
            </div>
            {/* Rest */}
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">
                Rest (sec)
              </label>
              <Input
                type="number"
                value={exercise.restSeconds}
                onChange={(e) =>
                  onUpdate({ restSeconds: parseInt(e.target.value) || 60 })
                }
                className="h-7 text-xs bg-zinc-900 border-zinc-700"
                min={0}
                step={15}
              />
            </div>
            {/* RIR */}
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">
                RIR
              </label>
              <Input
                type="number"
                value={exercise.targetRIR ?? ''}
                onChange={(e) =>
                  onUpdate({
                    targetRIR: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="0-4"
                className="h-7 text-xs bg-zinc-900 border-zinc-700"
                min={0}
                max={5}
              />
            </div>
          </div>

          {/* Tempo */}
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">
              Tempo (e.g., 3-0-1-0)
            </label>
            <Input
              value={exercise.tempo}
              onChange={(e) => onUpdate({ tempo: e.target.value })}
              placeholder="3-0-1-0"
              className="h-7 text-xs bg-zinc-900 border-zinc-700"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Notes</label>
            <Input
              value={exercise.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Special instructions..."
              className="h-7 text-xs bg-zinc-900 border-zinc-700"
            />
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={onRemove}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove Exercise
          </Button>
        </div>
      )}
    </div>
  )
}
