import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch daily macro targets for user's meal plan
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get user's meal plan with daily targets
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { userId },
      include: {
        dailyTargets: {
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    })

    if (!mealPlan) {
      return NextResponse.json({ error: 'No meal plan found' }, { status: 404 })
    }

    return NextResponse.json({
      mealPlanId: mealPlan.id,
      dailyTargets: mealPlan.dailyTargets
    })
  } catch (error) {
    console.error('Error fetching daily targets:', error)
    return NextResponse.json({ error: 'Failed to fetch daily targets' }, { status: 500 })
  }
}

// POST - Create or update daily macro targets
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const isCoach = (session.user as any).role?.toUpperCase() === 'COACH'

    const body = await request.json()
    const { mealPlanId, targets } = body

    // Validate request
    if (!mealPlanId || !targets || !Array.isArray(targets)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Verify access to meal plan
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId }
    })

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
    }

    // Check permissions: user must own the plan or be the coach who created it
    if (mealPlan.userId !== userId && mealPlan.coachId !== userId && !isCoach) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Upsert each daily target
    const results = await Promise.all(
      targets.map(async (target: {
        dayOfWeek: number
        calories: number
        protein: number
        fat: number
        carbs: number
      }) => {
        return prisma.dailyMacroTarget.upsert({
          where: {
            mealPlanId_dayOfWeek: {
              mealPlanId,
              dayOfWeek: target.dayOfWeek
            }
          },
          update: {
            calories: target.calories,
            protein: target.protein,
            fat: target.fat,
            carbs: target.carbs
          },
          create: {
            mealPlanId,
            dayOfWeek: target.dayOfWeek,
            calories: target.calories,
            protein: target.protein,
            fat: target.fat,
            carbs: target.carbs
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      dailyTargets: results
    })
  } catch (error) {
    console.error('Error saving daily targets:', error)
    return NextResponse.json({ error: 'Failed to save daily targets' }, { status: 500 })
  }
}
