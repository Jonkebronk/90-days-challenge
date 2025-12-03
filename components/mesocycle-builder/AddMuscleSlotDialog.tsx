'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_COLORS,
  PRIORITY_COLORS,
  MuscleSlotFormData,
  SlotPriority,
  createEmptyMuscleSlot,
} from './types'

interface AddMuscleSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingMuscleGroups: string[]
  onAdd: (slot: MuscleSlotFormData) => void
}

export function AddMuscleSlotDialog({
  open,
  onOpenChange,
  existingMuscleGroups,
  onAdd,
}: AddMuscleSlotDialogProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [priority, setPriority] = useState<SlotPriority>('primary')

  const handleAdd = () => {
    if (!selectedMuscle) return
    const slot = createEmptyMuscleSlot(selectedMuscle, priority)
    onAdd(slot)
    setSelectedMuscle(null)
    setPriority('primary')
  }

  const handleClose = () => {
    setSelectedMuscle(null)
    setPriority('primary')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Add Muscle Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Priority Selection */}
          <div>
            <label className="text-sm text-zinc-400 block mb-2">Priority</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className={cn(
                  'flex-1 h-9',
                  priority === 'primary'
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                )}
                onClick={() => setPriority('primary')}
              >
                Primary
              </Button>
              <Button
                variant="outline"
                className={cn(
                  'flex-1 h-9',
                  priority === 'secondary'
                    ? 'bg-zinc-600/30 border-zinc-500/50 text-zinc-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                )}
                onClick={() => setPriority('secondary')}
              >
                Secondary
              </Button>
            </div>
          </div>

          {/* Muscle Group Selection */}
          <div>
            <label className="text-sm text-zinc-400 block mb-2">
              Muscle Group
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MUSCLE_GROUPS.map((muscle) => {
                const isSelected = selectedMuscle === muscle
                const isExisting = existingMuscleGroups.includes(muscle)
                const color = MUSCLE_GROUP_COLORS[muscle]

                return (
                  <button
                    key={muscle}
                    disabled={isExisting}
                    className={cn(
                      'p-2 rounded-lg border text-xs font-medium transition-all',
                      isSelected
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                        : isExisting
                        ? 'border-zinc-800 bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700/50'
                    )}
                    onClick={() => !isExisting && setSelectedMuscle(muscle)}
                  >
                    <div
                      className="w-2 h-2 rounded-full mx-auto mb-1"
                      style={{ backgroundColor: isExisting ? '#3f3f46' : color }}
                    />
                    {muscle}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          {selectedMuscle && (
            <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50">
              <div className="text-xs text-zinc-500 mb-1">Preview</div>
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    'text-xs',
                    priority === 'primary'
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-500 text-white'
                  )}
                  style={{
                    backgroundColor:
                      priority === 'primary'
                        ? MUSCLE_GROUP_COLORS[selectedMuscle]
                        : undefined,
                  }}
                >
                  {selectedMuscle.toUpperCase()}
                </Badge>
                {priority === 'secondary' && (
                  <span className="text-xs text-zinc-500">secondary</span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-zinc-700"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              disabled={!selectedMuscle}
              onClick={handleAdd}
            >
              Add Muscle Group
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
