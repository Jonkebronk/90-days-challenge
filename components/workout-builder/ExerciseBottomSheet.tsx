import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'
import { Exercise } from './types'

interface ExerciseBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: Exercise[]
  onSelectExercise: (exercise: Exercise) => void
}

export function ExerciseBottomSheet({
  open,
  onOpenChange,
  exercises,
  onSelectExercise
}: ExerciseBottomSheetProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null)

  // Filter exercises
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ex.muscleGroups.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesMuscleGroup = !selectedMuscleGroup ||
                              ex.muscleGroups.includes(selectedMuscleGroup)
    return matchesSearch && matchesMuscleGroup
  })

  // Get unique muscle groups
  const allMuscleGroups = Array.from(
    new Set(exercises.flatMap(ex => ex.muscleGroups))
  ).sort()

  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise)
    onOpenChange(false)
    setSearchTerm('')
    setSelectedMuscleGroup(null)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] bg-[rgba(10,10,10,0.98)] border-t-2 border-[rgba(255,215,0,0.3)] backdrop-blur-xl"
      >
        <SheetHeader>
          <SheetTitle className="text-2xl text-[rgba(255,255,255,0.9)]">
            Välj övning
          </SheetTitle>
          <SheetDescription className="text-[rgba(255,255,255,0.6)]">
            Sök efter övningar eller filtrera på muskelgrupp
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.4)]" />
            <Input
              placeholder="Sök övningar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white"
            />
          </div>

          {/* Muscle Group Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-[rgba(255,255,255,0.6)]" />
              <span className="text-sm text-[rgba(255,255,255,0.6)]">Muskelgrupp:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedMuscleGroup === null ? "default" : "outline"}
                className={selectedMuscleGroup === null
                  ? "bg-[#FFD700] text-[#0a0a0a] cursor-pointer"
                  : "border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.7)] cursor-pointer hover:border-[rgba(255,215,0,0.5)]"
                }
                onClick={() => setSelectedMuscleGroup(null)}
              >
                Alla
              </Badge>
              {allMuscleGroups.map(mg => (
                <Badge
                  key={mg}
                  variant={selectedMuscleGroup === mg ? "default" : "outline"}
                  className={selectedMuscleGroup === mg
                    ? "bg-[#FFD700] text-[#0a0a0a] cursor-pointer"
                    : "border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.7)] cursor-pointer hover:border-[rgba(255,215,0,0.5)]"
                  }
                  onClick={() => setSelectedMuscleGroup(mg)}
                >
                  {mg}
                </Badge>
              ))}
            </div>
          </div>

          {/* Exercise List */}
          <div className="space-y-2 overflow-y-auto max-h-[calc(85vh-250px)]">
            {filteredExercises.length > 0 ? (
              filteredExercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelectExercise(exercise)}
                  className="w-full p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg hover:bg-[rgba(255,215,0,0.1)] hover:border-[rgba(255,215,0,0.4)] transition-all text-left"
                >
                  <h4 className="text-[rgba(255,255,255,0.9)] font-medium mb-2">
                    {exercise.name}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscleGroups.map(mg => (
                      <Badge
                        key={mg}
                        variant="outline"
                        className="text-xs bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.3)] text-[#FFD700]"
                      >
                        {mg}
                      </Badge>
                    ))}
                    {exercise.equipmentNeeded.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.7)]"
                      >
                        {exercise.equipmentNeeded.join(', ')}
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-[rgba(255,255,255,0.5)]">
                  Inga övningar hittades
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
