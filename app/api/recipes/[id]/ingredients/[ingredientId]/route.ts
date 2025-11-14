import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/recipes/[id]/ingredients/[ingredientId] - Update ingredient
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ingredientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ingredientId } = await params
    const body = await request.json()

    const {
      foodItemId,
      amount,
      displayUnit,
      displayAmount,
      optional,
      notes,
    } = body

    const ingredient = await prisma.recipeIngredient.update({
      where: { id: ingredientId },
      data: {
        ...(foodItemId && { foodItemId }),
        ...(amount !== undefined && { amount }),
        ...(displayUnit !== undefined && { displayUnit }),
        ...(displayAmount !== undefined && { displayAmount }),
        ...(optional !== undefined && { optional }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        foodItem: true,
      },
    })

    return NextResponse.json({ ingredient })
  } catch (error) {
    console.error('Error updating ingredient:', error)
    return NextResponse.json(
      { error: 'Failed to update ingredient' },
      { status: 500 }
    )
  }
}

// DELETE /api/recipes/[id]/ingredients/[ingredientId] - Delete ingredient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ingredientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ingredientId } = await params

    await prisma.recipeIngredient.delete({
      where: { id: ingredientId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    return NextResponse.json(
      { error: 'Failed to delete ingredient' },
      { status: 500 }
    )
  }
}
