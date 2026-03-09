import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ParsedWorkoutProgram } from '@/types/workout-program-parser'

interface ImportRequest {
  parsedProgram: ParsedWorkoutProgram
  exerciseMappings: Record<string, string>  // originalName -> exerciseId
  categoryId?: string
  published?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body: ImportRequest = await request.json()
    const { parsedProgram, exerciseMappings, categoryId, published } = body

    if (!parsedProgram || !parsedProgram.weeks || !exerciseMappings) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Validate all exercise mappings exist
    const exerciseIds = Object.values(exerciseMappings).filter(Boolean)
    const existingExercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true }
    })
    const existingIds = new Set(existingExercises.map(e => e.id))

    const missingExercises = exerciseIds.filter(id => !existingIds.has(id))
    if (missingExercises.length > 0) {
      return NextResponse.json({
        error: 'Some exercise mappings are invalid',
        missingExercises
      }, { status: 400 })
    }

    // Map day names to weekday numbers
    const dayNameToWeekday: Record<string, number> = {
      'monday': 0,
      'tuesday': 1,
      'wednesday': 2,
      'thursday': 3,
      'friday': 4,
      'saturday': 5,
      'sunday': 6,
      'måndag': 0,
      'tisdag': 1,
      'onsdag': 2,
      'torsdag': 3,
      'fredag': 4,
      'lördag': 5,
      'söndag': 6
    }

    // Build program data with any type to match existing pattern
    const programData: any = {
      coachId: userId,
      name: parsedProgram.name,
      description: parsedProgram.description,
      difficulty: parsedProgram.difficulty || null,
      durationWeeks: parsedProgram.durationWeeks,
      categoryId: categoryId || null,
      published: published ?? true,
      isTemplate: true,
      weeks: {
        create: parsedProgram.weeks.map((week, weekIndex) => ({
          weekNumber: week.weekNumber,
          title: week.title || `Week ${week.weekNumber}`,
          description: week.isDeloadWeek ? 'Deload Week' : undefined,
          orderIndex: weekIndex,
          days: {
            create: week.days.map((day, dayIndex) => {
              const weekday = day.dayName
                ? dayNameToWeekday[day.dayName.toLowerCase()]
                : undefined

              return {
                dayNumber: day.dayNumber,
                name: day.dayName
                  ? `${day.dayName}${day.muscleGroups.length > 0 ? ` - ${day.muscleGroups.join(', ')}` : ''}`
                  : `Day ${day.dayNumber}`,
                description: day.muscleGroups.length > 0
                  ? `Focus: ${day.muscleGroups.join(', ')}`
                  : undefined,
                weekday: weekday ?? null,
                isRestDay: false,
                orderIndex: dayIndex,
                exercises: {
                  create: day.exercises
                    .filter(ex => exerciseMappings[ex.name])  // Only include mapped exercises
                    .map((ex, exIndex) => ({
                      exerciseId: exerciseMappings[ex.name],
                      sets: typeof ex.sets === 'string' ? parseInt(ex.sets as string) || 3 : ex.sets || 3,
                      reps: ex.reps || null,
                      restSeconds: ex.restSeconds || 60,
                      tempo: ex.tempo || null,
                      notes: buildExerciseNotes(ex),
                      targetRPE: ex.rpe || null,
                      orderIndex: exIndex
                    }))
                }
              }
            })
          }
        }))
      }
    }

    // Create the workout program with nested data
    const program = await prisma.workoutProgram.create({
      data: programData,
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Calculate statistics
    const totalWeeks = program.weeks.length
    const totalDays = program.weeks.reduce((sum, w) => sum + w.days.length, 0)
    const totalExercises = program.weeks.reduce((sum, w) =>
      sum + w.days.reduce((dSum, d) => dSum + d.exercises.length, 0), 0
    )

    return NextResponse.json({
      success: true,
      program: {
        id: program.id,
        name: program.name,
        description: program.description,
        durationWeeks: program.durationWeeks,
        difficulty: program.difficulty
      },
      statistics: {
        totalWeeks,
        totalDays,
        totalExercises
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error importing workout program:', error)
    return NextResponse.json(
      { error: 'Failed to import workout program' },
      { status: 500 }
    )
  }
}

// Helper to build notes from exercise metadata
function buildExerciseNotes(ex: {
  notes?: string
  phase?: string
  isDropset?: boolean
}): string | null {
  const parts: string[] = []

  if (ex.phase) {
    parts.push(`[${ex.phase}]`)
  }

  if (ex.isDropset) {
    parts.push('Dropset')
  }

  if (ex.notes) {
    parts.push(ex.notes)
  }

  return parts.length > 0 ? parts.join(' - ') : null
}
