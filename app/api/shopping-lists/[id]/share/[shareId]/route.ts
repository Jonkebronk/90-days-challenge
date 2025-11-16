import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/shopping-lists/[id]/share/[shareId] - Update share (change role)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const { id: listId, shareId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user is owner
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        userId,
      },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Shopping list not found or you are not the owner' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { role } = body

    if (!role || !['viewer', 'editor'].includes(role)) {
      return NextResponse.json({ error: 'Valid role (viewer or editor) is required' }, { status: 400 })
    }

    const share = await prisma.shoppingListShare.update({
      where: { id: shareId },
      data: { role },
    })

    return NextResponse.json({ share })
  } catch (error) {
    console.error('Error updating share:', error)
    return NextResponse.json({ error: 'Failed to update share' }, { status: 500 })
  }
}

// DELETE /api/shopping-lists/[id]/share/[shareId] - Remove share
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const { id: listId, shareId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user is owner
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        userId,
      },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Shopping list not found or you are not the owner' },
        { status: 404 }
      )
    }

    await prisma.shoppingListShare.delete({
      where: { id: shareId },
    })

    return NextResponse.json({ message: 'Share removed successfully' })
  } catch (error) {
    console.error('Error removing share:', error)
    return NextResponse.json({ error: 'Failed to remove share' }, { status: 500 })
  }
}
