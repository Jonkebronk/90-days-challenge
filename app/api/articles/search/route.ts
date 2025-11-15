import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim() || ''
    const categoryId = searchParams.get('categoryId')
    const phase = searchParams.get('phase')
    const difficulty = searchParams.get('difficulty')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query && !categoryId && !phase && !difficulty) {
      return NextResponse.json({
        articles: [],
        total: 0,
        hasMore: false
      })
    }

    // Build search filters
    const filters: any = {
      published: true,
      AND: []
    }

    // Text search on title and content
    if (query) {
      filters.AND.push({
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            tags: {
              hasSome: [query.toLowerCase()]
            }
          }
        ]
      })
    }

    // Category filter
    if (categoryId) {
      filters.AND.push({ categoryId })
    }

    // Phase filter
    if (phase) {
      filters.AND.push({ phase: parseInt(phase) })
    }

    // Difficulty filter
    if (difficulty) {
      filters.AND.push({ difficulty })
    }

    // Execute search with pagination
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: filters,
        include: {
          category: true,
          progress: {
            where: { userId: session.user.id }
          }
        },
        take: limit,
        skip: offset,
        orderBy: [
          { updatedAt: 'desc' } // Most recently updated first
        ]
      }),
      prisma.article.count({ where: filters })
    ])

    // Calculate relevance score for each article
    const scoredArticles = articles.map(article => {
      let score = 0
      const lowerQuery = query.toLowerCase()

      // Title match: +10 points
      if (article.title.toLowerCase().includes(lowerQuery)) {
        score += 10
        // Exact title match: +20 points
        if (article.title.toLowerCase() === lowerQuery) {
          score += 20
        }
        // Title starts with query: +5 points
        if (article.title.toLowerCase().startsWith(lowerQuery)) {
          score += 5
        }
      }

      // Content match: +3 points
      if (article.content.toLowerCase().includes(lowerQuery)) {
        score += 3
      }

      // Tag match: +7 points per matching tag
      const matchingTags = article.tags.filter(tag =>
        tag.toLowerCase().includes(lowerQuery)
      ).length
      score += matchingTags * 7

      // Category name match: +5 points
      if (article.category.name.toLowerCase().includes(lowerQuery)) {
        score += 5
      }

      // Generate highlighted snippets
      const snippets = extractSnippets(article.content, query, 3)

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        categoryId: article.categoryId,
        categoryName: article.category.name,
        categoryColor: article.category.color,
        categoryIcon: article.category.icon,
        phase: article.phase,
        difficulty: article.difficulty,
        estimatedReadingMinutes: article.estimatedReadingMinutes,
        coverImage: article.coverImage,
        tags: article.tags,
        isRead: article.progress.some(p => p.completed),
        score,
        snippets, // Highlighted text excerpts
        updatedAt: article.updatedAt
      }
    })

    // Sort by relevance score (highest first)
    scoredArticles.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      articles: scoredArticles,
      total,
      hasMore: offset + limit < total,
      query,
      filters: {
        categoryId,
        phase,
        difficulty
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search articles' },
      { status: 500 }
    )
  }
}

/**
 * Extract text snippets around search query matches
 */
function extractSnippets(
  content: string,
  query: string,
  maxSnippets: number = 3
): string[] {
  if (!query) return []

  const snippets: string[] = []
  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const snippetLength = 150 // Characters before and after match

  let searchStart = 0
  while (snippets.length < maxSnippets) {
    const matchIndex = lowerContent.indexOf(lowerQuery, searchStart)
    if (matchIndex === -1) break

    const start = Math.max(0, matchIndex - snippetLength)
    const end = Math.min(content.length, matchIndex + query.length + snippetLength)

    let snippet = content.substring(start, end)

    // Add ellipsis if not at start/end
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'

    // Highlight the match
    const highlightStart = snippet.toLowerCase().indexOf(lowerQuery)
    if (highlightStart !== -1) {
      snippet =
        snippet.substring(0, highlightStart) +
        '**' + snippet.substring(highlightStart, highlightStart + query.length) + '**' +
        snippet.substring(highlightStart + query.length)
    }

    snippets.push(snippet.trim())
    searchStart = matchIndex + query.length
  }

  return snippets
}
