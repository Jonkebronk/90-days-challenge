import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ExerciseMatch, ExerciseMatchResult } from '@/types/workout-program-parser'

// Simple string similarity function (Levenshtein-based)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 100

  // Check for exact word match
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)

  // If main word matches exactly, high score
  if (words1[0] === words2[0]) {
    return 85 + (words1.length === words2.length ? 10 : 0)
  }

  // Calculate Levenshtein distance
  const matrix: number[][] = []
  const len1 = s1.length
  const len2 = s2.length

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  const distance = matrix[len1][len2]
  const maxLen = Math.max(len1, len2)

  // Convert distance to similarity score (0-100)
  return Math.round((1 - distance / maxLen) * 100)
}

// Check if muscle groups overlap
function muscleGroupBoost(exerciseMuscles: string[], dayMuscles: string[]): number {
  if (!dayMuscles || dayMuscles.length === 0) return 0

  const normalize = (s: string) => s.toLowerCase().trim()
  const exerciseMusclesNorm = exerciseMuscles.map(normalize)
  const dayMusclesNorm = dayMuscles.map(normalize)

  const overlap = exerciseMusclesNorm.filter(m =>
    dayMusclesNorm.some(dm => dm.includes(m) || m.includes(dm))
  )

  // Each matching muscle group adds points
  return overlap.length * 5
}

// Check for common exercise name patterns
function patternBoost(searchName: string, exerciseName: string): number {
  const search = searchName.toLowerCase()
  const name = exerciseName.toLowerCase()

  let boost = 0

  // Exact substring match
  if (name.includes(search) || search.includes(name)) {
    boost += 15
  }

  // Common variations
  const variations: Record<string, string[]> = {
    'pulldown': ['lat pulldown', 'cable pulldown', 'pull-down'],
    'curl': ['bicep curl', 'barbell curl', 'dumbbell curl', 'hammer curl'],
    'press': ['bench press', 'shoulder press', 'overhead press', 'military press'],
    'row': ['barbell row', 'dumbbell row', 'cable row', 'seated row'],
    'squat': ['back squat', 'front squat', 'goblet squat'],
    'deadlift': ['conventional deadlift', 'romanian deadlift', 'rdl', 'sumo deadlift'],
    'extension': ['tricep extension', 'leg extension', 'cable extension'],
    'fly': ['chest fly', 'cable fly', 'pec fly', 'dumbbell fly'],
    'raise': ['lateral raise', 'front raise', 'rear delt raise'],
    'pullup': ['pull-up', 'pull up', 'chin-up', 'chinup'],
    'pushup': ['push-up', 'push up'],
  }

  for (const [base, alts] of Object.entries(variations)) {
    if (search.includes(base) && alts.some(a => name.includes(a))) {
      boost += 10
    }
    if (name.includes(base) && alts.some(a => search.includes(a))) {
      boost += 10
    }
  }

  return boost
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exerciseNames, dayMuscleGroups } = body as {
      exerciseNames: string[]
      dayMuscleGroups?: Record<string, string[]>  // exerciseName -> muscleGroups from that day
    }

    if (!exerciseNames || !Array.isArray(exerciseNames)) {
      return NextResponse.json({ error: 'exerciseNames array is required' }, { status: 400 })
    }

    // Fetch all exercises from database
    const allExercises = await prisma.exercise.findMany({
      select: {
        id: true,
        name: true,
        muscleGroups: true
      }
    })

    // Match each exercise name
    const results: ExerciseMatchResult[] = exerciseNames.map(searchName => {
      const dayMuscles = dayMuscleGroups?.[searchName] || []

      // Score each exercise
      const scored = allExercises.map(ex => {
        let confidence = calculateSimilarity(searchName, ex.name)

        // Add muscle group boost
        confidence += muscleGroupBoost(ex.muscleGroups, dayMuscles)

        // Add pattern boost
        confidence += patternBoost(searchName, ex.name)

        // Cap at 100
        confidence = Math.min(confidence, 100)

        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          confidence,
          muscleGroups: ex.muscleGroups
        } as ExerciseMatch
      })

      // Sort by confidence and take top 5
      scored.sort((a, b) => b.confidence - a.confidence)
      const topMatches = scored.slice(0, 5)

      // Auto-select if confidence is very high
      const selectedMatch = topMatches[0]?.confidence >= 85 ? topMatches[0] : undefined

      return {
        originalName: searchName,
        topMatches,
        selectedMatch
      }
    })

    // Calculate statistics
    const autoMatched = results.filter(r => r.selectedMatch).length
    const needsReview = results.filter(r => !r.selectedMatch).length

    return NextResponse.json({
      success: true,
      results,
      statistics: {
        total: results.length,
        autoMatched,
        needsReview
      }
    })

  } catch (error) {
    console.error('Error matching exercises:', error)
    return NextResponse.json(
      { error: 'Failed to match exercises' },
      { status: 500 }
    )
  }
}
