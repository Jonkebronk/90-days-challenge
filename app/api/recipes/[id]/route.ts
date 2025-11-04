import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recipes/[id] - Get single recipe
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        category: true,
        ingredients: {
          include: {
            foodItem: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        instructions: {
          orderBy: { stepNumber: 'asc' }
        },
        favorites: {
          where: { userId: session.user.id as string }
        }
      }
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Clients can only view published recipes
    if ((session.user as any).role !== 'coach' && !recipe.published) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 })
  }
}

// PATCH /api/recipes/[id] - Update recipe
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.servings !== undefined) updateData.servings = body.servings
    if (body.prepTimeMinutes !== undefined) updateData.prepTimeMinutes = body.prepTimeMinutes
    if (body.cookTimeMinutes !== undefined) updateData.cookTimeMinutes = body.cookTimeMinutes
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty
    if (body.cuisineType !== undefined) updateData.cuisineType = body.cuisineType
    if (body.mealType !== undefined) updateData.mealType = body.mealType
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl
    if (body.dietaryTags !== undefined) updateData.dietaryTags = body.dietaryTags
    if (body.caloriesPerServing !== undefined) updateData.caloriesPerServing = body.caloriesPerServing
    if (body.proteinPerServing !== undefined) updateData.proteinPerServing = body.proteinPerServing
    if (body.carbsPerServing !== undefined) updateData.carbsPerServing = body.carbsPerServing
    if (body.fatPerServing !== undefined) updateData.fatPerServing = body.fatPerServing

    if (body.published !== undefined) {
      updateData.published = body.published
      const currentRecipe = await prisma.recipe.findUnique({
        where: { id },
        select: { published: true, publishedAt: true }
      })
      if (body.published && !currentRecipe?.published && !currentRecipe?.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        ingredients: {
          include: {
            foodItem: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        instructions: {
          orderBy: { stepNumber: 'asc' }
        }
      }
    })

    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Error updating recipe:', error)
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
  }
}

// DELETE /api/recipes/[id] - Delete recipe
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.recipe.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recipe:', error)
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
  }
}
