'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Library, Dumbbell } from 'lucide-react'
import {
  ProgramDay,
  Exercise,
  ProgramExercise,
  SupersetGroup,
  Dropset,
  SUPERSET_COLORS,
  DROPSET_COLORS
} from './types'
import { DayTabs } from './DayTabs'
import { ExerciseLibraryPanel } from './ExerciseLibraryPanel'
import { WorkoutPlanPanel } from './WorkoutPlanPanel'
import { useAutoSave } from './hooks/useAutoSave'

interface DualPanelWorkoutBuilderProps {
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

export function DualPanelWorkoutBuilder({
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
}: DualPanelWorkoutBuilderProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [mobileTab, setMobileTab] = useState<'library' | 'workout'>('workout')

  // Superset and dropset state per day
  const [supersetsMap, setSupersetsMap] = useState<Record<number, SupersetGroup[]>>({})
  const [dropsetsMap, setDropsetsMap] = useState<Record<number, Dropset[]>>({})

  const currentDay = days[selectedDayIndex] || { dayNumber: 1, name: '', description: '', isRestDay: false, exercises: [] }
  const currentSupersets = supersetsMap[selectedDayIndex] || []
  const currentDropsets = dropsetsMap[selectedDayIndex] || []

  // Auto-save functionality
  const handleAutoSave = useCallback(async (data: ProgramDay[]) => {
    if (onSave) {
      await onSave(data)
    }
  }, [onSave])

  const { hasUnsavedChanges, triggerSave, markAsSaved } = useAutoSave(
    days,
    handleAutoSave,
    30000,
    !!onSave
  )

  // Handle adding exercise (click)
  const handleAddExercise = (exercise: Exercise) => {
    onAddExercise(selectedDayIndex, exercise)
    if (window.innerWidth < 1024) {
      setMobileTab('workout')
    }
  }

  // Handle superset creation
  const handleCreateSuperset = (indices: number[]) => {
    const nextColor = SUPERSET_COLORS[currentSupersets.length % SUPERSET_COLORS.length].value
    const nextLabel = String.fromCharCode(65 + currentSupersets.length)

    const newSuperset: SupersetGroup = {
      id: `superset-${Date.now()}`,
      exerciseIndices: indices,
      color: nextColor,
      label: `Superset ${nextLabel}`
    }

    setSupersetsMap(prev => ({
      ...prev,
      [selectedDayIndex]: [...(prev[selectedDayIndex] || []), newSuperset]
    }))
  }

  // Handle superset removal
  const handleRemoveSuperset = (supersetId: string) => {
    setSupersetsMap(prev => ({
      ...prev,
      [selectedDayIndex]: (prev[selectedDayIndex] || []).filter(s => s.id !== supersetId)
    }))
  }

  // Handle dropset creation
  const handleCreateDropset = (indices: number[]) => {
    const newDropset: Dropset = {
      id: `dropset-${Date.now()}`,
      exerciseIndices: indices,
      weights: indices.map(() => 0),
      reps: indices.map(() => 0),
      sequence: 'descending'
    }

    setDropsetsMap(prev => ({
      ...prev,
      [selectedDayIndex]: [...(prev[selectedDayIndex] || []), newDropset]
    }))
  }

  // Handle dropset removal
  const handleRemoveDropset = (dropsetId: string) => {
    setDropsetsMap(prev => ({
      ...prev,
      [selectedDayIndex]: (prev[selectedDayIndex] || []).filter(d => d.id !== dropsetId)
    }))
  }

  // Handle dropset update
  const handleUpdateDropset = (updatedDropset: Dropset) => {
    setDropsetsMap(prev => ({
      ...prev,
      [selectedDayIndex]: (prev[selectedDayIndex] || []).map(d =>
        d.id === updatedDropset.id ? updatedDropset : d
      )
    }))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[rgba(255,215,0,0.1)]">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            className="text-[rgba(255,255,255,0.7)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">
              Bygg träningsdagar
            </h1>
            <p className="text-sm text-[rgba(255,255,255,0.6)]">
              Klicka på övningar för att lägga till
            </p>
          </div>
        </div>
      </div>

        {/* Day Tabs */}
        <div className="p-4 border-b border-[rgba(255,215,0,0.1)]">
          <DayTabs
            days={days.map(d => ({ dayNumber: d.dayNumber, name: d.name }))}
            selectedIndex={selectedDayIndex}
            onSelectDay={setSelectedDayIndex}
            onAddDay={onAddDay}
            onRemoveDay={onRemoveDay}
          />
        </div>

        {/* Desktop Layout: Side-by-side panels */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          {/* Exercise Library Panel - Left */}
          <ExerciseLibraryPanel
            exercises={exercises}
            onSelectExercise={handleAddExercise}
            className="w-[450px] flex-shrink-0"
          />

          {/* Workout Plan Panel - Right */}
          <WorkoutPlanPanel
            day={currentDay}
            exercises={exercises}
            supersets={currentSupersets}
            dropsets={currentDropsets}
            onUpdateDay={(field, value) => onUpdateDay(selectedDayIndex, field, value)}
            onUpdateExercise={(exerciseIndex, field, value) =>
              onUpdateExercise(selectedDayIndex, exerciseIndex, field, value)
            }
            onRemoveExercise={(exerciseIndex) => onRemoveExercise(selectedDayIndex, exerciseIndex)}
            onReorderExercises={(oldIndex, newIndex) =>
              onReorderExercises(selectedDayIndex, oldIndex, newIndex)
            }
            onCreateSuperset={handleCreateSuperset}
            onRemoveSuperset={handleRemoveSuperset}
            onCreateDropset={handleCreateDropset}
            onRemoveDropset={handleRemoveDropset}
            onUpdateDropset={handleUpdateDropset}
            hasUnsavedChanges={hasUnsavedChanges()}
            onManualSave={triggerSave}
            className="flex-1 border-l border-[rgba(255,215,0,0.1)]"
          />
        </div>

        {/* Mobile/Tablet Layout: Tabs */}
        <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
          <Tabs
            value={mobileTab}
            onValueChange={(v) => setMobileTab(v as 'library' | 'workout')}
            className="flex flex-col flex-1"
          >
            <TabsList className="mx-4 mt-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,215,0,0.2)]">
              <TabsTrigger
                value="library"
                className="flex-1 data-[state=active]:bg-[rgba(255,215,0,0.2)] data-[state=active]:text-[#FFD700]"
              >
                <Library className="w-4 h-4 mr-2" />
                Bibliotek
              </TabsTrigger>
              <TabsTrigger
                value="workout"
                className="flex-1 data-[state=active]:bg-[rgba(255,215,0,0.2)] data-[state=active]:text-[#FFD700]"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Träning
                {currentDay.exercises.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-[rgba(255,215,0,0.3)] rounded-full">
                    {currentDay.exercises.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="flex-1 mt-0 overflow-hidden">
              <ExerciseLibraryPanel
                exercises={exercises}
                onSelectExercise={handleAddExercise}
                className="h-full"
              />
            </TabsContent>

            <TabsContent value="workout" className="flex-1 mt-0 overflow-hidden">
              <WorkoutPlanPanel
                day={currentDay}
                exercises={exercises}
                supersets={currentSupersets}
                dropsets={currentDropsets}
                onUpdateDay={(field, value) => onUpdateDay(selectedDayIndex, field, value)}
                onUpdateExercise={(exerciseIndex, field, value) =>
                  onUpdateExercise(selectedDayIndex, exerciseIndex, field, value)
                }
                onRemoveExercise={(exerciseIndex) => onRemoveExercise(selectedDayIndex, exerciseIndex)}
                onReorderExercises={(oldIndex, newIndex) =>
                  onReorderExercises(selectedDayIndex, oldIndex, newIndex)
                }
                onCreateSuperset={handleCreateSuperset}
                onRemoveSuperset={handleRemoveSuperset}
                onCreateDropset={handleCreateDropset}
                onRemoveDropset={handleRemoveDropset}
                onUpdateDropset={handleUpdateDropset}
                hasUnsavedChanges={hasUnsavedChanges()}
                onManualSave={triggerSave}
                className="h-full"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
  )
}
