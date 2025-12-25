import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncUserSteps } from '@/lib/fitbit/sync-steps'

// Fitbit sends a verification code that we must echo back
// GET /api/fitbit/webhook?verify=VERIFICATION_CODE
export async function GET(req: NextRequest) {
  const verify = req.nextUrl.searchParams.get('verify')

  if (verify) {
    // Fitbit verification request
    // Check if it matches our configured verification code
    const expectedCode = process.env.FITBIT_SUBSCRIBER_VERIFY_CODE
    console.log('[Fitbit Webhook] Verification request received:', verify)

    if (expectedCode && verify === expectedCode) {
      // Correct code - respond with 204
      return new NextResponse(null, { status: 204 })
    } else if (!expectedCode) {
      // No code configured - accept any (for testing)
      return new NextResponse(null, { status: 204 })
    } else {
      // Wrong code - respond with 404
      return new NextResponse(null, { status: 404 })
    }
  }

  return NextResponse.json({ status: 'Fitbit webhook endpoint active' })
}

// Fitbit sends notifications when user data changes
// POST /api/fitbit/webhook
export async function POST(req: NextRequest) {
  try {
    const notifications = await req.json()
    console.log('[Fitbit Webhook] Received notifications:', JSON.stringify(notifications))

    // Fitbit sends an array of notifications
    // Each notification contains: collectionType, date, ownerId, ownerType, subscriptionId
    if (!Array.isArray(notifications)) {
      console.log('[Fitbit Webhook] Invalid payload - not an array')
      return new NextResponse(null, { status: 204 })
    }

    // Process each notification
    for (const notification of notifications) {
      const { collectionType, ownerId, date } = notification

      // We only care about activity updates
      if (collectionType !== 'activities') {
        continue
      }

      // Find the user by Fitbit user ID
      const fitbitAccount = await prisma.fitbitAccount.findFirst({
        where: { fitbitUserId: ownerId },
      })

      if (!fitbitAccount) {
        console.log('[Fitbit Webhook] No account found for Fitbit user:', ownerId)
        continue
      }

      console.log('[Fitbit Webhook] Syncing data for user:', fitbitAccount.userId, 'date:', date)

      // Sync the user's step data (just the last 2 days to be safe)
      try {
        await syncUserSteps(fitbitAccount.userId, 2)
        console.log('[Fitbit Webhook] Sync complete for user:', fitbitAccount.userId)
      } catch (syncError) {
        console.error('[Fitbit Webhook] Sync failed for user:', fitbitAccount.userId, syncError)
      }
    }

    // Fitbit expects a 204 No Content response
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[Fitbit Webhook] Error processing notification:', error)
    // Still return 204 to acknowledge receipt
    return new NextResponse(null, { status: 204 })
  }
}
