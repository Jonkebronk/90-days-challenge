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

    const userId = session.user.id

    // Get all published learning paths with progress
    const paths = await prisma.learningPath.findMany({
      where: { published: true },
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
        },
        pathAssignments: {
          where: { userId }
        }
      },
      orderBy: { orderIndex: 'asc' }
    })

    // Calculate progress for each path
    const pathsWithProgress = paths.map(path => {
      const totalArticles = path.pathArticles.filter(pa => !pa.isOptional).length
      const completedArticles = path.pathArticles.filter(pa =>
        !pa.isOptional && pa.article.progress.some(p => p.completed)
      ).length

      const progress = totalArticles > 0
        ? Math.round((completedArticles / totalArticles) * 100)
        : 0

      // Check if prerequisites are met
      const prerequisitesMet = path.prerequisitePathIds.length === 0 ||
        path.prerequisitePathIds.every(prereqId => {
          const prereqPath = paths.find(p => p.id === prereqId)
          return prereqPath?.pathProgress.some(pp => pp.completed)
        })

      return {
        id: path.id,
        title: path.title,
        description: path.description,
        slug: path.slug,
        coverImage: path.coverImage,
        difficulty: path.difficulty,
        orderIndex: path.orderIndex,
        estimatedDuration: path.estimatedDuration,
        totalArticles,
        completedArticles,
        progress,
        isLocked: !prerequisitesMet,
        isStarted: path.pathProgress.some(pp => pp.started),
        isCompleted: path.pathProgress.some(pp => pp.completed),
        isAssigned: path.pathAssignments.length > 0,
        dueDate: path.pathAssignments[0]?.dueDate || null
      }
    })

    return NextResponse.json({ paths: pathsWithProgress })
  } catch (error) {
    console.error('Learning paths error:', error)
    return NextResponse.json(
      { error: 'Failed to get learning paths' },
      { status: 500 }
    )
  }
}
