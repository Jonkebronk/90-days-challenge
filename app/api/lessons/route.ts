import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lessons = await prisma.lesson.findMany({
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json({
      success: true,
      lessons,
    })
  } catch (error) {
    console.error('Failed to fetch lessons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      subtitle,
      content,
      coverImage,
      attachments,
      videoUrl,
      audioUrl,
      visibility,
      orderIndex,
    } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        subtitle,
        content,
        coverImage,
        attachments: attachments || [],
        videoUrl,
        audioUrl,
        visibility: visibility || 'all',
        orderIndex,
      },
    })

    return NextResponse.json({
      success: true,
      lesson,
    })
  } catch (error) {
    console.error('Failed to create lesson:', error)
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    )
  }
}
