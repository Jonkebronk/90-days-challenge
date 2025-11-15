import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: pathId } = await params
    const userId = session.user.id

    // Get path with all details
    const path = await prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        pathArticles: {
          include: {
            article: {
              include: {
                category: true,
                progress: {
                  where: { userId }
                }
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        pathProgress: {
          where: { userId }
        }
      }
    })

    if (!path) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 })
    }

    // Check if prerequisites are met
    const prerequisitesMet = path.prerequisitePathIds.length === 0 ||
      await checkPrerequisites(path.prerequisitePathIds, userId)

    // Calculate progress
    const totalArticles = path.pathArticles.filter(pa => !pa.isOptional).length
    const completedArticles = path.pathArticles.filter(pa =>
      !pa.isOptional && pa.article.progress.some(p => p.completed)
    ).length

    const progress = totalArticles > 0
      ? Math.round((completedArticles / totalArticles) * 100)
      : 0

    // Map articles with lock status
    const articles = await Promise.all(path.pathArticles.map(async (pa) => {
      const articlePrereqsMet = pa.prerequisiteArticleIds.length === 0 ||
        await checkArticlePrerequisites(pa.prerequisiteArticleIds, userId)

      return {
        id: pa.article.id,
        title: pa.article.title,
        slug: pa.article.slug,
        categoryName: pa.article.category.name,
        categoryColor: pa.article.category.color,
        categoryIcon: pa.article.category.icon,
        phase: pa.article.phase,
        difficulty: pa.article.difficulty,
        estimatedReadingMinutes: pa.article.estimatedReadingMinutes,
        coverImage: pa.article.coverImage,
        orderIndex: pa.orderIndex,
        isOptional: pa.isOptional,
        isCompleted: pa.article.progress.some(p => p.completed),
        isLocked: !prerequisitesMet || !articlePrereqsMet,
        prerequisiteArticleIds: pa.prerequisiteArticleIds
      }
    }))

    return NextResponse.json({
      path: {
        id: path.id,
        title: path.title,
        description: path.description,
        slug: path.slug,
        coverImage: path.coverImage,
        difficulty: path.difficulty,
        estimatedDuration: path.estimatedDuration,
        prerequisitePathIds: path.prerequisitePathIds,
        totalArticles,
        completedArticles,
        progress,
        isLocked: !prerequisitesMet,
        isStarted: path.pathProgress.some(pp => pp.started),
        isCompleted: path.pathProgress.some(pp => pp.completed)
      },
      articles
    })
  } catch (error) {
    console.error('Learning path error:', error)
    return NextResponse.json(
      { error: 'Failed to get learning path' },
      { status: 500 }
    )
  }
}

// Start or update path progress
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: pathId } = await params
    const userId = session.user.id
    const { action } = await req.json()

    if (action === 'start') {
      // Mark path as started
      await prisma.pathProgress.upsert({
        where: {
          userId_pathId: {
            userId,
            pathId
          }
        },
        update: {
          started: true,
          startedAt: new Date()
        },
        create: {
          userId,
          pathId,
          started: true,
          startedAt: new Date()
        }
      })

      return NextResponse.json({ success: true })
    }

    // Check if path is complete
    if (action === 'check-completion') {
      const path = await prisma.learningPath.findUnique({
        where: { id: pathId },
        include: {
          pathArticles: {
            include: {
              article: {
                include: {
                  progress: {
                    where: { userId, completed: true }
                  }
                }
              }
            }
          }
        }
      })

      if (!path) {
        return NextResponse.json({ error: 'Path not found' }, { status: 404 })
      }

      const requiredArticles = path.pathArticles.filter(pa => !pa.isOptional)
      const completedRequired = requiredArticles.filter(pa =>
        pa.article.progress.length > 0
      )

      const isComplete = requiredArticles.length === completedRequired.length

      if (isComplete) {
        await prisma.pathProgress.upsert({
          where: {
            userId_pathId: {
              userId,
              pathId
            }
          },
          update: {
            completed: true,
            completedAt: new Date()
          },
          create: {
            userId,
            pathId,
            started: true,
            startedAt: new Date(),
            completed: true,
            completedAt: new Date()
          }
        })
      }

      return NextResponse.json({ isComplete })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Path progress error:', error)
    return NextResponse.json(
      { error: 'Failed to update path progress' },
      { status: 500 }
    )
  }
}

async function checkPrerequisites(pathIds: string[], userId: string): Promise<boolean> {
  const progress = await prisma.pathProgress.findMany({
    where: {
      userId,
      pathId: { in: pathIds },
      completed: true
    }
  })

  return progress.length === pathIds.length
}

async function checkArticlePrerequisites(articleIds: string[], userId: string): Promise<boolean> {
  const progress = await prisma.articleProgress.findMany({
    where: {
      userId,
      articleId: { in: articleIds },
      completed: true
    }
  })

  return progress.length === articleIds.length
}
