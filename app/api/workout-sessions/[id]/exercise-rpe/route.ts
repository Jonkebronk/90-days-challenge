import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/workout-sessions/[id]/exercise-rpe
 * Update RPE for all sets of a specific exercise in a session
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await params
    const body = await request.json()
    const { exerciseId, rpe } = body

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'Exercise ID is required' },
        { status: 400 }
      )
    }

    if (rpe === undefined || rpe < 1 || rpe > 10) {
      return NextResponse.json(
        { error: 'RPE must be between 1 and 10' },
        { status: 400 }
      )
    }

    // Verify session belongs to user
    const workoutSession = await prisma.workoutSessionLog.findUnique({
      where: { id: sessionId },
      select: { userId: true }
    })

    if (!workoutSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const userId = (session.user as any).id
    if (workoutSession.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update RPE for all sets of this exercise in the session
    const result = await prisma.workoutSetLog.updateMany({
      where: {
        workoutSessionLogId: sessionId,
        exerciseId: exerciseId
      },
      data: {
        rpe: rpe
      }
    })

    return NextResponse.json({
      success: true,
      updatedSets: result.count,
      exerciseId,
      rpe
    })
  } catch (error) {
    console.error('Error updating exercise RPE:', error)
    return NextResponse.json(
      { error: 'Failed to update RPE' },
      { status: 500 }
    )
  }
}
