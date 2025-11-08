import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExerciseDBClient, mapExerciseDBToPrisma } from '@/lib/exercisedb'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role?.toUpperCase()
    if (userRole !== 'COACH') {
      return NextResponse.json({ error: 'Only coaches can import exercises' }, { status: 403 })
    }

    const body = await request.json()
    const { limit, skipExisting } = body

    const client = new ExerciseDBClient()

    // Fetch exercises (limit for testing, or all)
    const exercisesToImport = limit
      ? (await client.fetchExercises(1, limit)).data
      : await client.fetchAllExercises()

    let added = 0
    let skipped = 0
    let updated = 0
    const errors: string[] = []

    console.log(`Starting import of ${exercisesToImport.length} exercises...`)

    for (const exercise of exercisesToImport) {
      try {
        const mappedExercise = mapExerciseDBToPrisma(exercise)

        // Check if exercise already exists
        const existing = await prisma.exercise.findUnique({
          where: { externalId: exercise.exerciseId }
        })

        if (existing) {
          if (skipExisting) {
            skipped++
            continue
          } else {
            // Update existing exercise
            await prisma.exercise.update({
              where: { externalId: exercise.exerciseId },
              data: mappedExercise
            })
            updated++
          }
        } else {
          // Create new exercise
          await prisma.exercise.create({
            data: mappedExercise
          })
          added++
        }

        // Log progress every 50 exercises
        if ((added + skipped + updated) % 50 === 0) {
          console.log(`Progress: ${added + skipped + updated}/${exercisesToImport.length}`)
        }

      } catch (error: any) {
        console.error(`Error importing exercise ${exercise.name}:`, error)
        errors.push(`${exercise.name}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: exercisesToImport.length,
        added,
        updated,
        skipped,
        errors: errors.length
      },
      errors: errors.slice(0, 10) // Return first 10 errors only
    })

  } catch (error: any) {
    console.error('Error importing exercises:', error)
    return NextResponse.json(
      { error: 'Failed to import exercises', details: error.message },
      { status: 500 }
    )
  }
}
