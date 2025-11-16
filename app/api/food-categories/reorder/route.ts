import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/food-categories/reorder - Reorder categories (coach only)
export async function PATCH(req: NextRequest) {
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
    const { categories } = body

    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: 'Categories must be an array' }, { status: 400 })
    }

    // Update order index for each category
    const updates = categories.map((cat: { id: string; orderIndex: number }) => {
      return prisma.foodCategory.update({
        where: { id: cat.id },
        data: { orderIndex: cat.orderIndex },
      })
    })

    await prisma.$transaction(updates)

    // Fetch updated categories
    const updatedCategories = await prisma.foodCategory.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { foodItems: true },
        },
      },
    })

    return NextResponse.json({ categories: updatedCategories })
  } catch (error) {
    console.error('Error reordering food categories:', error)
    return NextResponse.json(
      { error: 'Failed to reorder food categories' },
      { status: 500 }
    )
  }
}
