import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/recipe-categories/[id] - Update category (coach only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, slug, color, icon, orderIndex } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (slug !== undefined) updateData.slug = slug
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex

    const category = await prisma.recipeCategory.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            recipes: true,
            subcategories: true
          }
        },
        subcategories: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating recipe category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE /api/recipe-categories/[id] - Delete category (coach only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if category has recipes
    const category = await prisma.recipeCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { recipes: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category._count.recipes > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${category._count.recipes} recipes. Please reassign or delete the recipes first.`,
        },
        { status: 400 }
      )
    }

    await prisma.recipeCategory.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting recipe category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
