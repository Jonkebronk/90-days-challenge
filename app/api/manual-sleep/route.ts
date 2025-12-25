import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/manual-sleep - Save manual sleep data
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string
    const { date, hours } = await request.json()

    if (!date || hours === undefined) {
      return NextResponse.json({ error: 'Date and hours are required' }, { status: 400 })
    }

    const parsedDate = new Date(date)
    parsedDate.setHours(0, 0, 0, 0)

    const minutesAsleep = Math.round(parseFloat(hours) * 60)

    // Upsert the manual sleep data
    const result = await prisma.dailySleep.upsert({
      where: {
        userId_date: {
          userId,
          date: parsedDate,
        },
      },
      create: {
        userId,
        date: parsedDate,
        minutesAsleep,
        minutesAwake: 0,
        efficiency: 85, // Default efficiency
      },
      update: {
        minutesAsleep,
        syncedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      hours: parseFloat(hours),
      efficiency: result.efficiency,
      date: date,
    })
  } catch (error) {
    console.error('Error saving manual sleep:', error)
    return NextResponse.json(
      { error: 'Failed to save sleep data' },
      { status: 500 }
    )
  }
}
