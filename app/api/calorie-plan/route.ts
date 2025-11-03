import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch calorie plan for a client
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 })
    }

    // Verify coach has access to this client
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { coachId: true }
    })

    if (!client || client.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const caloriePlan = await prisma.caloriePlan.findUnique({
      where: { userId: clientId }
    })

    return NextResponse.json({ caloriePlan })
  } catch (error) {
    console.error('Error fetching calorie plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save/Update calorie plan for a client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      clientId,
      weight,
      activityLevel,
      deficit,
      dailySteps,
      proteinPerKg,
      fatPerKg,
      numMeals,
      customDistribution,
      mealCalories,
      customMacros
    } = body

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 })
    }

    // Verify coach has access to this client
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { coachId: true }
    })

    if (!client || client.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Upsert calorie plan
    const caloriePlan = await prisma.caloriePlan.upsert({
      where: { userId: clientId },
      create: {
        userId: clientId,
        weight,
        activityLevel,
        deficit,
        dailySteps,
        proteinPerKg,
        fatPerKg,
        numMeals,
        customDistribution,
        mealCalories: mealCalories || [],
        customMacros: customMacros || null
      },
      update: {
        weight,
        activityLevel,
        deficit,
        dailySteps,
        proteinPerKg,
        fatPerKg,
        numMeals,
        customDistribution,
        mealCalories: mealCalories || [],
        customMacros: customMacros || null
      }
    })

    return NextResponse.json({ success: true, caloriePlan })
  } catch (error) {
    console.error('Error saving calorie plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
