import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CATALOG_CATEGORIES, CATALOG_SCHEMAS } from '@/lib/kostschema/catalog'

// POST /api/catalog/seed - Seed the database with predefined schemas (coach only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if data already exists
    const existingCategories = await prisma.catalogCategory.count()
    if (existingCategories > 0) {
      return NextResponse.json(
        { error: 'Katalogen innehåller redan data. Radera befintliga kategorier först.' },
        { status: 400 }
      )
    }

    // Create categories first
    const categoryIdMap: Record<string, string> = {}

    for (let i = 0; i < CATALOG_CATEGORIES.length; i++) {
      const cat = CATALOG_CATEGORIES[i]
      const created = await prisma.catalogCategory.create({
        data: {
          name: cat.name,
          description: cat.description || null,
          icon: cat.icon || null,
          orderIndex: i,
        },
      })
      categoryIdMap[cat.id] = created.id
    }

    // Create schemas with meals and foods
    let schemaCount = 0
    let mealCount = 0
    let foodCount = 0

    for (const schema of CATALOG_SCHEMAS) {
      const dbCategoryId = categoryIdMap[schema.categoryId]

      if (!dbCategoryId) {
        console.warn(`Skipping schema ${schema.id}: category ${schema.categoryId} not found`)
        continue
      }

      const createdSchema = await prisma.catalogSchema.create({
        data: {
          categoryId: dbCategoryId,
          name: schema.name,
          description: schema.description || null,
          calorieLevel: schema.calorieLevel,
          totalProtein: schema.totals.protein,
          totalCarbs: schema.totals.carbs,
          totalFat: schema.totals.fat,
          totalKcal: schema.totals.kcal,
          isActive: true,
          orderIndex: schemaCount,
        },
      })
      schemaCount++

      // Create meals
      for (let mealIndex = 0; mealIndex < schema.meals.length; mealIndex++) {
        const meal = schema.meals[mealIndex]
        const createdMeal = await prisma.catalogMeal.create({
          data: {
            schemaId: createdSchema.id,
            name: meal.name,
            time: meal.time,
            totalProtein: meal.totalProtein,
            totalCarbs: meal.totalCarbs,
            totalFat: meal.totalFat,
            totalKcal: meal.totalKcal,
            orderIndex: mealIndex,
          },
        })
        mealCount++

        // Create foods
        for (let foodIndex = 0; foodIndex < meal.foods.length; foodIndex++) {
          const food = meal.foods[foodIndex]
          await prisma.catalogFood.create({
            data: {
              mealId: createdMeal.id,
              name: food.name,
              amountG: food.amountG,
              category: food.category,
              protein: Math.round(food.protein),
              carbs: Math.round(food.carbs),
              fat: Math.round(food.fat),
              kcal: Math.round(food.kcal),
              orderIndex: foodIndex,
            },
          })
          foodCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importerade ${CATALOG_CATEGORIES.length} kategorier, ${schemaCount} scheman, ${mealCount} måltider och ${foodCount} livsmedel`,
      stats: {
        categories: CATALOG_CATEGORIES.length,
        schemas: schemaCount,
        meals: mealCount,
        foods: foodCount,
      },
    })
  } catch (error) {
    console.error('Error seeding catalog:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod när katalogen skulle fyllas' },
      { status: 500 }
    )
  }
}
