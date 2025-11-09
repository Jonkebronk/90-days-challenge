import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/faq-questions - Get all FAQ questions (with optional category filter)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const where = categoryId ? { categoryId } : {}

    const questions = await prisma.faqQuestion.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error fetching FAQ questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FAQ questions' },
      { status: 500 }
    )
  }
}

// POST /api/faq-questions - Create new FAQ question (coach only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const question = await prisma.faqQuestion.create({
      data: {
        categoryId: body.categoryId,
        question: body.question,
        answer: body.answer,
        orderIndex: body.orderIndex || 0,
        published: body.published !== undefined ? body.published : true,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    console.error('Error creating FAQ question:', error)
    return NextResponse.json(
      { error: 'Failed to create FAQ question' },
      { status: 500 }
    )
  }
}
