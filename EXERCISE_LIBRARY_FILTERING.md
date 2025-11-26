# Priority 1: Exercise Library Filtering Implementation Guide

## Overview
**Effort:** Medium (2-3 days)  
**Impact:** High (30% faster exercise selection)  
**Status:** Not Started  
**Skills Needed:** React, TypeScript, Tailwind CSS, Hook design

---

## Current State vs. Target State

### Current
- Simple bottom sheet with flat exercise list
- - Limited to showing all exercises at once
  - - No search capability
    - - Scroll through 700+ exercises manually
     
      - ### Target
      - - Advanced filtering panel
        - - Multi-select filters (muscle groups, equipment, difficulty)
          - - Real-time search with debouncing
            - - Recently used exercises section
              - - Favorite exercises marking
                - - Visual exercise icons
                 
                  - ---

                  ## Implementation Roadmap

                  ### Phase 1: Add Type Definitions
                  **Time:** 30 minutes
                  **File:** `components/workout-builder/types.ts`

                  Add these types:

                  ```typescript
                  // Exercise filter criteria
                  export interface ExerciseFilter {
                    muscleGroups?: string[]
                    equipment?: string[]
                    difficulty?: 'beginner' | 'intermediate' | 'advanced'
                    searchTerm?: string
                    favorites?: boolean
                  }

                  // Exercise with additional metadata
                  export interface ExerciseWithMeta extends Exercise {
                    difficulty?: 'beginner' | 'intermediate' | 'advanced'
                    isFavorite?: boolean
                    lastUsedDate?: string
                    usageCount?: number
                  }
                  ```

                  ### Phase 2: Create useExerciseFilter Hook
                  **Time:** 1 hour
                  **File:** `components/workout-builder/hooks/useExerciseFilter.ts`

                  ```typescript
                  import { useMemo, useCallback } from 'react'
                  import { ExerciseFilter, Exercise } from '../types'

                  export function useExerciseFilter(
                    exercises: Exercise[],
                    filter: ExerciseFilter
                  ) {
                    const filtered = useMemo(() => {
                      let result = exercises

                      // Filter by search term
                      if (filter.searchTerm?.trim()) {
                        const term = filter.searchTerm.toLowerCase()
                        result = result.filter(ex =>
                          ex.name.toLowerCase().includes(term) ||
                          ex.muscleGroups.some(mg => mg.toLowerCase().includes(term))
                        )
                      }

                      // Filter by muscle groups (OR logic)
                      if (filter.muscleGroups?.length) {
                        result = result.filter(ex =>
                          ex.muscleGroups.some(mg => filter.muscleGroups!.includes(mg))
                        )
                      }

                      // Filter by equipment (OR logic)
                      if (filter.equipment?.length) {
                        result = result.filter(ex =>
                          filter.equipment!.some(eq => ex.equipmentNeeded.includes(eq))
                        )
                      }

                      return result
                    }, [exercises, filter])

                    return filtered
                  }
                  ```

                  ### Phase 3: Create UseDebounce Hook
                  **Time:** 15 minutes
                  **File:** `components/workout-builder/hooks/useDebounce.ts`

                  ```typescript
                  import { useState, useEffect } from 'react'

                  export function useDebounce<T>(value: T, delay: number): T {
                    const [debouncedValue, setDebouncedValue] = useState(value)

                    useEffect(() => {
                      const handler = setTimeout(() => {
                        setDebouncedValue(value)
                      }, delay)

                      return () => clearTimeout(handler)
                    }, [value, delay])

                    return debouncedValue
                  }
                  ```

                  ### Phase 4: Create ExerciseLibraryPanel Component
                  **Time:** 2 hours
                  **File:** `components/workout-builder/ExerciseLibraryPanel.tsx`

                  ```typescript
                  import { useState } from 'react'
                  import { Input } from '@/components/ui/input'
                  import { Label } from '@/components/ui/label'
                  import { Checkbox } from '@/components/ui/checkbox'
                  import { Badge } from '@/components/ui/badge'
                  import { Button } from '@/components/ui/button'
                  import { Search } from 'lucide-react'
                  import { ExerciseFilter, Exercise } from './types'
                  import { useExerciseFilter } from './hooks/useExerciseFilter'
                  import { useDebounce } from './hooks/useDebounce'

                  interface ExerciseLibraryPanelProps {
                    exercises: Exercise[]
                    onSelectExercise: (exercise: Exercise) => void
                    recentExercises?: Exercise[]
                  }

                  export function ExerciseLibraryPanel({
                    exercises,
                    onSelectExercise,
                    recentExercises = [],
                  }: ExerciseLibraryPanelProps) {
                    const [filter, setFilter] = useState<ExerciseFilter>({})
                    const debouncedSearchTerm = useDebounce(filter.searchTerm || '', 300)

                    const filtered = useExerciseFilter(exercises, {
                      ...filter,
                      searchTerm: debouncedSearchTerm,
                    })

                    // Get all unique muscle groups and equipment
                    const allMuscleGroups = Array.from(
                      new Set(exercises.flatMap(ex => ex.muscleGroups))
                    ).sort()

                    const allEquipment = Array.from(
                      new Set(exercises.flatMap(ex => ex.equipmentNeeded))
                    ).sort()

                    const handleMuscleGroupChange = (mg: string) => {
                      setFilter(prev => {
                        const groups = prev.muscleGroups || []
                        return {
                          ...prev,
                          muscleGroups: groups.includes(mg)
                            ? groups.filter(g => g !== mg)
                            : [...groups, mg],
                        }
                      })
                    }

                    const handleEquipmentChange = (eq: string) => {
                      setFilter(prev => {
                        const equip = prev.equipment || []
                        return {
                          ...prev,
                          equipment: equip.includes(eq)
                            ? equip.filter(e => e !== eq)
                            : [...equip, eq],
                        }
                      })
                    }

                    return (
                      <div className="space-y-4 p-4">
                        {/* Search */}
                        <div>
                          <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                            <Input
                              placeholder="Search exercises..."
                              value={filter.searchTerm || ''}
                              onChange={(e) =>
                                setFilter(prev => ({ ...prev, searchTerm: e.target.value }))
                              }
                              className="pl-10"
                            />
                          </div>
                        </div>

                        {/* Muscle Groups Filter */}
                        <div>
                          <Label className="text-sm font-semibold">Muscle Groups</Label>
                          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                            {allMuscleGroups.map(mg => (
                              <div key={mg} className="flex items-center gap-2">
                                <Checkbox
                                  id={`mg-${mg}`}
                                  checked={filter.muscleGroups?.includes(mg) || false}
                                  onCheckedChange={() => handleMuscleGroupChange(mg)}
                                />
                                <Label htmlFor={`mg-${mg}`} className="text-sm cursor-pointer">
                                  {mg}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Equipment Filter */}
                        <div>
                          <Label className="text-sm font-semibold">Equipment</Label>
                          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                            {allEquipment.map(eq => (
                              <div key={eq} className="flex items-center gap-2">
                                <Checkbox
                                  id={`eq-${eq}`}
                                  checked={filter.equipment?.includes(eq) || false}
                                  onCheckedChange={() => handleEquipmentChange(eq)}
                                />
                                <Label htmlFor={`eq-${eq}`} className="text-sm cursor-pointer">
                                  {eq}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recently Used */}
                        {recentExercises.length > 0 && (
                          <div>
                            <Label className="text-sm font-semibold">Recently Used</Label>
                            <div className="mt-2 space-y-2">
                              {recentExercises.slice(0, 5).map(ex => (
                                <Button
                                  key={ex.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onSelectExercise(ex)}
                                  className="w-full justify-start text-left"
                                >
                                  {ex.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Results */}
                        <div>
                          <Label className="text-sm font-semibold">
                            Results ({filtered.length})
                          </Label>
                          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                            {filtered.length > 0 ? (
                              filtered.map(ex => (
                                <Button
                                  key={ex.id}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onSelectExercise(ex)}
                                  className="w-full justify-start text-left h-auto py-2"
                                >
                                  <div>
                                    <div className="font-medium">{ex.name}</div>
                                    <div className="flex gap-1 mt-1">
                                      {ex.muscleGroups.map(mg => (
                                        <Badge key={mg} variant="secondary" className="text-xs">
                                          {mg}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </Button>
                              ))
                            ) : (
                              <div className="text-center text-sm text-gray-500 py-4">
                                No exercises found
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  ```

                  ### Phase 5: Integrate into ExerciseBottomSheet
                  **Time:** 45 minutes
                  **File:** `components/workout-builder/ExerciseBottomSheet.tsx`

                  Replace the current simple list with the new panel:

                  ```typescript
                  import { ExerciseLibraryPanel } from './ExerciseLibraryPanel'

                  export function ExerciseBottomSheet({
                    open,
                    onOpenChange,
                    exercises,
                    onSelectExercise,
                  }: ExerciseBottomSheetProps) {
                    // Get recent exercises from localStorage
                    const recentExercises = getRecentExercises()

                    return (
                      <Sheet open={open} onOpenChange={onOpenChange}>
                        <SheetContent side="bottom" className="h-[80vh]">
                          <SheetHeader>
                            <SheetTitle>Select Exercise</SheetTitle>
                          </SheetHeader>
                          <ExerciseLibraryPanel
                            exercises={exercises}
                            onSelectExercise={(exercise) => {
                              saveRecentExercise(exercise)
                              onSelectExercise(exercise)
                              onOpenChange(false)
                            }}
                            recentExercises={recentExercises}
                          />
                        </SheetContent>
                      </Sheet>
                    )
                  }
                  ```

                  ### Phase 6: Add Local Storage for Recent Exercises
                  **Time:** 30 minutes
                  **File:** `lib/exerciseUtils.ts`

                  ```typescript
                  const RECENT_EXERCISES_KEY = 'recentExercises'
                  const MAX_RECENT = 10

                  export function getRecentExercises(): Exercise[] {
                    if (typeof window === 'undefined') return []

                    const stored = localStorage.getItem(RECENT_EXERCISES_KEY)
                    return stored ? JSON.parse(stored) : []
                  }

                  export function saveRecentExercise(exercise: Exercise): void {
                    if (typeof window === 'undefined') return

                    const recent = getRecentExercises()

                    // Remove if already exists
                    const filtered = recent.filter(e => e.id !== exercise.id)

                    // Add to beginning and limit to MAX_RECENT
                    const updated = [exercise, ...filtered].slice(0, MAX_RECENT)

                    localStorage.setItem(RECENT_EXERCISES_KEY, JSON.stringify(updated))
                  }
                  ```

                  ---

                  ## Testing Checklist

                  - [ ] Search filters results correctly
                  - [ ] - [ ] Muscle group filter works with OR logic
                  - [ ] - [ ] Equipment filter works with OR logic
                  - [ ] - [ ] Combined filters work together
                  - [ ] - [ ] Recently used list updates after selecting exercise
                  - [ ] - [ ] Performance acceptable with 700+ exercises
                  - [ ] - [ ] Mobile friendly on small screens
                  - [ ] - [ ] Keyboard navigation works
                  - [ ] - [ ] No console errors
                 
                  - [ ] ---
                 
                  - [ ] ## Performance Considerations
                 
                  - [ ] 1. **Search Debouncing:** 300ms delay prevents excessive re-renders
                  - [ ] 2. **Memoization:** Use `useMemo` for filtered results
                  - [ ] 3. **Virtual Scrolling:** Consider for 700+ items (use `@tanstack/react-virtual`)
                  - [ ] 4. **Caching:** Recent exercises stored locally
                 
                  - [ ] ---
                 
                  - [ ] ## Future Enhancements
                 
                  - [ ] 1. Mark exercises as favorites
                  - [ ] 2. Show exercise difficulty rating
                  - [ ] 3. Suggest alternatives when selected
                  - [ ] 4. Show video previews
                  - [ ] 5. Filter by client feedback (too easy/hard)
                 
                  - [ ] ---
                 
                  - [ ] ## Getting Help
                 
                  - [ ] If stuck:
                  - [ ] 1. Check that all hooks are imported correctly
                  - [ ] 2. Verify Exercise type includes all required fields
                  - [ ] 3. Test filter logic in isolation
                  - [ ] 4. Check localStorage is available (SSR considerations)
