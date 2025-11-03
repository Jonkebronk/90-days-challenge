import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Find user with this invite code
    const user = await prisma.user.findUnique({
      where: { inviteCode: code.toUpperCase().trim() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'This code doesn\'t exist in our vault' },
        { status: 404 }
      )
    }

    // Check if code has been used
    if (user.inviteCodeUsedAt) {
      return NextResponse.json(
        { error: 'This code has already been used' },
        { status: 400 }
      )
    }

    // Check if code has expired
    if (user.inviteCodeExpiresAt && new Date() > user.inviteCodeExpiresAt) {
      return NextResponse.json(
        { error: 'This code has expired' },
        { status: 400 }
      )
    }

    // Mark code as used
    await prisma.user.update({
      where: { id: user.id },
      data: {
        inviteCodeUsedAt: new Date(),
      },
    })

    // Return invitation token for account setup
    return NextResponse.json({
      success: true,
      invitationToken: user.invitationToken,
      userId: user.id,
    })
  } catch (error) {
    console.error('Invite code verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify invite code' },
      { status: 500 }
    )
  }
}
