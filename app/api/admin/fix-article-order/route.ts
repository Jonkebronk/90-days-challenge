import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/fix-article-order - Fix duplicate orderIndex values
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Only coaches can run this
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fixing article orderIndex values...')

    // Get all categories with their articles
    const categories = await prisma.articleCategory.findMany({
      include: {
        articles: {
          orderBy: { createdAt: 'asc' } // Use creation time as initial order
        }
      }
    })

    const results: Array<{
      category: string
      articles: Array<{ title: string; newOrderIndex: number }>
    }> = []

    for (const category of categories) {
      const categoryResult: {
        category: string
        articles: Array<{ title: string; newOrderIndex: number }>
      } = {
        category: category.name,
        articles: []
      }

      for (let i = 0; i < category.articles.length; i++) {
        const article = category.articles[i]
        await prisma.article.update({
          where: { id: article.id },
          data: { orderIndex: i }
        })
        categoryResult.articles.push({
          title: article.title,
          newOrderIndex: i
        })
      }

      results.push(categoryResult)
    }

    console.log('✅ Done! All articles now have unique orderIndex values.')

    return NextResponse.json({
      success: true,
      message: 'Article orderIndex values fixed',
      results
    })
  } catch (error) {
    console.error('Error fixing article order:', error)
    return NextResponse.json({ error: 'Failed to fix article order' }, { status: 500 })
  }
}
