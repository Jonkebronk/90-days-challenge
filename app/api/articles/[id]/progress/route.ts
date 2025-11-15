import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, differenceInDays, startOfWeek, endOfWeek } from 'date-fns'

// POST /api/articles/[id]/progress - Mark article as read/update progress
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: articleId } = await params
    const body = await request.json()
    const { completed } = body

    const userId = session.user.id as string

    // Check if progress already exists
    const existingProgress = await prisma.articleProgress.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId
        }
      }
    })

    let progress

    if (existingProgress) {
      // Update existing progress
      progress = await prisma.articleProgress.update({
        where: {
          userId_articleId: {
            userId,
            articleId
          }
        },
        data: {
          completed: completed !== undefined ? completed : existingProgress.completed,
          completedAt: completed ? new Date() : existingProgress.completedAt,
          lastReadAt: new Date()
        }
      })
    } else {
      // Create new progress
      progress = await prisma.articleProgress.create({
        data: {
          userId,
          articleId,
          completed: completed || false,
          completedAt: completed ? new Date() : null,
          lastReadAt: new Date()
        }
      })
    }

    // Update streak if article was marked as completed
    if (completed) {
      await updateReadingStreak(userId)
      await updateWeeklyGoal(userId)
    }

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Error updating article progress:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}

// Helper function to update reading streak
async function updateReadingStreak(userId: string) {
  const today = startOfDay(new Date())

  // Get or create streak
  let streak = await prisma.readingStreak.findUnique({
    where: { userId }
  })

  if (!streak) {
    // Create new streak
    await prisma.readingStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastReadDate: today
      }
    })
    return
  }

  // Check if already read today
  if (streak.lastReadDate && startOfDay(streak.lastReadDate).getTime() === today.getTime()) {
    return // Already counted for today
  }

  // Calculate days since last read
  const daysSinceLastRead = streak.lastReadDate
    ? differenceInDays(today, startOfDay(streak.lastReadDate))
    : 999

  let newStreak = 1
  if (daysSinceLastRead === 1) {
    // Consecutive day - increment streak
    newStreak = streak.currentStreak + 1
  } else if (daysSinceLastRead > 1) {
    // Streak broken - reset to 1
    newStreak = 1
  }

  // Update longest streak if needed
  const newLongestStreak = Math.max(streak.longestStreak, newStreak)

  await prisma.readingStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastReadDate: today
    }
  })
}

// Helper function to update weekly goal progress
async function updateWeeklyGoal(userId: string) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  // Get or create weekly goal
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

  // Count articles completed this week
  const articlesThisWeek = await prisma.articleProgress.count({
    where: {
      userId,
      completed: true,
      completedAt: {
        gte: weekStart,
        lte: weekEnd
      }
    }
  })

  // Update weekly goal
  await prisma.weeklyGoal.update({
    where: {
      userId_weekStartDate: {
        userId,
        weekStartDate: weekStart
      }
    },
    data: {
      articlesRead: articlesThisWeek,
      completed: articlesThisWeek >= weeklyGoal.targetArticles
    }
  })
}
