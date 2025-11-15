import {
  BookOpen,
  Dumbbell,
  Heart,
  Apple,
  Brain,
  Target,
  TrendingUp,
  Users,
  Zap,
  Moon,
  Utensils,
  Activity,
  Clock,
  type LucideIcon,
} from 'lucide-react'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Dumbbell,
  Heart,
  Apple,
  Brain,
  Target,
  TrendingUp,
  Users,
  Zap,
  Moon,
  Utensils,
  Activity,
  Clock,
}

export type CategoryIconKey = keyof typeof CATEGORY_ICONS

/**
 * Get the Lucide icon component for a category based on icon name or intelligent keyword matching
 */
export function getCategoryIcon(iconName?: string, categoryName?: string): LucideIcon {
  // If iconName is provided and valid, use it directly
  if (iconName && CATEGORY_ICONS[iconName]) {
    return CATEGORY_ICONS[iconName]
  }

  // Fallback to keyword matching based on category name
  if (categoryName) {
    const normalized = categoryName.toLowerCase()

    // Nutrition/Food related
    if (normalized.includes('nutrition') || normalized.includes('kost') || normalized.includes('mat')) {
      return CATEGORY_ICONS.Apple
    }

    // Training/Exercise related
    if (normalized.includes('träning') || normalized.includes('workout') || normalized.includes('styrka')) {
      return CATEGORY_ICONS.Dumbbell
    }

    // Recovery/Sleep related
    if (normalized.includes('återhämtning') || normalized.includes('sömn') || normalized.includes('vila')) {
      return CATEGORY_ICONS.Moon
    }

    // Mindset/Mental related
    if (normalized.includes('mindset') || normalized.includes('mental') || normalized.includes('psykologi')) {
      return CATEGORY_ICONS.Brain
    }

    // Goals/Planning related
    if (normalized.includes('mål') || normalized.includes('goal') || normalized.includes('planering')) {
      return CATEGORY_ICONS.Target
    }

    // Progress/Tracking related
    if (normalized.includes('progress') || normalized.includes('framsteg') || normalized.includes('tracking')) {
      return CATEGORY_ICONS.TrendingUp
    }

    // Community/Social related
    if (normalized.includes('community') || normalized.includes('gemenskap') || normalized.includes('social')) {
      return CATEGORY_ICONS.Users
    }

    // Energy/Activity related
    if (normalized.includes('energy') || normalized.includes('energi') || normalized.includes('aktivitet')) {
      return CATEGORY_ICONS.Zap
    }

    // Health/Wellness related
    if (normalized.includes('health') || normalized.includes('hälsa') || normalized.includes('wellness')) {
      return CATEGORY_ICONS.Heart
    }

    // Meal/Recipe related
    if (normalized.includes('meal') || normalized.includes('måltid') || normalized.includes('recept')) {
      return CATEGORY_ICONS.Utensils
    }

    // Time management
    if (normalized.includes('time') || normalized.includes('tid') || normalized.includes('schema')) {
      return CATEGORY_ICONS.Clock
    }

    // General activity
    if (normalized.includes('activity') || normalized.includes('aktivitet')) {
      return CATEGORY_ICONS.Activity
    }
  }

  // Default fallback
  return CATEGORY_ICONS.BookOpen
}

/**
 * Get icon name string from icon component
 */
export function getIconName(icon: LucideIcon): string {
  const entry = Object.entries(CATEGORY_ICONS).find(([, value]) => value === icon)
  return entry ? entry[0] : 'BookOpen'
}

/**
 * Get all available icon names for selection UI
 */
export function getAvailableIcons(): CategoryIconKey[] {
  return Object.keys(CATEGORY_ICONS) as CategoryIconKey[]
}
