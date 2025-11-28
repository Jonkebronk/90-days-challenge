import { prisma } from '@/lib/prisma'
import { sendPushToDevices } from './firebase-admin'

// Notification types for different events
export type NotificationType =
  | 'new_message'
  | 'check_in_submitted'
  | 'workout_assigned'
  | 'meal_plan_assigned'
  | 'check_in_reminder'

// Send push notification to a user by userId
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  link?: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  try {
    // Get all push subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, token: true },
    })

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 }
    }

    const tokens = subscriptions.map((s) => s.token)

    // Send to all devices
    const result = await sendPushToDevices(tokens, title, body, link, data)

    // Remove failed tokens from database
    if (result.failedTokens.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          token: { in: result.failedTokens },
        },
      })
    }

    return {
      sent: result.successCount,
      failed: result.failedTokens.length,
    }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { sent: 0, failed: 0 }
  }
}

// Send notification for new message
export async function notifyNewMessage(
  receiverId: string,
  senderName: string
): Promise<void> {
  await sendPushNotification(
    receiverId,
    'Nytt meddelande',
    `${senderName} har skickat ett meddelande`,
    '/dashboard/messages',
    { type: 'new_message' }
  )
}

// Send notification for check-in submitted (to coach)
export async function notifyCheckInSubmitted(
  coachId: string,
  clientName: string,
  checkInId: string
): Promise<void> {
  await sendPushNotification(
    coachId,
    'Ny vecko-check-in',
    `${clientName} har gjort sin vecko-check-in`,
    `/dashboard/clients?checkIn=${checkInId}`,
    { type: 'check_in_submitted' }
  )
}

// Send notification for workout program assigned
export async function notifyWorkoutAssigned(
  clientId: string,
  programName: string
): Promise<void> {
  await sendPushNotification(
    clientId,
    'Nytt träningsprogram!',
    `Du har fått ett nytt träningsprogram: ${programName}`,
    '/dashboard/workout',
    { type: 'workout_assigned' }
  )
}

// Send notification for meal plan assigned
export async function notifyMealPlanAssigned(
  clientId: string,
  planName: string
): Promise<void> {
  await sendPushNotification(
    clientId,
    'Nytt kostschema!',
    `Du har fått ett nytt kostschema: ${planName}`,
    '/dashboard/nutrition/meal-plan',
    { type: 'meal_plan_assigned' }
  )
}

// Send weight reminder (for cron job)
export async function sendWeightReminders(): Promise<{
  total: number
  sent: number
  failed: number
}> {
  try {
    // Find all users with weight reminders enabled who have push subscriptions
    const usersWithReminders = await prisma.user.findMany({
      where: {
        weightReminderEnabled: true,
        pushSubscriptions: {
          some: {},
        },
      },
      select: {
        id: true,
      },
    })

    let totalSent = 0
    let totalFailed = 0

    for (const user of usersWithReminders) {
      const result = await sendPushNotification(
        user.id,
        'Morgonvägning 🌅',
        'Dags att väga dig! Klicka här för att logga din vikt.',
        '/dashboard',
        { type: 'weight_reminder' }
      )

      totalSent += result.sent
      totalFailed += result.failed
    }

    return {
      total: usersWithReminders.length,
      sent: totalSent,
      failed: totalFailed,
    }
  } catch (error) {
    console.error('Error sending weight reminders:', error)
    return { total: 0, sent: 0, failed: 0 }
  }
}

// Send check-in reminder (for cron job)
export async function sendCheckInReminders(): Promise<{
  total: number
  sent: number
  failed: number
}> {
  try {
    // Find all active clients who have push subscriptions
    const clientsWithPush = await prisma.user.findMany({
      where: {
        role: 'client',
        status: 'active',
        pushSubscriptions: {
          some: {},
        },
      },
      select: {
        id: true,
        pushSubscriptions: {
          select: { token: true },
        },
      },
    })

    let totalSent = 0
    let totalFailed = 0

    for (const client of clientsWithPush) {
      const result = await sendPushNotification(
        client.id,
        'Dags för check-in!',
        'Glöm inte att göra din vecko-check-in idag',
        '/dashboard/check-in',
        { type: 'check_in_reminder' }
      )

      totalSent += result.sent
      totalFailed += result.failed
    }

    return {
      total: clientsWithPush.length,
      sent: totalSent,
      failed: totalFailed,
    }
  } catch (error) {
    console.error('Error sending check-in reminders:', error)
    return { total: 0, sent: 0, failed: 0 }
  }
}
