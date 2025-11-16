import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/shopping-lists/[id]/items/clear-checked - Delete all checked items
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params
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

    // Delete all checked items
    const result = await prisma.shoppingListItem.deleteMany({
      where: {
        listId,
        checked: true,
      },
    })

    return NextResponse.json({ message: 'Checked items cleared', count: result.count })
  } catch (error) {
    console.error('Error clearing checked items:', error)
    return NextResponse.json({ error: 'Failed to clear checked items' }, { status: 500 })
  }
}
