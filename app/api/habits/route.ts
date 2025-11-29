import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch user's habits with settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const habits = await prisma.userHabit.findMany({
      where: { userId },
      include: {
        completions: {
          where: {
            date: {
              gte: getStartOfWeek(),
              lte: getEndOfWeek()
            }
          }
        }
      }
    })

    return NextResponse.json({ habits })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    )
  }
}

// POST - Create or update a habit
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { habitType, settings } = body

    if (!habitType) {
      return NextResponse.json(
        { error: 'habitType is required' },
        { status: 400 }
      )
    }

    const habit = await prisma.userHabit.upsert({
      where: {
        userId_habitType: {
          userId,
          habitType
        }
      },
      update: {
        settings: settings || {}
      },
      create: {
        userId,
        habitType,
        settings: settings || {}
      },
      include: {
        completions: {
          where: {
            date: {
              gte: getStartOfWeek(),
              lte: getEndOfWeek()
            }
          }
        }
      }
    })

    return NextResponse.json({ habit })
  } catch (error) {
    console.error('Error saving habit:', error)
    return NextResponse.json(
      { error: 'Failed to save habit' },
      { status: 500 }
    )
  }
}

// Helper functions to get start and end of current week (Monday-Sunday)
function getStartOfWeek(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getEndOfWeek(): Date {
  const monday = getStartOfWeek()
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}
