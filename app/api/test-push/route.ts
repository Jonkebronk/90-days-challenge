import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendPushNotification } from '@/lib/push-notifications'
import { prisma } from '@/lib/prisma'

// POST - Send a test push notification to yourself
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check if user has any push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, token: true, createdAt: true },
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No push subscriptions found for your account',
        subscriptionCount: 0,
      })
    }

    // Send test notification
    const result = await sendPushNotification(
      userId,
      'Test-notifikation',
      'Om du ser detta fungerar push-notiser korrekt!',
      '/dashboard',
      { type: 'test' }
    )

    return NextResponse.json({
      success: result.sent > 0,
      sent: result.sent,
      failed: result.failed,
      subscriptionCount: subscriptions.length,
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        tokenPreview: s.token.substring(0, 20) + '...',
        createdAt: s.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error sending test push:', error)
    return NextResponse.json(
      { error: 'Failed to send test notification', details: String(error) },
      { status: 500 }
    )
  }
}

// GET - Check push subscription status
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, token: true, createdAt: true },
    })

    return NextResponse.json({
      subscriptionCount: subscriptions.length,
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        tokenPreview: s.token.substring(0, 30) + '...',
        createdAt: s.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error checking push status:', error)
    return NextResponse.json(
      { error: 'Failed to check push status' },
      { status: 500 }
    )
  }
}
