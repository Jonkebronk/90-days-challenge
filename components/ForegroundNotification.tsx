'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { onForegroundMessage } from '@/lib/firebase'
import { Bell } from 'lucide-react'
import { useNotificationSound } from '@/lib/hooks/useNotificationSound'

export function ForegroundNotification() {
  const router = useRouter()
  const { playSound } = useNotificationSound()

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Foreground notification received:', payload)

      // Play notification sound
      playSound()

      // Handle both notification payload and data-only payload
      const title = payload.notification?.title || payload.data?.title || 'Ny notifikation'
      const body = payload.notification?.body || payload.data?.body || ''
      const link = payload.data?.link || payload.fcmOptions?.link

      // Show toast notification
      toast(title, {
        description: body,
        icon: <Bell className="w-5 h-5 text-gold-primary" />,
        duration: 8000,
        action: link ? {
          label: 'Visa',
          onClick: () => {
            router.push(link)
          },
        } : undefined,
      })
    })

    return unsubscribe
  }, [router, playSound])

  return null
}
