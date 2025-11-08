import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Fetch meal plan for the user
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { userId },
      include: {
        meals: {
          include: {
            items: {
              include: {
                foodItem: true
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          },
          orderBy: {
            mealNumber: 'asc'
          }
        },
        supplementItems: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    return NextResponse.json({ mealPlan })
  } catch (error) {
    console.error('Error fetching meal plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    )
  }
}
