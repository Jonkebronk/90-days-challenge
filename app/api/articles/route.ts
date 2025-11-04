import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/articles - Get all articles
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const published = searchParams.get('published')
    const phase = searchParams.get('phase')

    const where: any = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (published !== null && published !== undefined) {
      where.published = published === 'true'
    }

    if (phase) {
      where.phase = parseInt(phase)
    }

    // Clients can only see published articles
    if ((session.user as any).role !== 'coach') {
      where.published = true
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { roadmapAssignments: true, progress: true }
        }
      },
      orderBy: [
        { phase: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

// POST /api/articles - Create new article
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      published
    } = body

    if (!title || !slug || !categoryId) {
      return NextResponse.json(
        { error: 'Title, slug, and category are required' },
        { status: 400 }
      )
    }

    const article = await prisma.article.create({
      data: {
        title,
        content: content || '',
        slug,
        categoryId,
        tags: tags || [],
        difficulty: difficulty || null,
        phase: phase || null,
        estimatedReadingMinutes: estimatedReadingMinutes || null,
        coverImage: coverImage || null,
        published: published || false,
        publishedAt: published ? new Date() : null
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}
