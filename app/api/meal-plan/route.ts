import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // First, check for assigned meal plan template
    const assignment = await prisma.mealPlanTemplateAssignment.findFirst({
      where: {
        userId,
        active: true
      },
      include: {
        template: {
          include: {
            meals: {
              include: {
                options: {
                  include: {
                    recipe: {
                      select: {
                        id: true,
                        title: true,
                        coverImage: true,
                        caloriesPerServing: true,
                        proteinPerServing: true,
                        carbsPerServing: true,
                        fatPerServing: true,
                      }
                    }
                  },
                  orderBy: { orderIndex: 'asc' }
                }
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    })

    // If user has an assigned template, transform it to meal plan format
    if (assignment) {
      const template = assignment.template

      // Transform template structure to match old MealPlan structure
      const transformedMealPlan = {
        id: template.id,
        name: template.name,
        totalProtein: template.targetProtein ? Number(template.targetProtein) : null,
        totalFat: template.targetFat ? Number(template.targetFat) : null,
        totalCarbs: template.targetCarbs ? Number(template.targetCarbs) : null,
        totalCalories: template.targetCalories ? Number(template.targetCalories) : null,
        preWorkoutProtein: null,
        preWorkoutFat: null,
        preWorkoutCarbs: null,
        preWorkoutCalories: null,
        postWorkoutProtein: null,
        postWorkoutFat: null,
        postWorkoutCarbs: null,
        postWorkoutCalories: null,
        // Transform template meals to old meal structure
        meals: template.meals.map((meal, index) => ({
          id: meal.id,
          mealNumber: index + 1,
          name: meal.name,
          totalProtein: meal.targetProtein ? Number(meal.targetProtein) : null,
          totalFat: meal.targetFat ? Number(meal.targetFat) : null,
          totalCarbs: meal.targetCarbs ? Number(meal.targetCarbs) : null,
          totalCalories: meal.targetCalories ? Number(meal.targetCalories) : null,
          // Include ingredient sources
          carbSource: meal.carbSource,
          proteinSource: meal.proteinSource,
          fatSource: meal.fatSource,
          // Transform options to items
          options: meal.options, // Keep full option data including recipe
          items: meal.options.map((option, optIndex) => ({
            id: option.id,
            customName: option.recipe?.title || option.customName || 'Alternativ',
            amountG: 0,
            protein: option.recipe?.proteinPerServing ? Number(option.recipe.proteinPerServing) : null,
            fat: option.recipe?.fatPerServing ? Number(option.recipe.fatPerServing) : null,
            carbs: option.recipe?.carbsPerServing ? Number(option.recipe.carbsPerServing) : null,
            calories: option.recipe?.caloriesPerServing ? Number(option.recipe.caloriesPerServing) : null,
            isSupplement: false,
            supplementBadge: null,
            notes: option.notes,
            orderIndex: optIndex,
            foodItem: null
          }))
        })),
        supplementItems: [] // Templates don't have supplements
      }

      return NextResponse.json({
        mealPlan: transformedMealPlan,
        isTemplate: true
      })
    }

    // Otherwise, fetch the old-style meal plan for the user
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { userId },
      include: {
        meals: {
          include: {
            items: {
              include: {
                foodItem: true
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          },
          orderBy: {
            mealNumber: 'asc'
          }
        },
        supplementItems: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    return NextResponse.json({ mealPlan, isTemplate: false })
  } catch (error) {
    console.error('Error fetching meal plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role?.toUpperCase()
    if (userRole !== 'COACH') {
      return NextResponse.json({ error: 'Only coaches can create meal plans' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, name, totalProtein, totalFat, totalCarbs, totalCalories, meals } = body

    // Check if user already has a meal plan
    const existing = await prisma.mealPlan.findUnique({
      where: { userId }
    })

    if (existing) {
      // Delete existing meal plan and all related data
      await prisma.mealPlan.delete({
        where: { userId }
      })
    }

    // Create new meal plan
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        name,
        totalProtein,
        totalFat,
        totalCarbs,
        totalCalories,
        meals: {
          create: meals.map((meal: any) => ({
            mealNumber: meal.mealNumber,
            name: meal.name,
            totalProtein: meal.totalProtein,
            totalFat: meal.totalFat,
            totalCarbs: meal.totalCarbs,
            totalCalories: meal.totalCalories,
            items: {
              create: meal.items.map((item: any) => ({
                customName: item.customName,
                amountG: item.amountG,
                protein: item.protein,
                fat: item.fat,
                carbs: item.carbs,
                calories: item.calories,
                orderIndex: item.orderIndex,
                isSupplement: item.isSupplement
              }))
            }
          }))
        }
      },
      include: {
        meals: {
          include: {
            items: true
          }
        }
      }
    })

    return NextResponse.json({ mealPlan })
  } catch (error) {
    console.error('Error creating meal plan:', error)
    return NextResponse.json(
      { error: 'Failed to create meal plan' },
      { status: 500 }
    )
  }
}
