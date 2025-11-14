import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Link2, ArrowLeft } from 'lucide-react'
import { ProgramDay, Exercise, ProgramExercise, SupersetGroup, SUPERSET_COLORS } from './types'
import { DayTabs } from './DayTabs'
import { ExerciseCard } from './ExerciseCard'
import { ExerciseBottomSheet } from './ExerciseBottomSheet'
import { SupersetGroup as SupersetGroupComponent } from './SupersetGroup'

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
}

// Sortable Exercise Item
function SortableExerciseItem({
  exercise,
  exerciseData,
  onUpdate,
  onRemove,
  onToggleSuperset,
  isSelected,
  supersetColor
}: {
  exercise: ProgramExercise
  exerciseData?: Exercise
  onUpdate: (field: keyof ProgramExercise, value: any) => void
  onRemove: () => void
  onToggleSuperset?: (selected: boolean) => void
  isSelected?: boolean
  supersetColor?: string
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
        isSelected={isSelected}
        supersetColor={supersetColor}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  )
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
  onPrevious
}: DayBuilderStepProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [selectedForSuperset, setSelectedForSuperset] = useState<Set<number>>(new Set())
  const [supersets, setSupersets] = useState<SupersetGroup[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const currentDay = days[selectedDayIndex]

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = currentDay.exercises.findIndex(ex => ex.exerciseId === active.id)
      const newIndex = currentDay.exercises.findIndex(ex => ex.exerciseId === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderExercises(selectedDayIndex, oldIndex, newIndex)
      }
    }
  }

  const handleAddExercise = (exercise: Exercise) => {
    onAddExercise(selectedDayIndex, exercise)
  }

  const handleToggleSuperset = (index: number, selected: boolean) => {
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

  const handleCreateSuperset = () => {
    if (selectedForSuperset.size >= 2) {
      const indices = Array.from(selectedForSuperset).sort((a, b) => a - b)
      const nextColor = SUPERSET_COLORS[supersets.length % SUPERSET_COLORS.length].value
      const nextLabel = String.fromCharCode(65 + supersets.length) // A, B, C...

      const newSuperset: SupersetGroup = {
        id: `superset-${Date.now()}`,
        exerciseIndices: indices,
        color: nextColor,
        label: `Superset ${nextLabel}`
      }

      setSupersets(prev => [...prev, newSuperset])
      setSelectedForSuperset(new Set())
    }
  }

  const handleRemoveSuperset = (supersetId: string) => {
    setSupersets(prev => prev.filter(s => s.id !== supersetId))
  }

  const getExerciseSuperset = (index: number): SupersetGroup | undefined => {
    return supersets.find(s => s.exerciseIndices.includes(index))
  }

  // Group exercises by superset
  const groupedExercises: Array<{ type: 'single' | 'superset', content: any }> = []
  const processedIndices = new Set<number>()

  currentDay.exercises.forEach((exercise, index) => {
    if (processedIndices.has(index)) return

    const superset = getExerciseSuperset(index)

    if (superset) {
      // Add all exercises in this superset as a group
      groupedExercises.push({
        type: 'superset',
        content: {
          group: superset,
          exercises: superset.exerciseIndices.map(i => ({
            exercise: currentDay.exercises[i],
            index: i
          }))
        }
      })
      superset.exerciseIndices.forEach(i => processedIndices.add(i))
    } else {
      // Add single exercise
      groupedExercises.push({
        type: 'single',
        content: { exercise, index }
      })
      processedIndices.add(index)
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
              Bygg träningsdagar
            </h1>
            <p className="text-[rgba(255,255,255,0.6)] mt-1">
              Skapa och organisera övningar för varje dag
            </p>
          </div>
        </div>

        {selectedForSuperset.size >= 2 && (
          <Button
            onClick={handleCreateSuperset}
            className="bg-[rgba(255,215,0,0.2)] border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.3)]"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Skapa Superset ({selectedForSuperset.size})
          </Button>
        )}
      </div>

      {/* Day Tabs */}
      <DayTabs
        days={days.map(d => ({ dayNumber: d.dayNumber, name: d.name }))}
        selectedIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
        onAddDay={onAddDay}
        onRemoveDay={onRemoveDay}
      />

      {/* Day Details */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Dagnamn</Label>
              <Input
                value={currentDay.name}
                onChange={(e) => onUpdateDay(selectedDayIndex, 'name', e.target.value)}
                placeholder="T.ex. Push Day"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Beskrivning</Label>
              <Input
                value={currentDay.description}
                onChange={(e) => onUpdateDay(selectedDayIndex, 'description', e.target.value)}
                placeholder="Kort beskrivning"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="restDay"
              checked={currentDay.isRestDay}
              onChange={(e) => onUpdateDay(selectedDayIndex, 'isRestDay', e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(255,215,0,0.3)]"
            />
            <Label htmlFor="restDay" className="text-[rgba(255,255,255,0.7)] cursor-pointer">
              Vilodag
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      {!currentDay.isRestDay && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg text-[rgba(255,255,255,0.9)]">
              Övningar ({currentDay.exercises.length})
            </Label>
            <Button
              onClick={() => setBottomSheetOpen(true)}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Lägg till övning
            </Button>
          </div>

          {currentDay.exercises.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={currentDay.exercises.map(ex => ex.exerciseId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {groupedExercises.map((item, idx) => {
                    if (item.type === 'superset') {
                      return (
                        <SupersetGroupComponent
                          key={item.content.group.id}
                          group={item.content.group}
                          onRemove={() => handleRemoveSuperset(item.content.group.id)}
                        >
                          <div className="space-y-2">
                            {item.content.exercises.map(({ exercise, index }: any) => {
                              const exerciseData = exercises.find(e => e.id === exercise.exerciseId)
                              return (
                                <SortableExerciseItem
                                  key={exercise.exerciseId}
                                  exercise={exercise}
                                  exerciseData={exerciseData}
                                  onUpdate={(field, value) => onUpdateExercise(selectedDayIndex, index, field, value)}
                                  onRemove={() => onRemoveExercise(selectedDayIndex, index)}
                                  supersetColor={item.content.group.color}
                                />
                              )
                            })}
                          </div>
                        </SupersetGroupComponent>
                      )
                    } else {
                      const { exercise, index } = item.content
                      const exerciseData = exercises.find(e => e.id === exercise.exerciseId)
                      return (
                        <SortableExerciseItem
                          key={exercise.exerciseId}
                          exercise={exercise}
                          exerciseData={exerciseData}
                          onUpdate={(field, value) => onUpdateExercise(selectedDayIndex, index, field, value)}
                          onRemove={() => onRemoveExercise(selectedDayIndex, index)}
                          onToggleSuperset={(selected) => handleToggleSuperset(index, selected)}
                          isSelected={selectedForSuperset.has(index)}
                        />
                      )
                    }
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
              <CardContent className="py-12 text-center">
                <p className="text-[rgba(255,255,255,0.6)] mb-4">
                  Inga övningar än. Lägg till din första övning!
                </p>
                <Button
                  onClick={() => setBottomSheetOpen(true)}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till övning
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Exercise Bottom Sheet */}
      <ExerciseBottomSheet
        open={bottomSheetOpen}
        onOpenChange={setBottomSheetOpen}
        exercises={exercises}
        onSelectExercise={handleAddExercise}
      />
    </div>
  )
}
