import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/shopping-lists/[id]/share - Share list with another user
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

    // Check if user is owner
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        userId, // Only owner can share
      },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Shopping list not found or you are not the owner' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { sharedWith, role } = body

    // Validate
    if (!sharedWith) {
      return NextResponse.json({ error: 'sharedWith (user ID or email) is required' }, { status: 400 })
    }

    // Check if sharing with self
    if (sharedWith === userId) {
      return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 })
    }

    // Check if already shared
    const existingShare = await prisma.shoppingListShare.findUnique({
      where: {
        listId_sharedWith: {
          listId,
          sharedWith,
        },
      },
    })

    if (existingShare) {
      return NextResponse.json({ error: 'List already shared with this user' }, { status: 400 })
    }

    // Create share
    const share = await prisma.shoppingListShare.create({
      data: {
        listId,
        sharedWith,
        role: role || 'editor',
        accepted: true, // Auto-accept for now (can implement invitation flow later)
      },
    })

    return NextResponse.json({ share })
  } catch (error) {
    console.error('Error sharing shopping list:', error)
    return NextResponse.json({ error: 'Failed to share list' }, { status: 500 })
  }
}
