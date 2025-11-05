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
    const { name, description, slug, color } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Get all categories to calculate next orderIndex (handles duplicates)
    const existingCategories = await prisma.articleCategory.findMany({
      select: { orderIndex: true }
    })

    // Find the highest orderIndex, defaulting to -1 so first category gets 0
    const maxOrderIndex = existingCategories.length > 0
      ? Math.max(...existingCategories.map(c => c.orderIndex))
      : -1

    const category = await prisma.articleCategory.create({
      data: {
        name,
        description: description || null,
        slug,
        color: color || '#FFD700',
        orderIndex: maxOrderIndex + 1
      }
    })

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error('Error creating category:', error)

    // Check for specific errors
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'En kategori med denna slug existerar redan' }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to create category',
      details: error.message
    }, { status: 500 })
  }
}
