// Types for parsing workout programs from PDFs

export interface ParsedWorkoutProgram {
  name: string
  description?: string
  durationWeeks: number
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  weeks: ParsedProgramWeek[]
}

export interface ParsedProgramWeek {
  weekNumber: number
  title?: string
  isDeloadWeek?: boolean
  days: ParsedProgramDay[]
}

export interface ParsedProgramDay {
  dayNumber: number
  dayName?: string  // "Monday", "Tuesday", etc.
  muscleGroups: string[]
  exercises: ParsedExercise[]
}

export interface ParsedExercise {
  name: string
  sets: number | string
  reps: string  // "8-12", "AMRAP", "10"
  rpe?: number
  notes?: string
  phase?: string  // "Activation", "Main Work", "Finisher"
  isDropset?: boolean
  restSeconds?: number
  tempo?: string
  matchedExerciseId?: string  // Filled in after matching
}

// For exercise matching
export interface ExerciseMatch {
  exerciseId: string
  exerciseName: string
  confidence: number  // 0-100
  muscleGroups: string[]
}

export interface ExerciseMatchResult {
  originalName: string
  topMatches: ExerciseMatch[]
  selectedMatch?: ExerciseMatch
}

// For the import wizard state
export interface ImportWizardState {
  step: 'upload' | 'preview' | 'match' | 'save'
  rawText?: string
  parsedProgram?: ParsedWorkoutProgram
  exerciseMatches?: ExerciseMatchResult[]
  isProcessing: boolean
  error?: string
}
