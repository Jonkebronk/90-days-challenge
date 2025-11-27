// Firebase Messaging Service Worker
// This service worker handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Firebase config will be sent via postMessage from the client
let firebaseConfig = null

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config
    initializeFirebase()
  }
})

function initializeFirebase() {
  if (!firebaseConfig) return

  try {
    firebase.initializeApp(firebaseConfig)
    const messaging = firebase.messaging()

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload)

      const notificationTitle = payload.notification?.title || 'Ny notifikation'
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: payload.data?.tag || 'notification',
        requireInteraction: true,
        data: {
          link: payload.data?.link || payload.fcmOptions?.link || '/',
        },
      }

      self.registration.showNotification(notificationTitle, notificationOptions)
    })
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error initializing Firebase:', error)
  }
}

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
