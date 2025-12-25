import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const WITHINGS_AUTH_URL = 'https://account.withings.com/oauth2_user/authorize2'
const WITHINGS_TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2'

// Generate random state parameter
export function generateState(): string {
  return crypto.randomBytes(16).toString('base64url')
}

// Build Withings authorization URL
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.WITHINGS_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/withings/callback`,
    scope: 'user.metrics',
    state: state,
  })

  return `${WITHINGS_AUTH_URL}?${params.toString()}`
}

// Store OAuth state in database (reuse OAuthState from Fitbit)
export async function storeOAuthState(
  state: string,
  userId: string
): Promise<void> {
  // Delete any existing states for this user (cleanup)
  await prisma.oAuthState.deleteMany({
    where: { userId },
  })

  // Also delete expired states
  await prisma.oAuthState.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })

  // Create new state (codeVerifier is required field, use placeholder for Withings)
  await prisma.oAuthState.create({
    data: {
      state,
      codeVerifier: 'withings', // Placeholder - Withings doesn't use PKCE
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  })
}

// Retrieve and delete OAuth state from database
export async function retrieveOAuthState(
  state: string
): Promise<{ userId: string } | null> {
  const oauthState = await prisma.oAuthState.findUnique({
    where: { state },
  })

  if (!oauthState) {
    return null
  }

  // Check if expired
  if (oauthState.expiresAt < new Date()) {
    await prisma.oAuthState.delete({ where: { state } })
    return null
  }

  // Delete the state (one-time use)
  await prisma.oAuthState.delete({ where: { state } })

  return {
    userId: oauthState.userId,
  }
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string
): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
  userId: string
  scope: string
}> {
  const params = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'authorization_code',
    client_id: process.env.WITHINGS_CLIENT_ID!,
    client_secret: process.env.WITHINGS_CLIENT_SECRET!,
    code,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/withings/callback`,
  })

  const response = await fetch(WITHINGS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })

  const data = await response.json()
  console.log('[Withings OAuth] Token response:', JSON.stringify(data))

  if (data.status !== 0) {
    throw new Error(`Withings token error: ${data.error || 'Unknown error'} (status: ${data.status})`)
  }

  const body = data.body

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresIn: body.expires_in,
    userId: body.userid,
    scope: body.scope,
  }
}

// Refresh access token
export async function refreshAccessToken(
  refreshToken: string
): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const params = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'refresh_token',
    client_id: process.env.WITHINGS_CLIENT_ID!,
    client_secret: process.env.WITHINGS_CLIENT_SECRET!,
    refresh_token: refreshToken,
  })

  const response = await fetch(WITHINGS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })

  const data = await response.json()

  if (data.status !== 0) {
    throw new Error(`Failed to refresh Withings token: ${data.error || 'Unknown error'}`)
  }

  const body = data.body

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresIn: body.expires_in,
  }
}

// Get valid access token (refreshes if expired)
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const withingsAccount = await prisma.withingsAccount.findUnique({
    where: { userId },
  })

  if (!withingsAccount) {
    return null
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date()
  const expiresAt = new Date(withingsAccount.expiresAt)
  const bufferMs = 5 * 60 * 1000 // 5 minutes

  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    // Token is still valid
    return withingsAccount.accessToken
  }

  // Token expired or about to expire, refresh it
  try {
    console.log('[Withings OAuth] Token expired, refreshing...')
    const tokens = await refreshAccessToken(withingsAccount.refreshToken)

    // Update tokens in database
    await prisma.withingsAccount.update({
      where: { userId },
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      },
    })

    console.log('[Withings OAuth] Token refreshed successfully')
    return tokens.accessToken
  } catch (error) {
    console.error('[Withings OAuth] Failed to refresh token:', error)
    return null
  }
}
