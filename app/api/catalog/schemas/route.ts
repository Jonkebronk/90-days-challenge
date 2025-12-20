import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/catalog/schemas - Get all catalog schemas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const schemas = await prisma.catalogSchema.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(!includeInactive && { isActive: true }),
      },
      orderBy: [
        { category: { orderIndex: 'asc' } },
        { calorieLevel: 'asc' },
      ],
      include: {
        category: {
          select: { id: true, name: true },
        },
        _count: {
          select: { meals: true },
        },
      },
    })

    return NextResponse.json({ schemas })
  } catch (error) {
    console.error('Error fetching catalog schemas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalog schemas' },
      { status: 500 }
    )
  }
}

// POST /api/catalog/schemas - Create new catalog schema
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'Kategori är obligatoriskt' },
        { status: 400 }
      )
    }

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Schemanamn är obligatoriskt' },
        { status: 400 }
      )
    }

    if (!body.calorieLevel || body.calorieLevel < 1000) {
      return NextResponse.json(
        { error: 'Kalorinivå måste vara minst 1000 kcal' },
        { status: 400 }
      )
    }

    // Create schema with meals and foods in a transaction
    const schema = await prisma.$transaction(async (tx) => {
      // Create the schema
      const newSchema = await tx.catalogSchema.create({
        data: {
          categoryId: body.categoryId,
          name: body.name.trim(),
          description: body.description?.trim() || null,
          calorieLevel: body.calorieLevel,
          totalProtein: body.totalProtein || 0,
          totalCarbs: body.totalCarbs || 0,
          totalFat: body.totalFat || 0,
          totalKcal: body.totalKcal || body.calorieLevel,
          isActive: body.isActive ?? true,
          orderIndex: body.orderIndex ?? 0,
        },
      })

      // Create meals if provided
      if (body.meals && Array.isArray(body.meals)) {
        for (let mealIndex = 0; mealIndex < body.meals.length; mealIndex++) {
          const meal = body.meals[mealIndex]
          const newMeal = await tx.catalogMeal.create({
            data: {
              schemaId: newSchema.id,
              name: meal.name,
              time: meal.time || '12:00',
              totalProtein: meal.totalProtein || 0,
              totalCarbs: meal.totalCarbs || 0,
              totalFat: meal.totalFat || 0,
              totalKcal: meal.totalKcal || 0,
              orderIndex: mealIndex,
            },
          })

          // Create foods for this meal
          if (meal.foods && Array.isArray(meal.foods)) {
            for (let foodIndex = 0; foodIndex < meal.foods.length; foodIndex++) {
              const food = meal.foods[foodIndex]
              await tx.catalogFood.create({
                data: {
                  mealId: newMeal.id,
                  name: food.name,
                  amountG: food.amountG || 0,
                  category: food.category || 'protein',
                  protein: food.protein || 0,
                  carbs: food.carbs || 0,
                  fat: food.fat || 0,
                  kcal: food.kcal || 0,
                  orderIndex: foodIndex,
                },
              })
            }
          }
        }
      }

      return newSchema
    })

    // Fetch the complete schema with relations
    const completeSchema = await prisma.catalogSchema.findUnique({
      where: { id: schema.id },
      include: {
        category: true,
        meals: {
          orderBy: { orderIndex: 'asc' },
          include: {
            foods: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    })

    return NextResponse.json({ schema: completeSchema }, { status: 201 })
  } catch (error) {
    console.error('Error creating catalog schema:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod när schemat skulle skapas' },
      { status: 500 }
    )
  }
}
