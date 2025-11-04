import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/lessons/[id]/slides/[slideId] - Update slide (coach only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; slideId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slideId } = await params
    const body = await request.json()
    const { type, title, content, videoUrl, orderIndex, quizOptions } = body

    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex
    if (quizOptions !== undefined) updateData.quizOptions = quizOptions

    const slide = await prisma.slide.update({
      where: { id: slideId },
      data: updateData
    })

    return NextResponse.json({ slide })
  } catch (error) {
    console.error('Failed to update slide:', error)
    return NextResponse.json(
      { error: 'Failed to update slide' },
      { status: 500 }
    )
  }
}

// DELETE /api/lessons/[id]/slides/[slideId] - Delete slide (coach only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; slideId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slideId } = await params
    await prisma.slide.delete({
      where: { id: slideId }
    })

    return NextResponse.json({ message: 'Slide deleted successfully' })
  } catch (error) {
    console.error('Failed to delete slide:', error)
    return NextResponse.json(
      { error: 'Failed to delete slide' },
      { status: 500 }
    )
  }
}
