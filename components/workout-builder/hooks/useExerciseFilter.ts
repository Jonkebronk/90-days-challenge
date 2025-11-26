import { useMemo } from 'react'
import { ExerciseFilter, Exercise } from '../types'

/**
 * Filter exercises based on search term, muscle groups, and equipment
 * Uses OR logic for multi-select filters
 */
export function useExerciseFilter(
  exercises: Exercise[],
  filter: ExerciseFilter
) {
  const filtered = useMemo(() => {
    let result = exercises

    // Filter by search term (name or muscle groups)
    if (filter.searchTerm?.trim()) {
      const term = filter.searchTerm.toLowerCase()
      result = result.filter(ex =>
        ex.name.toLowerCase().includes(term) ||
        ex.muscleGroups.some(mg => mg.toLowerCase().includes(term))
      )
    }

    // Filter by muscle groups (OR logic - match any selected)
    if (filter.muscleGroups?.length) {
      result = result.filter(ex =>
        ex.muscleGroups.some(mg => filter.muscleGroups!.includes(mg))
      )
    }

    // Filter by equipment (OR logic - match any selected)
    if (filter.equipment?.length) {
      result = result.filter(ex =>
        filter.equipment!.some(eq => ex.equipmentNeeded.includes(eq))
      )
    }

    return result
  }, [exercises, filter])

  return filtered
}

/**
 * Get all unique muscle groups from exercises
 */
export function getUniqueMuscleGroups(exercises: Exercise[]): string[] {
  return Array.from(
    new Set(exercises.flatMap(ex => ex.muscleGroups))
  ).sort()
}

/**
 * Get all unique equipment from exercises
 */
export function getUniqueEquipment(exercises: Exercise[]): string[] {
  return Array.from(
    new Set(exercises.flatMap(ex => ex.equipmentNeeded))
  ).sort()
}
