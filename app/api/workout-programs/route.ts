import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const userId = (session.user as any).id

    // Only coaches can view all programs
    if (userRole !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const programs = await prisma.workoutProgram.findMany({
      where: {
        coachId: userId
      },
      include: {
        category: true,
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  },
                  orderBy: {
                    orderIndex: 'asc'
                  }
                }
              },
              orderBy: {
                dayNumber: 'asc'
              }
            }
          },
          orderBy: {
            weekNumber: 'asc'
          }
        },
        days: {
          include: {
            exercises: {
              include: {
                exercise: true
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        },
        _count: {
          select: {
            assignments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Also get all categories with program counts
    const categories = await prisma.workoutProgramCategory.findMany({
      include: {
        _count: {
          select: { programs: true }
        }
      },
      orderBy: { orderIndex: 'asc' }
    })

    return NextResponse.json({ programs, categories })
  } catch (error) {
    console.error('Error fetching workout programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout programs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const userId = (session.user as any).id

    if (userRole !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      difficulty,
      categoryId,
      durationWeeks,
      published,
      useMultiWeek,
      weeks,
      days
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Program name is required' },
        { status: 400 }
      )
    }

    // Create program - with either week structure or flat day structure
    const programData: any = {
      coachId: userId,
      name,
      description,
      difficulty,
      categoryId: categoryId || null,
      durationWeeks,
      published: published || false
    }

    if (useMultiWeek && weeks) {
      // Multi-week structure: create weeks with nested days
      programData.weeks = {
        create: weeks.map((week: any, weekIndex: number) => ({
          weekNumber: week.weekNumber,
          title: week.title,
          description: week.description,
          orderIndex: week.orderIndex || weekIndex,
          days: {
            create: week.days.map((day: any, dayIndex: number) => ({
              dayNumber: day.dayNumber || dayIndex + 1,
              name: day.name,
              description: day.description,
              isRestDay: day.isRestDay || false,
              orderIndex: day.orderIndex || dayIndex,
              exercises: day.exercises ? {
                create: day.exercises.map((ex: any, exIndex: number) => ({
                  exerciseId: ex.exerciseId,
                  sets: ex.sets,
                  repsMin: ex.repsMin,
                  repsMax: ex.repsMax,
                  restSeconds: ex.restSeconds || 60,
                  tempo: ex.tempo,
                  notes: ex.notes,
                  targetWeight: ex.targetWeight,
                  targetRPE: ex.targetRPE,
                  orderIndex: ex.orderIndex || exIndex
                }))
              } : undefined
            }))
          }
        }))
      }
    } else if (days) {
      // Flat structure: days directly on program (no weeks)
      programData.days = {
        create: days.map((day: any, dayIndex: number) => ({
          dayNumber: day.dayNumber || dayIndex + 1,
          name: day.name,
          description: day.description,
          isRestDay: day.isRestDay || false,
          orderIndex: day.orderIndex || dayIndex,
          exercises: day.exercises ? {
            create: day.exercises.map((ex: any, exIndex: number) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              repsMin: ex.repsMin,
              repsMax: ex.repsMax,
              restSeconds: ex.restSeconds || 60,
              tempo: ex.tempo,
              notes: ex.notes,
              targetWeight: ex.targetWeight,
              targetRPE: ex.targetRPE,
              orderIndex: ex.orderIndex || exIndex
            }))
          } : undefined
        }))
      }
    }

    const program = await prisma.workoutProgram.create({
      data: programData,
      include: {
        weeks: {
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
        },
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
    })

    return NextResponse.json({ program }, { status: 201 })
  } catch (error) {
    console.error('Error creating workout program:', error)
    return NextResponse.json(
      { error: 'Failed to create workout program' },
      { status: 500 }
    )
  }
}
