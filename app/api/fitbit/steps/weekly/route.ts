import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface StepDay {
  date: string
  dayName: string
  steps: number | null
  goal: number | null
  percentage: number | null
}

const dayNames = ['Son', 'Man', 'Tis', 'Ons', 'Tor', 'Fre', 'Lor']

// GET /api/fitbit/steps/weekly - Get weekly step data
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    // Check if user has Fitbit connected
    const fitbitAccount = await prisma.fitbitAccount.findUnique({
      where: { userId },
    })

    // Get user's step goal (fallback to 10000)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stepGoal: true },
    })

    const defaultGoal = user?.stepGoal || 10000

    // Calculate date range (last 7 days including today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)

    // Get step data from database
    const stepData = await prisma.dailySteps.findMany({
      where: {
        userId,
        date: {
          gte: weekAgo,
          lte: today,
        },
      },
      orderBy: { date: 'asc' },
    })

    // Create map for quick lookup
    const stepMap = new Map(
      stepData.map((s) => [s.date.toISOString().split('T')[0], s])
    )

    // Build response with all 7 days
    const days: StepDay[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const dayData = stepMap.get(dateStr)

      const steps = dayData?.steps ?? null
      const goal = dayData?.goal ?? defaultGoal

      days.push({
        date: dateStr,
        dayName: dayNames[date.getDay()],
        steps,
        goal,
        percentage: steps !== null && goal ? Math.round((steps / goal) * 100) : null,
      })
    }

    // Calculate summary stats
    const daysWithData = days.filter((d) => d.steps !== null)
    const avgSteps =
      daysWithData.length > 0
        ? Math.round(
            daysWithData.reduce((sum, d) => sum + (d.steps || 0), 0) /
              daysWithData.length
          )
        : 0

    const goalsMet = daysWithData.filter(
      (d) => d.percentage !== null && d.percentage >= 100
    ).length

    const bestDay = daysWithData.reduce(
      (best, d) => ((d.steps || 0) > (best?.steps || 0) ? d : best),
      daysWithData[0]
    )

    return NextResponse.json({
      connected: !!fitbitAccount,
      days,
      summary: {
        avgSteps,
        goalsMet,
        totalDays: daysWithData.length,
        bestDay: bestDay
          ? {
              dayName: bestDay.dayName,
              steps: bestDay.steps,
            }
          : null,
        defaultGoal,
      },
    })
  } catch (error) {
    console.error('Error fetching weekly steps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch step data' },
      { status: 500 }
    )
  }
}
