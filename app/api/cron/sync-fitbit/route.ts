import { NextRequest, NextResponse } from 'next/server'
import { syncAllUsers } from '@/lib/fitbit/sync-steps'

// POST /api/cron/sync-fitbit - Daily sync of all Fitbit users
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting Fitbit sync cron job...')

    // Sync last 2 days for all users
    const result = await syncAllUsers(2)

    console.log(`Fitbit sync completed: ${result.users} users, ${result.totalSynced} synced, ${result.totalErrors} errors`)

    return NextResponse.json({
      success: true,
      users: result.users,
      synced: result.totalSynced,
      errors: result.totalErrors,
    })
  } catch (error) {
    console.error('Error in Fitbit sync cron:', error)
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}

// Also allow GET for Vercel Cron
export async function GET(req: NextRequest) {
  return POST(req)
}
