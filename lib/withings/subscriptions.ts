import { getValidAccessToken } from './oauth'

const WITHINGS_NOTIFY_URL = 'https://wbsapi.withings.net/notify'

// Withings appli values:
// 1 = Weight
// 4 = Blood Pressure
// 16 = Activity
// 44 = Sleep

// Subscribe to weight notifications
export async function createWeightSubscription(userId: string): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken(userId)
    if (!accessToken) {
      console.error('[Withings Subscription] No valid access token for user:', userId)
      return false
    }

    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/withings/webhook`

    const params = new URLSearchParams({
      action: 'subscribe',
      callbackurl: callbackUrl,
      appli: '1', // Weight
    })

    const response = await fetch(WITHINGS_NOTIFY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    const data = await response.json()
    console.log('[Withings Subscription] Subscribe response:', JSON.stringify(data))

    if (data.status === 0) {
      console.log('[Withings Subscription] Created subscription for user:', userId)
      return true
    }

    // Status 343 means subscription already exists - that's fine
    if (data.status === 343) {
      console.log('[Withings Subscription] Subscription already exists for user:', userId)
      return true
    }

    console.error('[Withings Subscription] Failed to create subscription:', data)
    return false
  } catch (error) {
    console.error('[Withings Subscription] Error creating subscription:', error)
    return false
  }
}

// Unsubscribe from weight notifications
export async function deleteWeightSubscription(userId: string): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken(userId)
    if (!accessToken) {
      console.error('[Withings Subscription] No valid access token for user:', userId)
      return false
    }

    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/withings/webhook`

    const params = new URLSearchParams({
      action: 'revoke',
      callbackurl: callbackUrl,
      appli: '1', // Weight
    })

    const response = await fetch(WITHINGS_NOTIFY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    const data = await response.json()
    console.log('[Withings Subscription] Revoke response:', JSON.stringify(data))

    if (data.status === 0) {
      console.log('[Withings Subscription] Deleted subscription for user:', userId)
      return true
    }

    // Status 294 means subscription doesn't exist - that's fine
    if (data.status === 294) {
      console.log('[Withings Subscription] Subscription not found for user:', userId)
      return true
    }

    console.error('[Withings Subscription] Failed to delete subscription:', data)
    return false
  } catch (error) {
    console.error('[Withings Subscription] Error deleting subscription:', error)
    return false
  }
}

// List all subscriptions for a user
export async function listSubscriptions(userId: string): Promise<any[]> {
  try {
    const accessToken = await getValidAccessToken(userId)
    if (!accessToken) {
      return []
    }

    const params = new URLSearchParams({
      action: 'list',
      appli: '1', // Weight
    })

    const response = await fetch(`${WITHINGS_NOTIFY_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    if (data.status === 0) {
      return data.body?.profiles || []
    }

    return []
  } catch (error) {
    console.error('[Withings Subscription] Error listing subscriptions:', error)
    return []
  }
}
