import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/mesocycles/[id]/assign - Assign mesocycle to client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if ((session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { userId, startDate } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Verify mesocycle exists and belongs to coach
    const mesocycle = await prisma.mesocycle.findUnique({
      where: { id },
      select: { coachId: true, durationWeeks: true },
    })

    if (!mesocycle) {
      return NextResponse.json({ error: 'Mesocycle not found' }, { status: 404 })
    }

    if (mesocycle.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify client exists and belongs to this coach
    const client = await prisma.user.findFirst({
      where: {
        id: userId,
        coachId: session.user.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Deactivate any existing active mesocycle assignments for this client
    await prisma.assignedMesocycle.updateMany({
      where: {
        userId,
        active: true,
      },
      data: {
        active: false,
        endDate: new Date(),
      },
    })

    // Calculate end date based on duration
    const start = startDate ? new Date(startDate) : new Date()
    const endDate = new Date(start)
    endDate.setDate(endDate.getDate() + (mesocycle.durationWeeks * 7))

    // Create new assignment
    const assignment = await prisma.assignedMesocycle.create({
      data: {
        userId,
        mesocycleId: id,
        coachId: session.user.id,
        startDate: start,
        endDate,
        active: true,
        currentWeek: 1,
        currentDay: 1,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        mesocycle: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Error assigning mesocycle:', error)
    return NextResponse.json(
      { error: 'Failed to assign mesocycle' },
      { status: 500 }
    )
  }
}

// DELETE /api/mesocycles/[id]/assign - Unassign mesocycle from client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if ((session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Verify mesocycle belongs to coach
    const mesocycle = await prisma.mesocycle.findUnique({
      where: { id },
      select: { coachId: true },
    })

    if (!mesocycle) {
      return NextResponse.json({ error: 'Mesocycle not found' }, { status: 404 })
    }

    if (mesocycle.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Deactivate the assignment
    await prisma.assignedMesocycle.updateMany({
      where: {
        mesocycleId: id,
        userId,
        active: true,
      },
      data: {
        active: false,
        endDate: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unassigning mesocycle:', error)
    return NextResponse.json(
      { error: 'Failed to unassign mesocycle' },
      { status: 500 }
    )
  }
}
