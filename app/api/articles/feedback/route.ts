import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const feedbackSchema = z.object({
  articleId: z.string(),
  isHelpful: z.boolean(),
  comment: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { articleId, isHelpful, comment } = feedbackSchema.parse(body)

    // Upsert feedback (update if exists, create if not)
    const feedback = await prisma.articleFeedback.upsert({
      where: {
        articleId_userId: {
          articleId,
          userId: session.user.id,
        },
      },
      update: {
        isHelpful,
        comment,
      },
      create: {
        articleId,
        userId: session.user.id,
        isHelpful,
        comment,
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }

    const feedback = await prisma.articleFeedback.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Get feedback error:', error)
    return NextResponse.json({ error: 'Failed to get feedback' }, { status: 500 })
  }
}
