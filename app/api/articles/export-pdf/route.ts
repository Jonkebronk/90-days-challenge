import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { KnowledgeBasePDF } from '@/components/pdf'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const audience = searchParams.get('audience') || 'client'
    const categoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean)

    // Validate audience parameter
    if (audience !== 'client' && audience !== 'coach') {
      return NextResponse.json({ error: 'Invalid audience parameter' }, { status: 400 })
    }

    // Coach articles require coach role
    if (audience === 'coach' && (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized to access coach content' }, { status: 403 })
    }

    // Build category filter
    const categoryFilter: any = {
      audience,
    }
    if (categoryIds && categoryIds.length > 0) {
      categoryFilter.id = { in: categoryIds }
    }

    // Fetch categories with their articles
    const categories = await prisma.articleCategory.findMany({
      where: categoryFilter,
      orderBy: { orderIndex: 'asc' },
      include: {
        articles: {
          where: {
            published: true,
          },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            content: true,
            difficulty: true,
            estimatedReadingMinutes: true,
            orderIndex: true,
          },
        },
      },
    })

    // Filter out categories with no articles
    const categoriesWithArticles = categories.filter(cat => cat.articles.length > 0)

    if (categoriesWithArticles.length === 0) {
      return NextResponse.json({ error: 'No articles found' }, { status: 404 })
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      KnowledgeBasePDF({
        categories: categoriesWithArticles,
        audience: audience as 'client' | 'coach',
      })
    )

    // Return PDF as downloadable file
    const filename = audience === 'coach'
      ? 'coach-kunskapsbank.pdf'
      : 'kunskapsbank.pdf'

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer)

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
