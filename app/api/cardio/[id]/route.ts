import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/cardio/[id] - Get single cardio program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const cardioProgram = await prisma.cardioProgram.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    if (!cardioProgram) {
      return NextResponse.json({ error: 'Cardio program not found' }, { status: 404 })
    }

    // Check authorization - coach who created it or the assigned client
    const isCoach = cardioProgram.coachId === session.user.id
    const isClient = cardioProgram.userId === session.user.id

    if (!isCoach && !isClient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(cardioProgram)
  } catch (error) {
    console.error('Error fetching cardio program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cardio program' },
      { status: 500 }
    )
  }
}

// PUT /api/cardio/[id] - Update cardio program
export async function PUT(
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

    // Verify ownership
    const existing = await prisma.cardioProgram.findUnique({
      where: { id },
      select: { coachId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Cardio program not found' }, { status: 404 })
    }

    if (existing.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      title,
      description,
      cardioType,
      frequency,
      durationMinutes,
      intensity,
      preferredDays,
      timing,
      notes,
      active,
    } = body

    const cardioProgram = await prisma.cardioProgram.update({
      where: { id },
      data: {
        title,
        description,
        cardioType,
        frequency,
        durationMinutes,
        intensity,
        preferredDays,
        timing,
        notes,
        active,
        ...(active === false ? { endDate: new Date() } : {}),
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
      },
    })

    return NextResponse.json(cardioProgram)
  } catch (error) {
    console.error('Error updating cardio program:', error)
    return NextResponse.json(
      { error: 'Failed to update cardio program' },
      { status: 500 }
    )
  }
}

// DELETE /api/cardio/[id] - Delete cardio program
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

    // Verify ownership
    const existing = await prisma.cardioProgram.findUnique({
      where: { id },
      select: { coachId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Cardio program not found' }, { status: 404 })
    }

    if (existing.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.cardioProgram.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cardio program:', error)
    return NextResponse.json(
      { error: 'Failed to delete cardio program' },
      { status: 500 }
    )
  }
}
