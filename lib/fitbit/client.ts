import { getValidAccessToken } from './oauth'

const FITBIT_API_BASE = 'https://api.fitbit.com'

interface FitbitActivityResponse {
  summary: {
    steps: number
    caloriesOut: number
    veryActiveMinutes: number
    fairlyActiveMinutes: number
    lightlyActiveMinutes: number
    sedentaryMinutes: number
  }
  goals: {
    steps: number
    caloriesOut: number
    activeMinutes: number
  }
}

export interface DailyActivityData {
  date: string
  steps: number
  goal: number
  caloriesOut: number
  activeMinutes: number
}

// Format date as YYYY-MM-DD for Fitbit API
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Fetch activity data for a specific date
export async function fetchDailyActivity(
  userId: string,
  date: Date
): Promise<DailyActivityData | null> {
  const accessToken = await getValidAccessToken(userId)

  if (!accessToken) {
    return null
  }

  const dateStr = formatDate(date)

  try {
    const response = await fetch(
      `${FITBIT_API_BASE}/1/user/-/activities/date/${dateStr}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be revoked
        console.error('Fitbit token unauthorized')
        return null
      }
      throw new Error(`Fitbit API error: ${response.status}`)
    }

    const data: FitbitActivityResponse = await response.json()

    return {
      date: dateStr,
      steps: data.summary.steps,
      goal: data.goals.steps,
      caloriesOut: data.summary.caloriesOut,
      activeMinutes:
        data.summary.veryActiveMinutes +
        data.summary.fairlyActiveMinutes +
        data.summary.lightlyActiveMinutes,
    }
  } catch (error) {
    console.error(`Failed to fetch activity for ${dateStr}:`, error)
    return null
  }
}

// Fetch activity data for multiple dates
export async function fetchActivityRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyActivityData[]> {
  const activities: DailyActivityData[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const activity = await fetchDailyActivity(userId, currentDate)
    if (activity) {
      activities.push(activity)
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return activities
}

// Get user's Fitbit profile (for display purposes)
export async function fetchUserProfile(userId: string): Promise<{
  displayName: string
  avatar: string
} | null> {
  const accessToken = await getValidAccessToken(userId)

  if (!accessToken) {
    return null
  }

  try {
    const response = await fetch(`${FITBIT_API_BASE}/1/user/-/profile.json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    return {
      displayName: data.user.displayName,
      avatar: data.user.avatar150,
    }
  } catch (error) {
    console.error('Failed to fetch Fitbit profile:', error)
    return null
  }
}
