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

    const template = await prisma.workoutTemplate.findUnique({
      where: { id },
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
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching workout template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout template' },
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

    const userId = (session.user as any).id
    const { id } = await params
    const body = await request.json()

    // Check ownership
    const existingTemplate = await prisma.workoutTemplate.findUnique({
      where: { id }
    })

    if (!existingTemplate || existingTemplate.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      name,
      description,
      estimatedDuration,
      isPublic,
      category,
      exercises
    } = body

    // Delete existing exercises and recreate (simpler than complex update logic)
    await prisma.workoutTemplateExercise.deleteMany({
      where: { workoutTemplateId: id }
    })

    const template = await prisma.workoutTemplate.update({
      where: { id },
      data: {
        name,
        description,
        estimatedDuration,
        isPublic,
        category,
        exercises: exercises ? {
          create: exercises.map((ex: any, index: number) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            repsMin: ex.repsMin,
            repsMax: ex.repsMax,
            restSeconds: ex.restSeconds || 60,
            notes: ex.notes,
            orderIndex: ex.orderIndex || index
          }))
        } : undefined
      },
      include: {
        exercises: {
          include: {
            exercise: true
          }
        }
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating workout template:', error)
    return NextResponse.json(
      { error: 'Failed to update workout template' },
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

    const userId = (session.user as any).id
    const { id } = await params

    // Check ownership
    const template = await prisma.workoutTemplate.findUnique({
      where: { id }
    })

    if (!template || template.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.workoutTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout template:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout template' },
      { status: 500 }
    )
  }
}
