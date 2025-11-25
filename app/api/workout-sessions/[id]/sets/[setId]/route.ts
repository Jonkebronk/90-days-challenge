import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recalculatePRsForExercise } from '@/lib/pr-helper'

// Update a set
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id: sessionId, setId } = await params
    const body = await request.json()
    const { reps, weightKg, timeSeconds, notes, setType } = body

    // Verify the set belongs to the user's session
    const existingSet = await prisma.workoutSetLog.findUnique({
      where: { id: setId },
      include: {
        workoutSessionLog: {
          select: { userId: true }
        }
      }
    })

    if (!existingSet) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    if (existingSet.workoutSessionLog.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (existingSet.workoutSessionLogId !== sessionId) {
      return NextResponse.json({ error: 'Set does not belong to this session' }, { status: 400 })
    }

    // Update the set
    const updatedSet = await prisma.workoutSetLog.update({
      where: { id: setId },
      data: {
        ...(reps !== undefined && { reps }),
        ...(weightKg !== undefined && { weightKg: weightKg || null }),
        ...(timeSeconds !== undefined && { timeSeconds }),
        ...(notes !== undefined && { notes }),
        ...(setType !== undefined && { setType })
      },
      include: {
        exercise: true
      }
    })

    // Recalculate PRs if weight or reps changed
    if (reps !== undefined || weightKg !== undefined) {
      await recalculatePRsForExercise(userId, existingSet.exerciseId)
    }

    return NextResponse.json({ set: updatedSet })
  } catch (error) {
    console.error('Error updating set:', error)
    return NextResponse.json(
      { error: 'Failed to update set' },
      { status: 500 }
    )
  }
}

// Delete a set
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id: sessionId, setId } = await params

    // Verify the set belongs to the user's session
    const existingSet = await prisma.workoutSetLog.findUnique({
      where: { id: setId },
      include: {
        workoutSessionLog: {
          select: { userId: true }
        }
      }
    })

    if (!existingSet) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    if (existingSet.workoutSessionLog.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (existingSet.workoutSessionLogId !== sessionId) {
      return NextResponse.json({ error: 'Set does not belong to this session' }, { status: 400 })
    }

    const exerciseId = existingSet.exerciseId

    // Delete the set
    await prisma.workoutSetLog.delete({
      where: { id: setId }
    })

    // Recalculate PRs after deletion
    await recalculatePRsForExercise(userId, exerciseId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting set:', error)
    return NextResponse.json(
      { error: 'Failed to delete set' },
      { status: 500 }
    )
  }
}
