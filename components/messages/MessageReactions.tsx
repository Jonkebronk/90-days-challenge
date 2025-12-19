'use client'

import { useState } from 'react'
import { SmilePlus } from 'lucide-react'

interface Reaction {
  id: string
  emoji: string
  userId: string
  user: {
    id: string
    name: string | null
  }
}

interface MessageReactionsProps {
  messageId: string
  reactions: Reaction[]
  currentUserId: string
  onReact: (messageId: string, emoji: string) => void
}

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '😡']

export function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  onReact
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)

  // Group reactions by emoji
  const grouped = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        count: 0,
        users: [] as string[],
        userReacted: false
      }
    }
    acc[reaction.emoji].count++
    acc[reaction.emoji].users.push(reaction.user.name || 'Anonym')
    if (reaction.userId === currentUserId) {
      acc[reaction.emoji].userReacted = true
    }
    return acc
  }, {} as Record<string, { count: number; users: string[]; userReacted: boolean }>)

  const hasReactions = Object.keys(grouped).length > 0

  const handleReact = (emoji: string) => {
    onReact(messageId, emoji)
    setShowPicker(false)
  }

  return (
    <div className="relative flex items-center gap-1">
      {/* Existing reactions */}
      {hasReactions && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(grouped).map(([emoji, data]) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              title={data.users.join(', ')}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all ${
                data.userReacted
                  ? 'bg-blue-100 border border-blue-300'
                  : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <span>{emoji}</span>
              {data.count > 1 && (
                <span className="text-gray-600">{data.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
          title="Lägg till reaktion"
        >
          <SmilePlus className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
        </button>

        {/* Emoji picker */}
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50 flex gap-1">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MessageReactions
