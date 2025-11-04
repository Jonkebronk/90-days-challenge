import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/lessons/[id] - Get single lesson
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
    const isCoach = (session.user as any).role === 'coach'
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { orderIndex: 'asc' }
        },
        progress: isCoach ? false : {
          where: { userId: session.user.id }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Clients can only see published lessons
    if (!isCoach && !lesson.published) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Failed to fetch lesson:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    )
  }
}

// PUT /api/lessons/[id] - Update lesson (coach only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, phase, orderIndex, coverImage, prerequisiteIds, published } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (phase !== undefined) updateData.phase = phase
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (prerequisiteIds !== undefined) updateData.prerequisiteIds = prerequisiteIds
    if (published !== undefined) {
      updateData.published = published
      if (published && !updateData.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
      include: {
        slides: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Failed to update lesson:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    )
  }
}

// DELETE /api/lessons/[id] - Delete lesson (coach only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.lesson.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Failed to delete lesson:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    )
  }
}
