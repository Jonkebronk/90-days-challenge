'use client'

import { useState } from 'react'
import {
  useDroppable,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Link2, TrendingDown, Save, CloudOff } from 'lucide-react'
import {
  ProgramDay,
  Exercise,
  ProgramExercise,
  SupersetGroup,
  Dropset,
  SUPERSET_COLORS,
  DROPSET_COLORS
} from './types'
import { ExerciseCard } from './ExerciseCard'
import { SupersetGroup as SupersetGroupComponent } from './SupersetGroup'
import { DropsetGroup } from './DropsetGroup'

interface WorkoutPlanPanelProps {
  day: ProgramDay
  exercises: Exercise[]
  supersets: SupersetGroup[]
  dropsets: Dropset[]
  onUpdateDay: (field: keyof ProgramDay, value: any) => void
  onUpdateExercise: (exerciseIndex: number, field: keyof ProgramExercise, value: any) => void
  onRemoveExercise: (exerciseIndex: number) => void
  onReorderExercises: (oldIndex: number, newIndex: number) => void
  onCreateSuperset: (indices: number[]) => void
  onRemoveSuperset: (supersetId: string) => void
  onCreateDropset: (indices: number[]) => void
  onRemoveDropset: (dropsetId: string) => void
  onUpdateDropset: (dropset: Dropset) => void
  hasUnsavedChanges?: boolean
  onManualSave?: () => void
  className?: string
  isDropTarget?: boolean
}

// Sortable Exercise Item
function SortableExerciseItem({
  exercise,
  exerciseData,
  onUpdate,
  onRemove,
  onToggleSuperset,
  onToggleDropset,
  isSelectedForSuperset,
  isSelectedForDropset,
  supersetColor,
  dropsetColor
}: {
  exercise: ProgramExercise
  exerciseData?: Exercise
  onUpdate: (field: keyof ProgramExercise, value: any) => void
  onRemove: () => void
  onToggleSuperset?: (selected: boolean) => void
  onToggleDropset?: (selected: boolean) => void
  isSelectedForSuperset?: boolean
  isSelectedForDropset?: boolean
  supersetColor?: string
  dropsetColor?: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: exercise.exerciseId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseCard
        exercise={exercise}
        exerciseData={exerciseData}
        onChange={onUpdate}
        onRemove={onRemove}
        onToggleSuperset={onToggleSuperset}
        isSelected={isSelectedForSuperset}
        supersetColor={supersetColor || dropsetColor}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  )
}

export function WorkoutPlanPanel({
  day,
  exercises,
  supersets,
  dropsets,
  onUpdateDay,
  onUpdateExercise,
  onRemoveExercise,
  onReorderExercises,
  onCreateSuperset,
  onRemoveSuperset,
  onCreateDropset,
  onRemoveDropset,
  onUpdateDropset,
  hasUnsavedChanges = false,
  onManualSave,
  className = '',
  isDropTarget = false
}: WorkoutPlanPanelProps) {
  const [selectedForSuperset, setSelectedForSuperset] = useState<Set<number>>(new Set())
  const [selectedForDropset, setSelectedForDropset] = useState<Set<number>>(new Set())
  const [groupingMode, setGroupingMode] = useState<'none' | 'superset' | 'dropset'>('none')

  // Make the panel a drop target
  const { setNodeRef, isOver } = useDroppable({
    id: 'workout-drop-zone'
  })

  const handleToggleSuperset = (index: number, selected: boolean) => {
    if (groupingMode !== 'superset') {
      setGroupingMode('superset')
      setSelectedForDropset(new Set())
    }

    setSelectedForSuperset(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(index)
      } else {
        newSet.delete(index)
      }
      return newSet
    })
  }

  const handleToggleDropset = (index: number, selected: boolean) => {
    if (groupingMode !== 'dropset') {
      setGroupingMode('dropset')
      setSelectedForSuperset(new Set())
    }

    setSelectedForDropset(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(index)
      } else {
        newSet.delete(index)
      }
      return newSet
    })
  }

  const handleCreateSuperset = () => {
    if (selectedForSuperset.size >= 2) {
      const indices = Array.from(selectedForSuperset).sort((a, b) => a - b)
      onCreateSuperset(indices)
      setSelectedForSuperset(new Set())
      setGroupingMode('none')
    }
  }

  const handleCreateDropset = () => {
    if (selectedForDropset.size >= 2) {
      const indices = Array.from(selectedForDropset).sort((a, b) => a - b)
      onCreateDropset(indices)
      setSelectedForDropset(new Set())
      setGroupingMode('none')
    }
  }

  const getExerciseSuperset = (index: number): SupersetGroup | undefined => {
    return supersets.find(s => s.exerciseIndices.includes(index))
  }

  const getExerciseDropset = (index: number): Dropset | undefined => {
    return dropsets.find(d => d.exerciseIndices.includes(index))
  }

  // Group exercises by superset/dropset
  type GroupedItem = {
    type: 'single' | 'superset' | 'dropset'
    content: any
  }

  const groupedExercises: GroupedItem[] = []
  const processedIndices = new Set<number>()

  day.exercises.forEach((exercise, index) => {
    if (processedIndices.has(index)) return

    const superset = getExerciseSuperset(index)
    const dropset = getExerciseDropset(index)

    if (superset) {
      groupedExercises.push({
        type: 'superset',
        content: {
          group: superset,
          exercises: superset.exerciseIndices.map(i => ({
            exercise: day.exercises[i],
            index: i
          }))
        }
      })
      superset.exerciseIndices.forEach(i => processedIndices.add(i))
    } else if (dropset) {
      groupedExercises.push({
        type: 'dropset',
        content: {
          dropset,
          exercises: dropset.exerciseIndices.map(i => ({
            exercise: day.exercises[i],
            index: i
          }))
        }
      })
      dropset.exerciseIndices.forEach(i => processedIndices.add(i))
    } else {
      groupedExercises.push({
        type: 'single',
        content: { exercise, index }
      })
      processedIndices.add(index)
    }
  })

  return (
    <div
      className={`flex flex-col h-full ${className} ${
        isDropTarget || isOver
          ? 'ring-2 ring-[#FFD700] ring-inset bg-[rgba(255,215,0,0.05)]'
          : ''
      } transition-all`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[rgba(255,215,0,0.1)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[rgba(255,255,255,0.9)]">
            {day.name || `Dag ${day.dayNumber}`}
          </h2>

          {/* Save Status */}
          <div className="flex items-center gap-2">
            {hasUnsavedChanges ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onManualSave}
                className="text-[rgba(255,215,0,0.8)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
              >
                <CloudOff className="w-4 h-4 mr-1" />
                Osparade ändringar
              </Button>
            ) : (
              <span className="text-xs text-[rgba(255,255,255,0.4)] flex items-center gap-1">
                <Save className="w-3 h-3" />
                Sparad
              </span>
            )}
          </div>
        </div>

        {/* Day Details */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-[rgba(255,255,255,0.6)]">Dagnamn</Label>
            <Input
              value={day.name}
              onChange={(e) => onUpdateDay('name', e.target.value)}
              placeholder="T.ex. Push Day"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-[rgba(255,255,255,0.6)]">Beskrivning</Label>
            <Input
              value={day.description}
              onChange={(e) => onUpdateDay('description', e.target.value)}
              placeholder="Kort beskrivning"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
            />
          </div>
        </div>
      </div>

      {/* Grouping Actions */}
      {(selectedForSuperset.size >= 2 || selectedForDropset.size >= 2) && (
        <div className="p-3 border-b border-[rgba(255,215,0,0.1)] bg-[rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-2">
            {selectedForSuperset.size >= 2 && (
              <Button
                onClick={handleCreateSuperset}
                size="sm"
                className="bg-[rgba(255,215,0,0.2)] border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.3)]"
              >
                <Link2 className="w-4 h-4 mr-1" />
                Skapa Superset ({selectedForSuperset.size})
              </Button>
            )}
            {selectedForDropset.size >= 2 && (
              <Button
                onClick={handleCreateDropset}
                size="sm"
                className="bg-[rgba(59,130,246,0.2)] border border-[rgba(59,130,246,0.3)] text-[#3B82F6] hover:bg-[rgba(59,130,246,0.3)]"
              >
                <TrendingDown className="w-4 h-4 mr-1" />
                Skapa Dropset ({selectedForDropset.size})
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedForSuperset(new Set())
                setSelectedForDropset(new Set())
                setGroupingMode('none')
              }}
              className="text-[rgba(255,255,255,0.6)]"
            >
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {/* Exercises */}
      <ScrollArea className="flex-1">
        <div ref={setNodeRef} className="p-4 min-h-full">
          {day.exercises.length > 0 ? (
              <SortableContext
                items={day.exercises.map(ex => ex.exerciseId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {groupedExercises.map((item, idx) => {
                    if (item.type === 'superset') {
                      return (
                        <SupersetGroupComponent
                          key={item.content.group.id}
                          group={item.content.group}
                          onRemove={() => onRemoveSuperset(item.content.group.id)}
                        >
                          <div className="space-y-2">
                            {item.content.exercises.map(({ exercise, index }: any) => {
                              const exerciseData = exercises.find(e => e.id === exercise.exerciseId)
                              return (
                                <SortableExerciseItem
                                  key={exercise.exerciseId}
                                  exercise={exercise}
                                  exerciseData={exerciseData}
                                  onUpdate={(field, value) => onUpdateExercise(index, field, value)}
                                  onRemove={() => onRemoveExercise(index)}
                                  supersetColor={item.content.group.color}
                                />
                              )
                            })}
                          </div>
                        </SupersetGroupComponent>
                      )
                    } else if (item.type === 'dropset') {
                      const exerciseNames = item.content.exercises.map(({ exercise }: any) => {
                        const data = exercises.find(e => e.id === exercise.exerciseId)
                        return data?.name || 'Okänd'
                      })
                      return (
                        <DropsetGroup
                          key={item.content.dropset.id}
                          dropset={item.content.dropset}
                          exerciseNames={exerciseNames}
                          onRemove={() => onRemoveDropset(item.content.dropset.id)}
                          onUpdate={onUpdateDropset}
                        >
                          <div className="space-y-2">
                            {item.content.exercises.map(({ exercise, index }: any) => {
                              const exerciseData = exercises.find(e => e.id === exercise.exerciseId)
                              return (
                                <SortableExerciseItem
                                  key={exercise.exerciseId}
                                  exercise={exercise}
                                  exerciseData={exerciseData}
                                  onUpdate={(field, value) => onUpdateExercise(index, field, value)}
                                  onRemove={() => onRemoveExercise(index)}
                                  dropsetColor={DROPSET_COLORS[0].value}
                                />
                              )
                            })}
                          </div>
                        </DropsetGroup>
                      )
                    } else {
                      const { exercise, index } = item.content
                      const exerciseData = exercises.find(e => e.id === exercise.exerciseId)
                      const isInSuperset = supersets.some(s => s.exerciseIndices.includes(index))
                      const isInDropset = dropsets.some(d => d.exerciseIndices.includes(index))

                      return (
                        <SortableExerciseItem
                          key={exercise.exerciseId}
                          exercise={exercise}
                          exerciseData={exerciseData}
                          onUpdate={(field, value) => onUpdateExercise(index, field, value)}
                          onRemove={() => onRemoveExercise(index)}
                          onToggleSuperset={
                            !isInDropset
                              ? (selected) => handleToggleSuperset(index, selected)
                              : undefined
                          }
                          isSelectedForSuperset={selectedForSuperset.has(index)}
                        />
                      )
                    }
                  })}
                </div>
              </SortableContext>
          ) : (
            <Card className={`bg-[rgba(255,255,255,0.03)] border-2 border-dashed transition-all ${
              isOver ? 'border-[#FFD700] bg-[rgba(255,215,0,0.1)]' : 'border-[rgba(255,215,0,0.2)]'
            }`}>
              <CardContent className="py-12 text-center">
                <p className={`mb-2 ${isOver ? 'text-[#FFD700]' : 'text-[rgba(255,255,255,0.5)]'}`}>
                  {isOver ? 'Släpp för att lägga till' : 'Inga övningar än'}
                </p>
                <p className="text-sm text-[rgba(255,255,255,0.4)]">
                  Dra övningar från biblioteket eller klicka för att lägga till
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-[rgba(255,215,0,0.1)] bg-[rgba(255,255,255,0.02)]">
        <div className="flex items-center justify-between text-xs text-[rgba(255,255,255,0.5)]">
          <span>{day.exercises.length} övningar</span>
          <div className="flex items-center gap-3">
            {supersets.length > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
                {supersets.length} superset{supersets.length !== 1 ? 's' : ''}
              </span>
            )}
            {dropsets.length > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                {dropsets.length} dropset{dropsets.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
