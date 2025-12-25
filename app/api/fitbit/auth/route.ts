import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthUrl,
  storeOAuthState,
} from '@/lib/fitbit/oauth'

// GET /api/fitbit/auth - Start OAuth flow
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    // Generate PKCE codes and state
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)
    const state = generateState()

    // Store code verifier in database (PWA compatible)
    await storeOAuthState(state, codeVerifier, userId)

    // Build and redirect to Fitbit authorization URL
    const authUrl = buildAuthUrl(codeChallenge, state)

    console.log('[Fitbit Auth] Starting OAuth for user:', userId)
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error starting Fitbit OAuth:', error)
    return NextResponse.json({ error: 'Failed to start OAuth' }, { status: 500 })
  }
}
