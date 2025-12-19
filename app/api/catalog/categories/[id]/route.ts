import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/catalog/categories/[id] - Get a single category with its schemas
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const category = await prisma.catalogCategory.findUnique({
      where: { id },
      include: {
        schemas: {
          where: { isActive: true },
          orderBy: { calorieLevel: 'asc' },
          include: {
            meals: {
              orderBy: { orderIndex: 'asc' },
              include: {
                foods: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Kategorin hittades inte' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching catalog category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalog category' },
      { status: 500 }
    )
  }
}

// PUT /api/catalog/categories/[id] - Update a category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const category = await prisma.catalogCategory.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        description: body.description?.trim() || null,
        icon: body.icon || null,
        orderIndex: body.orderIndex,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating catalog category:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod när kategorin skulle uppdateras' },
      { status: 500 }
    )
  }
}

// DELETE /api/catalog/categories/[id] - Delete a category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if category has schemas
    const category = await prisma.catalogCategory.findUnique({
      where: { id },
      include: { _count: { select: { schemas: true } } }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Kategorin hittades inte' },
        { status: 404 }
      )
    }

    if (category._count.schemas > 0) {
      return NextResponse.json(
        { error: 'Kategorin innehåller scheman och kan inte tas bort' },
        { status: 400 }
      )
    }

    await prisma.catalogCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting catalog category:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod när kategorin skulle tas bort' },
      { status: 500 }
    )
  }
}
