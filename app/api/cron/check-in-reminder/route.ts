import { NextRequest, NextResponse } from 'next/server'
import { sendCheckInReminders } from '@/lib/push-notifications'

// GET /api/cron/check-in-reminder - Send check-in reminders to all active clients
// This endpoint should be called by a cron job on Sundays
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sendCheckInReminders()

    return NextResponse.json({
      success: true,
      message: `Sent ${result.sent} reminders to ${result.total} clients`,
      ...result,
    })
  } catch (error) {
    console.error('Error sending check-in reminders:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}

// POST - Alternative method if GET doesn't work with cron service
export async function POST(request: NextRequest) {
  return GET(request)
}
