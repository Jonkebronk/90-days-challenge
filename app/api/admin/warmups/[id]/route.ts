import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get a single warmup routine
export async function GET(
  request: NextRequest,
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

    const warmup = await prisma.warmupRoutine.findUnique({
      where: { id },
      include: {
        exercises: {
          orderBy: {
            orderIndex: 'asc'
          }
        },
        programs: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!warmup) {
      return NextResponse.json({ error: 'Warmup not found' }, { status: 404 })
    }

    return NextResponse.json({ warmup })
  } catch (error) {
    console.error('Error fetching warmup routine:', error)
    return NextResponse.json(
      { error: 'Failed to fetch warmup routine' },
      { status: 500 }
    )
  }
}

// PATCH - Update a warmup routine
export async function PATCH(
  request: NextRequest,
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
    const body = await request.json()
    const { name, description, introText, outroText, exercises } = body

    // First check if warmup exists
    const existing = await prisma.warmupRoutine.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Warmup not found' }, { status: 404 })
    }

    // Update warmup and exercises in a transaction
    const warmup = await prisma.$transaction(async (tx) => {
      // Delete existing exercises if new ones are provided
      if (exercises !== undefined) {
        await tx.warmupExercise.deleteMany({
          where: { warmupRoutineId: id }
        })
      }

      // Update the warmup routine
      return tx.warmupRoutine.update({
        where: { id },
        data: {
          name,
          description,
          introText,
          outroText,
          exercises: exercises ? {
            create: exercises.map((ex: any, index: number) => ({
              orderIndex: ex.orderIndex ?? index,
              name: ex.name,
              reps: ex.reps,
              videoUrl: ex.videoUrl
            }))
          } : undefined
        },
        include: {
          exercises: {
            orderBy: {
              orderIndex: 'asc'
            }
          }
        }
      })
    })

    return NextResponse.json({ warmup })
  } catch (error) {
    console.error('Error updating warmup routine:', error)
    return NextResponse.json(
      { error: 'Failed to update warmup routine' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a warmup routine
export async function DELETE(
  request: NextRequest,
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

    // Check if warmup is used by any programs
    const warmup = await prisma.warmupRoutine.findUnique({
      where: { id },
      include: {
        _count: {
          select: { programs: true }
        }
      }
    })

    if (!warmup) {
      return NextResponse.json({ error: 'Warmup not found' }, { status: 404 })
    }

    if (warmup._count.programs > 0) {
      return NextResponse.json(
        { error: `Cannot delete warmup - it is used by ${warmup._count.programs} program(s)` },
        { status: 400 }
      )
    }

    await prisma.warmupRoutine.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting warmup routine:', error)
    return NextResponse.json(
      { error: 'Failed to delete warmup routine' },
      { status: 500 }
    )
  }
}
