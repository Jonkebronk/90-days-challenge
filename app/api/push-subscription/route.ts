import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Save a new push subscription token
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token, device } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Upsert the subscription (update if exists, create if not)
    const subscription = await prisma.pushSubscription.upsert({
      where: { token },
      update: {
        userId: session.user.id,
        device: device || 'web',
      },
      create: {
        userId: session.user.id,
        token,
        device: device || 'web',
      },
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        device: subscription.device,
      },
    })
  } catch (error) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a push subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Delete the subscription
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        token,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}

// GET - Check if user has any active subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        device: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      hasSubscriptions: subscriptions.length > 0,
      count: subscriptions.length,
      subscriptions,
    })
  } catch (error) {
    console.error('Error fetching push subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}
