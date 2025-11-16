import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/shopping-lists/[id]/items/[itemId] - Update item (quantity, checked, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: listId, itemId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user has edit access
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        OR: [
          { userId },
          {
            shares: {
              some: {
                sharedWith: userId,
                accepted: true,
                role: 'editor',
              },
            },
          },
        ],
      },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Shopping list not found or you do not have permission' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { quantity, unit, category, checked, notes } = body

    const item = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: {
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        unit: unit !== undefined ? unit : undefined,
        category: category !== undefined ? category : undefined,
        checked: checked !== undefined ? checked : undefined,
        notes: notes !== undefined ? (notes || null) : undefined,
      },
      include: {
        foodItem: {
          select: {
            id: true,
            name: true,
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
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating shopping list item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

// DELETE /api/shopping-lists/[id]/items/[itemId] - Delete item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: listId, itemId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user has edit access
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        OR: [
          { userId },
          {
            shares: {
              some: {
                sharedWith: userId,
                accepted: true,
                role: 'editor',
              },
            },
          },
        ],
      },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Shopping list not found or you do not have permission' },
        { status: 404 }
      )
    }

    await prisma.shoppingListItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting shopping list item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
