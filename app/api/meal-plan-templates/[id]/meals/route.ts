import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/meal-plan-templates/[id]/meals - Add meal to template
export async function POST(
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
    const {
      name,
      mealType,
      description,
      targetProtein,
      targetFat,
      targetCarbs,
      targetCalories,
    } = body

    if (!name || !mealType) {
      return NextResponse.json(
        { error: 'Name and meal type are required' },
        { status: 400 }
      )
    }

    // Get current meal count for ordering
    const existingMeals = await prisma.templateMeal.findMany({
      where: { templateId: id },
      orderBy: { orderIndex: 'desc' },
      take: 1,
    })

    const nextOrderIndex = existingMeals.length > 0 ? existingMeals[0].orderIndex + 1 : 0

    const meal = await prisma.templateMeal.create({
      data: {
        templateId: id,
        name,
        mealType,
        description: description || null,
        targetProtein: targetProtein ? parseFloat(targetProtein) : null,
        targetFat: targetFat ? parseFloat(targetFat) : null,
        targetCarbs: targetCarbs ? parseFloat(targetCarbs) : null,
        targetCalories: targetCalories ? parseFloat(targetCalories) : null,
        orderIndex: nextOrderIndex,
      },
      include: {
        options: true,
      },
    })

    return NextResponse.json({ meal })
  } catch (error: any) {
    console.error('Error creating meal:', error)
    return NextResponse.json(
      {
        error: 'Failed to create meal',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
