import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/article-categories - Get all categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.articleCategory.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/article-categories - Create new category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, slug } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Get the highest orderIndex
    const lastCategory = await prisma.articleCategory.findFirst({
      orderBy: { orderIndex: 'desc' }
    })

    const category = await prisma.articleCategory.create({
      data: {
        name,
        description: description || null,
        slug,
        orderIndex: (lastCategory?.orderIndex || 0) + 1
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
