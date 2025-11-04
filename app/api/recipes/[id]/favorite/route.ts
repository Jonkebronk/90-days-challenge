import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/recipes/[id]/favorite - Toggle favorite
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: recipeId } = params
    const userId = session.user.id as string

    // Check if already favorited
    const existing = await prisma.recipeFavorite.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      }
    })

    if (existing) {
      // Remove favorite
      await prisma.recipeFavorite.delete({
        where: {
          userId_recipeId: {
            userId,
            recipeId
          }
        }
      })
      return NextResponse.json({ favorited: false })
    } else {
      // Add favorite
      await prisma.recipeFavorite.create({
        data: {
          userId,
          recipeId
        }
      })
      return NextResponse.json({ favorited: true })
    }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 })
  }
}
