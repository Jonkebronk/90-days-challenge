import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recipes - Get all recipes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const published = searchParams.get('published')
    const mealType = searchParams.get('mealType')
    const difficulty = searchParams.get('difficulty')

    const where: any = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (published !== null && published !== undefined) {
      where.published = published === 'true'
    }

    if (mealType) {
      where.mealType = mealType
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    // Clients can only see published recipes
    if ((session.user as any).role !== 'coach') {
      where.published = true
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        category: true,
        subcategory: true,
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
        },
        _count: {
          select: { favorites: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

// POST /api/recipes - Create new recipe
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      categoryId,
      subcategoryId,
      servings,
      prepTimeMinutes,
      cookTimeMinutes,
      difficulty,
      cuisineType,
      mealType,
      coverImage,
      videoUrl,
      dietaryTags,
      published
    } = body

    if (!title || !categoryId) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      )
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description: description || null,
        categoryId,
        subcategoryId: subcategoryId || null,
        servings: servings || 1,
        prepTimeMinutes: prepTimeMinutes || null,
        cookTimeMinutes: cookTimeMinutes || null,
        difficulty: difficulty || null,
        cuisineType: cuisineType || null,
        mealType: mealType || null,
        coverImage: coverImage || null,
        videoUrl: videoUrl || null,
        dietaryTags: dietaryTags || [],
        published: published || false,
        publishedAt: published ? new Date() : null
      },
      include: {
        category: true,
        subcategory: true
      }
    })

    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
  }
}
