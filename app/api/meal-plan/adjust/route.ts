import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/meal-plan/adjust - Update meal plan macros/settings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      weight,
      activityLevel,
      goal,
      proteinPerKg,
      fatPerKg,
      mealsPerDay,
      targetCalories,
      proteinGrams,
      fatGrams,
      carbGrams,
    } = body

    // Validate required fields
    if (!targetCalories || !proteinGrams || !fatGrams || !carbGrams) {
      return NextResponse.json({ error: 'Missing required macro values' }, { status: 400 })
    }

    const userId = session.user.id

    // Find the user's active meal plan
    let mealPlan = await prisma.mealPlan.findUnique({
      where: { userId },
      include: { dailyTargets: true }
    })

    if (!mealPlan) {
      // Create a new meal plan if none exists
      mealPlan = await prisma.mealPlan.create({
        data: {
          userId,
          name: 'Min kostplan',
          totalCalories: targetCalories,
          totalProtein: proteinGrams,
          totalFat: fatGrams,
          totalCarbs: carbGrams,
          active: true,
        },
        include: { dailyTargets: true }
      })
    }

    // Update the meal plan totals
    await prisma.mealPlan.update({
      where: { id: mealPlan.id },
      data: {
        totalCalories: targetCalories,
        totalProtein: proteinGrams,
        totalFat: fatGrams,
        totalCarbs: carbGrams,
      }
    })

    // Update daily targets for all days of the week (0-6)
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      await prisma.dailyMacroTarget.upsert({
        where: {
          mealPlanId_dayOfWeek: {
            mealPlanId: mealPlan.id,
            dayOfWeek,
          }
        },
        create: {
          mealPlanId: mealPlan.id,
          dayOfWeek,
          calories: targetCalories,
          protein: proteinGrams,
          fat: fatGrams,
          carbs: carbGrams,
        },
        update: {
          calories: targetCalories,
          protein: proteinGrams,
          fat: fatGrams,
          carbs: carbGrams,
        }
      })
    }

    // Store the settings metadata (optional - for future reference)
    // This could be stored in a separate table or as JSON in the meal plan
    // For now, we just update the macros

    return NextResponse.json({
      success: true,
      mealPlan: {
        id: mealPlan.id,
        totalCalories: targetCalories,
        totalProtein: proteinGrams,
        totalFat: fatGrams,
        totalCarbs: carbGrams,
      },
      settings: {
        weight,
        activityLevel,
        goal,
        proteinPerKg,
        fatPerKg,
        mealsPerDay,
      }
    })
  } catch (error) {
    console.error('Error adjusting meal plan:', error)
    return NextResponse.json({ error: 'Failed to adjust meal plan' }, { status: 500 })
  }
}
