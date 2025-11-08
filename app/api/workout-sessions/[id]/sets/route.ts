import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAndCreatePR } from '@/lib/pr-helper'

// Log a set during a workout session
export async function POST(
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
    const {
      exerciseId,
      workoutProgramExerciseId,
      setNumber,
      reps,
      weightKg,
      timeSeconds,
      distance,
      rpe,
      completed,
      notes
    } = body

    if (!exerciseId || setNumber === undefined) {
      return NextResponse.json(
        { error: 'Exercise ID and set number are required' },
        { status: 400 }
      )
    }

    // Create set log
    const setLog = await prisma.workoutSetLog.create({
      data: {
        workoutSessionLogId: sessionId,
        exerciseId,
        workoutProgramExerciseId,
        setNumber,
        reps: reps || null,
        weightKg: weightKg || null,
        timeSeconds: timeSeconds || null,
        distance: distance || null,
        rpe: rpe || null,
        completed: completed !== undefined ? completed : true,
        notes: notes || null
      },
      include: {
        exercise: true
      }
    })

    // Check for PRs
    const userId = (session.user as any).id
    const newPRs = await checkAndCreatePR(
      userId,
      exerciseId,
      reps,
      weightKg,
      setLog.id
    )

    return NextResponse.json({
      set: setLog,
      personalRecords: newPRs
    }, { status: 201 })
  } catch (error) {
    console.error('Error logging set:', error)
    return NextResponse.json(
      { error: 'Failed to log set' },
      { status: 500 }
    )
  }
}

// Get all sets for a session
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await params

    const sets = await prisma.workoutSetLog.findMany({
      where: {
        workoutSessionLogId: sessionId
      },
      include: {
        exercise: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ sets })
  } catch (error) {
    console.error('Error fetching sets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sets' },
      { status: 500 }
    )
  }
}
