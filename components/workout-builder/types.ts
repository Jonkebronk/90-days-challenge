// Shared types for workout builder components

export interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  equipmentNeeded: string[]
  videoUrl?: string
}

export interface ProgramExercise {
  id: string  // Unique ID for this exercise instance (for drag-and-drop)
  exerciseId: string
  exercise?: Exercise
  sets: number | string
  reps?: string
  repsMin: number | null
  repsMax: number | null
  restSeconds: number | string
  tempo: string
  notes: string
  coachNotes: string
  targetWeight: number | null
  supersetGroupId?: string
  supersetColor?: string
}

export interface ProgramDay {
  dayNumber: number
  name: string
  description: string
  isRestDay: boolean
  exercises: ProgramExercise[]
}

export interface SupersetGroup {
  id: string
  exerciseIndices: number[]
  color: string
  label: string
}

export interface ProgramInfo {
  name: string
  description: string
  difficulty: string
  categoryId?: string
  warmupRoutineId?: string
  durationWeeks: number | null
  published: boolean
}

export const SUPERSET_COLORS = [
  { value: '#FFD700', label: 'Guld' },
  { value: '#FFA500', label: 'Orange' },
  { value: '#60A5FA', label: 'Ljusblå' },
  { value: '#34D399', label: 'Grön' },
  { value: '#A78BFA', label: 'Lila' },
  { value: '#F87171', label: 'Röd' },
]

// Exercise filter criteria for library panel
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

// Dropset configuration
export interface Dropset {
  id: string
  exerciseIndices: number[]
  weights: number[]
  reps: number[]
  sequence: 'descending' | 'ascending'
  notes?: string
}

// Dropset colors (blue theme to differentiate from supersets)
export const DROPSET_COLORS = [
  { value: '#3B82F6', label: 'Blå' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#8B5CF6', label: 'Violett' },
]
