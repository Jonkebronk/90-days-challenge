import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateRecipeNutrition } from '@/lib/calculations/recipe-nutrition'

// POST /api/recipes/[id]/calculate-nutrition - Auto-calculate recipe nutrition
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: recipeId } = await params

    // Fetch recipe with ingredients and food items
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            foodItem: true,
          },
        },
      },
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    if (recipe.ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Recipe has no ingredients' },
        { status: 400 }
      )
    }

    // Calculate nutrition
    const nutrition = calculateRecipeNutrition(
      recipe.ingredients as any,
      recipe.servings
    )

    // Update recipe with calculated nutrition
    const updated = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        caloriesPerServing: nutrition.caloriesPerServing,
        proteinPerServing: nutrition.proteinPerServing,
        carbsPerServing: nutrition.carbsPerServing,
        fatPerServing: nutrition.fatPerServing,
      },
    })

    return NextResponse.json({ nutrition, recipe: updated })
  } catch (error) {
    console.error('Error calculating nutrition:', error)
    return NextResponse.json(
      { error: 'Failed to calculate nutrition' },
      { status: 500 }
    )
  }
}
