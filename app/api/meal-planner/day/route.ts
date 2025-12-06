/**
 * API: Generate day plan
 * POST /api/meal-planner/day
 *
 * Generate a complete day plan with recipes for each meal
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  planDay,
  ratiosToGrams,
  MacroTargets,
  MacroRatios,
  MealSlot,
  Recipe,
  DEFAULT_MEAL_SLOTS
} from '@/lib/meal-planner'

interface DayPlanRequest {
  // Calorie target
  calories: number

  // Macros (either grams or percentages)
  protein?: number
  carbs?: number
  fat?: number
  proteinRatio?: number
  carbsRatio?: number
  fatRatio?: number

  // Meal distribution (optional)
  mealSlots?: {
    name: string
    targetRatio: number
  }[]

  // Filters
  vegetarian?: boolean
  avoidRecipeIds?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: DayPlanRequest = await request.json()

    // Validate
    if (!body.calories || body.calories <= 0) {
      return NextResponse.json(
        { error: 'calories krävs och måste vara > 0' },
        { status: 400 }
      )
    }

    // Convert to MacroTargets
    let dayTarget: MacroTargets

    if (body.protein !== undefined && body.carbs !== undefined && body.fat !== undefined) {
      dayTarget = {
        calories: body.calories,
        protein: body.protein,
        carbs: body.carbs,
        fat: body.fat
      }
    } else if (body.proteinRatio !== undefined && body.carbsRatio !== undefined && body.fatRatio !== undefined) {
      const ratios: MacroRatios = {
        protein: body.proteinRatio,
        carbs: body.carbsRatio,
        fat: body.fatRatio
      }
      dayTarget = ratiosToGrams(body.calories, ratios)
    } else {
      // Default: 30/30/40
      dayTarget = ratiosToGrams(body.calories, { protein: 30, fat: 30, carbs: 40 })
    }

    // Meal slots
    const mealSlots: MealSlot[] = body.mealSlots || DEFAULT_MEAL_SLOTS

    // Validate that ratios sum to 1
    const ratioSum = mealSlots.reduce((sum, s) => sum + s.targetRatio, 0)
    if (Math.abs(ratioSum - 1) > 0.05) {
      return NextResponse.json(
        { error: `Måltidsfördelning summerar till ${ratioSum}, bör vara 1.0` },
        { status: 400 }
      )
    }

    // Fetch recipes
    const dbRecipes = await prisma.recipe.findMany({
      where: { published: true },
      include: {
        ingredients: {
          include: {
            foodItem: true
          }
        },
        category: true
      }
    })

    const recipes: Recipe[] = dbRecipes.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      servings: r.servings,
      calories: Number(r.caloriesPerServing) || 0,
      protein: Number(r.proteinPerServing) || 0,
      carbs: Number(r.carbsPerServing) || 0,
      fat: Number(r.fatPerServing) || 0,
      imageUrl: r.coverImage || undefined,
      published: r.published,
      categoryId: r.categoryId || undefined,
      subcategoryId: r.subcategoryId || undefined,
      ingredients: r.ingredients.map(ing => ({
        id: ing.id,
        recipeId: ing.recipeId,
        foodItemId: ing.foodItemId,
        amount: Number(ing.amount),
        displayUnit: ing.displayUnit || undefined,
        displayAmount: ing.displayAmount || undefined,
        note: ing.notes || undefined,
        foodItem: {
          id: ing.foodItem.id,
          name: ing.foodItem.name,
          calories: Number(ing.foodItem.calories) || 0,
          proteinG: Number(ing.foodItem.proteinG) || 0,
          carbsG: Number(ing.foodItem.carbsG) || 0,
          fatG: Number(ing.foodItem.fatG) || 0,
          commonServingSize: ing.foodItem.commonServingSize || '100g',
          isVegetarian: ing.foodItem.isVegetarian || false
        }
      }))
    }))

    // Generate day plan
    const plan = planDay(recipes, {
      dayTarget,
      mealSlots,
      vegetarian: body.vegetarian,
      avoidRecipeIds: body.avoidRecipeIds
    })

    // Format response
    return NextResponse.json({
      target: dayTarget,
      mealSlots,
      meals: plan.meals.map(m => ({
        slot: m.slot.name,
        recipe: {
          id: m.recipe.recipe.id,
          title: m.recipe.recipe.title,
          description: m.recipe.recipe.description,
          imageUrl: m.recipe.recipe.imageUrl,
          scaleFactor: m.recipe.scaleFactor,
          scaledServings: m.recipe.scaledServings,
          macros: m.recipe.macros,
          score: Math.round(m.recipe.score * 100) / 100
        }
      })),
      totals: plan.totals,
      deviation: {
        calories: Math.round(plan.targetDeviation.calories * 10) / 10,
        protein: Math.round(plan.targetDeviation.protein * 10) / 10,
        carbs: Math.round(plan.targetDeviation.carbs * 10) / 10,
        fat: Math.round(plan.targetDeviation.fat * 10) / 10
      },
      score: Math.round(plan.score * 100) / 100
    })

  } catch (error) {
    console.error('Day plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
