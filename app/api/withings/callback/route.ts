import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, retrieveOAuthState } from '@/lib/withings/oauth'
import { prisma } from '@/lib/prisma'
import { syncUserWeight } from '@/lib/withings/sync-weight'
import { createWeightSubscription } from '@/lib/withings/subscriptions'

// Get base URL for redirects
function getBaseUrl() {
  return process.env.NEXTAUTH_URL || 'https://friskvardskompassen.com'
}

// GET /api/withings/callback - Handle OAuth callback
export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl()
  console.log('[Withings Callback] Starting, baseUrl:', baseUrl)

  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    console.log('[Withings Callback] Code:', code ? 'present' : 'missing', 'State:', state ? 'present' : 'missing', 'Error:', error)

    if (error) {
      console.error('[Withings Callback] OAuth error:', error)
      return NextResponse.redirect(`${baseUrl}/dashboard?error=withings_${error}`)
    }

    if (!code) {
      console.log('[Withings Callback] No code in params')
      return NextResponse.redirect(`${baseUrl}/dashboard?error=withings_no_code`)
    }

    if (!state) {
      console.log('[Withings Callback] No state in params')
      return NextResponse.redirect(`${baseUrl}/dashboard?error=withings_no_state`)
    }

    // Retrieve userId from database using state
    const oauthState = await retrieveOAuthState(state)
    console.log('[Withings Callback] OAuth state from DB:', oauthState ? 'found' : 'NOT FOUND')

    if (!oauthState) {
      console.log('[Withings Callback] No OAuth state found for state:', state)
      return NextResponse.redirect(`${baseUrl}/dashboard?error=withings_invalid_state`)
    }

    const { userId } = oauthState

    // Exchange code for tokens
    console.log('[Withings Callback] Exchanging code for tokens...')
    const tokens = await exchangeCodeForTokens(code)
    console.log('[Withings Callback] Got tokens for Withings user:', tokens.userId)

    // Save or update Withings account
    await prisma.withingsAccount.upsert({
      where: { userId },
      create: {
        userId,
        withingsUserId: tokens.userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scope: tokens.scope,
      },
      update: {
        withingsUserId: tokens.userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scope: tokens.scope,
      },
    })

    console.log('[Withings Callback] SUCCESS - Withings connected for user:', userId)

    // Trigger initial sync of weight data (don't await, let it run in background)
    syncUserWeight(userId, 30).then(result => {
      console.log('[Withings Callback] Initial sync complete:', result)
    }).catch(err => {
      console.error('[Withings Callback] Initial sync failed:', err)
    })

    // Create webhook subscription for real-time updates (don't await)
    createWeightSubscription(userId).then(success => {
      console.log('[Withings Callback] Subscription created:', success)
    }).catch(err => {
      console.error('[Withings Callback] Subscription creation failed:', err)
    })

    // Redirect back to dashboard with success message
    return NextResponse.redirect(`${baseUrl}/dashboard?withings=connected`)
  } catch (error) {
    console.error('[Withings Callback] ERROR:', error)
    return NextResponse.redirect(`${baseUrl}/dashboard?error=withings_token_exchange_failed`)
  }
}
