'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, X, Dumbbell } from 'lucide-react'
import { Exercise } from './types'

interface ExerciseSelectorProps {
  exercises: Exercise[]
  allExercises: Exercise[]
  muscleGroup: string
  onSelect: (exercise: Exercise) => void
  onCancel: () => void
}

export function ExerciseSelector({
  exercises,
  allExercises,
  muscleGroup,
  onSelect,
  onCancel,
}: ExerciseSelectorProps) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const displayExercises = showAll ? allExercises : exercises

  const filteredExercises = useMemo(() => {
    if (!search) return displayExercises
    const searchLower = search.toLowerCase()
    return displayExercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(searchLower) ||
        ex.muscleGroups.some((mg) => mg.toLowerCase().includes(searchLower))
    )
  }, [displayExercises, search])

  return (
    <div className="bg-zinc-800/50 rounded-md border border-zinc-700 overflow-hidden">
      {/* Search Header */}
      <div className="p-2 border-b border-zinc-700">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
          <Input
            placeholder={`Search ${muscleGroup.toLowerCase()} exercises...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 pr-7 text-xs bg-zinc-900 border-zinc-700"
            autoFocus
          />
          {search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              onClick={() => setSearch('')}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-500">
            {filteredExercises.length} exercises
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-zinc-400"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show muscle group only' : 'Show all exercises'}
          </Button>
        </div>
      </div>

      {/* Exercise List */}
      <ScrollArea className="h-48">
        <div className="p-1">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-xs">
              No exercises found
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                className="w-full text-left p-2 rounded hover:bg-zinc-700/50 transition-colors flex items-center gap-2"
                onClick={() => onSelect(exercise)}
              >
                <div className="h-8 w-8 rounded bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  {exercise.thumbnailUrl ? (
                    <img
                      src={exercise.thumbnailUrl}
                      alt={exercise.name}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <Dumbbell className="h-4 w-4 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-200 truncate">
                    {exercise.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {exercise.muscleGroups.join(', ')}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Cancel Button */}
      <div className="p-2 border-t border-zinc-700">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
