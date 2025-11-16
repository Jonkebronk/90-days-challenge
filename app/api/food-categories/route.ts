import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/food-categories - List all food categories
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.foodCategory.findMany({
      orderBy: {
        orderIndex: 'asc',
      },
      include: {
        _count: {
          select: { foodItems: true },
        },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching food categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch food categories' },
      { status: 500 }
    )
  }
}

// POST /api/food-categories - Create new food category (coach only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is coach
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden: Coach access required' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, slug, color, icon } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Check if slug already exists
    const existing = await prisma.foodCategory.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 400 })
    }

    // Get max order index
    const maxOrderIndex = await prisma.foodCategory.findFirst({
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    })

    const category = await prisma.foodCategory.create({
      data: {
        name,
        description: description || null,
        slug,
        color: color || '#FFD700',
        icon: icon || 'Apple',
        orderIndex: (maxOrderIndex?.orderIndex || 0) + 1,
      },
      include: {
        _count: {
          select: { foodItems: true },
        },
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating food category:', error)
    return NextResponse.json(
      { error: 'Failed to create food category' },
      { status: 500 }
    )
  }
}
