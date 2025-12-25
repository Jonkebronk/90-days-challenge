import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncUserSteps } from '@/lib/fitbit/sync-steps'
import { syncUserSleep } from '@/lib/fitbit/sync-sleep'

// POST /api/fitbit/sync - Manual sync of step and sleep data
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    // Sync last 7 days of steps and sleep in parallel
    const [stepsResult, sleepResult] = await Promise.all([
      syncUserSteps(userId, 7),
      syncUserSleep(userId, 7),
    ])

    return NextResponse.json({
      success: true,
      steps: {
        synced: stepsResult.synced,
        errors: stepsResult.errors,
      },
      sleep: {
        synced: sleepResult.synced,
        errors: sleepResult.errors,
      },
    })
  } catch (error) {
    console.error('Error syncing Fitbit data:', error)
    return NextResponse.json(
      { error: 'Failed to sync Fitbit data' },
      { status: 500 }
    )
  }
}
