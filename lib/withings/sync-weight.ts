import { prisma } from '@/lib/prisma'
import { getValidAccessToken } from './oauth'

const WITHINGS_MEASURE_URL = 'https://wbsapi.withings.net/measure'

interface WithingsMeasure {
  value: number
  type: number
  unit: number
}

interface WithingsMeasureGroup {
  grpid: number
  attrib: number
  date: number // Unix timestamp
  created: number
  category: number
  deviceid: string | null
  measures: WithingsMeasure[]
}

interface WithingsResponse {
  status: number
  body: {
    updatetime: number
    timezone: string
    measuregrps: WithingsMeasureGroup[]
  }
  error?: string
}

// Convert Withings measure value to kg
// Withings uses: value * 10^unit
// Weight is type 1, returned in kg (usually unit=-3 means grams stored as integer)
function convertToKg(value: number, unit: number): number {
  return value * Math.pow(10, unit)
}

// Sync weight data for a user
export async function syncUserWeight(
  userId: string,
  days: number = 30
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = []
  let synced = 0

  try {
    const accessToken = await getValidAccessToken(userId)
    if (!accessToken) {
      return { synced: 0, errors: ['No valid access token'] }
    }

    // Calculate date range
    const endDate = Math.floor(Date.now() / 1000) // Now in Unix timestamp
    const startDate = endDate - (days * 24 * 60 * 60) // days ago

    // Fetch weight measurements
    const params = new URLSearchParams({
      action: 'getmeas',
      meastype: '1', // Weight
      category: '1', // Real measures (not goals)
      startdate: startDate.toString(),
      enddate: endDate.toString(),
    })

    const response = await fetch(`${WITHINGS_MEASURE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data: WithingsResponse = await response.json()
    console.log('[Withings Sync] Response status:', data.status)

    if (data.status !== 0) {
      return { synced: 0, errors: [`Withings API error: ${data.error || 'Unknown'} (status: ${data.status})`] }
    }

    const measureGroups = data.body?.measuregrps || []
    console.log(`[Withings Sync] Found ${measureGroups.length} measurement groups`)

    // Process each measurement group
    for (const group of measureGroups) {
      // Find weight measurement (type 1)
      const weightMeasure = group.measures.find(m => m.type === 1)
      if (!weightMeasure) continue

      // Convert timestamp to date
      const measureDate = new Date(group.date * 1000)
      const dateStr = measureDate.toISOString().split('T')[0]

      // Convert to kg
      const weightKg = convertToKg(weightMeasure.value, weightMeasure.unit)
      console.log(`[Withings Sync] Date: ${dateStr}, Weight: ${weightKg} kg`)

      // Upsert to database
      try {
        await prisma.dailyWeight.upsert({
          where: {
            userId_date: {
              userId,
              date: new Date(dateStr),
            },
          },
          create: {
            userId,
            date: new Date(dateStr),
            weight: weightKg,
            source: 'withings',
            syncedAt: new Date(),
          },
          update: {
            weight: weightKg,
            source: 'withings',
            syncedAt: new Date(),
          },
        })
        synced++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Failed to save weight for ${dateStr}: ${message}`)
      }
    }

    console.log(`[Withings Sync] Synced ${synced} weight entries for user ${userId}`)
    return { synced, errors }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Withings Sync] Error:', message)
    return { synced: 0, errors: [message] }
  }
}

// Sync weight for all users with Withings accounts
export async function syncAllUsers(days: number = 7): Promise<{
  total: number
  successful: number
  failed: number
}> {
  const accounts = await prisma.withingsAccount.findMany({
    select: { userId: true },
  })

  let successful = 0
  let failed = 0

  for (const account of accounts) {
    try {
      const result = await syncUserWeight(account.userId, days)
      if (result.errors.length === 0) {
        successful++
      } else {
        failed++
        console.error(`[Withings Sync] Errors for user ${account.userId}:`, result.errors)
      }
    } catch (error) {
      failed++
      console.error(`[Withings Sync] Failed for user ${account.userId}:`, error)
    }
  }

  return {
    total: accounts.length,
    successful,
    failed,
  }
}
