import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch daily weights for a date range
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { userId }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const weights = await prisma.dailyWeight.findMany({
      where,
      orderBy: { date: 'asc' }
    })

    // Convert dates to ISO strings for JSON serialization
    const formattedWeights = weights.map(w => ({
      ...w,
      date: w.date.toISOString().split('T')[0],
      weight: parseFloat(w.weight.toString())
    }))

    return NextResponse.json({ weights: formattedWeights })
  } catch (error) {
    console.error('Error fetching daily weights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily weights' },
      { status: 500 }
    )
  }
}

// POST - Save or update a daily weight (upsert)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { date, weight } = body

    if (!date || weight === undefined || weight === null) {
      return NextResponse.json(
        { error: 'Date and weight are required' },
        { status: 400 }
      )
    }

    const weightValue = parseFloat(weight)
    if (isNaN(weightValue) || weightValue <= 0 || weightValue > 500) {
      return NextResponse.json(
        { error: 'Invalid weight value' },
        { status: 400 }
      )
    }

    // Upsert: create if not exists, update if exists
    const dailyWeight = await prisma.dailyWeight.upsert({
      where: {
        userId_date: {
          userId,
          date: new Date(date)
        }
      },
      update: {
        weight: weightValue
      },
      create: {
        userId,
        date: new Date(date),
        weight: weightValue
      }
    })

    return NextResponse.json({
      weight: {
        ...dailyWeight,
        date: dailyWeight.date.toISOString().split('T')[0],
        weight: parseFloat(dailyWeight.weight.toString())
      }
    })
  } catch (error) {
    console.error('Error saving daily weight:', error)
    return NextResponse.json(
      { error: 'Failed to save daily weight' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a daily weight entry
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    await prisma.dailyWeight.delete({
      where: {
        userId_date: {
          userId,
          date: new Date(date)
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting daily weight:', error)
    return NextResponse.json(
      { error: 'Failed to delete daily weight' },
      { status: 500 }
    )
  }
}
