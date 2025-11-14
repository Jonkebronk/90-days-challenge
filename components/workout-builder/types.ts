// Shared types for workout builder components

export interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  equipmentNeeded: string[]
}

export interface ProgramExercise {
  exerciseId: string
  exercise?: Exercise
  sets: number
  repsMin: number | null
  repsMax: number | null
  restSeconds: number
  notes: string
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
