import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/meal-plan-templates - Get all meal plan templates
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only coaches can view templates
    if ((session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const where: any = {
      isArchived: includeArchived ? undefined : false,
    }

    if (published !== null) {
      where.published = published === 'true'
    }

    const templates = await prisma.mealPlanTemplate.findMany({
      where,
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
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching meal plan templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plan templates' },
      { status: 500 }
    )
  }
}

// POST /api/meal-plan-templates - Create new meal plan template
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      description,
      targetProtein,
      targetFat,
      targetCarbs,
      targetCalories,
      tags,
      published,
      meals,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Create template with meals and options
    const template = await prisma.mealPlanTemplate.create({
      data: {
        coachId: user.id,
        name,
        description,
        targetProtein: targetProtein ? parseFloat(targetProtein) : null,
        targetFat: targetFat ? parseFloat(targetFat) : null,
        targetCarbs: targetCarbs ? parseFloat(targetCarbs) : null,
        targetCalories: targetCalories ? parseFloat(targetCalories) : null,
        tags: tags || [],
        published: published || false,
        meals: meals
          ? {
              create: meals.map((meal: any, index: number) => ({
                name: meal.name,
                mealType: meal.mealType,
                targetProtein: meal.targetProtein
                  ? parseFloat(meal.targetProtein)
                  : null,
                targetFat: meal.targetFat ? parseFloat(meal.targetFat) : null,
                targetCarbs: meal.targetCarbs
                  ? parseFloat(meal.targetCarbs)
                  : null,
                targetCalories: meal.targetCalories
                  ? parseFloat(meal.targetCalories)
                  : null,
                orderIndex: index,
                options: meal.options
                  ? {
                      create: meal.options.map(
                        (option: any, optIndex: number) => ({
                          optionType: option.optionType,
                          recipeId: option.recipeId || null,
                          servingMultiplier: option.servingMultiplier
                            ? parseFloat(option.servingMultiplier)
                            : null,
                          customName: option.customName || null,
                          customDescription: option.customDescription || null,
                          customFoodItems: option.customFoodItems || null,
                          calculatedProtein: parseFloat(
                            option.calculatedProtein
                          ),
                          calculatedFat: parseFloat(option.calculatedFat),
                          calculatedCarbs: parseFloat(option.calculatedCarbs),
                          calculatedCalories: parseFloat(
                            option.calculatedCalories
                          ),
                          isDefault: option.isDefault || false,
                          orderIndex: optIndex,
                          notes: option.notes || null,
                        })
                      ),
                    }
                  : undefined,
              })),
            }
          : undefined,
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
    console.error('Error creating meal plan template:', error)
    return NextResponse.json(
      {
        error: 'Failed to create meal plan template',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
