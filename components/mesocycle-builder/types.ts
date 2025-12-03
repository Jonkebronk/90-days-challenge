// Standard muscle groups
export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
  'Forearms',
  'Traps',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export type SlotPriority = 'primary' | 'secondary'

// Weekday names
export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export type Weekday = (typeof WEEKDAYS)[number]

// Goals
export const MESOCYCLE_GOALS = [
  'hypertrophy',
  'strength',
  'power',
  'endurance',
  'deload',
  'maintenance',
] as const

export type MesocycleGoal = (typeof MESOCYCLE_GOALS)[number]

// Color scheme for priorities
export const PRIORITY_COLORS = {
  primary: {
    bg: 'bg-red-500/20',
    bgHover: 'hover:bg-red-500/30',
    border: 'border-red-500/40',
    text: 'text-red-400',
    badge: 'bg-red-500',
    badgeText: 'text-white',
  },
  secondary: {
    bg: 'bg-zinc-700/50',
    bgHover: 'hover:bg-zinc-700/70',
    border: 'border-zinc-600/50',
    text: 'text-zinc-400',
    badge: 'bg-zinc-500',
    badgeText: 'text-white',
  },
}

// Muscle group colors for visual differentiation
export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Chest: '#ef4444',
  Back: '#3b82f6',
  Shoulders: '#f97316',
  Biceps: '#22c55e',
  Triceps: '#a855f7',
  Quadriceps: '#eab308',
  Hamstrings: '#14b8a6',
  Glutes: '#ec4899',
  Calves: '#6366f1',
  Abs: '#f59e0b',
  Forearms: '#84cc16',
  Traps: '#06b6d4',
}

// TypeScript interfaces
export interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  equipmentNeeded: string[]
  videoUrl?: string | null
  thumbnailUrl?: string | null
}

export interface MesocycleSlotExercise {
  id: string
  muscleSlotId: string
  exerciseId: string
  exercise?: Exercise
  sets: number
  reps: string | null
  restSeconds: number
  tempo: string | null
  targetRPE: number | null
  targetRIR: number | null
  notes: string | null
  coachNotes: string | null
  orderIndex: number
}

export interface MesocleMuscleSlot {
  id: string
  mesocleDayId: string
  muscleGroup: string
  priority: SlotPriority
  setsMin: number | null
  setsMax: number | null
  orderIndex: number
  exercises: MesocycleSlotExercise[]
}

export interface MesocycleDay {
  id: string
  mesocycleId: string
  dayNumber: number
  dayName: string | null
  weekday: number | null
  isRestDay: boolean
  orderIndex: number
  muscleSlots: MesocleMuscleSlot[]
}

export interface Mesocycle {
  id: string
  coachId: string
  macrocycleId: string | null
  name: string
  description: string | null
  goal: string | null
  durationWeeks: number
  orderIndex: number
  startingRIR: number | null
  endingRIR: number | null
  published: boolean
  isTemplate: boolean
  createdAt: string
  updatedAt: string
  days: MesocycleDay[]
  macrocycle?: Macrocycle | null
}

export interface Macrocycle {
  id: string
  coachId: string
  name: string
  description: string | null
  goal: string | null
  published: boolean
  isTemplate: boolean
  createdAt: string
  updatedAt: string
  mesocycles: Mesocycle[]
}

// Form/State types for builder
export interface MesocycleFormData {
  name: string
  description: string
  goal: string
  durationWeeks: number
  startingRIR: number | null
  endingRIR: number | null
  macrocycleId: string | null
}

export interface DayFormData {
  id: string // temporary ID for UI
  dayNumber: number
  dayName: string
  weekday: number | null
  isRestDay: boolean
  muscleSlots: MuscleSlotFormData[]
}

export interface MuscleSlotFormData {
  id: string // temporary ID for UI
  muscleGroup: string
  priority: SlotPriority
  setsMin: number | null
  setsMax: number | null
  exercises: SlotExerciseFormData[]
}

export interface SlotExerciseFormData {
  id: string // temporary ID for UI
  exerciseId: string
  exercise?: Exercise
  sets: number
  reps: string
  restSeconds: number
  tempo: string
  targetRPE: number | null
  targetRIR: number | null
  notes: string
  coachNotes: string
}

// Helper functions
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function createEmptyDay(dayNumber: number): DayFormData {
  return {
    id: generateTempId(),
    dayNumber,
    dayName: WEEKDAYS[(dayNumber - 1) % 7] || `Day ${dayNumber}`,
    weekday: (dayNumber - 1) % 7,
    isRestDay: false,
    muscleSlots: [],
  }
}

export function createEmptyMuscleSlot(
  muscleGroup: string,
  priority: SlotPriority = 'primary'
): MuscleSlotFormData {
  return {
    id: generateTempId(),
    muscleGroup,
    priority,
    setsMin: null,
    setsMax: null,
    exercises: [],
  }
}

export function createEmptySlotExercise(
  exerciseId: string,
  exercise?: Exercise
): SlotExerciseFormData {
  return {
    id: generateTempId(),
    exerciseId,
    exercise,
    sets: 3,
    reps: '8-12',
    restSeconds: 90,
    tempo: '',
    targetRPE: null,
    targetRIR: null,
    notes: '',
    coachNotes: '',
  }
}
