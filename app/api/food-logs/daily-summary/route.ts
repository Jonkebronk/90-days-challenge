import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/food-logs/daily-summary - Get daily totals with meal plan comparison
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date') // YYYY-MM-DD

    const date = dateStr ? new Date(dateStr) : new Date()
    date.setHours(0, 0, 0, 0)

    // Get all food logs for the date
    const logs = await prisma.foodLog.findMany({
      where: {
        userId: session.user.id,
        date
      },
      include: {
        items: true
      }
    })

    // Calculate logged totals
    const logged = logs.reduce(
      (acc, log) => ({
        kcal: acc.kcal + (log.totalKcal?.toNumber() || 0),
        protein: acc.protein + (log.totalProtein?.toNumber() || 0),
        carbs: acc.carbs + (log.totalCarbs?.toNumber() || 0),
        fat: acc.fat + (log.totalFat?.toNumber() || 0)
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    )

    // Get meal plan targets for comparison
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        userId: session.user.id,
        active: true
      }
    })

    const targets = mealPlan ? {
      kcal: mealPlan.totalCalories?.toNumber() || 0,
      protein: mealPlan.totalProtein?.toNumber() || 0,
      carbs: mealPlan.totalCarbs?.toNumber() || 0,
      fat: mealPlan.totalFat?.toNumber() || 0
    } : null

    // Calculate progress percentages
    const progress = targets ? {
      kcal: targets.kcal > 0 ? Math.round((logged.kcal / targets.kcal) * 100) : 0,
      protein: targets.protein > 0 ? Math.round((logged.protein / targets.protein) * 100) : 0,
      carbs: targets.carbs > 0 ? Math.round((logged.carbs / targets.carbs) * 100) : 0,
      fat: targets.fat > 0 ? Math.round((logged.fat / targets.fat) * 100) : 0
    } : null

    return NextResponse.json({
      date: date.toISOString().split('T')[0],
      logged,
      targets,
      progress,
      logCount: logs.length
    })
  } catch (error) {
    console.error('Error fetching daily summary:', error)
    return NextResponse.json({ error: 'Failed to fetch daily summary' }, { status: 500 })
  }
}
