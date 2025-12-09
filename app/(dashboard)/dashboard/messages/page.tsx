'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Image as ImageIcon, X, ZoomIn, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { FAQPanel } from '@/components/messages/FAQPanel'
import { MessageReactions } from '@/components/messages/MessageReactions'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { useNotificationSound } from '@/lib/hooks/useNotificationSound'

interface Reaction {
  id: string
  emoji: string
  userId: string
  user: {
    id: string
    name: string | null
  }
}

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  isCheckInSummary: boolean
  images: string[]
  createdAt: string
  sender: {
    id: string
    name: string | null
    email: string
    role: string
  }
  receiver: {
    id: string
    name: string | null
    email: string
    role: string
  }
  reactions: Reaction[]
}

// Track unread counts per contact
interface UnreadCounts {
  [contactId: string]: number
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({})
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef<number>(0)
  const { playSound } = useNotificationSound()

  const userId = (session?.user as any)?.id
  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

  // For coach: get client list, for client: get coach
  const [otherUserId, setOtherUserId] = useState<string>('')
  const [clients, setClients] = useState<any[]>([])
  const [coach, setCoach] = useState<any>(null)

  useEffect(() => {
    if (isCoach) {
      fetchClients()
    } else {
      fetchCoach()
    }
  }, [isCoach])

  // Real-time polling for new messages
  useEffect(() => {
    if (!otherUserId) return

    const pollMessages = async () => {
      try {
        const response = await fetch(`/api/messages?otherUserId=${otherUserId}`)
        if (response.ok) {
          const data = await response.json()
          const newMessages = data.messages as Message[]

          // Check if there are new messages from the other person
          if (newMessages.length > lastMessageCountRef.current) {
            const newOnesCount = newMessages.length - lastMessageCountRef.current
            const latestMessages = newMessages.slice(-newOnesCount)

            // Check if any new message is from the other person (not us)
            const hasNewFromOther = latestMessages.some(msg => msg.senderId !== userId)

            if (hasNewFromOther && lastMessageCountRef.current > 0) {
              playSound()
            }

            setMessages(newMessages)
          }

          lastMessageCountRef.current = newMessages.length
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    // Poll every 5 seconds
    const interval = setInterval(pollMessages, 5000)

    return () => clearInterval(interval)
  }, [otherUserId, userId, playSound])

  useEffect(() => {
    if (otherUserId) {
      fetchMessages()
    }
  }, [otherUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients.filter((c: any) => c.name))
        if (data.clients.length > 0) {
          setOtherUserId(data.clients[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchCoach = async () => {
    try {
      // Client's coach is in their user record
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        // This endpoint returns the current user's coach if client
        if (data.coach) {
          setCoach(data.coach)
          setOtherUserId(data.coach.id)
        }
      }
    } catch (error) {
      console.error('Error fetching coach:', error)
    }
  }

  const fetchMessages = async () => {
    if (!otherUserId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/messages?otherUserId=${otherUserId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
        // Track message count for polling comparison
        lastMessageCountRef.current = data.messages.length
        // Clear unread for this contact
        setUnreadCounts(prev => ({ ...prev, [otherUserId]: 0 }))
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Kunde inte ladda meddelanden')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && pendingImages.length === 0) || !otherUserId) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage || (pendingImages.length > 0 ? '📷' : ''),
          receiverId: otherUserId,
          images: pendingImages
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, data.message])
        setNewMessage('')
        setPendingImages([])
      } else {
        toast.error('Kunde inte skicka meddelande')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setSending(false)
    }
  }

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            if (data.action === 'added') {
              return {
                ...msg,
                reactions: [...(msg.reactions || []), data.reaction]
              }
            } else {
              // Remove the reaction
              return {
                ...msg,
                reactions: (msg.reactions || []).filter(
                  r => !(r.userId === userId && r.emoji === emoji)
                )
              }
            }
          }
          return msg
        }))
      }
    } catch (error) {
      console.error('Error reacting to message:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      for (const file of Array.from(files)) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Bilden är för stor (max 10MB)')
          continue
        }

        // Convert to base64 and upload to Cloudinary
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64 = reader.result as string
            const response = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: base64,
                folder: 'messages'
              })
            })

            if (response.ok) {
              const data = await response.json()
              setPendingImages(prev => [...prev, data.url])
            } else {
              toast.error('Kunde inte ladda upp bilden')
            }
          } catch (err) {
            console.error('Upload error:', err)
            toast.error('Ett fel uppstod vid uppladdning')
          }
        }
        reader.readAsDataURL(file)
      }
    } finally {
      setUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Prevent pull-to-refresh on message scroll - must be before early return
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target.scrollTop === 0) {
      target.scrollTop = 1
    }
  }, [])

  const selectedContact = isCoach
    ? clients.find(c => c.id === otherUserId)
    : coach

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Laddar meddelanden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 text-center mb-4 sm:mb-6">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
          Meddelanden
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Kommunicera med din {isCoach ? 'klient' : 'coach'}
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 opacity-30" />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Sidebar - Contact List (Coach only) */}
        {isCoach && (
          <div className="flex-shrink-0 lg:w-64">
            <Card className="bg-white border-2 border-gray-300 rounded-lg p-3 h-full overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Klienter</h3>
              <div className="space-y-2">
                {clients.map(client => {
                  const unread = unreadCounts[client.id] || 0
                  return (
                    <button
                      key={client.id}
                      onClick={() => setOtherUserId(client.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all relative ${
                        otherUserId === client.id
                          ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-semibold'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{client.name}</p>
                          <p className={`text-xs ${otherUserId === client.id ? 'text-white/80' : 'text-gray-500'}`}>
                            {client.email}
                          </p>
                        </div>
                        {/* Unread badge */}
                        {unread > 0 && otherUserId !== client.id && (
                          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Card className="bg-white border-2 border-gray-300 rounded-lg flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Contact Header */}
            {selectedContact && (
              <div className="flex-shrink-0 p-3 sm:p-4 border-b-2 border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {selectedContact.name}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Messages List */}
            <div
              className="flex-1 overflow-y-auto overscroll-none p-3 sm:p-4 space-y-3"
              onTouchStart={handleTouchStart}
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}
            >
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Inga meddelanden än. Skicka det första!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId === userId
                  const isCheckIn = message.isCheckInSummary
                  const senderName = message.sender?.name || message.sender?.email || 'Okänd'

                  return (
                    <div
                      key={message.id}
                      className="space-y-1 group"
                    >
                      {/* Sender name */}
                      <p className={`text-xs font-semibold ${isMine ? 'text-right' : 'text-left'} ${
                        isMine ? 'text-gold-primary' : 'text-blue-600'
                      }`}>
                        {senderName}
                      </p>

                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className="relative">
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] ${
                              isCheckIn
                                ? 'bg-blue-50 border-2 border-blue-200'
                                : 'bg-gray-100 border border-gray-200'
                            } rounded-2xl p-3 sm:p-4`}
                          >
                            {/* Check-in header */}
                            {isCheckIn && (
                              <div className="mb-2 pb-2 border-b border-blue-200">
                                <p className="text-xs font-bold text-blue-600">VECKORAPPORT</p>
                              </div>
                            )}

                            {/* Message content */}
                            <p className="whitespace-pre-wrap text-sm sm:text-base text-gray-700">
                              {message.content}
                            </p>

                            {/* Images */}
                            {message.images && message.images.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {message.images.map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="relative group/img cursor-pointer"
                                    onClick={() => setSelectedImage(img)}
                                  >
                                    <img
                                      src={img}
                                      alt={`Bild ${idx + 1}`}
                                      className="w-full h-20 sm:h-24 object-cover rounded-lg"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-all rounded-lg flex items-center justify-center">
                                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Timestamp */}
                            <p className="text-xs mt-2 text-gray-400">
                              {format(new Date(message.createdAt), 'PPp', { locale: sv })}
                            </p>
                          </div>

                          {/* Reactions */}
                          <MessageReactions
                            messageId={message.id}
                            reactions={message.reactions || []}
                            currentUserId={userId}
                            onReact={handleReact}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-t-2 border-gray-200 bg-gray-50">
              {/* Pending images preview */}
              {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {pendingImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img}
                        alt={`Bild ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removePendingImage(idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <FAQPanel
                  onSelectAnswer={(answer) => setNewMessage(answer)}
                  isCoach={isCoach}
                />
              </div>
              <div className="flex gap-2">
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                {/* Image upload button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="border-2 border-gray-300 hover:border-gold-primary h-10 sm:h-12 px-3"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Skriv ett meddelande..."
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gold-primary h-10 sm:h-12"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || (!newMessage.trim() && pendingImages.length === 0)}
                  className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold disabled:opacity-50 h-10 sm:h-12 px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gold-primary transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
