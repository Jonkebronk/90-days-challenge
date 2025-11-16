import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/food-categories/[id] - Get single food category
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const category = await prisma.foodCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { foodItems: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching food category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch food category' },
      { status: 500 }
    )
  }
}

// PATCH /api/food-categories/[id] - Update food category (coach only)
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

    const body = await req.json()
    const { name, description, slug, color, icon, orderIndex } = body

    // Check if category exists
    const existing = await prisma.foodCategory.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // If slug is being changed, check if new slug is unique
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.foodCategory.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.foodCategory.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        slug: slug !== undefined ? slug : undefined,
        color: color !== undefined ? color : undefined,
        icon: icon !== undefined ? icon : undefined,
        orderIndex: orderIndex !== undefined ? orderIndex : undefined,
      },
      include: {
        _count: {
          select: { foodItems: true },
        },
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating food category:', error)
    return NextResponse.json(
      { error: 'Failed to update food category' },
      { status: 500 }
    )
  }
}

// DELETE /api/food-categories/[id] - Delete food category (coach only)
export async function DELETE(
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

    // Check if category exists
    const existing = await prisma.foodCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { foodItems: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Don't allow deletion if there are food items in this category
    if (existing._count.foodItems > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${existing._count.foodItems} food items. Please reassign or delete the food items first.`,
        },
        { status: 400 }
      )
    }

    await prisma.foodCategory.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting food category:', error)
    return NextResponse.json(
      { error: 'Failed to delete food category' },
      { status: 500 }
    )
  }
}
