import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Start a new workout session
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { workoutProgramDayId, assignedProgramId } = body

    if (!workoutProgramDayId) {
      return NextResponse.json(
        { error: 'Workout program day ID is required' },
        { status: 400 }
      )
    }

    // Create workout session log
    const workoutSession = await prisma.workoutSessionLog.create({
      data: {
        userId,
        workoutProgramDayId,
        assignedProgramId,
        startedAt: new Date(),
        completed: false
      },
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
        }
      }
    })

    return NextResponse.json({ session: workoutSession }, { status: 201 })
  } catch (error) {
    console.error('Error starting workout session:', error)
    return NextResponse.json(
      { error: 'Failed to start workout session' },
      { status: 500 }
    )
  }
}

// Get user's workout sessions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const sessions = await prisma.workoutSessionLog.findMany({
      where: {
        userId
      },
      include: {
        workoutProgramDay: {
          select: {
            name: true,
            dayNumber: true
          }
        },
        sets: {
          include: {
            exercise: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching workout sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout sessions' },
      { status: 500 }
    )
  }
}
