import { getValidAccessToken } from './oauth'

const FITBIT_API_BASE = 'https://api.fitbit.com'

// Create a subscription for activity updates
export async function createActivitySubscription(userId: string): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken(userId)
    if (!accessToken) {
      console.error('[Fitbit Subscription] No valid access token for user:', userId)
      return false
    }

    // Use the user's database ID as the subscription ID for easy tracking
    const subscriptionId = userId

    // Create subscription for activities collection
    // POST /1/user/-/activities/apiSubscriptions/[subscription-id].json
    const response = await fetch(
      `${FITBIT_API_BASE}/1/user/-/activities/apiSubscriptions/${subscriptionId}.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (response.ok || response.status === 201) {
      console.log('[Fitbit Subscription] Created subscription for user:', userId)
      return true
    }

    // 409 Conflict means subscription already exists - that's fine
    if (response.status === 409) {
      console.log('[Fitbit Subscription] Subscription already exists for user:', userId)
      return true
    }

    const errorText = await response.text()
    console.error('[Fitbit Subscription] Failed to create subscription:', response.status, errorText)
    return false
  } catch (error) {
    console.error('[Fitbit Subscription] Error creating subscription:', error)
    return false
  }
}

// Delete a subscription
export async function deleteActivitySubscription(userId: string): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken(userId)
    if (!accessToken) {
      console.error('[Fitbit Subscription] No valid access token for user:', userId)
      return false
    }

    const subscriptionId = userId

    // DELETE /1/user/-/activities/apiSubscriptions/[subscription-id].json
    const response = await fetch(
      `${FITBIT_API_BASE}/1/user/-/activities/apiSubscriptions/${subscriptionId}.json`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (response.ok || response.status === 204) {
      console.log('[Fitbit Subscription] Deleted subscription for user:', userId)
      return true
    }

    // 404 means subscription doesn't exist - that's fine
    if (response.status === 404) {
      console.log('[Fitbit Subscription] Subscription not found for user:', userId)
      return true
    }

    const errorText = await response.text()
    console.error('[Fitbit Subscription] Failed to delete subscription:', response.status, errorText)
    return false
  } catch (error) {
    console.error('[Fitbit Subscription] Error deleting subscription:', error)
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

    const response = await fetch(
      `${FITBIT_API_BASE}/1/user/-/activities/apiSubscriptions.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data.apiSubscriptions || []
    }

    return []
  } catch (error) {
    console.error('[Fitbit Subscription] Error listing subscriptions:', error)
    return []
  }
}
