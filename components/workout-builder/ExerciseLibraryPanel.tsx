'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react'
import { Exercise, ExerciseFilter } from './types'
import { useDebounce } from './hooks/useDebounce'
import { useExerciseFilter, getUniqueMuscleGroups, getUniqueEquipment } from './hooks/useExerciseFilter'

interface ExerciseLibraryPanelProps {
  exercises: Exercise[]
  onSelectExercise: (exercise: Exercise) => void
  className?: string
}

// Exercise Item (click to add)
function ExerciseItem({
  exercise,
  onClick,
  isRecent = false
}: {
  exercise: Exercise
  onClick: () => void
  isRecent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full p-3 rounded-lg text-left transition-all
        ${isRecent
          ? 'bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.15)] hover:bg-[rgba(255,215,0,0.1)] hover:border-[rgba(255,215,0,0.3)]'
          : 'bg-[rgba(255,255,255,0.02)] border border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.08)] hover:border-[rgba(255,215,0,0.25)]'
        }
        cursor-pointer
      `}
    >
      <h4 className="text-[rgba(255,255,255,0.9)] font-medium text-sm mb-1.5 truncate">
        {exercise.name}
      </h4>
      <div className="flex flex-wrap gap-1">
        {exercise.muscleGroups?.slice(0, 3).map(mg => (
          <Badge
            key={mg}
            variant="outline"
            className="text-xs bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.2)] text-[#FFD700] py-0"
          >
            {mg}
          </Badge>
        ))}
        {exercise.muscleGroups?.length > 3 && (
          <Badge
            variant="outline"
            className="text-xs bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] py-0"
          >
            +{exercise.muscleGroups.length - 3}
          </Badge>
        )}
      </div>
    </button>
  )
}

export function ExerciseLibraryPanel({
  exercises,
  onSelectExercise,
  className = ''
}: ExerciseLibraryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Build filter object
  const filter: ExerciseFilter = useMemo(() => ({
    searchTerm: debouncedSearchTerm,
    muscleGroups: selectedMuscleGroups.length > 0 ? selectedMuscleGroups : undefined,
    equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined
  }), [debouncedSearchTerm, selectedMuscleGroups, selectedEquipment])

  // Apply filters
  const filteredExercises = useExerciseFilter(exercises, filter)

  // Get unique values for filter options
  const allMuscleGroups = useMemo(() => getUniqueMuscleGroups(exercises), [exercises])
  const allEquipment = useMemo(() => getUniqueEquipment(exercises), [exercises])

  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise)
  }

  const toggleMuscleGroup = (mg: string) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(mg)
        ? prev.filter(m => m !== mg)
        : [...prev, mg]
    )
  }

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment(prev =>
      prev.includes(eq)
        ? prev.filter(e => e !== eq)
        : [...prev, eq]
    )
  }

  const clearFilters = () => {
    setSelectedMuscleGroups([])
    setSelectedEquipment([])
    setSearchTerm('')
  }

  const hasActiveFilters = selectedMuscleGroups.length > 0 || selectedEquipment.length > 0 || searchTerm.length > 0

  return (
    <div className={`flex flex-col h-full bg-[rgba(10,10,10,0.95)] border-r border-[rgba(255,215,0,0.1)] ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[rgba(255,215,0,0.1)]">
        <h2 className="text-lg font-semibold text-[rgba(255,255,255,0.9)] mb-3">
          Övningsbibliotek
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.4)]" />
          <Input
            placeholder="Sök övningar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-8 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="mt-2 w-full justify-between text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[rgba(255,215,0,0.1)]"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            {hasActiveFilters && (
              <Badge className="bg-[#FFD700] text-[#0a0a0a] text-xs px-1.5">
                {selectedMuscleGroups.length + selectedEquipment.length}
              </Badge>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 space-y-3 p-3 bg-[rgba(255,255,255,0.02)] rounded-lg border border-[rgba(255,215,0,0.1)]">
            {/* Muscle Groups */}
            <div>
              <span className="text-xs text-[rgba(255,255,255,0.6)] mb-2 block">Muskelgrupp</span>
              <div className="flex flex-wrap gap-1">
                {allMuscleGroups.map(mg => (
                  <Badge
                    key={mg}
                    variant={selectedMuscleGroups.includes(mg) ? "default" : "outline"}
                    className={`cursor-pointer text-xs ${
                      selectedMuscleGroups.includes(mg)
                        ? "bg-[#FFD700] text-[#0a0a0a] hover:bg-[#FFA500]"
                        : "border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,215,0,0.5)]"
                    }`}
                    onClick={() => toggleMuscleGroup(mg)}
                  >
                    {mg}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <span className="text-xs text-[rgba(255,255,255,0.6)] mb-2 block">Utrustning</span>
              <div className="flex flex-wrap gap-1">
                {allEquipment.map(eq => (
                  <Badge
                    key={eq}
                    variant={selectedEquipment.includes(eq) ? "default" : "outline"}
                    className={`cursor-pointer text-xs ${
                      selectedEquipment.includes(eq)
                        ? "bg-[#60A5FA] text-[#0a0a0a] hover:bg-[#3B82F6]"
                        : "border-[rgba(96,165,250,0.3)] text-[rgba(255,255,255,0.7)] hover:border-[rgba(96,165,250,0.5)]"
                    }`}
                    onClick={() => toggleEquipment(eq)}
                  >
                    {eq}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)]"
              >
                <X className="w-3 h-3 mr-1" />
                Rensa filter
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Hint */}
          <p className="text-xs text-[rgba(255,255,255,0.4)] text-center pb-2">
            Klicka på en övning för att lägga till
          </p>

          {/* All/Filtered Exercises */}
          <div>
            <span className="text-sm text-[rgba(255,255,255,0.6)] mb-2 block">
              {hasActiveFilters
                ? `Filtrerade övningar (${filteredExercises.length})`
                : `Alla övningar (${exercises.length})`
              }
            </span>
            <div className="space-y-1.5">
              {filteredExercises.length > 0 ? (
                filteredExercises.map(exercise => (
                  <ExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    onClick={() => handleSelectExercise(exercise)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-[rgba(255,255,255,0.5)]">
                  <p>Inga övningar hittades</p>
                  {hasActiveFilters && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={clearFilters}
                      className="text-[#FFD700] mt-2"
                    >
                      Rensa filter
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
