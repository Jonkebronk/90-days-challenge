import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/catalog/categories - Get all catalog categories with schemas
export async function GET() {
  try {
    const categories = await prisma.catalogCategory.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        schemas: {
          where: { isActive: true },
          orderBy: { calorieLevel: 'asc' },
          select: {
            id: true,
            name: true,
            calorieLevel: true,
            totalProtein: true,
            totalCarbs: true,
            totalFat: true,
            totalKcal: true,
          },
        },
        _count: {
          select: { schemas: true },
        },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching catalog categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalog categories' },
      { status: 500 }
    )
  }
}

// POST /api/catalog/categories - Create new catalog category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Kategorinamn är obligatoriskt' },
        { status: 400 }
      )
    }

    // Check if name already exists
    const existing = await prisma.catalogCategory.findUnique({
      where: { name: body.name.trim() }
    })

    if (existing) {
      return NextResponse.json(
        { error: `Kategorin "${body.name}" finns redan` },
        { status: 409 }
      )
    }

    // Get max order index
    const maxOrder = await prisma.catalogCategory.aggregate({
      _max: { orderIndex: true }
    })

    const category = await prisma.catalogCategory.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        icon: body.icon || null,
        orderIndex: body.orderIndex ?? (maxOrder._max.orderIndex ?? 0) + 1,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating catalog category:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod när kategorin skulle skapas' },
      { status: 500 }
    )
  }
}
