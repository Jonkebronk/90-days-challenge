import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize'
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token'

// Generate PKCE code verifier (43-128 characters)
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

// Generate PKCE code challenge from verifier (SHA-256 hash)
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url')
}

// Generate random state parameter
export function generateState(): string {
  return crypto.randomBytes(16).toString('base64url')
}

// Build Fitbit authorization URL with state
export function buildAuthUrl(codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FITBIT_CLIENT_ID!,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: 'activity sleep',
    redirect_uri: process.env.FITBIT_REDIRECT_URI!,
    state: state,
  })

  return `${FITBIT_AUTH_URL}?${params.toString()}`
}

// Store OAuth state in database (PWA compatible)
export async function storeOAuthState(
  state: string,
  codeVerifier: string,
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

  // Create new state
  await prisma.oAuthState.create({
    data: {
      state,
      codeVerifier,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  })
}

// Retrieve and delete OAuth state from database
export async function retrieveOAuthState(
  state: string
): Promise<{ codeVerifier: string; userId: string } | null> {
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
    codeVerifier: oauthState.codeVerifier,
    userId: oauthState.userId,
  }
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
  userId: string
  scope: string
}> {
  const response = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      client_id: process.env.FITBIT_CLIENT_ID!,
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: process.env.FITBIT_REDIRECT_URI!,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for tokens: ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    userId: data.user_id,
    scope: data.scope,
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
  const response = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

// Get valid access token (refreshes if expired)
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const fitbitAccount = await prisma.fitbitAccount.findUnique({
    where: { userId },
  })

  if (!fitbitAccount) {
    return null
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date()
  const expiresAt = new Date(fitbitAccount.expiresAt)
  const bufferMs = 5 * 60 * 1000 // 5 minutes

  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    // Token is still valid
    return fitbitAccount.accessToken
  }

  // Token expired or about to expire, refresh it
  try {
    const tokens = await refreshAccessToken(fitbitAccount.refreshToken)

    // Update tokens in database
    await prisma.fitbitAccount.update({
      where: { userId },
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      },
    })

    return tokens.accessToken
  } catch (error) {
    console.error('Failed to refresh Fitbit token:', error)
    return null
  }
}
