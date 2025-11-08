import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const records = await prisma.personalRecord.findMany({
      where: {
        userId
      },
      include: {
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        achievedAt: 'desc'
      }
    })

    // Group by exercise
    const recordsByExercise = new Map()

    for (const record of records) {
      const exercise = await prisma.exercise.findUnique({
        where: { id: record.exerciseId },
        select: {
          id: true,
          name: true,
          muscleGroups: true,
          category: true
        }
      })

      if (!exercise) continue

      if (!recordsByExercise.has(record.exerciseId)) {
        recordsByExercise.set(record.exerciseId, {
          exercise,
          records: {}
        })
      }

      const exerciseData = recordsByExercise.get(record.exerciseId)
      exerciseData.records[record.recordType] = {
        ...record,
        user: undefined // Remove user data from individual records
      }
    }

    const groupedRecords = Array.from(recordsByExercise.values())

    return NextResponse.json({
      records: groupedRecords,
      totalRecords: records.length
    })
  } catch (error) {
    console.error('Error fetching personal records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personal records' },
      { status: 500 }
    )
  }
}
