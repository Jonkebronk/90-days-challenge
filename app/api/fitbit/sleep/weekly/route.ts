import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface SleepDay {
  date: string
  dayName: string
  minutesAsleep: number | null
  hoursAsleep: number | null
  efficiency: number | null
}

const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']

// GET /api/fitbit/sleep/weekly - Get weekly sleep data
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

    // Calculate date range (last 7 days including today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)

    // Get sleep data from database
    const sleepData = await prisma.dailySleep.findMany({
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
    const sleepMap = new Map(
      sleepData.map((s) => [s.date.toISOString().split('T')[0], s])
    )

    // Build response with all 7 days
    const days: SleepDay[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const dayData = sleepMap.get(dateStr)

      const minutesAsleep = dayData?.minutesAsleep ?? null
      const hoursAsleep = minutesAsleep !== null ? Math.round((minutesAsleep / 60) * 10) / 10 : null

      days.push({
        date: dateStr,
        dayName: dayNames[date.getDay()],
        minutesAsleep,
        hoursAsleep,
        efficiency: dayData?.efficiency ?? null,
      })
    }

    // Calculate summary stats
    const daysWithData = days.filter((d) => d.minutesAsleep !== null)
    const avgMinutes =
      daysWithData.length > 0
        ? Math.round(
            daysWithData.reduce((sum, d) => sum + (d.minutesAsleep || 0), 0) /
              daysWithData.length
          )
        : 0

    const avgHours = avgMinutes > 0 ? Math.round((avgMinutes / 60) * 10) / 10 : 0

    const avgEfficiency =
      daysWithData.length > 0
        ? Math.round(
            daysWithData.reduce((sum, d) => sum + (d.efficiency || 0), 0) /
              daysWithData.length
          )
        : 0

    // Good sleep is 7+ hours
    const goodSleepDays = daysWithData.filter(
      (d) => d.hoursAsleep !== null && d.hoursAsleep >= 7
    ).length

    const bestDay = daysWithData.reduce(
      (best, d) => ((d.minutesAsleep || 0) > (best?.minutesAsleep || 0) ? d : best),
      daysWithData[0]
    )

    return NextResponse.json({
      connected: !!fitbitAccount,
      hasSleepData: sleepData.length > 0,
      days,
      summary: {
        avgMinutes,
        avgHours,
        avgEfficiency,
        goodSleepDays,
        totalDays: daysWithData.length,
        bestDay: bestDay
          ? {
              dayName: bestDay.dayName,
              hoursAsleep: bestDay.hoursAsleep,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Error fetching weekly sleep:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sleep data' },
      { status: 500 }
    )
  }
}
