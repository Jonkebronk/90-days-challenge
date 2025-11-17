'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Image as ImageIcon, X, ZoomIn } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

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
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Kunde inte ladda meddelanden')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !otherUserId) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          receiverId: otherUserId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, data.message])
        setNewMessage('')
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Laddar meddelanden...</p>
        </div>
      </div>
    )
  }

  const selectedContact = isCoach
    ? clients.find(c => c.id === otherUserId)
    : coach

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)] max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="relative text-center py-8 bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px]">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
          MEDDELANDEN
        </h1>
        <p className="text-gray-400 mt-2">
          Kommunicera med din {isCoach ? 'klient' : 'coach'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-12rem)] max-w-full">
        {/* Sidebar - Contact List (Coach only) */}
        {isCoach && (
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px] p-4 h-full overflow-y-auto">
              <h3 className="text-lg font-bold text-gold-light mb-4">Klienter</h3>
              <div className="space-y-2">
                {clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => setOtherUserId(client.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      otherUserId === client.id
                        ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-gray-900 font-semibold'
                        : 'bg-white/5 hover:bg-gold-primary/10 text-gray-100 border border-gold-primary/20'
                    }`}
                  >
                    <p className="font-medium">{client.name}</p>
                    <p className={`text-sm ${otherUserId === client.id ? 'text-gray-800' : 'text-gray-400'}`}>
                      {client.email}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Messages Area */}
        <div className={`${isCoach ? 'lg:col-span-3' : 'lg:col-span-4'} flex flex-col`}>
          <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px] flex-1 flex flex-col">
            {/* Contact Header */}
            {selectedContact && (
              <div className="p-4 border-b border-gold-primary/20">
                <h3 className="text-lg font-bold text-gold-light">
                  {selectedContact.name}
                </h3>
                <p className="text-sm text-gray-400">{selectedContact.email}</p>
              </div>
            )}

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Inga meddelanden än. Skicka det första!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId === userId
                  const isCheckIn = message.isCheckInSummary

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isCheckIn
                            ? 'bg-[rgba(30,58,138,0.5)] border-2 border-[rgba(59,130,246,0.6)]'
                            : isMine
                            ? 'bg-gradient-to-r from-gold-primary to-gold-secondary'
                            : 'bg-white/10 border border-gold-primary/20'
                        } rounded-2xl p-4`}
                      >
                        {/* Check-in header */}
                        {isCheckIn && (
                          <div className="mb-2 pb-2 border-b border-[rgba(147,197,253,0.5)]">
                            <p className="text-xs font-bold text-[rgba(147,197,253,1)]">VECKORAPPORT</p>
                          </div>
                        )}

                        {/* Message content */}
                        <p
                          className={`whitespace-pre-wrap ${
                            isMine && !isCheckIn
                              ? 'text-gray-900 font-medium'
                              : isCheckIn
                              ? 'text-gray-100'
                              : 'text-gray-100'
                          }`}
                        >
                          {message.content}
                        </p>

                        {/* Images */}
                        {message.images && message.images.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {message.images.map((img, idx) => (
                              <div
                                key={idx}
                                className="relative group cursor-pointer"
                                onClick={() => setSelectedImage(img)}
                              >
                                <img
                                  src={img}
                                  alt={`Bild ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-gray-900 bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Timestamp */}
                        <p
                          className={`text-xs mt-2 ${
                            isMine && !isCheckIn
                              ? 'text-gray-800'
                              : isCheckIn
                              ? 'text-gray-400'
                              : 'text-gray-400'
                          }`}
                        >
                          {format(new Date(message.createdAt), 'PPp', { locale: sv })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gold-primary/20">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Skriv ett meddelande..."
                  className="flex-1 bg-black/30 border-gold-primary/30 text-white placeholder:text-gray-400 focus:border-gold-primary"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-gray-900 font-semibold disabled:opacity-50"
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
          className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gold-light transition-colors"
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
