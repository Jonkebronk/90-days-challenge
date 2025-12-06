/**
 * API: Find matching recipes
 * POST /api/meal-planner/match
 *
 * Find recipes that match the user's macro targets
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  findMatchingRecipes,
  ratiosToGrams,
  MacroTargets,
  MacroRatios,
  Recipe
} from '@/lib/meal-planner'

interface MatchRequest {
  // Either specific grams...
  calories?: number
  protein?: number
  carbs?: number
  fat?: number

  // ...or percentage distribution
  proteinRatio?: number
  carbsRatio?: number
  fatRatio?: number

  // Filters
  limit?: number
  categoryId?: string
  vegetarian?: boolean
  allowScaling?: boolean
  minScore?: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: MatchRequest = await request.json()

    // Validate input
    if (!body.calories || body.calories <= 0) {
      return NextResponse.json(
        { error: 'calories krävs och måste vara > 0' },
        { status: 400 }
      )
    }

    // Convert to MacroTargets
    let target: MacroTargets

    if (body.protein !== undefined && body.carbs !== undefined && body.fat !== undefined) {
      // Specific grams provided
      target = {
        calories: body.calories,
        protein: body.protein,
        carbs: body.carbs,
        fat: body.fat
      }
    } else if (body.proteinRatio !== undefined && body.carbsRatio !== undefined && body.fatRatio !== undefined) {
      // Percentage distribution provided
      const ratios: MacroRatios = {
        protein: body.proteinRatio,
        carbs: body.carbsRatio,
        fat: body.fatRatio
      }

      // Validate sum is ~100%
      const sum = ratios.protein + ratios.carbs + ratios.fat
      if (Math.abs(sum - 100) > 5) {
        return NextResponse.json(
          { error: `Makrofördelning summerar till ${sum}%, bör vara 100%` },
          { status: 400 }
        )
      }

      target = ratiosToGrams(body.calories, ratios)
    } else {
      // Default: 30/30/40 (P/F/C)
      target = ratiosToGrams(body.calories, { protein: 30, fat: 30, carbs: 40 })
    }

    // Fetch recipes from database
    const dbRecipes = await prisma.recipe.findMany({
      where: {
        published: true,
        ...(body.categoryId && { categoryId: body.categoryId })
      },
      include: {
        ingredients: {
          include: {
            foodItem: true
          }
        },
        category: true,
        subcategory: true
      }
    })

    // Convert to our format (map from caloriesPerServing to calories etc.)
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

    // Find matching recipes
    const matches = findMatchingRecipes(recipes, {
      target,
      limit: body.limit || 10,
      vegetarian: body.vegetarian,
      categoryId: body.categoryId,
      allowScaling: body.allowScaling ?? true,
      minScore: body.minScore || 0.5
    })

    return NextResponse.json({
      target,
      matches: matches.map(m => ({
        recipe: {
          id: m.recipe.id,
          title: m.recipe.title,
          description: m.recipe.description,
          imageUrl: m.recipe.imageUrl,
          originalServings: m.recipe.servings,
          originalMacros: {
            calories: m.recipe.calories,
            protein: m.recipe.protein,
            carbs: m.recipe.carbs,
            fat: m.recipe.fat
          }
        },
        scaleFactor: m.scaleFactor,
        scaledServings: m.scaledServings,
        scaledMacros: m.macros,
        score: Math.round(m.score * 100) / 100,
        deviation: {
          calories: Math.round(m.deviation.calories * 10) / 10,
          protein: Math.round(m.deviation.protein * 10) / 10,
          carbs: Math.round(m.deviation.carbs * 10) / 10,
          fat: Math.round(m.deviation.fat * 10) / 10
        }
      })),
      count: matches.length
    })

  } catch (error) {
    console.error('Match recipes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
