import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/mesocycles/[id] - Get single mesocycle with all data
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

    const mesocycle = await prisma.mesocycle.findUnique({
      where: { id },
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
        macrocycle: true,
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

    if (!mesocycle) {
      return NextResponse.json({ error: 'Mesocycle not found' }, { status: 404 })
    }

    // Check authorization - coach who created it or assigned client
    const isCoach = mesocycle.coachId === session.user.id
    const isAssignedClient = mesocycle.assignments.some(
      (a) => a.userId === session.user.id
    )

    if (!isCoach && !isAssignedClient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(mesocycle)
  } catch (error) {
    console.error('Error fetching mesocycle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mesocycle' },
      { status: 500 }
    )
  }
}

// PUT /api/mesocycles/[id] - Update mesocycle
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
    const existing = await prisma.mesocycle.findUnique({
      where: { id },
      select: { coachId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Mesocycle not found' }, { status: 404 })
    }

    if (existing.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      name,
      description,
      goal,
      durationWeeks,
      macrocycleId,
      startingRIR,
      endingRIR,
      published,
      days,
    } = body

    // Update mesocycle - if days provided, replace all days
    if (days) {
      // Delete existing days (cascade deletes slots and exercises)
      await prisma.mesocycleDay.deleteMany({
        where: { mesocycleId: id },
      })

      // Update with new days
      const mesocycle = await prisma.mesocycle.update({
        where: { id },
        data: {
          name,
          description,
          goal,
          durationWeeks,
          macrocycleId,
          startingRIR,
          endingRIR,
          published,
          days: {
            create: days.map((day: any, dayIndex: number) => ({
              dayNumber: day.dayNumber || dayIndex + 1,
              dayName: day.dayName,
              weekday: day.weekday,
              isRestDay: day.isRestDay || false,
              orderIndex: dayIndex,
              muscleSlots: {
                create: (day.muscleSlots || []).map((slot: any, slotIndex: number) => ({
                  muscleGroup: slot.muscleGroup,
                  priority: slot.priority || 'primary',
                  setsMin: slot.setsMin,
                  setsMax: slot.setsMax,
                  orderIndex: slotIndex,
                  exercises: {
                    create: (slot.exercises || []).map((ex: any, exIndex: number) => ({
                      exerciseId: ex.exerciseId,
                      sets: ex.sets || 3,
                      reps: ex.reps,
                      restSeconds: ex.restSeconds || 90,
                      tempo: ex.tempo,
                      targetRPE: ex.targetRPE,
                      targetRIR: ex.targetRIR,
                      notes: ex.notes,
                      coachNotes: ex.coachNotes,
                      orderIndex: exIndex,
                    })),
                  },
                })),
              },
            })),
          },
        },
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
      })

      return NextResponse.json(mesocycle)
    }

    // Update only metadata fields
    const mesocycle = await prisma.mesocycle.update({
      where: { id },
      data: {
        name,
        description,
        goal,
        durationWeeks,
        macrocycleId,
        startingRIR,
        endingRIR,
        published,
      },
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
    })

    return NextResponse.json(mesocycle)
  } catch (error) {
    console.error('Error updating mesocycle:', error)
    return NextResponse.json(
      { error: 'Failed to update mesocycle' },
      { status: 500 }
    )
  }
}

// DELETE /api/mesocycles/[id] - Delete mesocycle
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
    const existing = await prisma.mesocycle.findUnique({
      where: { id },
      select: { coachId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Mesocycle not found' }, { status: 404 })
    }

    if (existing.coachId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.mesocycle.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mesocycle:', error)
    return NextResponse.json(
      { error: 'Failed to delete mesocycle' },
      { status: 500 }
    )
  }
}
