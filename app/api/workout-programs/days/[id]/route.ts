import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const day = await prisma.workoutProgramDay.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            exercise: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    if (!day) {
      return NextResponse.json({ error: 'Workout day not found' }, { status: 404 })
    }

    return NextResponse.json({ day })
  } catch (error) {
    console.error('Error fetching workout day:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout day' },
      { status: 500 }
    )
  }
}
