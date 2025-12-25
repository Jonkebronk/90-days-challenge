import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exchangeCodeForTokens } from '@/lib/fitbit/oauth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// Get base URL for redirects
function getBaseUrl() {
  return process.env.NEXTAUTH_URL || 'https://friskvardskompassen.com'
}

// GET /api/fitbit/callback - Handle OAuth callback
export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl()
  console.log('[Fitbit Callback] Starting, baseUrl:', baseUrl)

  try {
    const session = await getServerSession(authOptions)
    console.log('[Fitbit Callback] Session:', session?.user?.email || 'none')

    if (!session?.user) {
      console.log('[Fitbit Callback] No session found')
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=not_authenticated`)
    }

    const userId = session.user.id as string
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    console.log('[Fitbit Callback] Code:', code ? 'present' : 'missing', 'Error:', error)

    if (error) {
      console.error('[Fitbit Callback] OAuth error:', error)
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=fitbit_${error}`)
    }

    if (!code) {
      console.log('[Fitbit Callback] No code in params')
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=no_code`)
    }

    // Get code verifier from cookie
    const cookieStore = await cookies()
    const codeVerifier = cookieStore.get('fitbit_code_verifier')?.value
    console.log('[Fitbit Callback] Code verifier:', codeVerifier ? 'present' : 'MISSING')

    if (!codeVerifier) {
      console.log('[Fitbit Callback] No code verifier cookie found')
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=no_verifier`)
    }

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

    // Clear the code verifier cookie
    cookieStore.delete('fitbit_code_verifier')

    console.log('[Fitbit Callback] SUCCESS - Fitbit connected for user:', userId)
    // Redirect back to workout page with success message
    return NextResponse.redirect(`${baseUrl}/dashboard/workout?fitbit=connected`)
  } catch (error) {
    console.error('[Fitbit Callback] ERROR:', error)
    return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=token_exchange_failed`)
  }
}
