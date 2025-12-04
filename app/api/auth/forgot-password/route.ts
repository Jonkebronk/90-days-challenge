import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'E-post krävs' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: 'Om e-postadressen finns i vårt system kommer du att få ett mejl med instruktioner.',
    })

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // If user doesn't exist, still return success (security)
    if (!user) {
      return successResponse
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    })

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    })

    // Build reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

    // Send email
    await sendPasswordResetEmail(
      normalizedEmail,
      resetUrl,
      user.name || undefined
    )

    return successResponse
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod. Försök igen senare.' },
      { status: 500 }
    )
  }
}
