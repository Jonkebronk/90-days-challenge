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

    const userId = (session.user as any).id

    // Get user's own templates + public templates
    const templates = await prisma.workoutTemplate.findMany({
      where: {
        OR: [
          { userId },
          { isPublic: true }
        ]
      },
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
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching workout templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout templates' },
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

    const userId = (session.user as any).id
    const body = await request.json()
    const {
      name,
      description,
      estimatedDuration,
      isPublic,
      category,
      exercises
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    // Create template with nested exercises
    const template = await prisma.workoutTemplate.create({
      data: {
        userId,
        name,
        description,
        estimatedDuration,
        isPublic: isPublic || false,
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

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating workout template:', error)
    return NextResponse.json(
      { error: 'Failed to create workout template' },
      { status: 500 }
    )
  }
}
