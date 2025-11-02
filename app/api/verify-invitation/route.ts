import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find user with this invitation token
    const user = await prisma.user.findUnique({
      where: { invitationToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        password: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if already activated
    if (user.status === 'active' && user.password) {
      return NextResponse.json(
        { valid: false, error: 'This invitation has already been used' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      client: {
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Verify invitation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Failed to verify invitation' },
      { status: 500 }
    )
  }
}
