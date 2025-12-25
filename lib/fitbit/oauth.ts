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

// Build Fitbit authorization URL
export function buildAuthUrl(codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FITBIT_CLIENT_ID!,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: 'activity',
    redirect_uri: process.env.FITBIT_REDIRECT_URI!,
  })

  return `${FITBIT_AUTH_URL}?${params.toString()}`
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
