'use client'

import { ProgramDay, Exercise, ProgramExercise } from './types'
import { DualPanelWorkoutBuilder } from './DualPanelWorkoutBuilder'

interface DayBuilderStepProps {
  days: ProgramDay[]
  exercises: Exercise[]
  onUpdateDay: (index: number, field: keyof ProgramDay, value: any) => void
  onAddDay: () => void
  onRemoveDay: (index: number) => void
  onAddExercise: (dayIndex: number, exercise: Exercise) => void
  onUpdateExercise: (dayIndex: number, exerciseIndex: number, field: keyof ProgramExercise, value: any) => void
  onRemoveExercise: (dayIndex: number, exerciseIndex: number) => void
  onReorderExercises: (dayIndex: number, oldIndex: number, newIndex: number) => void
  onPrevious: () => void
  onSave?: (days: ProgramDay[]) => Promise<void>
}

export function DayBuilderStep({
  days,
  exercises,
  onUpdateDay,
  onAddDay,
  onRemoveDay,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
  onReorderExercises,
  onPrevious,
  onSave
}: DayBuilderStepProps) {
  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px]">
      <DualPanelWorkoutBuilder
        days={days}
        exercises={exercises}
        onUpdateDay={onUpdateDay}
        onAddDay={onAddDay}
        onRemoveDay={onRemoveDay}
        onAddExercise={onAddExercise}
        onUpdateExercise={onUpdateExercise}
        onRemoveExercise={onRemoveExercise}
        onReorderExercises={onReorderExercises}
        onPrevious={onPrevious}
        onSave={onSave}
      />
    </div>
  )
}
