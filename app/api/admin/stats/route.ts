import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get counts
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalClients,
      totalExercises,
      totalPrograms,
      totalArticles,
      totalRecipes,
      totalLessons,
      totalSessions,
      recentSessions,
      recentCheckIns,
      recentWorkoutSessions
    ] = await Promise.all([
      // Total clients
      prisma.user.count({
        where: {
          role: 'CLIENT'
        }
      }),
      // Total exercises
      prisma.exercise.count(),
      // Total workout programs
      prisma.workoutProgram.count(),
      // Total articles
      prisma.article.count(),
      // Total recipes
      prisma.recipe.count(),
      // Total lessons
      prisma.lesson.count(),
      // Total workout sessions
      prisma.workoutSessionLog.count(),
      // Recent workout sessions (last 7 days)
      prisma.workoutSessionLog.count({
        where: {
          startedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Recent check-ins (last 30 days)
      prisma.checkIn.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      }),
      // Recent workout sessions by user (last 30 days)
      prisma.workoutSessionLog.findMany({
        where: {
          startedAt: {
            gte: thirtyDaysAgo
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      })
    ])

    // Calculate active clients (users with recent check-ins or workouts)
    const activeUserIds = new Set([
      ...recentCheckIns.map(c => c.userId),
      ...recentWorkoutSessions.map(s => s.userId)
    ])
    const activeClients = activeUserIds.size

    return NextResponse.json({
      totalClients,
      activeClients,
      totalExercises,
      totalPrograms,
      totalArticles,
      totalRecipes,
      totalLessons,
      totalSessions,
      recentSessions
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
