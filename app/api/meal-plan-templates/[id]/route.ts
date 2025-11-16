import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/meal-plan-templates/[id] - Get specific template
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.mealPlanTemplate.findUnique({
      where: { id },
      include: {
        meals: {
          include: {
            items: {
              orderBy: { orderIndex: 'asc' },
            },
            options: {
              include: {
                recipe: {
                  include: {
                    ingredients: {
                      include: {
                        foodItem: true,
                      },
                    },
                    instructions: {
                      orderBy: { stepNumber: 'asc' },
                    },
                  },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching meal plan template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plan template' },
      { status: 500 }
    )
  }
}

// PATCH /api/meal-plan-templates/[id] - Update template
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const template = await prisma.mealPlanTemplate.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        generalAdvice: body.generalAdvice,
        targetProtein: body.targetProtein
          ? parseFloat(body.targetProtein)
          : null,
        targetFat: body.targetFat ? parseFloat(body.targetFat) : null,
        targetCarbs: body.targetCarbs ? parseFloat(body.targetCarbs) : null,
        targetCalories: body.targetCalories
          ? parseFloat(body.targetCalories)
          : null,
        tags: body.tags,
        published: body.published,
        isArchived: body.isArchived,
      },
      include: {
        meals: {
          include: {
            options: {
              include: {
                recipe: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Error updating meal plan template:', error)
    return NextResponse.json(
      {
        error: 'Failed to update meal plan template',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE /api/meal-plan-templates/[id] - Delete template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.mealPlanTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting meal plan template:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete meal plan template',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
