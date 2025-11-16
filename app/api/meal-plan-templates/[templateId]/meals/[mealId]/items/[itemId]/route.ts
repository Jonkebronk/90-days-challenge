import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/meal-plan-templates/[templateId]/meals/[mealId]/items/[itemId] - Update ingredient
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string; mealId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
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

    const item = await prisma.templateMealItem.update({
      where: { id: itemId },
      data: {
        ...(name !== undefined && { name }),
        ...(amount !== undefined && { amount }),
        ...(protein !== undefined && { protein }),
        ...(fat !== undefined && { fat }),
        ...(carbs !== undefined && { carbs }),
        ...(calories !== undefined && { calories }),
      },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating meal item:', error)
    return NextResponse.json({ error: 'Failed to update meal item' }, { status: 500 })
  }
}

// DELETE /api/meal-plan-templates/[templateId]/meals/[mealId]/items/[itemId] - Delete ingredient
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string; mealId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
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

    await prisma.templateMealItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting meal item:', error)
    return NextResponse.json({ error: 'Failed to delete meal item' }, { status: 500 })
  }
}
