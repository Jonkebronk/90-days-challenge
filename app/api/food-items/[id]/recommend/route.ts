import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/food-items/[id]/recommend - Toggle recommended status (coach only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if food item exists
    const existing = await prisma.foodItem.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 })
    }

    // Toggle recommended
    const isRecommended = !existing.isRecommended

    const foodItem = await prisma.foodItem.update({
      where: { id },
      data: {
        isRecommended,
      },
      include: {
        foodCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
      },
    })

    return NextResponse.json({ item: foodItem })
  } catch (error) {
    console.error('Error toggling recommended:', error)
    return NextResponse.json({ error: 'Failed to toggle recommended' }, { status: 500 })
  }
}
