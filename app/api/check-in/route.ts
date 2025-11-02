import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      statusUpdate,
      weightKg,
      energyLevel,
      mood,
      dietPlanAdherence,
      workoutPlanAdherence,
      sleepNotes,
      dailySteps,
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        statusUpdate,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        energyLevel,
        mood,
        dietPlanAdherence,
        workoutPlanAdherence,
        sleepNotes,
        dailySteps,
      },
    })

    console.log('Check-in created for user:', userId)

    return NextResponse.json({
      success: true,
      checkIn,
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to save check-in' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get all check-ins for user
    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      checkIns,
    })
  } catch (error) {
    console.error('Failed to fetch check-ins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    )
  }
}
