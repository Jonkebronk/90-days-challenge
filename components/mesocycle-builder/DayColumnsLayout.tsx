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
  viewMode: 'scroll' | 'week'
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
  viewMode,
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

  // Week view: Show all 7 days Mon-Sun
  if (viewMode === 'week') {
    return (
      <div className="h-full overflow-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[1200px]">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
            (weekday, weekdayIndex) => {
              // Find day that matches this weekday
              const dayIndex = days.findIndex((d) => d.weekday === weekdayIndex)
              const day = dayIndex >= 0 ? days[dayIndex] : null

              return (
                <div key={weekday} className="flex flex-col">
                  {/* Weekday Header */}
                  <div className="text-center text-xs font-medium text-zinc-400 mb-2 py-1 bg-zinc-800/50 rounded-t-lg">
                    {weekday.slice(0, 3)}
                  </div>

                  {day ? (
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
                      compact
                    />
                  ) : (
                    <button
                      onClick={() => {
                        onAddDay()
                        // Note: The new day will be created, user can then assign weekday
                      }}
                      className="flex-1 min-h-[150px] rounded-lg border-2 border-dashed border-zinc-800 bg-zinc-900/20 text-zinc-600 hover:text-amber-400 hover:border-amber-500/30 hover:bg-zinc-800/30 flex flex-col items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-xs">Rest day</span>
                    </button>
                  )}
                </div>
              )
            }
          )}
        </div>
      </div>
    )
  }

  // Scroll view (default)
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
          className="flex-shrink-0 w-[280px] md:w-[320px]"
          style={{ scrollSnapAlign: 'start' }}
        >
          <button
            onClick={onAddDay}
            className="h-full min-h-[200px] w-full rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/30 text-zinc-500 hover:text-amber-400 hover:border-amber-500/50 hover:bg-zinc-800/50 flex flex-col items-center justify-center gap-3 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">ADD A DAY</span>
          </button>
        </div>
      </div>

      {/* Mobile Hint */}
      <div className="md:hidden text-center mt-2 text-xs text-zinc-500">
        Swipe to see more days →
      </div>
    </div>
  )
}
