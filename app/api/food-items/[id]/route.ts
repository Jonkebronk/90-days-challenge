import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/food-items/[id] - Get single food item
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const foodItem = await prisma.foodItem.findUnique({
      where: { id },
      include: {
        foodCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
      },
    })

    if (!foodItem) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 })
    }

    // Check if user is coach - clients can only see approved items
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'coach' && !foodItem.isApproved) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 })
    }

    return NextResponse.json({ item: foodItem })
  } catch (error) {
    console.error('Error fetching food item:', error)
    return NextResponse.json({ error: 'Failed to fetch food item' }, { status: 500 })
  }
}

// PATCH /api/food-items/[id] - Update food item (coach only)
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
    const {
      name,
      categoryId,
      calories,
      proteinG,
      carbsG,
      fatG,
      commonServingSize,
      isVegetarian,
      isVegan,
      isRecommended,
      notes,
    } = body

    // Check if food item exists
    const existing = await prisma.foodItem.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 })
    }

    const foodItem = await prisma.foodItem.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        calories: calories !== undefined ? parseFloat(calories.toString()) : undefined,
        proteinG: proteinG !== undefined ? parseFloat(proteinG.toString()) : undefined,
        carbsG: carbsG !== undefined ? parseFloat(carbsG.toString()) : undefined,
        fatG: fatG !== undefined ? parseFloat(fatG.toString()) : undefined,
        commonServingSize: commonServingSize !== undefined ? commonServingSize : undefined,
        isVegetarian: isVegetarian !== undefined ? isVegetarian : undefined,
        isVegan: isVegan !== undefined ? isVegan : undefined,
        isRecommended: isRecommended !== undefined ? isRecommended : undefined,
        notes: notes !== undefined ? (notes || null) : undefined,
      },
      include: {
        foodCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
      },
    })

    return NextResponse.json({ item: foodItem })
  } catch (error) {
    console.error('Error updating food item:', error)
    return NextResponse.json({ error: 'Failed to update food item' }, { status: 500 })
  }
}

// DELETE /api/food-items/[id] - Delete food item (coach only)
export async function DELETE(
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

    // Check if food item exists
    const existing = await prisma.foodItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            mealIngredients: true,
            recipeIngredients: true,
            mealPlanItems: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 })
    }

    // Check if food item is used in any meals, recipes, or meal plans
    const totalUsage =
      existing._count.mealIngredients +
      existing._count.recipeIngredients +
      existing._count.mealPlanItems

    if (totalUsage > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete food item that is used in ${totalUsage} meals/recipes. Please remove it from those first.`,
        },
        { status: 400 }
      )
    }

    await prisma.foodItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Food item deleted successfully' })
  } catch (error) {
    console.error('Error deleting food item:', error)
    return NextResponse.json({ error: 'Failed to delete food item' }, { status: 500 })
  }
}
