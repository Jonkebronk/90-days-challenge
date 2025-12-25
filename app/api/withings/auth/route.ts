import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateState, buildAuthUrl, storeOAuthState } from '@/lib/withings/oauth'

// GET /api/withings/auth - Start OAuth flow
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id as string

    // Generate state for CSRF protection
    const state = generateState()

    // Store state in database (PWA compatible)
    await storeOAuthState(state, userId)

    // Build authorization URL
    const authUrl = buildAuthUrl(state)

    console.log('[Withings Auth] Redirecting to Withings OAuth for user:', userId)

    // Redirect to Withings
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('[Withings Auth] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start Withings OAuth flow' },
      { status: 500 }
    )
  }
}
