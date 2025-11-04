import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/lessons/[id]/progress - Update lesson progress
export async function POST(
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
    const { completed, lastSlideIndex } = body

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id!,
          lessonId: id
        }
      },
      update: {
        completed: completed !== undefined ? completed : undefined,
        completedAt: completed ? new Date() : undefined,
        lastSlideIndex: lastSlideIndex !== undefined ? lastSlideIndex : undefined
      },
      create: {
        userId: session.user.id!,
        lessonId: id,
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        lastSlideIndex: lastSlideIndex || 0
      }
    })

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Failed to update progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
