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

    // Get current user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        category: true,
        progress: {
          where: {
            userId: user.id
          },
          select: {
            completed: true,
            completedAt: true
          }
        },
        _count: {
          select: { roadmapAssignments: true, progress: true }
        }
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Auto-fix duplicated orderIndex values (only for coaches, only once per session)
    if ((session.user as any).role === 'coach' && !where.categoryId) {
      // Check if there are any duplicates
      const categories = await prisma.articleCategory.findMany({
        include: {
          articles: {
            select: { id: true, orderIndex: true },
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      let needsFix = false
      for (const category of categories) {
        const orderIndexes = category.articles.map(a => a.orderIndex)
        const uniqueIndexes = new Set(orderIndexes)
        if (orderIndexes.length !== uniqueIndexes.size) {
          needsFix = true
          break
        }
      }

      // If duplicates found, fix them
      if (needsFix) {
        console.log('🔧 Auto-fixing duplicate orderIndex values...')
        for (const category of categories) {
          for (let i = 0; i < category.articles.length; i++) {
            const article = category.articles[i]
            if (article.orderIndex !== i) {
              await prisma.article.update({
                where: { id: article.id },
                data: { orderIndex: i }
              })
            }
          }
        }
        console.log('✅ OrderIndex values fixed!')
      }
    }

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

    // Get all articles in category to calculate next orderIndex
    const existingArticles = await prisma.article.findMany({
      where: { categoryId },
      select: { orderIndex: true }
    })

    // Find the highest orderIndex, defaulting to -1 so first article gets 0
    const maxOrderIndex = existingArticles.length > 0
      ? Math.max(...existingArticles.map(a => a.orderIndex))
      : -1

    const article = await prisma.article.create({
      data: {
        title,
        content: content || '',
        slug,
        categoryId,
        tags: tags || [],
        difficulty: difficulty && difficulty !== '' ? difficulty : null,
        phase: phase && phase !== '' ? parseInt(phase) : null,
        estimatedReadingMinutes: estimatedReadingMinutes && estimatedReadingMinutes !== '' ? parseInt(estimatedReadingMinutes) : null,
        coverImage: coverImage || null,
        published: published || false,
        publishedAt: published ? new Date() : null,
        orderIndex: maxOrderIndex + 1
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({ article })
  } catch (error: any) {
    console.error('Error creating article:', error)

    // Check for specific errors
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'En artikel med denna slug existerar redan' }, { status: 400 })
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Ogiltig kategori vald' }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to create article',
      details: error.message
    }, { status: 500 })
  }
}
