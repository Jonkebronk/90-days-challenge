import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/roadmap - Get all roadmap assignments
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignments = await prisma.roadmapAssignment.findMany({
      include: {
        article: {
          include: {
            category: true
          }
        }
      },
      orderBy: [
        { dayNumber: 'asc' },
        { orderIndex: 'asc' }
      ]
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching roadmap:', error)
    return NextResponse.json({ error: 'Failed to fetch roadmap' }, { status: 500 })
  }
}

// POST /api/roadmap - Create roadmap assignment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { articleId, dayNumber, orderIndex, prerequisiteArticleIds } = body

    if (!articleId || !dayNumber) {
      return NextResponse.json(
        { error: 'Article ID and day number are required' },
        { status: 400 }
      )
    }

    // Calculate phase based on dayNumber
    let phase = 1
    if (dayNumber > 60) phase = 3
    else if (dayNumber > 30) phase = 2

    const assignment = await prisma.roadmapAssignment.create({
      data: {
        articleId,
        dayNumber,
        phase,
        orderIndex: orderIndex || 0,
        prerequisiteArticleIds: prerequisiteArticleIds || []
      },
      include: {
        article: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Error creating roadmap assignment:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
