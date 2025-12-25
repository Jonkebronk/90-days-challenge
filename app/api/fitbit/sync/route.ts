import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncUserSteps } from '@/lib/fitbit/sync-steps'

// POST /api/fitbit/sync - Manual sync of step data
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    // Sync last 7 days
    const result = await syncUserSteps(userId, 7)

    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Error syncing Fitbit data:', error)
    return NextResponse.json(
      { error: 'Failed to sync Fitbit data' },
      { status: 500 }
    )
  }
}
