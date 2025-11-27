import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: FirebaseApp | null = null
let messaging: Messaging | null = null
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null

// Register the Firebase messaging service worker and send config
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready

    // Send Firebase config to service worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig,
      })
    }

    serviceWorkerRegistration = registration
    return registration
  } catch (error) {
    console.error('Error registering service worker:', error)
    return null
  }
}

// Initialize Firebase (client-side only)
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null

  if (!firebaseApp && getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig)
  } else if (!firebaseApp) {
    firebaseApp = getApps()[0]
  }

  return firebaseApp
}

// Get Firebase Messaging instance
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null

  const supported = await isSupported()
  if (!supported) {
    console.log('Firebase Messaging is not supported in this browser')
    return null
  }

  const app = getFirebaseApp()
  if (!app) return null

  if (!messaging) {
    messaging = getMessaging(app)
  }

  return messaging
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  try {
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return null
    }

    // Register service worker first
    const swRegistration = await registerServiceWorker()

    const messaging = await getFirebaseMessaging()
    if (!messaging) return null

    // Get FCM token with service worker registration
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration || undefined,
    })

    return token
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  getFirebaseMessaging().then((messaging) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload)
        callback(payload)
      })
    }
  })

  return () => {
    // Cleanup function (onMessage doesn't return unsubscribe, so this is a no-op)
  }
}

// Check if push notifications are supported
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // Check for Notification API
  if (!('Notification' in window)) return false

  // Check for Service Worker
  if (!('serviceWorker' in navigator)) return false

  // Check if Firebase Messaging is supported
  const supported = await isSupported()
  return supported
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null
  return Notification.permission
}
