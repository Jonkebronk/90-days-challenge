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
        },
        feedback: {
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

    console.log('PATCH /api/articles/[id] - Received body:', {
      id,
      bodyKeys: Object.keys(body),
      title: body.title,
      contentLength: body.content?.length,
      categoryId: body.categoryId
    })

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
    if (difficulty !== undefined) updateData.difficulty = difficulty || null
    if (phase !== undefined) updateData.phase = phase
    if (estimatedReadingMinutes !== undefined) updateData.estimatedReadingMinutes = estimatedReadingMinutes
    if (coverImage !== undefined) updateData.coverImage = coverImage || null
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex

    console.log('PATCH /api/articles/[id] - Update data:', {
      updateDataKeys: Object.keys(updateData),
      titleChanged: updateData.title !== undefined,
      contentChanged: updateData.content !== undefined
    })

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

    console.log('PATCH /api/articles/[id] - About to update article with ID:', id)
    console.log('PATCH /api/articles/[id] - Final updateData:', JSON.stringify(updateData, null, 2))

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    })

    console.log('PATCH /api/articles/[id] - Article updated successfully:', {
      id: article.id,
      title: article.title,
      contentLength: article.content.length
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error updating article:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json({
      error: 'Failed to update article',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        roadmapAssignments: true,
        progress: true
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Delete related records first (Prisma should cascade but let's be explicit)
    await prisma.$transaction([
      // Delete roadmap assignments
      prisma.roadmapAssignment.deleteMany({
        where: { articleId: id }
      }),
      // Delete article progress
      prisma.articleProgress.deleteMany({
        where: { articleId: id }
      }),
      // Delete the article
      prisma.article.delete({
        where: { id }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json({
      error: 'Failed to delete article',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
