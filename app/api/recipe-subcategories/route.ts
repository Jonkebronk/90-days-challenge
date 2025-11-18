import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recipe-subcategories - List all subcategories or filter by categoryId
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')

    const where = categoryId ? { categoryId } : {}

    const subcategories = await prisma.recipeSubcategory.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        _count: {
          select: {
            recipes: true,
          },
        },
      },
      orderBy: [
        { categoryId: 'asc' },
        { orderIndex: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ subcategories })
  } catch (error) {
    console.error('Error fetching recipe subcategories:', error)
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 })
  }
}

// POST /api/recipe-subcategories - Create new subcategory (coach only)
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
    const { name, categoryId, orderIndex } = body

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and categoryId are required' }, { status: 400 })
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/å/g, 'a')
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if slug already exists in this category
    const existing = await prisma.recipeSubcategory.findUnique({
      where: {
        categoryId_slug: {
          categoryId,
          slug,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A subcategory with this name already exists in this category' },
        { status: 400 }
      )
    }

    const subcategory = await prisma.recipeSubcategory.create({
      data: {
        name,
        slug,
        categoryId,
        orderIndex: orderIndex ?? 0,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ subcategory }, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe subcategory:', error)
    return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 })
  }
}
