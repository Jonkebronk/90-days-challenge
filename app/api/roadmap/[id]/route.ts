import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/roadmap/[id] - Update roadmap assignment
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { dayNumber, orderIndex, prerequisiteArticleIds } = body

    const updateData: any = {}
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex
    if (prerequisiteArticleIds !== undefined) updateData.prerequisiteArticleIds = prerequisiteArticleIds

    if (dayNumber !== undefined) {
      updateData.dayNumber = dayNumber
      // Recalculate phase
      let phase = 1
      if (dayNumber > 60) phase = 3
      else if (dayNumber > 30) phase = 2
      updateData.phase = phase
    }

    const assignment = await prisma.roadmapAssignment.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating roadmap assignment:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

// DELETE /api/roadmap/[id] - Delete roadmap assignment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    await prisma.roadmapAssignment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting roadmap assignment:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
