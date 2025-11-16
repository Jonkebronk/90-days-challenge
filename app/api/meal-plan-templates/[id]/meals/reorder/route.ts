import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/meal-plan-templates/[id]/meals/reorder - Reorder meals (coach only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is coach
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden: Coach access required' }, { status: 403 })
    }

    const body = await req.json()
    const { meals } = body

    if (!Array.isArray(meals) || meals.length === 0) {
      return NextResponse.json({ error: 'Meals array is required' }, { status: 400 })
    }

    // Verify all meals belong to this template
    const mealIds = meals.map((m: any) => m.id)
    const existingMeals = await prisma.templateMeal.findMany({
      where: {
        id: { in: mealIds },
        templateId: id,
      },
    })

    if (existingMeals.length !== meals.length) {
      return NextResponse.json(
        { error: 'Some meals do not belong to this template' },
        { status: 400 }
      )
    }

    // Update orderIndex for all meals in a transaction
    await prisma.$transaction(
      meals.map((meal: any) =>
        prisma.templateMeal.update({
          where: { id: meal.id },
          data: { orderIndex: meal.orderIndex },
        })
      )
    )

    return NextResponse.json({ message: 'Meals reordered successfully' })
  } catch (error) {
    console.error('Error reordering meals:', error)
    return NextResponse.json({ error: 'Failed to reorder meals' }, { status: 500 })
  }
}
