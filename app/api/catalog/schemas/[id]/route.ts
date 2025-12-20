import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/catalog/schemas/[id] - Get a single schema with all details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const schema = await prisma.catalogSchema.findUnique({
      where: { id },
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

    if (!schema) {
      return NextResponse.json(
        { error: 'Schemat hittades inte' },
        { status: 404 }
      )
    }

    return NextResponse.json({ schema })
  } catch (error) {
    console.error('Error fetching catalog schema:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalog schema' },
      { status: 500 }
    )
  }
}

// PUT /api/catalog/schemas/[id] - Update a schema
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Update schema with meals and foods in a transaction
    const schema = await prisma.$transaction(async (tx) => {
      // Update the schema
      const updatedSchema = await tx.catalogSchema.update({
        where: { id },
        data: {
          categoryId: body.categoryId,
          name: body.name?.trim(),
          description: body.description?.trim() || null,
          calorieLevel: body.calorieLevel,
          totalProtein: body.totalProtein,
          totalCarbs: body.totalCarbs,
          totalFat: body.totalFat,
          totalKcal: body.totalKcal,
          isActive: body.isActive,
          orderIndex: body.orderIndex,
        },
      })

      // If meals are provided, delete existing and recreate
      if (body.meals && Array.isArray(body.meals)) {
        // Delete existing meals (cascade deletes foods)
        await tx.catalogMeal.deleteMany({
          where: { schemaId: id },
        })

        // Create new meals
        for (let mealIndex = 0; mealIndex < body.meals.length; mealIndex++) {
          const meal = body.meals[mealIndex]
          const newMeal = await tx.catalogMeal.create({
            data: {
              schemaId: id,
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

      return updatedSchema
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

    return NextResponse.json({ schema: completeSchema })
  } catch (error) {
    console.error('Error updating catalog schema:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod när schemat skulle uppdateras' },
      { status: 500 }
    )
  }
}

// DELETE /api/catalog/schemas/[id] - Delete a schema
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const schema = await prisma.catalogSchema.findUnique({
      where: { id },
    })

    if (!schema) {
      return NextResponse.json(
        { error: 'Schemat hittades inte' },
        { status: 404 }
      )
    }

    // Delete will cascade to meals and foods
    await prisma.catalogSchema.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting catalog schema:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod när schemat skulle tas bort' },
      { status: 500 }
    )
  }
}
