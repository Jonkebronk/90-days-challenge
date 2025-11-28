// Firebase Messaging Service Worker
// This service worker handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Firebase config - hardcoded for service worker reliability
const firebaseConfig = {
  apiKey: "AIzaSyBELlWYBtHlKp6WKRX_hU1O9DUEmZsFIsA",
  authDomain: "friskvardskompassen-698e6.firebaseapp.com",
  projectId: "friskvardskompassen-698e6",
  storageBucket: "friskvardskompassen-698e6.firebasestorage.app",
  messagingSenderId: "549903959470",
  appId: "1:549903959470:web:de95aad84fc9673f49f43f"
}

// Initialize Firebase immediately
firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  const notificationTitle = payload.notification?.title || 'Ny notifikation'
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/images/icon-192.png',
    badge: '/images/icon-192.png',
    tag: payload.data?.tag || 'notification',
    requireInteraction: true,
    data: {
      link: payload.data?.link || payload.fcmOptions?.link || '/',
    },
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event)

  event.notification.close()

  const link = event.notification.data?.link || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            client.navigate(link)
            return
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(link)
        }
      })
  )
})

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installed')
  self.skipWaiting()
})

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated')
  event.waitUntil(clients.claim())
})

// Handle push events directly (fallback)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event)

  if (event.data) {
    try {
      const payload = event.data.json()
      console.log('[firebase-messaging-sw.js] Push payload:', payload)

      // If Firebase SDK didn't handle it, show notification manually
      if (payload.notification) {
        const notificationTitle = payload.notification.title || 'Ny notifikation'
        const notificationOptions = {
          body: payload.notification.body || '',
          icon: '/images/icon-192.png',
          badge: '/images/icon-192.png',
          tag: 'notification',
          requireInteraction: true,
          data: {
            link: payload.data?.link || payload.fcmOptions?.link || '/',
          },
        }

        event.waitUntil(
          self.registration.showNotification(notificationTitle, notificationOptions)
        )
      }
    } catch (e) {
      console.error('[firebase-messaging-sw.js] Error parsing push data:', e)
    }
  }
})
