/**
 * API: Smart Meal Plans CRUD
 * GET  /api/meal-planner/plans - List user's plans
 * POST /api/meal-planner/plans - Save new plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List user's plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'day' | 'week' | null (all)
    const active = searchParams.get('active') // 'true' | 'false' | null

    const plans = await prisma.smartMealPlan.findMany({
      where: {
        userId: session.user.id,
        ...(type && { type }),
        ...(active !== null && { isActive: active === 'true' })
      },
      include: {
        days: {
          include: {
            meals: {
              include: {
                recipe: {
                  select: {
                    id: true,
                    title: true,
                    coverImage: true
                  }
                }
              },
              orderBy: { slotOrder: 'asc' }
            }
          },
          orderBy: { dayNumber: 'asc' }
        },
        coach: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ plans })

  } catch (error) {
    console.error('Get smart meal plans error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Save new plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    if (!body.name || !body.type || !body.target) {
      return NextResponse.json(
        { error: 'name, type och target krävs' },
        { status: 400 }
      )
    }

    if (!['day', 'week'].includes(body.type)) {
      return NextResponse.json(
        { error: 'type måste vara "day" eller "week"' },
        { status: 400 }
      )
    }

    if (!body.days || !Array.isArray(body.days) || body.days.length === 0) {
      return NextResponse.json(
        { error: 'days array krävs' },
        { status: 400 }
      )
    }

    // Calculate totals
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0

    for (const day of body.days) {
      if (day.meals) {
        for (const meal of day.meals) {
          totalCalories += meal.macros?.calories || 0
          totalProtein += meal.macros?.protein || 0
          totalCarbs += meal.macros?.carbs || 0
          totalFat += meal.macros?.fat || 0
        }
      }
    }

    // Create plan with days and meals
    const plan = await prisma.smartMealPlan.create({
      data: {
        userId: session.user.id,
        coachId: body.coachId || null,

        name: body.name,
        type: body.type,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,

        targetCalories: body.target.calories,
        targetProtein: body.target.protein,
        targetCarbs: body.target.carbs,
        targetFat: body.target.fat,

        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,

        score: body.score || null,
        isTemplate: body.isTemplate || false,
        isActive: true,

        days: {
          create: body.days.map((day: any, index: number) => ({
            dayNumber: day.dayNumber || index + 1,
            dayName: day.dayName || null,
            date: day.date ? new Date(day.date) : null,

            targetCalories: day.target?.calories || body.target.calories,
            targetProtein: day.target?.protein || body.target.protein,
            targetCarbs: day.target?.carbs || body.target.carbs,
            targetFat: day.target?.fat || body.target.fat,

            totalCalories: day.totals?.calories || null,
            totalProtein: day.totals?.protein || null,
            totalCarbs: day.totals?.carbs || null,
            totalFat: day.totals?.fat || null,

            score: day.score || null,

            meals: {
              create: (day.meals || []).map((meal: any, mealIndex: number) => ({
                slot: meal.slot,
                slotOrder: meal.slotOrder || mealIndex + 1,
                targetRatio: meal.targetRatio || null,

                recipeId: meal.recipeId,

                scaleFactor: meal.scaleFactor || 1.0,
                scaledServings: meal.scaledServings || 1.0,

                calories: meal.macros?.calories || 0,
                protein: meal.macros?.protein || 0,
                carbs: meal.macros?.carbs || 0,
                fat: meal.macros?.fat || 0,

                notes: meal.notes || null
              }))
            }
          }))
        }
      },
      include: {
        days: {
          include: {
            meals: {
              include: {
                recipe: {
                  select: {
                    id: true,
                    title: true,
                    coverImage: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ plan }, { status: 201 })

  } catch (error) {
    console.error('Create smart meal plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
