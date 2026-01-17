import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch the current user's nutrition plan (for clients)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Find the most recent active nutrition plan for this user (client)
    let nutritionPlan = await prisma.clientNutritionPlan.findFirst({
      where: {
        clientId: userId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        dailyCalorieTarget: true,
        proteinGrams: true,
        fatGrams: true,
        carbGrams: true,
        mealsPerDay: true,
        workoutTime: true,
        nutritionSystem: true,
      },
    })

    // Auto-create a nutrition plan with default values if none exists
    if (!nutritionPlan) {
      // Get user info for defaults
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { coachId: true, currentWeight: true },
      })

      // Default values for a starting plan
      const defaultWeight = user?.currentWeight ? Number(user.currentWeight) : 70
      const defaultCalories = 2000
      const defaultProtein = Math.round(defaultWeight * 2) // 2g per kg
      const defaultFat = Math.round(defaultWeight * 0.8) // 0.8g per kg
      const defaultCarbs = Math.round((defaultCalories - defaultProtein * 4 - defaultFat * 9) / 4)

      const newPlan = await prisma.clientNutritionPlan.create({
        data: {
          clientId: userId,
          coachId: user?.coachId || userId, // Use coach if available, otherwise self
          name: 'Min kostplan',
          status: 'ACTIVE',
          calculationMethod: 'metabolism',
          weight: defaultWeight,
          height: 170, // Default
          age: 30, // Default
          gender: 'male', // Default
          lifestyleActivity: 'moderately_active',
          exerciseActivity: 'moderate',
          lifestyleFactor: 1.55,
          exerciseFactor: 0.2,
          bmr: defaultCalories * 0.7, // Rough estimate
          tdee: defaultCalories,
          dailyCalorieTarget: defaultCalories,
          proteinPerKg: 2,
          proteinGrams: defaultProtein,
          fatPerKg: 0.8,
          fatGrams: defaultFat,
          carbGrams: defaultCarbs,
          mealsPerDay: 5,
          nutritionSystem: 'flexible',
        },
        select: {
          id: true,
          name: true,
          dailyCalorieTarget: true,
          proteinGrams: true,
          fatGrams: true,
          carbGrams: true,
          mealsPerDay: true,
          workoutTime: true,
          nutritionSystem: true,
        },
      })

      nutritionPlan = newPlan
    }

    // Convert Decimal to number for JSON response
    return NextResponse.json({
      id: nutritionPlan.id,
      name: nutritionPlan.name,
      dailyCalorieTarget: Number(nutritionPlan.dailyCalorieTarget),
      proteinGrams: Number(nutritionPlan.proteinGrams),
      fatGrams: Number(nutritionPlan.fatGrams),
      carbGrams: Number(nutritionPlan.carbGrams),
      mealsPerDay: nutritionPlan.mealsPerDay,
      workoutTime: nutritionPlan.workoutTime,
      nutritionSystem: nutritionPlan.nutritionSystem,
    })
  } catch (error) {
    console.error('Error fetching nutrition plan:', error)
    return NextResponse.json({ error: 'Failed to fetch nutrition plan' }, { status: 500 })
  }
}
