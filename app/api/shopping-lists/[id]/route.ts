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

    // Check if user owns the list or has access via share
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id,
        OR: [
          { userId }, // Owner
          {
            shares: {
              some: {
                sharedWith: userId,
                accepted: true,
              },
            },
          }, // Shared with user
        ],
      },
      include: {
        items: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
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

    // Check user's role
    const isOwner = shoppingList.userId === userId
    const shareRecord = shoppingList.shares.find((s) => s.sharedWith === userId)
    const userRole = isOwner ? 'owner' : shareRecord?.role || 'viewer'

    return NextResponse.json({
      list: shoppingList,
      userRole,
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

    const userId = session.user.id

    // Check if user is owner or has editor access
    const existing = await prisma.shoppingList.findFirst({
      where: {
        id,
        OR: [
          { userId }, // Owner
          {
            shares: {
              some: {
                sharedWith: userId,
                accepted: true,
                role: 'editor',
              },
            },
          }, // Editor
        ],
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Shopping list not found or you do not have permission to edit it' },
        { status: 404 }
      )
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

    const userId = session.user.id

    // Check if user is owner
    const existing = await prisma.shoppingList.findFirst({
      where: {
        id,
        userId, // Only owner can delete
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Shopping list not found or you do not have permission to delete it' },
        { status: 404 }
      )
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
