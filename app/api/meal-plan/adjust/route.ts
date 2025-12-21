import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateDefaultMealConfigs } from '@/lib/types/meal-plan-generator'
import { distributeMacros } from '@/lib/calculations/meal-plan-generator'

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
      nutritionPlanId, // New: to update GeneratedMealPlan
      mealDistribution, // New: wizard's calculated per-meal distribution
      mealNames, // New: custom meal names from wizard
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

    // If nutritionPlanId is provided, also update the GeneratedMealPlan
    let generatedMealPlan = null
    if (nutritionPlanId && mealsPerDay) {
      // Find existing GeneratedMealPlan
      generatedMealPlan = await prisma.generatedMealPlan.findFirst({
        where: { nutritionPlanId }
      })

      if (generatedMealPlan) {
        // Generate new mealConfigs based on mealsPerDay
        const newMealConfigs = generateDefaultMealConfigs(mealsPerDay)

        // Total target macros
        const targetMacros = {
          protein: proteinGrams,
          carbs: carbGrams,
          fat: fatGrams,
          kcal: targetCalories,
        }

        // Get existing meals
        const existingMeals = generatedMealPlan.meals as any[] || []
        const newMeals: any[] = []

        // Use wizard's distribution if provided, otherwise fall back to auto distribution
        const hasWizardDistribution = mealDistribution && Array.isArray(mealDistribution) && mealDistribution.length === mealsPerDay

        for (let i = 0; i < mealsPerDay; i++) {
          // Get meal target from wizard distribution or fall back to auto
          let mealTarget: { protein: number; carbs: number; fat: number; kcal: number }
          let mealName: string

          if (hasWizardDistribution) {
            const wizardMeal = mealDistribution[i]
            mealTarget = {
              protein: wizardMeal.protein,
              carbs: wizardMeal.carbs,
              fat: wizardMeal.fat,
              kcal: wizardMeal.protein * 4 + wizardMeal.carbs * 4 + wizardMeal.fat * 9,
            }
            mealName = mealNames?.[i] || wizardMeal.name || newMealConfigs[i]?.type || `meal_${i}`
          } else {
            // Fallback to auto distribution
            const distribution = distributeMacros(targetMacros, newMealConfigs, 'auto')
            mealTarget = distribution.get(i) || { protein: 0, carbs: 0, fat: 0, kcal: 0 }
            mealName = newMealConfigs[i]?.type || `meal_${i}`
          }

          // Convert meal name to type format (lowercase, no spaces)
          const mealType = mealName.toLowerCase().replace(/\s+/g, '_').replace(/[åä]/g, 'a').replace(/ö/g, 'o')

          if (i < existingMeals.length) {
            // Update existing meal with new targetMacros and name
            newMeals.push({
              ...existingMeals[i],
              type: mealType,
              customName: mealName, // Store the custom display name
              targetMacros: mealTarget,
            })
          } else {
            // Create new empty meal
            const isMainMeal = mealType.includes('lunch') || mealType.includes('middag')
            newMeals.push({
              type: mealType,
              customName: mealName,
              index: i,
              items: [],
              vegetableGrams: isMainMeal ? 200 : 0,
              totalMacros: { protein: 0, carbs: 0, fat: 0, kcal: 0 },
              targetMacros: mealTarget,
            })
          }
        }

        // Update mealConfigs with custom names
        const updatedMealConfigs = newMealConfigs.map((config, i) => ({
          ...config,
          displayName: mealNames?.[i] || config.type,
        }))

        // Update GeneratedMealPlan
        await prisma.generatedMealPlan.update({
          where: { id: generatedMealPlan.id },
          data: {
            mealConfigs: JSON.parse(JSON.stringify(updatedMealConfigs)),
            meals: JSON.parse(JSON.stringify(newMeals)),
            targetMacros: JSON.parse(JSON.stringify(targetMacros)),
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      mealPlan: {
        id: mealPlan.id,
        totalCalories: targetCalories,
        totalProtein: proteinGrams,
        totalFat: fatGrams,
        totalCarbs: carbGrams,
      },
      generatedMealPlanUpdated: !!generatedMealPlan,
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
