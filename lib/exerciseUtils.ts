/**
 * Utility functions for exercise management
 */

const RECENT_EXERCISES_KEY = 'recent-exercises'
const MAX_RECENT_EXERCISES = 5

interface RecentExerciseEntry {
  exerciseId: string
  lastUsed: string
}

/**
 * Get recently used exercise IDs from localStorage
 */
export function getRecentExercises(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(RECENT_EXERCISES_KEY)
    if (!stored) return []

    const entries: RecentExerciseEntry[] = JSON.parse(stored)
    // Sort by most recent and return IDs
    return entries
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, MAX_RECENT_EXERCISES)
      .map(e => e.exerciseId)
  } catch {
    return []
  }
}

/**
 * Save an exercise as recently used
 */
export function saveRecentExercise(exerciseId: string): void {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem(RECENT_EXERCISES_KEY)
    let entries: RecentExerciseEntry[] = stored ? JSON.parse(stored) : []

    // Remove existing entry for this exercise
    entries = entries.filter(e => e.exerciseId !== exerciseId)

    // Add new entry at the beginning
    entries.unshift({
      exerciseId,
      lastUsed: new Date().toISOString()
    })

    // Keep only max entries
    entries = entries.slice(0, MAX_RECENT_EXERCISES)

    localStorage.setItem(RECENT_EXERCISES_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('Failed to save recent exercise:', error)
  }
}

/**
 * Clear all recent exercises
 */
export function clearRecentExercises(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(RECENT_EXERCISES_KEY)
  } catch (error) {
    console.error('Failed to clear recent exercises:', error)
  }
}

/**
 * Format muscle group name for display
 */
export function formatMuscleGroup(muscleGroup: string): string {
  // Capitalize first letter of each word
  return muscleGroup
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Format equipment name for display
 */
export function formatEquipment(equipment: string): string {
  // Handle common abbreviations
  const abbreviations: Record<string, string> = {
    'db': 'Hantel',
    'bb': 'Skivstång',
    'ez': 'EZ-stång',
    'cable': 'Kabel',
    'machine': 'Maskin',
    'bodyweight': 'Kroppsvikt',
    'kettlebell': 'Kettlebell',
    'resistance band': 'Gummiband'
  }

  const lower = equipment.toLowerCase()
  if (abbreviations[lower]) {
    return abbreviations[lower]
  }

  return equipment
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Group exercises by muscle group for display
 */
export function groupExercisesByMuscle<T extends { muscleGroups: string[] }>(
  exercises: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}

  for (const exercise of exercises) {
    for (const muscle of exercise.muscleGroups) {
      if (!grouped[muscle]) {
        grouped[muscle] = []
      }
      // Avoid duplicates
      if (!grouped[muscle].includes(exercise)) {
        grouped[muscle].push(exercise)
      }
    }
  }

  return grouped
}
