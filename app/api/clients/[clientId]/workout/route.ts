import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Find active workout assignment for this client
    const assignment = await prisma.assignedWorkoutProgram.findFirst({
      where: {
        userId: clientId,
        active: true
      },
      include: {
        workoutProgram: {
          include: {
            days: {
              select: {
                id: true,
                name: true,
                dayNumber: true,
                isRestDay: true,
                description: true,
                orderIndex: true
              },
              orderBy: {
                dayNumber: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Error fetching client workout:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout assignment' },
      { status: 500 }
    )
  }
}
