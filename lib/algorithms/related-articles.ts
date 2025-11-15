import { prisma } from '@/lib/prisma'

export interface RelatedArticle {
  id: string
  title: string
  description: string | null
  categoryName: string
  phase: number | null
  estimatedReadingMinutes: number | null
  coverImage: string | null
  score: number // 0-1, relevance score
}

/**
 * Get related articles based on category, phase, tags, and reading history
 * @param articleId - The current article ID
 * @param userId - The user ID for personalization
 * @param limit - Maximum number of related articles to return
 * @returns Array of related articles sorted by relevance
 */
export async function getRelatedArticles(
  articleId: string,
  userId: string,
  limit: number = 3
): Promise<RelatedArticle[]> {
  // Get source article
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      category: true,
      progress: {
        where: { userId },
      },
    },
  })

  if (!article) return []

  // Find related articles based on multiple factors
  const candidates = await prisma.article.findMany({
    where: {
      id: { not: articleId },
      published: true,
      OR: [
        // Same category
        { categoryId: article.categoryId },
        // Same phase
        { phase: article.phase },
        // Next phase (for progression)
        { phase: article.phase ? article.phase + 1 : null },
      ],
    },
    include: {
      category: true,
      progress: {
        where: { userId },
      },
    },
    take: 20, // Get more candidates for scoring
  })

  // Score each candidate
  const scored = candidates.map((candidate) => {
    let score = 0

    // Same category: +0.5
    if (candidate.categoryId === article.categoryId) {
      score += 0.5
    }

    // Same phase: +0.3
    if (candidate.phase === article.phase) {
      score += 0.3
    }

    // Next phase (progression): +0.4
    if (article.phase && candidate.phase === article.phase + 1) {
      score += 0.4
    }

    // Tags overlap (if implemented)
    const sharedTags =
      article.tags?.filter((tag) => candidate.tags?.includes(tag))?.length || 0
    score += sharedTags * 0.1

    // Penalize if already read: -0.8
    if (candidate.progress.some((p) => p.completed)) {
      score -= 0.8
    }

    // Boost if not started yet: +0.2
    if (candidate.progress.length === 0) {
      score += 0.2
    }

    return {
      id: candidate.id,
      title: candidate.title,
      description: candidate.content.substring(0, 150) || null, // Use content preview as description
      categoryName: candidate.category.name,
      phase: candidate.phase,
      estimatedReadingMinutes: candidate.estimatedReadingMinutes,
      coverImage: candidate.coverImage,
      score: Math.max(0, Math.min(1, score)), // Clamp 0-1
    }
  })

  // Sort by score and take top N
  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Get the next article in a series (same category, next in order)
 * @param articleId - The current article ID
 * @param userId - The user ID
 * @returns The next article in the series, or null
 */
export async function getNextInSeries(
  articleId: string,
  userId: string
): Promise<RelatedArticle | null> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  })

  if (!article) return null

  // Find next article in same category with higher orderIndex
  const next = await prisma.article.findFirst({
    where: {
      categoryId: article.categoryId,
      orderIndex: { gt: article.orderIndex },
      id: { not: articleId },
      published: true,
    },
    include: {
      category: true,
      progress: {
        where: { userId },
      },
    },
    orderBy: {
      orderIndex: 'asc',
    },
  })

  if (!next) return null

  return {
    id: next.id,
    title: next.title,
    description: next.content.substring(0, 150) || null,
    categoryName: next.category.name,
    phase: next.phase,
    estimatedReadingMinutes: next.estimatedReadingMinutes,
    coverImage: next.coverImage,
    score: 1.0,
  }
}

/**
 * Get articles from the next phase for progression
 * @param currentPhase - The current phase (1, 2, or 3)
 * @param userId - The user ID
 * @param limit - Maximum number of articles to return
 * @returns Array of next phase articles
 */
export async function getNextPhaseArticles(
  currentPhase: number,
  userId: string,
  limit: number = 3
): Promise<RelatedArticle[]> {
  const nextPhase = currentPhase + 1

  if (nextPhase > 3) return []

  const articles = await prisma.article.findMany({
    where: {
      phase: nextPhase,
      published: true,
    },
    include: {
      category: true,
      progress: {
        where: { userId },
      },
    },
    take: limit,
    orderBy: {
      orderIndex: 'asc',
    },
  })

  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    description: article.content.substring(0, 150) || null,
    categoryName: article.category.name,
    phase: article.phase,
    estimatedReadingMinutes: article.estimatedReadingMinutes,
    coverImage: article.coverImage,
    score: 0.9,
  }))
}
