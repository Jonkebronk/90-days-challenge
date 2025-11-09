import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/meal-plan-templates/[id]/meals/[mealId]/options - Add option to meal
export async function POST(
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
    const {
      optionType,
      recipeId,
      servingMultiplier,
      customName,
      customDescription,
      customFoodItems,
      calculatedProtein,
      calculatedFat,
      calculatedCarbs,
      calculatedCalories,
      isDefault,
      notes,
    } = body

    if (!optionType || !['recipe', 'custom'].includes(optionType)) {
      return NextResponse.json(
        { error: 'Valid option type is required' },
        { status: 400 }
      )
    }

    if (optionType === 'recipe' && !recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required for recipe options' },
        { status: 400 }
      )
    }

    if (optionType === 'custom' && !customName) {
      return NextResponse.json(
        { error: 'Custom name is required for custom options' },
        { status: 400 }
      )
    }

    // Get current option count for ordering
    const existingOptions = await prisma.templateMealOption.findMany({
      where: { templateMealId: mealId },
      orderBy: { orderIndex: 'desc' },
      take: 1,
    })

    const nextOrderIndex =
      existingOptions.length > 0 ? existingOptions[0].orderIndex + 1 : 0

    // If this is set as default, remove default from other options
    if (isDefault) {
      await prisma.templateMealOption.updateMany({
        where: {
          templateMealId: mealId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const option = await prisma.templateMealOption.create({
      data: {
        templateMealId: mealId,
        optionType,
        recipeId: optionType === 'recipe' ? recipeId : null,
        servingMultiplier:
          optionType === 'recipe' && servingMultiplier
            ? parseFloat(servingMultiplier)
            : null,
        customName: optionType === 'custom' ? customName : null,
        customDescription: optionType === 'custom' ? customDescription : null,
        customFoodItems: optionType === 'custom' ? customFoodItems : null,
        calculatedProtein: parseFloat(calculatedProtein),
        calculatedFat: parseFloat(calculatedFat),
        calculatedCarbs: parseFloat(calculatedCarbs),
        calculatedCalories: parseFloat(calculatedCalories),
        isDefault: isDefault || false,
        orderIndex: nextOrderIndex,
        notes: notes || null,
      },
      include: {
        recipe: optionType === 'recipe' ? {
          select: {
            id: true,
            title: true,
            coverImage: true,
            caloriesPerServing: true,
            proteinPerServing: true,
            carbsPerServing: true,
            fatPerServing: true,
          },
        } : false,
      },
    })

    return NextResponse.json({ option })
  } catch (error: any) {
    console.error('Error creating meal option:', error)
    return NextResponse.json(
      {
        error: 'Failed to create meal option',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
