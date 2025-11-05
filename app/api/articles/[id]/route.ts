import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/articles/[id] - Get single article
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

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        category: true,
        roadmapAssignments: {
          orderBy: { dayNumber: 'asc' }
        },
        progress: {
          where: { userId: session.user.id as string }
        }
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Clients can only view published articles
    if ((session.user as any).role !== 'coach' && !article.published) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 })
  }
}

// PATCH /api/articles/[id] - Update article
export async function PATCH(
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
    const {
      title,
      content,
      slug,
      categoryId,
      tags,
      difficulty,
      phase,
      estimatedReadingMinutes,
      coverImage,
      published,
      orderIndex
    } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (slug !== undefined) updateData.slug = slug
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (tags !== undefined) updateData.tags = tags
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (phase !== undefined) updateData.phase = phase
    if (estimatedReadingMinutes !== undefined) updateData.estimatedReadingMinutes = estimatedReadingMinutes
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex

    if (published !== undefined) {
      updateData.published = published
      // Set publishedAt when first published
      const currentArticle = await prisma.article.findUnique({
        where: { id },
        select: { published: true, publishedAt: true }
      })
      if (published && !currentArticle?.published && !currentArticle?.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
  }
}

// DELETE /api/articles/[id] - Delete article
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

    await prisma.article.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 })
  }
}
