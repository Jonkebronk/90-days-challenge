import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRelatedArticles, getNextInSeries } from '@/lib/algorithms/related-articles'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const articleId = searchParams.get('articleId')
    const limit = parseInt(searchParams.get('limit') || '3')

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }

    const [related, next] = await Promise.all([
      getRelatedArticles(articleId, session.user.id, limit),
      getNextInSeries(articleId, session.user.id),
    ])

    return NextResponse.json({
      related,
      next,
    })
  } catch (error) {
    console.error('Related articles error:', error)
    return NextResponse.json({ error: 'Failed to get related articles' }, { status: 500 })
  }
}
