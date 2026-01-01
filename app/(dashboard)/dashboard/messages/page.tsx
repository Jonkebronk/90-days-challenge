'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Send, Image as ImageIcon, X, ZoomIn, MessageCircle, Loader2,
  Search, Reply, Pencil, Trash2, Check, CheckCheck, MoreVertical, User,
  Bold, Italic, Strikethrough, ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { FAQPanel } from '@/components/messages/FAQPanel'
import { CheckInEditDialog } from '@/components/CheckInEditDialog'
import { MessageReactions } from '@/components/messages/MessageReactions'
import { format, formatDistanceToNow } from 'date-fns'
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

interface ReplyTo {
  id: string
  content: string
  senderId: string
  sender: {
    name: string | null
  }
}

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  isCheckInSummary: boolean
  checkInId: string | null
  images: string[]
  createdAt: string
  readAt: string | null
  editedAt: string | null
  isDeleted: boolean
  replyTo: ReplyTo | null
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

interface Contact {
  id: string
  name: string | null
  email: string
  image: string | null
  lastMessage: {
    id: string
    content: string
    senderId: string
    createdAt: string
    isFromMe: boolean
    isRead: boolean
  } | null
  unreadCount: number
}

// Parse markdown to React elements
function parseMarkdown(text: string): React.ReactNode {
  if (!text) return text

  // Split by markdown patterns and create elements
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  // Pattern for bold, italic, strikethrough
  const pattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(__(.+?)__)|(~~(.+?)~~)/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // **bold**
      parts.push(<strong key={key++} className="font-bold">{match[2]}</strong>)
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={key++} className="italic">{match[4]}</em>)
    } else if (match[5]) {
      // __bold__
      parts.push(<strong key={key++} className="font-bold">{match[6]}</strong>)
    } else if (match[7]) {
      // ~~strikethrough~~
      parts.push(<del key={key++} className="line-through">{match[8]}</del>)
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  // New features state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [editCheckInId, setEditCheckInId] = useState<string | null>(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldScrollRef = useRef<boolean>(true)
  const { playSound } = useNotificationSound()

  const userId = (session?.user as any)?.id
  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

  const [otherUserId, setOtherUserId] = useState<string>('')

  // Fetch contacts with last message preview
  useEffect(() => {
    fetchContacts()
  }, [])

  // Polling for messages and typing indicator
  useEffect(() => {
    if (!otherUserId) return

    const pollData = async () => {
      try {
        // Poll messages
        const msgResponse = await fetch(`/api/messages?otherUserId=${otherUserId}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`)
        if (msgResponse.ok) {
          const data = await msgResponse.json()
          const newMessages = data.messages as Message[]

          if (newMessages.length > lastMessageCountRef.current) {
            const newOnesCount = newMessages.length - lastMessageCountRef.current
            const latestMessages = newMessages.slice(-newOnesCount)
            const hasNewFromOther = latestMessages.some(msg => msg.senderId !== userId)

            if (hasNewFromOther && lastMessageCountRef.current > 0) {
              playSound()
            }

            setMessages(newMessages)
          } else {
            setMessages(newMessages)
          }

          lastMessageCountRef.current = newMessages.length
        }

        // Poll typing indicator
        const typingResponse = await fetch('/api/messages/typing')
        if (typingResponse.ok) {
          const typingData = await typingResponse.json()
          if (typingData.isTyping && typingData.senderId === otherUserId) {
            setTypingUser(typingData.senderName)
          } else {
            setTypingUser(null)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    const interval = setInterval(pollData, 3000)
    pollData() // Initial fetch

    return () => clearInterval(interval)
  }, [otherUserId, userId, playSound, searchQuery])

  useEffect(() => {
    if (otherUserId) {
      fetchMessages()
      // Refresh contacts to update unread counts
      fetchContacts()
    }
  }, [otherUserId])

  // Only scroll to bottom when appropriate (new message sent/received, not during manual scroll)
  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToBottom()
    }
  }, [messages])

  // Check if user is scrolled near bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    shouldScrollRef.current = isNearBottom
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts)
        if (data.contacts.length > 0 && !otherUserId) {
          setOtherUserId(data.contacts[0].id)
          // Don't auto-show chat on mobile for first load
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const fetchMessages = async () => {
    if (!otherUserId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/messages?otherUserId=${otherUserId}`)
      if (response.ok) {
        const data = await response.json()
        shouldScrollRef.current = true // Scroll to bottom on initial load
        setMessages(data.messages)
        lastMessageCountRef.current = data.messages.length
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Kunde inte ladda meddelanden')
    } finally {
      setLoading(false)
    }
  }

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!otherUserId) return

    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: otherUserId })
    }).catch(() => {})

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to clear typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/messages/typing?recipientId=${otherUserId}`, { method: 'DELETE' }).catch(() => {})
    }, 3000)
  }, [otherUserId])

  const sendMessage = async () => {
    if ((!newMessage.trim() && pendingImages.length === 0) || !otherUserId) return

    // If editing, update instead of create
    if (editingMessage) {
      await updateMessage()
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage || (pendingImages.length > 0 ? '📷' : ''),
          receiverId: otherUserId,
          images: pendingImages,
          replyToId: replyingTo?.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        shouldScrollRef.current = true // Always scroll to bottom when sending
        setMessages([...messages, data.message])
        setNewMessage('')
        setPendingImages([])
        setReplyingTo(null)
        fetchContacts() // Update last message preview
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

  const updateMessage = async () => {
    if (!editingMessage || !newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/messages/${editingMessage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => prev.map(msg => msg.id === editingMessage.id ? data.message : msg))
        setNewMessage('')
        setEditingMessage(null)
        toast.success('Meddelandet uppdaterades')
      } else {
        toast.error('Kunde inte uppdatera meddelandet')
      }
    } catch (error) {
      console.error('Error updating message:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setSending(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        toast.success('Meddelandet togs bort')
        setActiveMenu(null)
      } else {
        toast.error('Kunde inte ta bort meddelandet')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Ett fel uppstod')
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
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            if (data.action === 'added') {
              return { ...msg, reactions: [...(msg.reactions || []), data.reaction] }
            } else {
              return { ...msg, reactions: (msg.reactions || []).filter(r => !(r.userId === userId && r.emoji === emoji)) }
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
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Bilden är för stor (max 10MB)')
          continue
        }

        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64 = reader.result as string
            const response = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64, folder: 'messages' })
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
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    // Keyboard shortcuts for formatting
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault()
        insertFormatting('**', '**')
      } else if (e.key === 'i') {
        e.preventDefault()
        insertFormatting('*', '*')
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    sendTypingIndicator()
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }

  // Reset textarea height when message is sent
  useEffect(() => {
    if (!newMessage && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [newMessage])

  // Insert formatting around selected text or at cursor
  const insertFormatting = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = newMessage
    const selectedText = text.slice(start, end)

    const newText = text.slice(0, start) + prefix + selectedText + suffix + text.slice(end)
    setNewMessage(newText)

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        // If text was selected, select the formatted text
        textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      } else {
        // If no selection, place cursor between prefix and suffix
        textarea.setSelectionRange(start + prefix.length, start + prefix.length)
      }
    }, 0)
  }

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target.scrollTop === 0) target.scrollTop = 1
  }, [])

  const startReply = (message: Message) => {
    setReplyingTo(message)
    setEditingMessage(null)
    setActiveMenu(null)
  }

  const startEdit = (message: Message) => {
    setEditingMessage(message)
    setNewMessage(message.content)
    setReplyingTo(null)
    setActiveMenu(null)
  }

  const cancelReplyOrEdit = () => {
    setReplyingTo(null)
    setEditingMessage(null)
    setNewMessage('')
  }

  const selectedContact = contacts.find(c => c.id === otherUserId)

  if (loading && messages.length === 0 && contacts.length === 0) {
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
    <div className="fixed inset-0 top-0 bottom-20 lg:relative lg:inset-auto lg:bottom-auto flex flex-col max-w-full overflow-hidden bg-white lg:h-[calc(100vh-8rem)] lg:rounded-lg lg:border-2 lg:border-gray-300">
      <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-4 min-h-0 overflow-hidden">
        {/* Sidebar - Contact List */}
        {isCoach && (
          <div className={`flex-shrink-0 lg:w-72 lg:block ${mobileShowChat ? 'hidden' : 'block'}`}>
            <Card className="bg-white border-2 border-gray-300 rounded-lg p-3 h-full overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Konversationer</h3>
              <div className="space-y-2">
                {contacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setOtherUserId(contact.id)
                      setMobileShowChat(true)
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all relative ${
                      otherUserId === contact.id
                        ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Contact Avatar */}
                      <div className="flex-shrink-0">
                        {contact.image ? (
                          <img
                            src={contact.image}
                            alt={contact.name || 'Profilbild'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            otherUserId === contact.id
                              ? 'bg-white/20'
                              : 'bg-gradient-to-br from-amber-400 to-orange-500'
                          }`}>
                            <span className="text-white font-bold text-sm">
                              {(contact.name || contact.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{contact.name || contact.email}</p>
                          {contact.unreadCount > 0 && otherUserId !== contact.id && (
                            <span className="flex-shrink-0 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                              {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                            </span>
                          )}
                        </div>
                        {contact.lastMessage && (
                          <div className="mt-1">
                            <p className={`text-xs truncate ${otherUserId === contact.id ? 'text-white/80' : 'text-gray-500'}`}>
                              {contact.lastMessage.isFromMe && <span className="mr-1">Du:</span>}
                              {contact.lastMessage.content}
                            </p>
                            <p className={`text-xs mt-0.5 ${otherUserId === contact.id ? 'text-white/60' : 'text-gray-400'}`}>
                              {formatDistanceToNow(new Date(contact.lastMessage.createdAt), { addSuffix: true, locale: sv })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Messages Area */}
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isCoach && !mobileShowChat ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Contact Header with Search */}
            {selectedContact && (
              <div className="flex-shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-[calc(env(safe-area-inset-top)+12px)] border-b border-gray-700 bg-[#1a3a4a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Back button on mobile */}
                    {isCoach && (
                      <button
                        onClick={() => setMobileShowChat(false)}
                        className="lg:hidden p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Tillbaka till konversationer"
                      >
                        <ArrowLeft className="w-5 h-5 text-white" />
                      </button>
                    )}
                    {/* Chat Header Avatar */}
                    {selectedContact.image ? (
                      <img
                        src={selectedContact.image}
                        alt={selectedContact.name || 'Profilbild'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {(selectedContact.name || selectedContact.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedContact.name}</h3>
                      {typingUser && <p className="text-xs text-green-400 animate-pulse">{typingUser} skriver...</p>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSearch(!showSearch)}
                    className={showSearch ? 'text-gold-primary' : 'text-white/70 hover:text-white hover:bg-white/10'}
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </div>
                {showSearch && (
                  <div className="mt-3">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Sök i meddelanden..."
                      className="bg-white border-gray-300"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Messages List */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overscroll-none p-3 sm:p-4 space-y-3"
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}
            >
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{searchQuery ? 'Inga meddelanden hittades' : 'Inga meddelanden än. Skicka det första!'}</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId === userId
                  const isCheckIn = message.isCheckInSummary
                  const senderName = message.sender?.name || message.sender?.email || 'Okänd'

                  return (
                    <div key={message.id} className="space-y-1 group">
                      {/* Sender name */}
                      <p className={`text-xs font-semibold ${isMine ? 'text-right' : 'text-left'} ${isMine ? 'text-gold-primary' : 'text-blue-600'}`}>
                        {senderName}
                      </p>

                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className="relative max-w-[85%] sm:max-w-[70%]">
                          {/* Reply preview */}
                          {message.replyTo && (
                            <div className={`mb-1 p-2 rounded-lg text-xs ${isMine ? 'bg-gold-primary/20' : 'bg-blue-50'} border-l-2 ${isMine ? 'border-gold-primary' : 'border-blue-400'}`}>
                              <p className="font-semibold text-gray-600">{message.replyTo.sender?.name || 'Okänd'}</p>
                              <p className="text-gray-500 truncate">{message.replyTo.content}</p>
                            </div>
                          )}

                          <div className={`${isCheckIn ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-100 border border-gray-200'} rounded-2xl p-3 sm:p-4`}>
                            {isCheckIn && (
                              <div className="mb-2 pb-2 border-b border-blue-200 flex items-center justify-between">
                                <p className="text-xs font-bold text-blue-600">VECKORAPPORT</p>
                                {message.checkInId && (
                                  <button
                                    onClick={() => setEditCheckInId(message.checkInId)}
                                    className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    Redigera
                                  </button>
                                )}
                              </div>
                            )}

                            <p className="whitespace-pre-wrap text-sm sm:text-base text-gray-700">
                              {message.isDeleted ? <span className="italic text-gray-400">{message.content}</span> : parseMarkdown(message.content)}
                            </p>

                            {message.images && message.images.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {message.images.map((img, idx) => (
                                  <div key={idx} className="relative group/img cursor-pointer" onClick={() => setSelectedImage(img)}>
                                    <img src={img} alt={`Bild ${idx + 1}`} className="w-full h-20 sm:h-24 object-cover rounded-lg" />
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-all rounded-lg flex items-center justify-center">
                                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Timestamp and read receipt */}
                            <div className={`flex items-center gap-1 mt-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <p className="text-xs text-gray-400">
                                {format(new Date(message.createdAt), 'HH:mm', { locale: sv })}
                                {message.editedAt && <span className="ml-1">(redigerad)</span>}
                              </p>
                              {isMine && !message.isDeleted && (
                                <span className="ml-1">
                                  {message.readAt ? (
                                    <CheckCheck className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <Check className="w-4 h-4 text-gray-400" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message actions */}
                          {isMine && !message.isDeleted && (
                            <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="relative">
                                <button
                                  onClick={() => setActiveMenu(activeMenu === message.id ? null : message.id)}
                                  className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-500" />
                                </button>
                                {activeMenu === message.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                                    <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[120px]">
                                      <button onClick={() => startEdit(message)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                                        <Pencil className="w-4 h-4" /> Redigera
                                      </button>
                                      <button onClick={() => deleteMessage(message.id)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600">
                                        <Trash2 className="w-4 h-4" /> Ta bort
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Reactions and Reply - inline on mobile */}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <MessageReactions
                              messageId={message.id}
                              reactions={message.reactions || []}
                              currentUserId={userId}
                              onReact={handleReact}
                            />
                            {!message.isDeleted && (
                              <button
                                onClick={() => startReply(message)}
                                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                                title="Svara"
                              >
                                <Reply className="w-3.5 h-3.5 text-gray-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply/Edit indicator */}
            {(replyingTo || editingMessage) && (
              <div className="flex-shrink-0 px-3 sm:px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {replyingTo && (
                    <>
                      <Reply className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Svarar på: </span>
                      <span className="text-gray-800 truncate max-w-[200px]">{replyingTo.content}</span>
                    </>
                  )}
                  {editingMessage && (
                    <>
                      <Pencil className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Redigerar meddelande</span>
                    </>
                  )}
                </div>
                <button onClick={cancelReplyOrEdit} className="p-1 hover:bg-gray-200 rounded">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-t-2 border-gray-200 bg-gray-50">
              {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {pendingImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`Bild ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200" />
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
                <FAQPanel />
                <div className="flex items-center gap-1 border-l border-gray-300 pl-2 ml-1">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Fet text (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*')}
                    className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Kursiv text (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('~~', '~~')}
                    className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Genomstruken text"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="border-2 border-gray-300 hover:border-gold-primary h-10 sm:h-12 px-3"
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                </Button>
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder={editingMessage ? 'Redigera meddelande...' : 'Skriv ett meddelande...'}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gold-primary focus:outline-none focus:ring-2 focus:ring-gold-primary/20 rounded-md px-3 py-2 min-h-[44px] max-h-[200px] resize-none overflow-y-auto"
                  disabled={sending}
                  rows={1}
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
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gold-primary transition-colors" onClick={() => setSelectedImage(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={selectedImage} alt="Fullscreen" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Check-in Edit Dialog */}
      {editCheckInId && (
        <CheckInEditDialog
          checkInId={editCheckInId}
          open={!!editCheckInId}
          onOpenChange={(open) => !open && setEditCheckInId(null)}
          onSuccess={() => {
            // Refresh messages to show updated check-in
            fetchMessages()
          }}
        />
      )}
    </div>
  )
}
