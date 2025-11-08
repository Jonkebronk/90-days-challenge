import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const coachId = (session.user as any).id

    if (userRole !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { clientId, startDate } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const { id } = await params

    // Verify the program exists
    const program = await prisma.workoutProgram.findUnique({
      where: { id }
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Check if client already has an active assignment for this program
    const existingAssignment = await prisma.assignedWorkoutProgram.findFirst({
      where: {
        userId: clientId,
        workoutProgramId: id,
        active: true
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Client already has this program assigned' },
        { status: 400 }
      )
    }

    // Create assignment
    const assignment = await prisma.assignedWorkoutProgram.create({
      data: {
        userId: clientId,
        workoutProgramId: id,
        coachId,
        startDate: startDate ? new Date(startDate) : new Date(),
        active: true
      },
      include: {
        workoutProgram: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Error assigning workout program:', error)
    return NextResponse.json(
      { error: 'Failed to assign workout program' },
      { status: 500 }
    )
  }
}
