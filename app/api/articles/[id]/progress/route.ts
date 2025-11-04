import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/articles/[id]/progress - Mark article as read/update progress
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: articleId } = await params
    const body = await request.json()
    const { completed } = body

    const userId = session.user.id as string

    // Check if progress already exists
    const existingProgress = await prisma.articleProgress.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId
        }
      }
    })

    let progress

    if (existingProgress) {
      // Update existing progress
      progress = await prisma.articleProgress.update({
        where: {
          userId_articleId: {
            userId,
            articleId
          }
        },
        data: {
          completed: completed !== undefined ? completed : existingProgress.completed,
          completedAt: completed ? new Date() : existingProgress.completedAt,
          lastReadAt: new Date()
        }
      })
    } else {
      // Create new progress
      progress = await prisma.articleProgress.create({
        data: {
          userId,
          articleId,
          completed: completed || false,
          completedAt: completed ? new Date() : null,
          lastReadAt: new Date()
        }
      })
    }

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Error updating article progress:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
