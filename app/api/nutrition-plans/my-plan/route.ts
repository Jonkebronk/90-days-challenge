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
    const nutritionPlan = await prisma.clientNutritionPlan.findFirst({
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

    if (!nutritionPlan) {
      return NextResponse.json(null)
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
