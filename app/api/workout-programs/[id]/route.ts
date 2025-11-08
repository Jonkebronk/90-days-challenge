import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const program = await prisma.workoutProgram.findUnique({
      where: { id },
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
        }
      }
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Error fetching workout program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout program' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
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

    const { id } = await params

    // Delete existing days and recreate (simpler than complex update logic)
    await prisma.workoutProgramDay.deleteMany({
      where: { workoutProgramId: id }
    })

    const program = await prisma.workoutProgram.update({
      where: { id },
      data: {
        name,
        description,
        difficulty,
        durationWeeks,
        published,
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

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Error updating workout program:', error)
    return NextResponse.json(
      { error: 'Failed to update workout program' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await prisma.workoutProgram.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout program:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout program' },
      { status: 500 }
    )
  }
}
