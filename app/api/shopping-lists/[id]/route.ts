import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/shopping-lists/[id] - Get single shopping list with items
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

    const userId = session.user.id

    // Get the list - all users have access to all lists
    const shoppingList = await prisma.shoppingList.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                categoryId: true,
                foodCategory: {
                  select: {
                    name: true,
                    color: true,
                    icon: true,
                  },
                },
              },
            },
            product: true,
            recipe: {
              select: {
                id: true,
                title: true,
                coverImage: true,
              },
            },
          },
          orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
        },
        shares: {
          where: { accepted: true },
          select: {
            id: true,
            sharedWith: true,
            role: true,
          },
        },
      },
    })

    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 })
    }

    // All users have full access
    const isOwner = shoppingList.userId === userId

    return NextResponse.json({
      list: shoppingList,
      userRole: 'editor',
      isOwner,
    })
  } catch (error) {
    console.error('Error fetching shopping list:', error)
    return NextResponse.json({ error: 'Failed to fetch shopping list' }, { status: 500 })
  }
}

// PATCH /api/shopping-lists/[id] - Update shopping list
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

    const body = await req.json()
    const { name, description, color } = body

    const shoppingList = await prisma.shoppingList.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        color: color !== undefined ? color : undefined,
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    })

    return NextResponse.json({ list: shoppingList })
  } catch (error) {
    console.error('Error updating shopping list:', error)
    return NextResponse.json({ error: 'Failed to update shopping list' }, { status: 500 })
  }
}

// DELETE /api/shopping-lists/[id] - Delete shopping list (owner only)
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

    await prisma.shoppingList.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Shopping list deleted successfully' })
  } catch (error) {
    console.error('Error deleting shopping list:', error)
    return NextResponse.json({ error: 'Failed to delete shopping list' }, { status: 500 })
  }
}
