import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all exercise notes for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notes = await prisma.userExerciseNote.findMany({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching user exercise notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

// POST - Save or update a user exercise note
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workoutProgramExerciseId, notes } = body

    if (!workoutProgramExerciseId) {
      return NextResponse.json(
        { error: 'workoutProgramExerciseId is required' },
        { status: 400 }
      )
    }

    const note = await prisma.userExerciseNote.upsert({
      where: {
        userId_workoutProgramExerciseId: {
          userId: session.user.id,
          workoutProgramExerciseId
        }
      },
      update: {
        notes
      },
      create: {
        userId: session.user.id,
        workoutProgramExerciseId,
        notes
      }
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Error saving user exercise note:', error)
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    )
  }
}
