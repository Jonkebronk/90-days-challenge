import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyNewMessage } from '@/lib/push-notifications'

// GET - Fetch messages between user and their coach/client
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('otherUserId')
    const search = searchParams.get('search')

    let messages

    if (otherUserId) {
      // Build where clause
      const whereClause: any = {
        isDeleted: false,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      }

      // Add search filter if provided
      if (search) {
        whereClause.content = {
          contains: search,
          mode: 'insensitive'
        }
      }

      // Get conversation with specific user
      messages = await prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              senderId: true,
              sender: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      // Mark unread messages from the other user as read
      await prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      })
    } else {
      // Get all messages involving this user
      messages = await prisma.message.findMany({
        where: {
          isDeleted: false,
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Send a new message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { content, receiverId, images = [], replyToId } = body

    if (!content || !receiverId) {
      return NextResponse.json({ error: 'Content and receiverId required' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        receiverId,
        images,
        replyToId: replyToId || null,
        isCheckInSummary: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: {
              select: {
                name: true
              }
            }
          }
        },
        reactions: true
      }
    })

    // Send push notification to receiver (async, don't wait)
    const senderName = message.sender.name || message.sender.email || 'Någon'
    notifyNewMessage(receiverId, senderName).catch((err) => {
      console.error('Failed to send push notification:', err)
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
