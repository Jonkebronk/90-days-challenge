import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { weight_kg, energy_level, sleep_hours, notes, log_date } = await request.json()

    // Check if log already exists for this date
    const existingLog = await prisma.dailyLog.findUnique({
      where: {
        userId_logDate: {
          userId: session.user.id,
          logDate: new Date(log_date),
        },
      },
    })

    let dailyLog

    if (existingLog) {
      // Update existing log
      dailyLog = await prisma.dailyLog.update({
        where: { id: existingLog.id },
        data: {
          weightKg: weight_kg,
          energyLevel: energy_level,
          sleepHours: sleep_hours,
          notes: notes || null,
        },
      })
    } else {
      // Create new log
      dailyLog = await prisma.dailyLog.create({
        data: {
          userId: session.user.id,
          logDate: new Date(log_date),
          weightKg: weight_kg,
          energyLevel: energy_level,
          sleepHours: sleep_hours,
          notes: notes || null,
        },
      })
    }

    return NextResponse.json({ success: true, dailyLog }, { status: 200 })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to save check-in' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const logs = await prisma.dailyLog.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        logDate: 'desc',
      },
      take: days,
    })

    return NextResponse.json({ logs }, { status: 200 })
  } catch (error) {
    console.error('Get check-ins error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    )
  }
}
