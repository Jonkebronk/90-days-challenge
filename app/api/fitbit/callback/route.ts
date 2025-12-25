import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, retrieveOAuthState } from '@/lib/fitbit/oauth'
import { prisma } from '@/lib/prisma'
import { syncUserSteps } from '@/lib/fitbit/sync-steps'

// Get base URL for redirects
function getBaseUrl() {
  return process.env.NEXTAUTH_URL || 'https://friskvardskompassen.com'
}

// GET /api/fitbit/callback - Handle OAuth callback
export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl()
  console.log('[Fitbit Callback] Starting, baseUrl:', baseUrl)

  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    console.log('[Fitbit Callback] Code:', code ? 'present' : 'missing', 'State:', state ? 'present' : 'missing', 'Error:', error)

    if (error) {
      console.error('[Fitbit Callback] OAuth error:', error)
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=fitbit_${error}`)
    }

    if (!code) {
      console.log('[Fitbit Callback] No code in params')
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=no_code`)
    }

    if (!state) {
      console.log('[Fitbit Callback] No state in params')
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=no_state`)
    }

    // Retrieve code verifier and userId from database using state
    const oauthState = await retrieveOAuthState(state)
    console.log('[Fitbit Callback] OAuth state from DB:', oauthState ? 'found' : 'NOT FOUND')

    if (!oauthState) {
      console.log('[Fitbit Callback] No OAuth state found for state:', state)
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=invalid_state`)
    }

    const { codeVerifier, userId } = oauthState

    // Exchange code for tokens
    console.log('[Fitbit Callback] Exchanging code for tokens...')
    const tokens = await exchangeCodeForTokens(code, codeVerifier)
    console.log('[Fitbit Callback] Got tokens for Fitbit user:', tokens.userId)

    // Save or update Fitbit account
    await prisma.fitbitAccount.upsert({
      where: { userId },
      create: {
        userId,
        fitbitUserId: tokens.userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scope: tokens.scope,
      },
      update: {
        fitbitUserId: tokens.userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scope: tokens.scope,
      },
    })

    console.log('[Fitbit Callback] SUCCESS - Fitbit connected for user:', userId)

    // Trigger initial sync of step data (don't await, let it run in background)
    syncUserSteps(userId, 7).then(result => {
      console.log('[Fitbit Callback] Initial sync complete:', result)
    }).catch(err => {
      console.error('[Fitbit Callback] Initial sync failed:', err)
    })

    // Redirect back to dashboard with success message
    return NextResponse.redirect(`${baseUrl}/dashboard?fitbit=connected`)
  } catch (error) {
    console.error('[Fitbit Callback] ERROR:', error)
    return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=token_exchange_failed`)
  }
}
