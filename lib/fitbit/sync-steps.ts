import { prisma } from '@/lib/prisma'
import { fetchDailyActivity } from './client'

// Sync step data for a user for the last N days
export async function syncUserSteps(
  userId: string,
  days: number = 7
): Promise<{ synced: number; errors: number }> {
  let synced = 0
  let errors = 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    try {
      const activity = await fetchDailyActivity(userId, date)

      if (activity) {
        // Upsert step data
        await prisma.dailySteps.upsert({
          where: {
            userId_date: {
              userId,
              date,
            },
          },
          create: {
            userId,
            date,
            steps: activity.steps,
            goal: activity.goal,
          },
          update: {
            steps: activity.steps,
            goal: activity.goal,
            syncedAt: new Date(),
          },
        })
        synced++
      }
    } catch (error) {
      console.error(`Failed to sync steps for ${date.toISOString()}:`, error)
      errors++
    }
  }

  return { synced, errors }
}

// Sync all users with Fitbit connected
export async function syncAllUsers(days: number = 2): Promise<{
  users: number
  totalSynced: number
  totalErrors: number
}> {
  const fitbitAccounts = await prisma.fitbitAccount.findMany({
    select: { userId: true },
  })

  let totalSynced = 0
  let totalErrors = 0

  for (const account of fitbitAccounts) {
    try {
      const result = await syncUserSteps(account.userId, days)
      totalSynced += result.synced
      totalErrors += result.errors
    } catch (error) {
      console.error(`Failed to sync user ${account.userId}:`, error)
      totalErrors++
    }
  }

  return {
    users: fitbitAccounts.length,
    totalSynced,
    totalErrors,
  }
}
