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

    const userRole = (session.user as any).role
    if (userRole !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: programId } = await params

    // Get all active assignments for this program
    const assignments = await prisma.assignedWorkoutProgram.findMany({
      where: {
        workoutProgramId: programId,
        active: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching program assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
