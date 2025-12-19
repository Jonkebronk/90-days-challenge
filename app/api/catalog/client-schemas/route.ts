import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/catalog/client-schemas - Get all client nutrition plans for browsing (coach only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coachId = (session.user as any).id

    // Get all nutrition plans for this coach's clients with their generated meal plans
    const plans = await prisma.clientNutritionPlan.findMany({
      where: {
        coachId,
        status: { in: ['ACTIVE', 'DRAFT'] },
      },
      select: {
        id: true,
        name: true,
        status: true,
        client: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
        generatedMealPlans: {
          select: {
            id: true,
            meals: true,
            targetMacros: true,
            actualMacros: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1, // Get only the latest generated meal plan
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Transform plans to include client name and calculated totals
    const transformedPlans = plans
      .filter((plan) => plan.generatedMealPlans.length > 0)
      .map((plan) => {
        const latestMealPlan = plan.generatedMealPlans[0]
        const meals = (latestMealPlan?.meals as any[]) || []
        const targetMacros = (latestMealPlan?.targetMacros as any) || {}
        const actualMacros = (latestMealPlan?.actualMacros as any) || {}

        const clientName =
          plan.client.name ||
          `${plan.client.firstName || ''} ${plan.client.lastName || ''}`.trim() ||
          'Okänd klient'

        // Calculate totals from meals if actualMacros not available
        let totalProtein = actualMacros.protein || 0
        let totalCarbs = actualMacros.carbs || 0
        let totalFat = actualMacros.fat || 0
        let totalKcal = actualMacros.kcal || 0

        if (!actualMacros.protein && meals.length > 0) {
          meals.forEach((meal: any) => {
            if (meal.foods) {
              meal.foods.forEach((food: any) => {
                totalProtein += food.protein || 0
                totalCarbs += food.carbs || 0
                totalFat += food.fat || 0
                totalKcal += food.kcal || 0
              })
            }
          })
        }

        return {
          id: plan.id,
          name: plan.name || `${clientName}s kostschema`,
          clientId: plan.client.id,
          clientName,
          status: plan.status,
          mealCount: meals.length,
          totalProtein: Math.round(totalProtein),
          totalCarbs: Math.round(totalCarbs),
          totalFat: Math.round(totalFat),
          totalKcal: Math.round(totalKcal),
          meals, // Include full meal data for import
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        }
      })

    return NextResponse.json({ plans: transformedPlans })
  } catch (error) {
    console.error('Error fetching client schemas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client schemas' },
      { status: 500 }
    )
  }
}
