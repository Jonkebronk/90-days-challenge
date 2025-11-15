/**
 * Phase-based color system for the 90-day challenge
 * Provides consistent color theming across the application
 */

export const PHASE_COLORS = {
  1: {
    // Emerald - Foundation Phase
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    ring: 'ring-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
    hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
  },
  2: {
    // Blue - Development Phase
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    ring: 'ring-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/50',
  },
  3: {
    // Purple - Mastery Phase
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    ring: 'ring-purple-500',
    gradient: 'from-purple-500 to-purple-600',
    hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/50',
  },
} as const

export type Phase = 1 | 2 | 3

export interface PhaseColors {
  bg: string
  text: string
  border: string
  badge: string
  ring: string
  gradient: string
  hover: string
}

/**
 * Get colors for a specific phase
 * @param phase - The phase number (1, 2, or 3)
 * @returns Color class names for the phase
 */
export function getPhaseColors(phase: Phase | null | undefined): PhaseColors {
  if (!phase || phase < 1 || phase > 3) {
    return PHASE_COLORS[1] // Default to phase 1
  }
  return PHASE_COLORS[phase]
}

/**
 * Get the human-readable name for a phase
 * @param phase - The phase number
 * @returns The phase name
 */
export function getPhaseName(phase: Phase | null | undefined): string {
  const names = {
    1: 'Fas 1: Foundation',
    2: 'Fas 2: Development',
    3: 'Fas 3: Mastery',
  }
  return phase && names[phase] ? names[phase] : 'Okänd fas'
}

/**
 * Get the Swedish short name for a phase
 * @param phase - The phase number
 * @returns The short phase name
 */
export function getPhaseShortName(phase: Phase | null | undefined): string {
  const names = {
    1: 'Fas 1',
    2: 'Fas 2',
    3: 'Fas 3',
  }
  return phase && names[phase] ? names[phase] : 'Fas 1'
}

/**
 * Get the English description for a phase
 * @param phase - The phase number
 * @returns The phase description
 */
export function getPhaseDescription(phase: Phase | null | undefined): string {
  const descriptions = {
    1: 'Building the foundation for sustainable change',
    2: 'Developing advanced skills and habits',
    3: 'Mastering your fitness and nutrition journey',
  }
  return phase && descriptions[phase] ? descriptions[phase] : descriptions[1]
}

/**
 * Calculate phase from day number (1-90)
 * @param dayNumber - Day number in the 90-day journey
 * @returns The corresponding phase (1, 2, or 3)
 */
export function calculatePhaseFromDay(dayNumber: number): Phase {
  if (dayNumber <= 30) return 1
  if (dayNumber <= 60) return 2
  return 3
}

/**
 * Get the day range for a phase
 * @param phase - The phase number
 * @returns An object with start and end day numbers
 */
export function getPhaseDayRange(phase: Phase): { start: number; end: number } {
  const ranges = {
    1: { start: 1, end: 30 },
    2: { start: 31, end: 60 },
    3: { start: 61, end: 90 },
  }
  return ranges[phase]
}
