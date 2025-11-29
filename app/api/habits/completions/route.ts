import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch completions for a date range
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const searchParams = request.nextUrl.searchParams
    const habitId = searchParams.get('habitId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      habit: {
        userId
      }
    }

    if (habitId) {
      where.habitId = habitId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const completions = await prisma.habitCompletion.findMany({
      where,
      include: {
        habit: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json({ completions })
  } catch (error) {
    console.error('Error fetching completions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch completions' },
      { status: 500 }
    )
  }
}

// POST - Mark a day as completed
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { habitId, date } = body

    if (!habitId || !date) {
      return NextResponse.json(
        { error: 'habitId and date are required' },
        { status: 400 }
      )
    }

    // Verify the habit belongs to the user
    const habit = await prisma.userHabit.findFirst({
      where: {
        id: habitId,
        userId
      }
    })

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    const completion = await prisma.habitCompletion.upsert({
      where: {
        habitId_date: {
          habitId,
          date: new Date(date)
        }
      },
      update: {
        completed: true
      },
      create: {
        habitId,
        date: new Date(date),
        completed: true
      }
    })

    return NextResponse.json({ completion })
  } catch (error) {
    console.error('Error saving completion:', error)
    return NextResponse.json(
      { error: 'Failed to save completion' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a completion (undo)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { habitId, date } = body

    if (!habitId || !date) {
      return NextResponse.json(
        { error: 'habitId and date are required' },
        { status: 400 }
      )
    }

    // Verify the habit belongs to the user
    const habit = await prisma.userHabit.findFirst({
      where: {
        id: habitId,
        userId
      }
    })

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    await prisma.habitCompletion.deleteMany({
      where: {
        habitId,
        date: new Date(date)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting completion:', error)
    return NextResponse.json(
      { error: 'Failed to delete completion' },
      { status: 500 }
    )
  }
}
