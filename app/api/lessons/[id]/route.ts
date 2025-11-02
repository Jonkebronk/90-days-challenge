import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(content && { content }),
        ...(coverImage !== undefined && { coverImage }),
        ...(attachments !== undefined && { attachments }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(audioUrl !== undefined && { audioUrl }),
        ...(visibility && { visibility }),
        ...(orderIndex !== undefined && { orderIndex }),
      },
    })

    return NextResponse.json({
      success: true,
      lesson,
    })
  } catch (error) {
    console.error('Failed to update lesson:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    await prisma.lesson.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete lesson:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    )
  }
}
