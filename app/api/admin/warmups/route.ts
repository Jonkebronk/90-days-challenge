import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all warmup routines
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    // Only coaches can view warmups
    if (userRole !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const warmups = await prisma.warmupRoutine.findMany({
      include: {
        exercises: {
          orderBy: {
            orderIndex: 'asc'
          }
        },
        _count: {
          select: {
            programs: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ warmups })
  } catch (error) {
    console.error('Error fetching warmup routines:', error)
    return NextResponse.json(
      { error: 'Failed to fetch warmup routines' },
      { status: 500 }
    )
  }
}

// POST - Create a new warmup routine
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    if (userRole !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, introText, outroText, exercises } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Warmup routine name is required' },
        { status: 400 }
      )
    }

    const warmup = await prisma.warmupRoutine.create({
      data: {
        name,
        description,
        introText,
        outroText,
        exercises: exercises ? {
          create: exercises.map((ex: any, index: number) => ({
            orderIndex: ex.orderIndex ?? index,
            name: ex.name,
            reps: ex.reps,
            videoUrl: ex.videoUrl,
            instructions: ex.instructions
          }))
        } : undefined
      },
      include: {
        exercises: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    return NextResponse.json({ warmup }, { status: 201 })
  } catch (error) {
    console.error('Error creating warmup routine:', error)
    return NextResponse.json(
      { error: 'Failed to create warmup routine' },
      { status: 500 }
    )
  }
}
