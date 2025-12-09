import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/food-logs/[id] - Get specific food log
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const foodLog = await prisma.foodLog.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            product: true
          }
        }
      }
    })

    if (!foodLog) {
      return NextResponse.json({ error: 'Food log not found' }, { status: 404 })
    }

    return NextResponse.json({ foodLog })
  } catch (error) {
    console.error('Error fetching food log:', error)
    return NextResponse.json({ error: 'Failed to fetch food log' }, { status: 500 })
  }
}

// PUT /api/food-logs/[id] - Update food log
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { notes, items } = body

    // Verify ownership
    const existing = await prisma.foodLog.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Food log not found' }, { status: 404 })
    }

    // If items are provided, recalculate totals
    let updateData: any = {}

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (items && items.length > 0) {
      // Calculate new totals
      const totals = items.reduce(
        (acc: any, item: any) => ({
          kcal: acc.kcal + (item.kcal || 0),
          protein: acc.protein + (item.protein || 0),
          carbs: acc.carbs + (item.carbs || 0),
          fat: acc.fat + (item.fat || 0)
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      )

      updateData.totalKcal = totals.kcal
      updateData.totalProtein = totals.protein
      updateData.totalCarbs = totals.carbs
      updateData.totalFat = totals.fat

      // Delete existing items and create new ones
      await prisma.foodLogItem.deleteMany({
        where: { foodLogId: id }
      })

      await prisma.foodLogItem.createMany({
        data: items.map((item: any, index: number) => ({
          foodLogId: id,
          productId: item.productId || null,
          name: item.name,
          portionG: item.portionG || item.portion_g || 0,
          kcal: item.kcal || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fat || 0,
          orderIndex: index
        }))
      })
    }

    const foodLog = await prisma.foodLog.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    return NextResponse.json({ foodLog })
  } catch (error) {
    console.error('Error updating food log:', error)
    return NextResponse.json({ error: 'Failed to update food log' }, { status: 500 })
  }
}

// DELETE /api/food-logs/[id] - Delete food log
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.foodLog.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Food log not found' }, { status: 404 })
    }

    await prisma.foodLog.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting food log:', error)
    return NextResponse.json({ error: 'Failed to delete food log' }, { status: 500 })
  }
}
