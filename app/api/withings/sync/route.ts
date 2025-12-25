import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncUserWeight } from '@/lib/withings/sync-weight'

// GET /api/withings/sync - Check connection status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    // Check if user has a Withings account
    const withingsAccount = await prisma.withingsAccount.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      connected: !!withingsAccount,
    })
  } catch (error) {
    console.error('Error checking Withings status:', error)
    return NextResponse.json({ connected: false })
  }
}

// POST /api/withings/sync - Manual sync of weight data
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    // Check if user has a Withings account
    const withingsAccount = await prisma.withingsAccount.findUnique({
      where: { userId },
    })

    if (!withingsAccount) {
      return NextResponse.json({
        success: false,
        connected: false,
        synced: 0,
        errors: ['Not connected to Withings'],
      })
    }

    // Sync last 30 days of weight data
    const result = await syncUserWeight(userId, 30)

    return NextResponse.json({
      success: true,
      connected: true,
      synced: result.synced,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Error syncing Withings:', error)
    return NextResponse.json(
      { error: 'Failed to sync Withings data' },
      { status: 500 }
    )
  }
}
