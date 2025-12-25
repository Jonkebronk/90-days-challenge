import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recipes/favorites - Get all favorite recipes with ingredients
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    const favorites = await prisma.recipeFavorite.findMany({
      where: { userId },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            ingredients: {
              select: {
                id: true,
                amount: true,
                displayUnit: true,
                displayAmount: true,
                foodItem: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favorite recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch favorite recipes' }, { status: 500 })
  }
}
