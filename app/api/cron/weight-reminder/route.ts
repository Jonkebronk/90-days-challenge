import { NextRequest, NextResponse } from 'next/server'
import { sendWeightReminders } from '@/lib/push-notifications'

// GET /api/cron/weight-reminder - Send daily weight reminders
// This endpoint should be called by a cron job every morning
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sendWeightReminders()

    return NextResponse.json({
      success: true,
      message: `Sent ${result.sent} weight reminders to ${result.total} users`,
      ...result,
    })
  } catch (error) {
    console.error('Error sending weight reminders:', error)
    return NextResponse.json(
      { error: 'Failed to send weight reminders' },
      { status: 500 }
    )
  }
}

// POST - Alternative method if GET doesn't work with cron service
export async function POST(request: NextRequest) {
  return GET(request)
}
