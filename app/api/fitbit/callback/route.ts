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

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=not_authenticated`)
    }

    const userId = session.user.id as string
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('Fitbit OAuth error:', error)
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=fitbit_${error}`)
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=no_code`)
    }

    // Get code verifier from cookie
    const cookieStore = await cookies()
    const codeVerifier = cookieStore.get('fitbit_code_verifier')?.value

    if (!codeVerifier) {
      return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=no_verifier`)
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier)

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

    // Redirect back to workout page with success message
    return NextResponse.redirect(`${baseUrl}/dashboard/workout?fitbit=connected`)
  } catch (error) {
    console.error('Error in Fitbit callback:', error)
    return NextResponse.redirect(`${baseUrl}/dashboard/profile?error=token_exchange_failed`)
  }
}
