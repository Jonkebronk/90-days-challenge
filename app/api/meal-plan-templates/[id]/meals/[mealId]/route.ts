import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/meal-plan-templates/[id]/meals/[mealId] - Update meal
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; mealId: string }> }
) {
  try {
    const { id, mealId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const meal = await prisma.templateMeal.update({
      where: { id: mealId },
      data: {
        name: body.name,
        mealType: body.mealType,
        description: body.description !== undefined ? (body.description || null) : undefined,
        targetProtein: body.targetProtein ? parseFloat(body.targetProtein) : null,
        targetFat: body.targetFat ? parseFloat(body.targetFat) : null,
        targetCarbs: body.targetCarbs ? parseFloat(body.targetCarbs) : null,
        targetCalories: body.targetCalories
          ? parseFloat(body.targetCalories)
          : null,
      },
      include: {
        options: {
          include: {
            recipe: true,
          },
        },
      },
    })

    return NextResponse.json({ meal })
  } catch (error: any) {
    console.error('Error updating meal:', error)
    return NextResponse.json(
      {
        error: 'Failed to update meal',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE /api/meal-plan-templates/[id]/meals/[mealId] - Delete meal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; mealId: string }> }
) {
  try {
    const { id, mealId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.templateMeal.delete({
      where: { id: mealId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting meal:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete meal',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
