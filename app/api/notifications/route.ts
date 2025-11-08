import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role?.toUpperCase()
    if (userRole !== 'COACH') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get activities from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Fetch new leads
    const newLeads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        },
        status: 'new'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    // Fetch new check-ins
    const newCheckIns = await prisma.checkIn.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    // Build notification list
    const notifications = []

    // Add lead notifications
    for (const lead of newLeads) {
      notifications.push({
        id: `lead-${lead.id}`,
        type: 'NEW_LEAD',
        message: `Ny ansökan från ${lead.fullName || 'Okänd'}`,
        timestamp: lead.createdAt,
        link: `/dashboard/leads`,
        data: {
          leadId: lead.id,
          leadName: lead.fullName
        }
      })
    }

    // Add check-in notifications
    for (const checkIn of newCheckIns) {
      const clientName = checkIn.user.firstName && checkIn.user.lastName
        ? `${checkIn.user.firstName} ${checkIn.user.lastName}`
        : checkIn.user.name || 'Klient'

      // Check if check-in has photos
      const hasPhotos = checkIn.photoFront || checkIn.photoSide || checkIn.photoBack

      if (hasPhotos) {
        notifications.push({
          id: `checkin-photo-${checkIn.id}`,
          type: 'NEW_PHOTOS',
          message: `${clientName} har laddat upp nya bilder`,
          timestamp: checkIn.createdAt,
          link: `/dashboard/journal?clientId=${checkIn.userId}&tab=progress`,
          data: {
            userId: checkIn.userId,
            checkInId: checkIn.id,
            clientName
          }
        })
      }

      notifications.push({
        id: `checkin-${checkIn.id}`,
        type: 'NEW_CHECKIN',
        message: `${clientName} har gjort en check-in`,
        timestamp: checkIn.createdAt,
        link: `/dashboard/journal?clientId=${checkIn.userId}&tab=check-ins`,
        data: {
          userId: checkIn.userId,
          checkInId: checkIn.id,
          clientName
        }
      })
    }

    // Sort all notifications by timestamp (newest first)
    notifications.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Limit to 50 most recent notifications
    const recentNotifications = notifications.slice(0, 50)

    return NextResponse.json({
      count: notifications.length,
      unreadCount: notifications.length, // For now, all are unread
      notifications: recentNotifications
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
