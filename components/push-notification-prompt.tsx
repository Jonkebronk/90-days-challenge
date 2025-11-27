'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bell, BellOff, X, Smartphone } from 'lucide-react'
import {
  requestNotificationPermission,
  isPushSupported,
  getNotificationPermission,
  onForegroundMessage,
} from '@/lib/firebase'
import { toast } from 'sonner'

interface PushNotificationPromptProps {
  className?: string
}

export function PushNotificationPrompt({ className }: PushNotificationPromptProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)

  // Check support and current permission on mount
  useEffect(() => {
    async function checkSupport() {
      const supported = await isPushSupported()
      setIsSupported(supported)

      if (supported) {
        setPermission(getNotificationPermission())

        // Check if already subscribed
        try {
          const response = await fetch('/api/push-subscription')
          if (response.ok) {
            const data = await response.json()
            setHasSubscription(data.hasSubscriptions)
          }
        } catch (error) {
          console.error('Error checking subscription:', error)
        }
      }

      // Check if user dismissed the prompt before
      const dismissed = localStorage.getItem('push-notification-prompt-dismissed')
      if (dismissed) {
        setIsDismissed(true)
      }
    }

    checkSupport()
  }, [])

  // Listen for foreground messages
  useEffect(() => {
    if (!isSupported || permission !== 'granted') return

    const cleanup = onForegroundMessage((payload) => {
      // Show toast for foreground notifications
      toast(payload.notification?.title || 'Ny notifikation', {
        description: payload.notification?.body,
        action: payload.data?.link
          ? {
              label: 'Visa',
              onClick: () => {
                window.location.href = payload.data.link
              },
            }
          : undefined,
      })
    })

    return cleanup
  }, [isSupported, permission])

  const handleEnableNotifications = async () => {
    setIsLoading(true)

    try {
      const token = await requestNotificationPermission()

      if (token) {
        // Save token to server
        const response = await fetch('/api/push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            device: detectDevice(),
          }),
        })

        if (response.ok) {
          setPermission('granted')
          setHasSubscription(true)
          toast.success('Notifikationer aktiverade!')
        } else {
          toast.error('Kunde inte spara prenumerationen')
        }
      } else {
        setPermission(getNotificationPermission())
        if (getNotificationPermission() === 'denied') {
          toast.error('Du har blockerat notifikationer. Ändra i webbläsarens inställningar.')
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      toast.error('Något gick fel')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('push-notification-prompt-dismissed', 'true')
  }

  // Detect device type
  function detectDevice(): string {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios'
    if (/android/.test(userAgent)) return 'android'
    return 'web'
  }

  // Don't show if not supported, already granted, or dismissed
  if (!isSupported || permission === 'granted' || hasSubscription || isDismissed) {
    return null
  }

  // Don't show if denied (user must change in browser settings)
  if (permission === 'denied') {
    return null
  }

  return (
    <Card className={`bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-amber-500/20">
            <Bell className="w-6 h-6 text-amber-500" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              Aktivera notifikationer
            </h3>
            <p className="text-sm text-[rgba(255,255,255,0.7)] mb-3">
              Få meddelanden direkt i telefonen om nya meddelanden, check-ins och uppdateringar.
            </p>

            <div className="flex items-center gap-2 text-xs text-amber-400 mb-3">
              <Smartphone className="w-4 h-4" />
              <span>
                Tips: Lägg till appen på hemskärmen för bästa upplevelse
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                {isLoading ? 'Aktiverar...' : 'Aktivera'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="text-[rgba(255,255,255,0.6)] hover:text-white"
              >
                Inte nu
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="text-[rgba(255,255,255,0.4)] hover:text-white -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Standalone hook for managing push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [hasSubscription, setHasSubscription] = useState(false)

  useEffect(() => {
    async function init() {
      const supported = await isPushSupported()
      setIsSupported(supported)

      if (supported) {
        setPermission(getNotificationPermission())

        try {
          const response = await fetch('/api/push-subscription')
          if (response.ok) {
            const data = await response.json()
            setHasSubscription(data.hasSubscriptions)
          }
        } catch (error) {
          console.error('Error checking subscription:', error)
        }
      }
    }

    init()
  }, [])

  const subscribe = useCallback(async () => {
    const token = await requestNotificationPermission()

    if (token) {
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        setPermission('granted')
        setHasSubscription(true)
        return true
      }
    }

    setPermission(getNotificationPermission())
    return false
  }, [])

  const unsubscribe = useCallback(async () => {
    // Note: This doesn't revoke permission, just removes server subscription
    const response = await fetch('/api/push-subscription', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Would need token, simplified for now
    })

    if (response.ok) {
      setHasSubscription(false)
      return true
    }

    return false
  }, [])

  return {
    isSupported,
    permission,
    hasSubscription,
    subscribe,
    unsubscribe,
  }
}
