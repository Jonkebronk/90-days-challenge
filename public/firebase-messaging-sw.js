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

// Handle background messages (data-only messages)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  // For data-only messages, we need to show the notification manually
  const title = payload.data?.title || 'Ny notifikation'
  const options = {
    body: payload.data?.body || '',
    icon: '/images/icon-192.png',
    badge: '/images/icon-192.png',
    tag: 'message-notification',
    requireInteraction: true,
    data: {
      link: payload.data?.link || '/',
    },
  }

  self.registration.showNotification(title, options)
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
