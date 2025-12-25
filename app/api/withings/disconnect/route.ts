import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteWeightSubscription } from '@/lib/withings/subscriptions'

// POST /api/withings/disconnect - Disconnect Withings account
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    // Delete webhook subscription first (while we still have tokens)
    try {
      await deleteWeightSubscription(userId)
    } catch (subError) {
      console.error('Error deleting Withings subscription:', subError)
      // Continue anyway - we still want to disconnect
    }

    // Delete Withings account
    await prisma.withingsAccount.delete({
      where: { userId },
    })

    // Note: We keep the weight data (DailyWeight) since it's still valid historical data
    // User can manually delete weights if they want

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting Withings:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Withings' },
      { status: 500 }
    )
  }
}
