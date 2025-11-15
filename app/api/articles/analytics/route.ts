import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, startOfDay } from 'date-fns'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get or create reading streak
    let streak = await prisma.readingStreak.findUnique({
      where: { userId }
    })

    if (!streak) {
      streak = await prisma.readingStreak.create({
        data: { userId }
      })
    }

    // Get current week's goal
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday

    let weeklyGoal = await prisma.weeklyGoal.findUnique({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: weekStart
        }
      }
    })

    if (!weeklyGoal) {
      weeklyGoal = await prisma.weeklyGoal.create({
        data: {
          userId,
          weekStartDate: weekStart,
          targetArticles: 3
        }
      })
    }

    // Get all article progress
    const allProgress = await prisma.articleProgress.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            category: true
          }
        }
      }
    })

    // Calculate statistics
    const totalArticlesRead = allProgress.filter(p => p.completed).length
    const totalReadingTime = allProgress.reduce((sum, p) => sum + (p.readingTimeMinutes || 0), 0)

    // Articles read this week
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const articlesThisWeek = allProgress.filter(p =>
      p.completedAt &&
      p.completedAt >= weekStart &&
      p.completedAt <= weekEnd
    ).length

    // Articles read this month
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const articlesThisMonth = allProgress.filter(p =>
      p.completedAt &&
      p.completedAt >= monthStart &&
      p.completedAt <= monthEnd
    ).length

    // Reading by category
    const categoryStats = allProgress
      .filter(p => p.completed)
      .reduce((acc: any[], p) => {
        const categoryName = p.article.category.name
        const existing = acc.find(c => c.name === categoryName)
        if (existing) {
          existing.count++
        } else {
          acc.push({
            name: categoryName,
            count: 1,
            color: p.article.category.color
          })
        }
        return acc
      }, [])
      .sort((a, b) => b.count - a.count)

    // Reading over time (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(now, 29 - i)
      const dayStart = startOfDay(date)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const articlesRead = allProgress.filter(p =>
        p.completedAt &&
        p.completedAt >= dayStart &&
        p.completedAt <= dayEnd
      ).length

      return {
        date: dayStart.toISOString(),
        count: articlesRead
      }
    })

    // Phase progress
    const phaseProgress = [1, 2, 3].map(phase => {
      const phaseArticles = allProgress.filter(p => p.article.phase === phase)
      const completed = phaseArticles.filter(p => p.completed).length
      const total = phaseArticles.length

      return {
        phase,
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    })

    // Average reading time
    const completedWithTime = allProgress.filter(p => p.completed && p.readingTimeMinutes)
    const averageReadingTime = completedWithTime.length > 0
      ? Math.round(completedWithTime.reduce((sum, p) => sum + (p.readingTimeMinutes || 0), 0) / completedWithTime.length)
      : 0

    return NextResponse.json({
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        lastReadDate: streak.lastReadDate
      },
      weeklyGoal: {
        target: weeklyGoal.targetArticles,
        current: articlesThisWeek,
        percentage: Math.round((articlesThisWeek / weeklyGoal.targetArticles) * 100),
        completed: weeklyGoal.completed
      },
      totals: {
        articlesRead: totalArticlesRead,
        totalReadingTime,
        averageReadingTime,
        articlesThisWeek,
        articlesThisMonth
      },
      categoryStats,
      readingOverTime: last30Days,
      phaseProgress
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    )
  }
}

// Update weekly goal
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetArticles } = await req.json()
    const userId = session.user.id
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

    const weeklyGoal = await prisma.weeklyGoal.upsert({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: weekStart
        }
      },
      update: {
        targetArticles
      },
      create: {
        userId,
        weekStartDate: weekStart,
        targetArticles
      }
    })

    return NextResponse.json({ weeklyGoal })
  } catch (error) {
    console.error('Update weekly goal error:', error)
    return NextResponse.json(
      { error: 'Failed to update weekly goal' },
      { status: 500 }
    )
  }
}
