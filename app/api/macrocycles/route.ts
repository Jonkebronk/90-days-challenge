import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/macrocycles - List all macrocycles for coach
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if ((session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const macrocycles = await prisma.macrocycle.findMany({
      where: {
        coachId: session.user.id,
      },
      include: {
        mesocycles: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            name: true,
            goal: true,
            durationWeeks: true,
            orderIndex: true,
          },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(macrocycles)
  } catch (error) {
    console.error('Error fetching macrocycles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch macrocycles' },
      { status: 500 }
    )
  }
}

// POST /api/macrocycles - Create new macrocycle
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
    const { name, description, goal, mesocycleIds = [] } = body

    // Create macrocycle
    const macrocycle = await prisma.macrocycle.create({
      data: {
        coachId: session.user.id,
        name,
        description,
        goal,
      },
    })

    // Link existing mesocycles to this macrocycle
    if (mesocycleIds.length > 0) {
      await prisma.mesocycle.updateMany({
        where: {
          id: { in: mesocycleIds },
          coachId: session.user.id, // Ensure coach owns them
        },
        data: {
          macrocycleId: macrocycle.id,
        },
      })

      // Update order indexes
      for (let i = 0; i < mesocycleIds.length; i++) {
        await prisma.mesocycle.update({
          where: { id: mesocycleIds[i] },
          data: { orderIndex: i },
        })
      }
    }

    // Fetch with relations
    const result = await prisma.macrocycle.findUnique({
      where: { id: macrocycle.id },
      include: {
        mesocycles: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating macrocycle:', error)
    return NextResponse.json(
      { error: 'Failed to create macrocycle' },
      { status: 500 }
    )
  }
}
