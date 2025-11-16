import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/shopping-lists - Get all shopping lists for user (including shared)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get own lists + shared lists
    const [ownLists, sharedListIds] = await Promise.all([
      // Own lists
      prisma.shoppingList.findMany({
        where: { userId },
        include: {
          _count: {
            select: {
              items: true,
            },
          },
          shares: {
            where: { accepted: true },
            select: {
              sharedWith: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Shared lists
      prisma.shoppingListShare.findMany({
        where: {
          sharedWith: userId,
          accepted: true,
        },
        select: { listId: true },
      }),
    ])

    // Fetch shared list details
    const sharedLists = await prisma.shoppingList.findMany({
      where: {
        id: {
          in: sharedListIds.map((s) => s.listId),
        },
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
        shares: {
          where: { sharedWith: userId },
          select: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      ownLists,
      sharedLists,
    })
  } catch (error) {
    console.error('Error fetching shopping lists:', error)
    return NextResponse.json({ error: 'Failed to fetch shopping lists' }, { status: 500 })
  }
}

// POST /api/shopping-lists - Create new shopping list
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const shoppingList = await prisma.shoppingList.create({
      data: {
        name,
        description: description || null,
        color: color || '#FFD700',
        userId: session.user.id,
        createdBy: session.user.id,
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
    console.error('Error creating shopping list:', error)
    return NextResponse.json({ error: 'Failed to create shopping list' }, { status: 500 })
  }
}
