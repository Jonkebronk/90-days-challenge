import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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

    // Get the template with exercises
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

    // Create a workout session log from the template
    const sessionLog = await prisma.workoutSessionLog.create({
      data: {
        userId,
        templateName: template.name,
        startedAt: new Date(),
        completed: false
      }
    })

    // Increment usage count for template
    await prisma.workoutTemplate.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      sessionLog,
      template
    }, { status: 201 })
  } catch (error) {
    console.error('Error starting workout from template:', error)
    return NextResponse.json(
      { error: 'Failed to start workout' },
      { status: 500 }
    )
  }
}
