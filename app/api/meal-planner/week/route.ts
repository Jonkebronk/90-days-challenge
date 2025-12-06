/**
 * API: Generate week plan
 * POST /api/meal-planner/week
 *
 * Generate a complete week plan with variety
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  planWeek,
  ratiosToGrams,
  MacroTargets,
  MacroRatios,
  Recipe
} from '@/lib/meal-planner'

interface WeekPlanRequest {
  // Daily calorie target
  dailyCalories: number

  // Macros
  protein?: number
  carbs?: number
  fat?: number
  proteinRatio?: number
  carbsRatio?: number
  fatRatio?: number

  // Options
  vegetarian?: boolean
  allowRepeat?: boolean // Allow same recipe multiple times
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: WeekPlanRequest = await request.json()

    if (!body.dailyCalories || body.dailyCalories <= 0) {
      return NextResponse.json(
        { error: 'dailyCalories krävs och måste vara > 0' },
        { status: 400 }
      )
    }

    // Convert to MacroTargets
    let dailyTarget: MacroTargets

    if (body.protein !== undefined && body.carbs !== undefined && body.fat !== undefined) {
      dailyTarget = {
        calories: body.dailyCalories,
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
      dailyTarget = ratiosToGrams(body.dailyCalories, ratios)
    } else {
      dailyTarget = ratiosToGrams(body.dailyCalories, { protein: 30, fat: 30, carbs: 40 })
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

    // Generate week plan
    const weekPlan = planWeek(recipes, dailyTarget, {
      vegetarian: body.vegetarian,
      allowRepeat: body.allowRepeat ?? true
    })

    // Format response
    return NextResponse.json({
      dailyTarget,
      days: weekPlan.days.map(day => ({
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        meals: day.plan.meals.map(m => ({
          slot: m.slot.name,
          recipe: {
            id: m.recipe.recipe.id,
            title: m.recipe.recipe.title,
            imageUrl: m.recipe.recipe.imageUrl,
            scaleFactor: m.recipe.scaleFactor,
            scaledServings: m.recipe.scaledServings,
            macros: m.recipe.macros
          }
        })),
        totals: day.plan.totals,
        deviation: {
          calories: Math.round(day.plan.targetDeviation.calories * 10) / 10,
          protein: Math.round(day.plan.targetDeviation.protein * 10) / 10,
          carbs: Math.round(day.plan.targetDeviation.carbs * 10) / 10,
          fat: Math.round(day.plan.targetDeviation.fat * 10) / 10
        },
        score: Math.round(day.plan.score * 100) / 100
      })),
      weeklyTotals: weekPlan.weeklyTotals,
      weeklyTarget: {
        calories: dailyTarget.calories * 7,
        protein: dailyTarget.protein * 7,
        carbs: dailyTarget.carbs * 7,
        fat: dailyTarget.fat * 7
      },
      averageScore: Math.round(weekPlan.averageScore * 100) / 100
    })

  } catch (error) {
    console.error('Week plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
