import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/clients/[clientId]/cardio - Get active cardio program for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Check authorization - user can access their own, coach can access their clients
    const isOwnProfile = clientId === session.user.id
    const isCoach = (session.user as any).role === 'coach'

    if (!isOwnProfile && !isCoach) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If coach, verify client belongs to them
    if (isCoach && !isOwnProfile) {
      const client = await prisma.user.findFirst({
        where: {
          id: clientId,
          coachId: session.user.id,
        },
      })

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
    }

    // Get active cardio program
    const cardioProgram = await prisma.cardioProgram.findFirst({
      where: {
        userId: clientId,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ cardioProgram })
  } catch (error) {
    console.error('Error fetching client cardio:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cardio program' },
      { status: 500 }
    )
  }
}
