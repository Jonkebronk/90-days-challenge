import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user is a client, return their coach
    if (user.role === 'client') {
      return NextResponse.json({
        clients: [],
        coach: user.coach
      })
    }

    // If user is a coach, fetch all their clients
    const clients = await prisma.user.findMany({
      where: {
        coachId: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        invitationSentAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ clients, coach: null })
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}
