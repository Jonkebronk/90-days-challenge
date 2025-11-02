import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Send welcome email to new client
async function sendWelcomeEmail(email: string, name: string, coachName: string) {
  console.log('=================================')
  console.log('WELCOME EMAIL')
  console.log('=================================')
  console.log('To:', email)
  console.log('Subject: Välkommen till', coachName)
  console.log('Name:', name)
  console.log('Message: Ditt konto har nu skapats!')
  console.log('Du kan nu logga in i appen för att påbörja din resa.')
  console.log('iOS App Store: https://apps.apple.com/app/your-app-id')
  console.log('Google Play: https://play.google.com/store/apps/details?id=com.yourapp')
  console.log('=================================')

  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  // Email should include:
  // - Welcome message from coach
  // - App download buttons/links (iOS & Android)
  // - Instructions to log in

  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, firstName, lastName, birthdate, gender, password, gdprConsent } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    if (!firstName || !lastName || !birthdate || !gender || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (!gdprConsent) {
      return NextResponse.json(
        { error: 'GDPR consent is required' },
        { status: 400 }
      )
    }

    // Find user with this invitation token
    const user = await prisma.user.findUnique({
      where: { invitationToken: token },
      include: {
        coach: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if already activated
    if (user.status === 'active') {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user and activate account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        birthdate: new Date(birthdate),
        gender,
        password: hashedPassword,
        status: 'active',
        emailVerified: new Date(),
        // Clear invitation token after use
        invitationToken: null,
      },
    })

    // Send welcome email
    const coachName = user.coach?.name || 'John Sund'
    await sendWelcomeEmail(
      user.email,
      `${firstName} ${lastName}`,
      coachName
    )

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: 'Account created successfully',
    })
  } catch (error) {
    console.error('Setup account error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
