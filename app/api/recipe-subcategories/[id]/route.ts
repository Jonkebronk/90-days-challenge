import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/recipe-subcategories/[id] - Update subcategory (coach only)
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
    const { name, orderIndex } = body

    const updateData: any = {}

    if (name !== undefined) {
      updateData.name = name
      // Regenerate slug if name changed
      updateData.slug = name
        .toLowerCase()
        .replace(/å/g, 'a')
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }

    if (orderIndex !== undefined) {
      updateData.orderIndex = orderIndex
    }

    const subcategory = await prisma.recipeSubcategory.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ subcategory })
  } catch (error) {
    console.error('Error updating recipe subcategory:', error)
    return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 })
  }
}

// DELETE /api/recipe-subcategories/[id] - Delete subcategory (coach only)
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

    // Check if subcategory exists and has recipes
    const subcategory = await prisma.recipeSubcategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipes: true,
          },
        },
      },
    })

    if (!subcategory) {
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 })
    }

    if (subcategory._count.recipes > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete subcategory with ${subcategory._count.recipes} recipes. Please reassign or delete the recipes first.`,
        },
        { status: 400 }
      )
    }

    await prisma.recipeSubcategory.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Subcategory deleted successfully' })
  } catch (error) {
    console.error('Error deleting recipe subcategory:', error)
    return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 })
  }
}
