import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get specific workout session
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

    const workoutSession = await prisma.workoutSessionLog.findUnique({
      where: { id },
      include: {
        workoutProgramDay: {
          include: {
            exercises: {
              include: {
                exercise: true
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          }
        },
        sets: {
          include: {
            exercise: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!workoutSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ session: workoutSession })
  } catch (error) {
    console.error('Error fetching workout session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout session' },
      { status: 500 }
    )
  }
}

// Update workout session (complete, add notes, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { completed, notes, durationMinutes } = body

    const workoutSession = await prisma.workoutSessionLog.update({
      where: { id },
      data: {
        completed: completed !== undefined ? completed : undefined,
        completedAt: completed ? new Date() : undefined,
        notes: notes !== undefined ? notes : undefined,
        durationMinutes: durationMinutes !== undefined ? durationMinutes : undefined
      }
    })

    return NextResponse.json({ session: workoutSession })
  } catch (error) {
    console.error('Error updating workout session:', error)
    return NextResponse.json(
      { error: 'Failed to update workout session' },
      { status: 500 }
    )
  }
}
