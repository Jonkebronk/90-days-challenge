import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// In-memory store for typing indicators
// Key: recipientId, Value: { senderId, senderName, timestamp }
const typingIndicators = new Map<string, { senderId: string; senderName: string; timestamp: number }>()

// Clean up old typing indicators (older than 5 seconds)
function cleanupOldIndicators() {
  const now = Date.now()
  for (const [key, value] of typingIndicators.entries()) {
    if (now - value.timestamp > 5000) {
      typingIndicators.delete(key)
    }
  }
}

// POST /api/messages/typing - Signal that user is typing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userName = (session.user as any).name || (session.user as any).email || 'Någon'
    const body = await request.json()
    const { recipientId } = body

    if (!recipientId) {
      return NextResponse.json({ error: 'recipientId required' }, { status: 400 })
    }

    // Store typing indicator
    typingIndicators.set(recipientId, {
      senderId: userId,
      senderName: userName,
      timestamp: Date.now()
    })

    // Cleanup old indicators
    cleanupOldIndicators()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting typing indicator:', error)
    return NextResponse.json({ error: 'Failed to set typing indicator' }, { status: 500 })
  }
}

// GET /api/messages/typing - Check if someone is typing to you
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Cleanup old indicators
    cleanupOldIndicators()

    // Check if anyone is typing to this user
    const indicator = typingIndicators.get(userId)

    if (indicator) {
      return NextResponse.json({
        isTyping: true,
        senderId: indicator.senderId,
        senderName: indicator.senderName
      })
    }

    return NextResponse.json({ isTyping: false })
  } catch (error) {
    console.error('Error getting typing indicator:', error)
    return NextResponse.json({ error: 'Failed to get typing indicator' }, { status: 500 })
  }
}

// DELETE /api/messages/typing - Clear typing indicator
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')

    if (recipientId) {
      typingIndicators.delete(recipientId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing typing indicator:', error)
    return NextResponse.json({ error: 'Failed to clear typing indicator' }, { status: 500 })
  }
}
