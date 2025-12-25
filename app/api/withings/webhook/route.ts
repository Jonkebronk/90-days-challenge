import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncUserWeight } from '@/lib/withings/sync-weight'

// GET /api/withings/webhook - Withings uses GET for subscription verification
export async function GET() {
  // Withings sends a HEAD/GET request to verify the endpoint is reachable
  console.log('[Withings Webhook] Verification request received')
  return new NextResponse(null, { status: 200 })
}

// HEAD /api/withings/webhook - Withings also uses HEAD for verification
export async function HEAD() {
  console.log('[Withings Webhook] HEAD verification request received')
  return new NextResponse(null, { status: 200 })
}

// POST /api/withings/webhook - Receive weight notifications
export async function POST(req: NextRequest) {
  try {
    // Withings sends form-encoded data
    const formData = await req.formData()

    // Convert FormData to object for logging
    const data: Record<string, string> = {}
    formData.forEach((value, key) => {
      data[key] = value.toString()
    })

    console.log('[Withings Webhook] Received notification:', JSON.stringify(data))

    // Withings notification fields:
    // - userid: Withings user ID
    // - appli: Application type (1 = Weight)
    // - startdate: Start of measure range (Unix timestamp)
    // - enddate: End of measure range (Unix timestamp)

    const withingsUserId = data.userid
    const appli = data.appli

    // We only care about weight notifications (appli=1)
    if (appli !== '1') {
      console.log('[Withings Webhook] Ignoring non-weight notification, appli:', appli)
      return new NextResponse(null, { status: 200 })
    }

    if (!withingsUserId) {
      console.log('[Withings Webhook] No userid in notification')
      return new NextResponse(null, { status: 200 })
    }

    // Find the user by Withings user ID
    const withingsAccount = await prisma.withingsAccount.findFirst({
      where: { withingsUserId },
    })

    if (!withingsAccount) {
      console.log('[Withings Webhook] No account found for Withings user:', withingsUserId)
      return new NextResponse(null, { status: 200 })
    }

    console.log('[Withings Webhook] Syncing data for user:', withingsAccount.userId)

    // Sync the user's weight data (just the last 7 days to be safe)
    try {
      const result = await syncUserWeight(withingsAccount.userId, 7)
      console.log('[Withings Webhook] Sync complete for user:', withingsAccount.userId, 'synced:', result.synced)
    } catch (syncError) {
      console.error('[Withings Webhook] Sync failed for user:', withingsAccount.userId, syncError)
    }

    // Withings expects a 200 OK response
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('[Withings Webhook] Error processing notification:', error)
    // Still return 200 to acknowledge receipt
    return new NextResponse(null, { status: 200 })
  }
}
