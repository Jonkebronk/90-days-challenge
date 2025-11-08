import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '90')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get workout sessions with sets
    const sessions = await prisma.workoutSessionLog.findMany({
      where: {
        userId,
        completedAt: {
          gte: startDate
        },
        completed: true
      },
      include: {
        sets: {
          include: {
            exercise: true
          }
        },
        workoutProgramDay: true
      },
      orderBy: {
        completedAt: 'asc'
      }
    })

    // Calculate volume progression over time
    const volumeProgression = sessions.map(session => {
      const totalVolume = session.sets.reduce((acc, set) => {
        if (set.reps && set.weightKg) {
          return acc + (set.reps * Number(set.weightKg))
        }
        return acc
      }, 0)

      return {
        date: session.completedAt?.toISOString().split('T')[0],
        volume: Math.round(totalVolume),
        workoutName: session.workoutProgramDay?.name || 'Workout'
      }
    })

    // Calculate workout frequency (workouts per week)
    const weeklyFrequency: Record<string, number> = {}
    sessions.forEach(session => {
      if (session.completedAt) {
        const weekStart = new Date(session.completedAt)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        weeklyFrequency[weekKey] = (weeklyFrequency[weekKey] || 0) + 1
      }
    })

    const frequencyData = Object.entries(weeklyFrequency).map(([week, count]) => ({
      week,
      workouts: count
    }))

    // Calculate body part volume distribution
    const muscleGroupVolume: Record<string, number> = {}
    sessions.forEach(session => {
      session.sets.forEach(set => {
        if (set.reps && set.weightKg) {
          const volume = set.reps * Number(set.weightKg)
          set.exercise.muscleGroups.forEach(muscle => {
            muscleGroupVolume[muscle] = (muscleGroupVolume[muscle] || 0) + volume
          })
        }
      })
    })

    const muscleDistribution = Object.entries(muscleGroupVolume)
      .map(([name, value]) => ({
        name,
        value: Math.round(value)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Top 8 muscle groups

    // Get PR progression
    const personalRecords = await prisma.personalRecord.findMany({
      where: {
        userId,
        achievedAt: {
          gte: startDate
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        achievedAt: 'asc'
      }
    })

    // Group PRs by exercise for progression
    const prProgression: Record<string, any[]> = {}
    for (const pr of personalRecords) {
      const exercise = await prisma.exercise.findUnique({
        where: { id: pr.exerciseId },
        select: { name: true }
      })

      if (exercise && pr.recordType === 'max_weight') {
        if (!prProgression[exercise.name]) {
          prProgression[exercise.name] = []
        }
        prProgression[exercise.name].push({
          date: pr.achievedAt.toISOString().split('T')[0],
          weight: Number(pr.weightKg)
        })
      }
    }

    // Summary statistics
    const totalWorkouts = sessions.length
    const totalSets = sessions.reduce((acc, s) => acc + s.sets.filter(set => set.completed).length, 0)
    const totalVolume = sessions.reduce((acc, session) => {
      return acc + session.sets.reduce((setAcc, set) => {
        if (set.reps && set.weightKg) {
          return setAcc + (set.reps * Number(set.weightKg))
        }
        return setAcc
      }, 0)
    }, 0)

    const avgSessionDuration = sessions
      .filter(s => s.durationMinutes)
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0) /
      (sessions.filter(s => s.durationMinutes).length || 1)

    return NextResponse.json({
      summary: {
        totalWorkouts,
        totalSets,
        totalVolume: Math.round(totalVolume),
        avgSessionDuration: Math.round(avgSessionDuration),
        avgWorkoutsPerWeek: (totalWorkouts / (days / 7)).toFixed(1)
      },
      volumeProgression,
      frequencyData,
      muscleDistribution,
      prProgression
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
