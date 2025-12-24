import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { aggregateIngredients, type MealPlanData } from '@/lib/shopping-list'

// POST /api/shopping-lists/generate-from-meal-plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      smartMealPlanId,
      name,
      includeRecurring = true,
      color = '#10B981', // Green for meal-plan generated lists
    } = body

    if (!smartMealPlanId) {
      return NextResponse.json(
        { error: 'smartMealPlanId is required' },
        { status: 400 }
      )
    }

    // Fetch the meal plan with all nested data
    const mealPlan = await prisma.smartMealPlan.findUnique({
      where: { id: smartMealPlanId },
      include: {
        days: {
          include: {
            meals: {
              include: {
                recipe: {
                  include: {
                    ingredients: {
                      include: {
                        foodItem: {
                          include: {
                            foodCategory: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { dayNumber: 'asc' },
        },
      },
    })

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      )
    }

    // Check permission
    if (mealPlan.userId !== session.user.id && mealPlan.coachId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to access this meal plan' },
        { status: 403 }
      )
    }

    // Transform to the expected format
    const mealPlanData: MealPlanData = {
      id: mealPlan.id,
      name: mealPlan.name,
      days: mealPlan.days.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        meals: day.meals.map((meal) => ({
          id: meal.id,
          slot: meal.slot,
          scaleFactor: meal.scaleFactor,
          scaledServings: meal.scaledServings,
          recipe: {
            id: meal.recipe.id,
            title: meal.recipe.title,
            servings: meal.recipe.servings,
            ingredients: meal.recipe.ingredients.map((ing) => ({
              id: ing.id,
              foodItemId: ing.foodItemId,
              amount: ing.amount,
              displayUnit: ing.displayUnit,
              displayAmount: ing.displayAmount,
              notes: ing.notes,
              foodItem: {
                id: ing.foodItem.id,
                name: ing.foodItem.name,
                calories: ing.foodItem.calories ? Number(ing.foodItem.calories) : null,
                proteinG: ing.foodItem.proteinG ? Number(ing.foodItem.proteinG) : null,
                carbsG: ing.foodItem.carbsG ? Number(ing.foodItem.carbsG) : null,
                fatG: ing.foodItem.fatG ? Number(ing.foodItem.fatG) : null,
                macroCategory: ing.foodItem.macroCategory,
                subCategory: ing.foodItem.subcategory,
                foodCategory: ing.foodItem.foodCategory,
              },
            })),
          },
        })),
      })),
    }

    // Aggregate ingredients
    const aggregatedIngredients = aggregateIngredients(mealPlanData)

    // Generate list name
    const listName = name || `Veckohandling - ${mealPlan.name}`

    // Create shopping list with items
    const shoppingList = await prisma.shoppingList.create({
      data: {
        name: listName,
        userId: session.user.id,
        createdBy: session.user.id,
        color,
        smartMealPlanId: mealPlan.id,
        weekStartDate: mealPlan.startDate,
        weekEndDate: mealPlan.endDate,
        items: {
          create: aggregatedIngredients.map((ing, idx) => ({
            foodItemId: ing.foodItemId,
            quantity: ing.totalGrams,
            unit: 'g',
            category: ing.category,
            source: 'meal_plan',
            orderIndex: idx,
            notes: ing.meals.length > 1
              ? `Används i ${ing.recipeCount} recept`
              : null,
          })),
        },
      },
      include: {
        items: {
          include: {
            foodItem: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { items: true },
        },
      },
    })

    // Add recurring items if requested
    if (includeRecurring) {
      const recurringItems = await prisma.recurringItem.findMany({
        where: {
          userId: session.user.id,
          isActive: true,
        },
      })

      if (recurringItems.length > 0) {
        const recurringToAdd = recurringItems.map((item, idx) => ({
          listId: shoppingList.id,
          foodItemId: item.foodItemId,
          customName: item.customName,
          icaProductId: item.icaProductId,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          source: 'recurring',
          orderIndex: aggregatedIngredients.length + idx,
        }))

        await prisma.shoppingListItem.createMany({
          data: recurringToAdd,
        })
      }
    }

    // Fetch the complete list with all items
    const completeList = await prisma.shoppingList.findUnique({
      where: { id: shoppingList.id },
      include: {
        items: {
          include: {
            foodItem: true,
          },
          orderBy: [
            { category: 'asc' },
            { orderIndex: 'asc' },
          ],
        },
        _count: {
          select: { items: true },
        },
      },
    })

    return NextResponse.json({
      list: completeList,
      ingredientCount: aggregatedIngredients.length,
      mealPlanName: mealPlan.name,
    })
  } catch (error) {
    console.error('Error generating shopping list from meal plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate shopping list' },
      { status: 500 }
    )
  }
}
