import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/lessons/[id]/slides - Add slide to lesson (coach only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { type, title, content, videoUrl, documentUrl, orderIndex, quizOptions } = body

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    const slide = await prisma.slide.create({
      data: {
        lessonId: id,
        type,
        title: title || null,
        content: content || null,
        videoUrl: videoUrl || null,
        documentUrl: documentUrl || null,
        orderIndex: orderIndex || 0,
        quizOptions: quizOptions || null
      }
    })

    return NextResponse.json({ slide }, { status: 201 })
  } catch (error) {
    console.error('Failed to create slide:', error)
    return NextResponse.json(
      { error: 'Failed to create slide' },
      { status: 500 }
    )
  }
}
