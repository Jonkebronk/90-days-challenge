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

    // First, check for assigned meal plan template
    const assignment = await prisma.mealPlanTemplateAssignment.findFirst({
      where: {
        userId,
        active: true
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
                      }
                    }
                  },
                  orderBy: { orderIndex: 'asc' }
                }
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    })

    // If user has an assigned template, return it in meal plan format
    if (assignment) {
      return NextResponse.json({
        mealPlan: assignment.template,
        isTemplate: true
      })
    }

    // Otherwise, fetch the old-style meal plan for the user
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

    return NextResponse.json({ mealPlan, isTemplate: false })
  } catch (error) {
    console.error('Error fetching meal plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role?.toUpperCase()
    if (userRole !== 'COACH') {
      return NextResponse.json({ error: 'Only coaches can create meal plans' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, name, totalProtein, totalFat, totalCarbs, totalCalories, meals } = body

    // Check if user already has a meal plan
    const existing = await prisma.mealPlan.findUnique({
      where: { userId }
    })

    if (existing) {
      // Delete existing meal plan and all related data
      await prisma.mealPlan.delete({
        where: { userId }
      })
    }

    // Create new meal plan
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        name,
        totalProtein,
        totalFat,
        totalCarbs,
        totalCalories,
        meals: {
          create: meals.map((meal: any) => ({
            mealNumber: meal.mealNumber,
            name: meal.name,
            totalProtein: meal.totalProtein,
            totalFat: meal.totalFat,
            totalCarbs: meal.totalCarbs,
            totalCalories: meal.totalCalories,
            items: {
              create: meal.items.map((item: any) => ({
                customName: item.customName,
                amountG: item.amountG,
                protein: item.protein,
                fat: item.fat,
                carbs: item.carbs,
                calories: item.calories,
                orderIndex: item.orderIndex,
                isSupplement: item.isSupplement
              }))
            }
          }))
        }
      },
      include: {
        meals: {
          include: {
            items: true
          }
        }
      }
    })

    return NextResponse.json({ mealPlan })
  } catch (error) {
    console.error('Error creating meal plan:', error)
    return NextResponse.json(
      { error: 'Failed to create meal plan' },
      { status: 500 }
    )
  }
}
