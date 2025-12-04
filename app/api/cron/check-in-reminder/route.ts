import { NextRequest, NextResponse } from 'next/server'
import { sendCheckInReminders } from '@/lib/push-notifications'
import { sendCheckInReminderEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

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

    // Send push notifications
    const pushResult = await sendCheckInReminders()

    // Send emails to all active clients
    const clients = await prisma.user.findMany({
      where: {
        role: 'client',
        status: 'active',
        email: { not: '' },
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        coach: {
          select: { name: true },
        },
      },
    })

    let emailsSent = 0
    let emailsFailed = 0

    for (const client of clients) {
      if (!client.email) continue

      const clientName = client.name || client.firstName || undefined
      const coachName = client.coach?.name || undefined

      const success = await sendCheckInReminderEmail(
        client.email,
        clientName,
        coachName
      )

      if (success) {
        emailsSent++
      } else {
        emailsFailed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Påminnelser skickade: ${pushResult.sent} push, ${emailsSent} e-post`,
      push: pushResult,
      email: {
        total: clients.length,
        sent: emailsSent,
        failed: emailsFailed,
      },
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
