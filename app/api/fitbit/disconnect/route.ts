import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/fitbit/disconnect - Disconnect Fitbit account
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    // Delete Fitbit account (this also deletes related data due to cascade)
    await prisma.fitbitAccount.delete({
      where: { userId },
    })

    // Optionally delete cached step data
    await prisma.dailySteps.deleteMany({
      where: { userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting Fitbit:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Fitbit' },
      { status: 500 }
    )
  }
}
