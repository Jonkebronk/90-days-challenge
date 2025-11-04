import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/lessons - List all lessons
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const phase = searchParams.get('phase')
    const published = searchParams.get('published')
    const isCoach = (session.user as any).role === 'coach'

    // Build where clause
    const where: any = {}

    if (phase) {
      where.phase = parseInt(phase)
    }

    // Clients can only see published lessons
    if (!isCoach) {
      where.published = true
    } else if (published !== null) {
      where.published = published === 'true'
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        slides: {
          orderBy: { orderIndex: 'asc' }
        },
        progress: isCoach ? false : {
          where: { userId: session.user.id }
        }
      },
      orderBy: [
        { phase: 'asc' },
        { orderIndex: 'asc' }
      ]
    })

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('Failed to fetch lessons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}

// POST /api/lessons - Create new lesson (coach only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, phase, orderIndex, coverImage, prerequisiteIds, published } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        phase: phase || null,
        orderIndex: orderIndex || 0,
        coverImage: coverImage || null,
        prerequisiteIds: prerequisiteIds || [],
        published: published || false,
        publishedAt: published ? new Date() : null
      },
      include: {
        slides: true
      }
    })

    return NextResponse.json({ lesson }, { status: 201 })
  } catch (error) {
    console.error('Failed to create lesson:', error)
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    )
  }
}
