import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/manual-steps - Save manual step count
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string
    const { date, steps } = await request.json()

    if (!date || steps === undefined) {
      return NextResponse.json({ error: 'Date and steps are required' }, { status: 400 })
    }

    const parsedDate = new Date(date)
    parsedDate.setHours(0, 0, 0, 0)

    // Upsert the manual steps data
    const result = await prisma.dailySteps.upsert({
      where: {
        userId_date: {
          userId,
          date: parsedDate,
        },
      },
      create: {
        userId,
        date: parsedDate,
        steps: parseInt(steps),
        goal: 10000, // Default goal
      },
      update: {
        steps: parseInt(steps),
        syncedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      steps: result.steps,
      date: date,
    })
  } catch (error) {
    console.error('Error saving manual steps:', error)
    return NextResponse.json(
      { error: 'Failed to save steps' },
      { status: 500 }
    )
  }
}

// DELETE /api/manual-steps - Delete a manual step entry
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const parsedDate = new Date(date)
    parsedDate.setHours(0, 0, 0, 0)

    await prisma.dailySteps.delete({
      where: {
        userId_date: {
          userId,
          date: parsedDate,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting manual steps:', error)
    return NextResponse.json(
      { error: 'Failed to delete steps' },
      { status: 500 }
    )
  }
}
