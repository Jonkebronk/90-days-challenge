'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayColumn } from './DayColumn'
import {
  DayFormData,
  MuscleSlotFormData,
  SlotExerciseFormData,
  Exercise,
} from './types'

interface DayColumnsLayoutProps {
  days: DayFormData[]
  exercises: Exercise[]
  onAddDay: () => void
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

export function DayColumnsLayout({
  days,
  exercises,
  onAddDay,
  onUpdateDay,
  onRemoveDay,
  onAddMuscleSlot,
  onUpdateMuscleSlot,
  onRemoveMuscleSlot,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
}: DayColumnsLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340 // Width of one column + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="relative">
      {/* Scroll Buttons */}
      {days.length > 2 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-zinc-900/90 border-zinc-700 shadow-lg hidden md:flex"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-zinc-900/90 border-zinc-700 shadow-lg hidden md:flex"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Columns Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {/* Day Columns */}
        {days.map((day, dayIndex) => (
          <div key={day.id} style={{ scrollSnapAlign: 'start' }}>
            <DayColumn
              day={day}
              dayIndex={dayIndex}
              exercises={exercises}
              onUpdateDay={onUpdateDay}
              onRemoveDay={onRemoveDay}
              onAddMuscleSlot={onAddMuscleSlot}
              onUpdateMuscleSlot={onUpdateMuscleSlot}
              onRemoveMuscleSlot={onRemoveMuscleSlot}
              onAddExercise={onAddExercise}
              onUpdateExercise={onUpdateExercise}
              onRemoveExercise={onRemoveExercise}
            />
          </div>
        ))}

        {/* Add Day Column */}
        <div
          className="flex-shrink-0 w-[280px] md:w-[320px] flex items-center justify-center"
          style={{ scrollSnapAlign: 'start' }}
        >
          <Button
            variant="outline"
            className="h-full min-h-[200px] w-full border-dashed border-2 border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/5 flex flex-col gap-2"
            onClick={onAddDay}
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">ADD A DAY</span>
          </Button>
        </div>
      </div>

      {/* Mobile Hint */}
      <div className="md:hidden text-center mt-2 text-xs text-zinc-500">
        Swipe to see more days →
      </div>
    </div>
  )
}
