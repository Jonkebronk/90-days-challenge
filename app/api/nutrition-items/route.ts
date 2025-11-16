import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/nutrition-items - Create nutrition item (coach only)
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
    const { categoryId, name, valuePer100g, customValues, order } = body

    if (!categoryId || !name || valuePer100g === undefined) {
      return NextResponse.json({ error: 'CategoryId, name, and valuePer100g are required' }, { status: 400 })
    }

    const item = await prisma.nutritionItem.create({
      data: {
        categoryId,
        name,
        valuePer100g: parseFloat(valuePer100g.toString()),
        customValues: customValues || null,
        order: order || 0,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating nutrition item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}

// PATCH /api/nutrition-items - Bulk update items (coach only)
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
    const { items } = body // Array of { id, name?, valuePer100g?, customValues?, order? }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
    }

    // Update each item
    const updates = await Promise.all(
      items.map(item =>
        prisma.nutritionItem.update({
          where: { id: item.id },
          data: {
            ...(item.name !== undefined && { name: item.name }),
            ...(item.valuePer100g !== undefined && { valuePer100g: parseFloat(item.valuePer100g.toString()) }),
            ...(item.customValues !== undefined && { customValues: item.customValues }),
            ...(item.order !== undefined && { order: item.order }),
          },
        })
      )
    )

    return NextResponse.json({ items: updates })
  } catch (error) {
    console.error('Error updating nutrition items:', error)
    return NextResponse.json({ error: 'Failed to update items' }, { status: 500 })
  }
}

// DELETE /api/nutrition-items?id=xxx - Delete nutrition item (coach only)
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    await prisma.nutritionItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting nutrition item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
