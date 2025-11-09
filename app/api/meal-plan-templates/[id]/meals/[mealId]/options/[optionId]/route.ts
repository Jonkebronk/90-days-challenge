import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/meal-plan-templates/[id]/meals/[mealId]/options/[optionId] - Update option
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; mealId: string; optionId: string }> }
) {
  try {
    const { id, mealId, optionId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // If this is being set as default, remove default from other options
    if (body.isDefault) {
      await prisma.templateMealOption.updateMany({
        where: {
          templateMealId: mealId,
          isDefault: true,
          id: { not: optionId },
        },
        data: {
          isDefault: false,
        },
      })
    }

    const updateData: any = {}

    if (body.servingMultiplier !== undefined) {
      updateData.servingMultiplier = body.servingMultiplier
        ? parseFloat(body.servingMultiplier)
        : null
    }
    if (body.customName !== undefined) updateData.customName = body.customName
    if (body.customDescription !== undefined)
      updateData.customDescription = body.customDescription
    if (body.customFoodItems !== undefined)
      updateData.customFoodItems = body.customFoodItems
    if (body.calculatedProtein !== undefined)
      updateData.calculatedProtein = parseFloat(body.calculatedProtein)
    if (body.calculatedFat !== undefined)
      updateData.calculatedFat = parseFloat(body.calculatedFat)
    if (body.calculatedCarbs !== undefined)
      updateData.calculatedCarbs = parseFloat(body.calculatedCarbs)
    if (body.calculatedCalories !== undefined)
      updateData.calculatedCalories = parseFloat(body.calculatedCalories)
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault
    if (body.notes !== undefined) updateData.notes = body.notes

    const option = await prisma.templateMealOption.update({
      where: { id: optionId },
      data: updateData,
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
    })

    return NextResponse.json({ option })
  } catch (error: any) {
    console.error('Error updating meal option:', error)
    return NextResponse.json(
      {
        error: 'Failed to update meal option',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE /api/meal-plan-templates/[id]/meals/[mealId]/options/[optionId] - Delete option
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; mealId: string; optionId: string }> }
) {
  try {
    const { id, mealId, optionId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.templateMealOption.delete({
      where: { id: optionId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting meal option:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete meal option',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
