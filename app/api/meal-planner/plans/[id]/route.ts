/**
 * API: Single Smart Meal Plan
 * GET    /api/meal-planner/plans/[id] - Get plan
 * PUT    /api/meal-planner/plans/[id] - Update plan
 * DELETE /api/meal-planner/plans/[id] - Delete plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET - Get a plan
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const plan = await prisma.smartMealPlan.findUnique({
      where: { id },
      include: {
        days: {
          include: {
            meals: {
              include: {
                recipe: {
                  include: {
                    ingredients: {
                      include: {
                        foodItem: true
                      }
                    }
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
            name: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check permissions (owner or coach)
    const isOwner = plan.userId === session.user.id
    const isCoach = plan.coachId === session.user.id
    const userRole = (session.user as any).role
    const isAdmin = userRole === 'coach' || userRole === 'admin'

    if (!isOwner && !isCoach && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ plan })

  } catch (error) {
    console.error('Get smart meal plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update plan
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    // Get existing plan
    const existing = await prisma.smartMealPlan.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = existing.userId === session.user.id
    const isCoach = existing.coachId === session.user.id
    const userRole = (session.user as any).role
    const isAdmin = userRole === 'coach' || userRole === 'admin'

    if (!isOwner && !isCoach && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update plan (metadata only - days/meals updated separately)
    const updated = await prisma.smartMealPlan.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
        endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
        isActive: body.isActive ?? existing.isActive,
        isTemplate: body.isTemplate ?? existing.isTemplate,

        // Update targets if provided
        ...(body.target && {
          targetCalories: body.target.calories,
          targetProtein: body.target.protein,
          targetCarbs: body.target.carbs,
          targetFat: body.target.fat
        })
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

    return NextResponse.json({ plan: updated })

  } catch (error) {
    console.error('Update smart meal plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete plan
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Get existing plan
    const existing = await prisma.smartMealPlan.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = existing.userId === session.user.id
    const isCoach = existing.coachId === session.user.id
    const userRole = (session.user as any).role
    const isAdmin = userRole === 'coach' || userRole === 'admin'

    if (!isOwner && !isCoach && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete (cascade handles days and meals)
    await prisma.smartMealPlan.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete smart meal plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
