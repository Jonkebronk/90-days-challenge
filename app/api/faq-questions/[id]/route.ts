import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/faq-questions/[id] - Get single question
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const question = await prisma.faqQuestion.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error fetching FAQ question:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FAQ question' },
      { status: 500 }
    )
  }
}

// PATCH /api/faq-questions/[id] - Update question (coach only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const question = await prisma.faqQuestion.update({
      where: { id },
      data: {
        categoryId: body.categoryId,
        question: body.question,
        answer: body.answer,
        orderIndex: body.orderIndex,
        published: body.published,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error updating FAQ question:', error)
    return NextResponse.json(
      { error: 'Failed to update FAQ question' },
      { status: 500 }
    )
  }
}

// DELETE /api/faq-questions/[id] - Delete question (coach only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.faqQuestion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting FAQ question:', error)
    return NextResponse.json(
      { error: 'Failed to delete FAQ question' },
      { status: 500 }
    )
  }
}
