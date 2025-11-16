import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/shopping-lists/[id]/items/uncheck-all - Uncheck all items
export async function POST(
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

    // Update all items to unchecked
    const result = await prisma.shoppingListItem.updateMany({
      where: { listId },
      data: { checked: false },
    })

    return NextResponse.json({ message: 'All items unchecked', count: result.count })
  } catch (error) {
    console.error('Error unchecking all items:', error)
    return NextResponse.json({ error: 'Failed to uncheck all items' }, { status: 500 })
  }
}
