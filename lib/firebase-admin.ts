import admin from 'firebase-admin'

// Initialize Firebase Admin SDK (server-side only)
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined

  if (privateKey && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    })
  } else {
    console.warn('Firebase Admin SDK not initialized: missing environment variables')
  }
}

export const firebaseAdmin = admin

// Send push notification to a single device
export async function sendPushToDevice(
  token: string,
  title: string,
  body: string,
  link?: string,
  data?: Record<string, string>
): Promise<boolean> {
  if (!admin.apps.length) {
    console.warn('Firebase Admin not initialized')
    return false
  }

  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          icon: '/images/icon-192.png',
          badge: '/images/icon-192.png',
          tag: 'notification',
          requireInteraction: true,
        },
        fcmOptions: {
          link: link || '/',
        },
      },
      data: {
        ...data,
        link: link || '/',
      },
    }

    await admin.messaging().send(message)
    return true
  } catch (error: any) {
    // Handle invalid tokens
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      console.log('Invalid token, should be removed:', token.substring(0, 20) + '...')
      return false
    }

    console.error('Error sending push notification:', error)
    return false
  }
}

// Send push notification to multiple devices
export async function sendPushToDevices(
  tokens: string[],
  title: string,
  body: string,
  link?: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failedTokens: string[] }> {
  if (!admin.apps.length) {
    console.warn('Firebase Admin not initialized')
    return { successCount: 0, failedTokens: tokens }
  }

  if (tokens.length === 0) {
    return { successCount: 0, failedTokens: [] }
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          icon: '/images/icon-192.png',
          badge: '/images/icon-192.png',
          tag: 'notification',
          requireInteraction: true,
        },
        fcmOptions: {
          link: link || '/',
        },
      },
      data: {
        ...data,
        link: link || '/',
      },
    }

    const response = await admin.messaging().sendEachForMulticast(message)

    const failedTokens: string[] = []
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx])
      }
    })

    return {
      successCount: response.successCount,
      failedTokens,
    }
  } catch (error) {
    console.error('Error sending multicast push notification:', error)
    return { successCount: 0, failedTokens: tokens }
  }
}
