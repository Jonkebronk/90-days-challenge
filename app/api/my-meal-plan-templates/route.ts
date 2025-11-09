import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/my-meal-plan-templates - Get assigned meal plan templates for current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active assignments with full template data
    const assignments = await prisma.mealPlanTemplateAssignment.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      include: {
        template: {
          include: {
            meals: {
              include: {
                options: {
                  include: {
                    recipe: {
                      select: {
                        id: true,
                        title: true,
                        coverImage: true,
                        caloriesPerServing: true,
                        proteinPerServing: true,
                        carbsPerServing: true,
                        fatPerServing: true,
                      },
                    },
                  },
                  orderBy: { orderIndex: 'asc' },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    })

    // Get user's meal selections
    const selections = await prisma.clientMealSelection.findMany({
      where: { userId: user.id },
      include: {
        selectedOption: true,
        templateMeal: true,
      },
    })

    return NextResponse.json({
      assignments: assignments.map(a => a.template),
      selections,
    })
  } catch (error) {
    console.error('Error fetching assigned templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plan templates' },
      { status: 500 }
    )
  }
}
