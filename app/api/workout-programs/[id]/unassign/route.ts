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
    if (userRole !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: programId } = await params
    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Find and deactivate the assignment
    await prisma.assignedWorkoutProgram.updateMany({
      where: {
        workoutProgramId: programId,
        userId: clientId,
        active: true
      },
      data: {
        active: false
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unassigning program:', error)
    return NextResponse.json(
      { error: 'Failed to unassign program' },
      { status: 500 }
    )
  }
}
