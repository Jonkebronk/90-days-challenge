import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/mesocycles - List all mesocycles for coach
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only coaches can access mesocycles
    if ((session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const mesocycles = await prisma.mesocycle.findMany({
      where: {
        coachId: session.user.id,
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
        macrocycle: true,
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(mesocycles)
  } catch (error) {
    console.error('Error fetching mesocycles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mesocycles' },
      { status: 500 }
    )
  }
}

// POST /api/mesocycles - Create new mesocycle
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
      name,
      description,
      goal,
      durationWeeks = 4,
      macrocycleId,
      startingRIR,
      endingRIR,
      days = [],
    } = body

    // Create mesocycle with days and muscle slots
    const mesocycle = await prisma.mesocycle.create({
      data: {
        coachId: session.user.id,
        name,
        description,
        goal,
        durationWeeks,
        macrocycleId,
        startingRIR,
        endingRIR,
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

    return NextResponse.json(mesocycle, { status: 201 })
  } catch (error) {
    console.error('Error creating mesocycle:', error)
    return NextResponse.json(
      { error: 'Failed to create mesocycle' },
      { status: 500 }
    )
  }
}
