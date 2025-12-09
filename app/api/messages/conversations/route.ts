import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/messages/conversations - Get conversation summaries with last message preview
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role?.toUpperCase()

    let contacts: any[] = []

    if (userRole === 'COACH') {
      // Get all clients for this coach
      const clients = await prisma.user.findMany({
        where: {
          coachId: userId,
          role: 'client'
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      })

      // Get last message and unread count for each client
      contacts = await Promise.all(
        clients.map(async (client) => {
          const lastMessage = await prisma.message.findFirst({
            where: {
              isDeleted: false,
              OR: [
                { senderId: userId, receiverId: client.id },
                { senderId: client.id, receiverId: userId }
              ]
            },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              senderId: true,
              createdAt: true,
              images: true,
              readAt: true
            }
          })

          const unreadCount = await prisma.message.count({
            where: {
              senderId: client.id,
              receiverId: userId,
              readAt: null,
              isDeleted: false
            }
          })

          return {
            ...client,
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              content: lastMessage.images.length > 0 && !lastMessage.content.trim()
                ? '📷 Bild'
                : lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : ''),
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              isFromMe: lastMessage.senderId === userId,
              isRead: !!lastMessage.readAt
            } : null,
            unreadCount
          }
        })
      )

      // Sort by last message time (most recent first)
      contacts.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0
        if (!a.lastMessage) return 1
        if (!b.lastMessage) return -1
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      })
    } else {
      // Client: get their coach
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      })

      if (user?.coach) {
        const lastMessage = await prisma.message.findFirst({
          where: {
            isDeleted: false,
            OR: [
              { senderId: userId, receiverId: user.coach.id },
              { senderId: user.coach.id, receiverId: userId }
            ]
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            images: true,
            readAt: true
          }
        })

        const unreadCount = await prisma.message.count({
          where: {
            senderId: user.coach.id,
            receiverId: userId,
            readAt: null,
            isDeleted: false
          }
        })

        contacts = [{
          ...user.coach,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.images.length > 0 && !lastMessage.content.trim()
              ? '📷 Bild'
              : lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : ''),
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
            isFromMe: lastMessage.senderId === userId,
            isRead: !!lastMessage.readAt
          } : null,
          unreadCount
        }]
      }
    }

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
