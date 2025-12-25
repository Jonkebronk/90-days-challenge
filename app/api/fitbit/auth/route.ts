import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateCodeVerifier, generateCodeChallenge, buildAuthUrl } from '@/lib/fitbit/oauth'
import { cookies } from 'next/headers'

// GET /api/fitbit/auth - Start OAuth flow
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate PKCE codes
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Store code verifier in cookie (encrypted in production)
    const cookieStore = await cookies()
    cookieStore.set('fitbit_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })

    // Build and redirect to Fitbit authorization URL
    const authUrl = buildAuthUrl(codeChallenge)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error starting Fitbit OAuth:', error)
    return NextResponse.json({ error: 'Failed to start OAuth' }, { status: 500 })
  }
}
