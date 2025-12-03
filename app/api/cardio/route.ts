import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/cardio - List all cardio programs for coach's clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if ((session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = {
      coachId: session.user.id,
    }

    if (userId) {
      where.userId = userId
    }

    const cardioPrograms = await prisma.cardioProgram.findMany({
      where,
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
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(cardioPrograms)
  } catch (error) {
    console.error('Error fetching cardio programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cardio programs' },
      { status: 500 }
    )
  }
}

// POST /api/cardio - Create new cardio program for a client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if ((session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      userId,
      title,
      description,
      cardioType,
      frequency,
      durationMinutes,
      intensity,
      preferredDays,
      timing,
      notes,
    } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    // Verify client belongs to this coach
    const client = await prisma.user.findFirst({
      where: {
        id: userId,
        coachId: session.user.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Deactivate any existing active cardio for this client
    await prisma.cardioProgram.updateMany({
      where: {
        userId,
        active: true,
      },
      data: {
        active: false,
        endDate: new Date(),
      },
    })

    // Create new cardio program
    const cardioProgram = await prisma.cardioProgram.create({
      data: {
        userId,
        coachId: session.user.id,
        title,
        description,
        cardioType,
        frequency,
        durationMinutes,
        intensity,
        preferredDays,
        timing,
        notes,
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

    return NextResponse.json(cardioProgram, { status: 201 })
  } catch (error) {
    console.error('Error creating cardio program:', error)
    return NextResponse.json(
      { error: 'Failed to create cardio program' },
      { status: 500 }
    )
  }
}
