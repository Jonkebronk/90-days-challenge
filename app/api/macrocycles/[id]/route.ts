import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/macrocycles/[id] - Get single macrocycle with all mesocycles
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

    const macrocycle = await prisma.macrocycle.findUnique({
      where: { id },
      include: {
        mesocycles: {
          orderBy: { orderIndex: 'asc' },
          include: {
            days: {
              include: {
                muscleSlots: {
                  include: {
                    exercises: {
                      include: {
                        exercise: true,
                      },
                      orderBy: { orderIndex: 'asc' },
                    },
                  },
                  orderBy: { orderIndex: 'asc' },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        assignments: {
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
        },
      },
    })

    if (!macrocycle) {
      return NextResponse.json({ error: 'Macrocycle not found' }, { status: 404 })
    }

    // Check authorization
    const isCoach = macrocycle.coachId === session.user.id
    const isAssignedClient = macrocycle.assignments.some(
      (a) => a.userId === session.user.id
    )

    if (!isCoach && !isAssignedClient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(macrocycle)
  } catch (error) {
    console.error('Error fetching macrocycle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch macrocycle' },
      { status: 500 }
    )
  }
}

// PUT /api/macrocycles/[id] - Update macrocycle
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
    const existing = await prisma.macrocycle.findUnique({
      where: { id },
      select: { coachId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Macrocycle not found' }, { status: 404 })
    }

    if (existing.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, description, goal, published, mesocycleIds } = body

    // Update macrocycle
    const macrocycle = await prisma.macrocycle.update({
      where: { id },
      data: {
        name,
        description,
        goal,
        published,
      },
    })

    // Update mesocycle associations if provided
    if (mesocycleIds !== undefined) {
      // Remove current associations
      await prisma.mesocycle.updateMany({
        where: {
          macrocycleId: id,
          coachId: session.user.id,
        },
        data: {
          macrocycleId: null,
          orderIndex: 0,
        },
      })

      // Add new associations with order
      for (let i = 0; i < mesocycleIds.length; i++) {
        await prisma.mesocycle.update({
          where: { id: mesocycleIds[i] },
          data: {
            macrocycleId: id,
            orderIndex: i,
          },
        })
      }
    }

    // Fetch updated macrocycle with relations
    const result = await prisma.macrocycle.findUnique({
      where: { id },
      include: {
        mesocycles: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating macrocycle:', error)
    return NextResponse.json(
      { error: 'Failed to update macrocycle' },
      { status: 500 }
    )
  }
}

// DELETE /api/macrocycles/[id] - Delete macrocycle
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
    const existing = await prisma.macrocycle.findUnique({
      where: { id },
      select: { coachId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Macrocycle not found' }, { status: 404 })
    }

    if (existing.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Unlink mesocycles first (don't delete them)
    await prisma.mesocycle.updateMany({
      where: { macrocycleId: id },
      data: { macrocycleId: null },
    })

    // Delete macrocycle
    await prisma.macrocycle.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting macrocycle:', error)
    return NextResponse.json(
      { error: 'Failed to delete macrocycle' },
      { status: 500 }
    )
  }
}
