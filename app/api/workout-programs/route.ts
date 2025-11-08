import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const userId = (session.user as any).id

    // Only coaches can view all programs
    if (userRole !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const programs = await prisma.workoutProgram.findMany({
      where: {
        coachId: userId
      },
      include: {
        days: {
          include: {
            exercises: {
              include: {
                exercise: true
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        },
        _count: {
          select: {
            assignments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Error fetching workout programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout programs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const userId = (session.user as any).id

    if (userRole !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      difficulty,
      durationWeeks,
      published,
      days
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Program name is required' },
        { status: 400 }
      )
    }

    // Create program with nested days and exercises
    const program = await prisma.workoutProgram.create({
      data: {
        coachId: userId,
        name,
        description,
        difficulty,
        durationWeeks,
        published: published || false,
        days: days ? {
          create: days.map((day: any, dayIndex: number) => ({
            dayNumber: day.dayNumber || dayIndex + 1,
            name: day.name,
            description: day.description,
            isRestDay: day.isRestDay || false,
            orderIndex: day.orderIndex || dayIndex,
            exercises: day.exercises ? {
              create: day.exercises.map((ex: any, exIndex: number) => ({
                exerciseId: ex.exerciseId,
                sets: ex.sets,
                repsMin: ex.repsMin,
                repsMax: ex.repsMax,
                restSeconds: ex.restSeconds || 60,
                tempo: ex.tempo,
                notes: ex.notes,
                targetWeight: ex.targetWeight,
                targetRPE: ex.targetRPE,
                orderIndex: ex.orderIndex || exIndex
              }))
            } : undefined
          }))
        } : undefined
      },
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
    })

    return NextResponse.json({ program }, { status: 201 })
  } catch (error) {
    console.error('Error creating workout program:', error)
    return NextResponse.json(
      { error: 'Failed to create workout program' },
      { status: 500 }
    )
  }
}
