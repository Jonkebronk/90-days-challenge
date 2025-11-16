import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/nutrition-categories - List all nutrition categories
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // protein, fat, carbs

    const where: any = {}
    if (type) {
      where.type = type
    }

    const categories = await prisma.nutritionCategory.findMany({
      where,
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching nutrition categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/nutrition-categories - Create nutrition category (coach only)
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
    const { type, key, name, order } = body

    if (!type || !key || !name) {
      return NextResponse.json({ error: 'Type, key, and name are required' }, { status: 400 })
    }

    const category = await prisma.nutritionCategory.create({
      data: {
        type,
        key,
        name,
        order: order || 0,
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating nutrition category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
