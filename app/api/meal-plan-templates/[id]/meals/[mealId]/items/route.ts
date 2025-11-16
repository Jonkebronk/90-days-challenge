import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/meal-plan-templates/[id]/meals/[mealId]/items - Add ingredient to meal
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mealId: string }> }
) {
  try {
    const { id: templateId, mealId } = await params
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
    const { name, amount, protein, fat, carbs, calories } = body

    if (!name || !amount) {
      return NextResponse.json({ error: 'Name and amount are required' }, { status: 400 })
    }

    // Verify meal belongs to template
    const meal = await prisma.templateMeal.findFirst({
      where: {
        id: mealId,
        templateId,
      },
    })

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 })
    }

    // Get max order index
    const maxOrderIndex = await prisma.templateMealItem.findFirst({
      where: { templateMealId: mealId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    })

    const item = await prisma.templateMealItem.create({
      data: {
        templateMealId: mealId,
        name,
        amount,
        protein: protein || 0,
        fat: fat || 0,
        carbs: carbs || 0,
        calories: calories || 0,
        orderIndex: (maxOrderIndex?.orderIndex || 0) + 1,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating meal item:', error)
    return NextResponse.json({ error: 'Failed to create meal item' }, { status: 500 })
  }
}
