import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// This would be replaced with actual email sending in production
async function sendInvitationEmail(email: string, name: string, invitationToken: string) {
  const invitationUrl = `${process.env.NEXTAUTH_URL}/setup-account?token=${invitationToken}`

  console.log('=================================')
  console.log('INVITATION EMAIL')
  console.log('=================================')
  console.log('To:', email)
  console.log('Subject: Create Your Account - 90 Days Challenge')
  console.log('Name:', name)
  console.log('Invitation URL:', invitationUrl)
  console.log('=================================')

  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  // For now, just log the invitation

  return true
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user (coach)
    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      country,
      language,
      tags,
      startDate,
      membershipStatus,
      checkInFrequency,
      checkInPeriod,
      checkInDay,
    } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name and email are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')

    // Create the client user with pending status
    const client = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        phone,
        countryCode,
        country,
        language,
        tags: tags || [],
        membershipStartDate: startDate ? new Date(startDate) : new Date(),
        membershipStatus,
        checkInFrequency,
        checkInPeriod,
        checkInDay,
        role: 'client',
        status: 'pending',
        coachId: coach.id,
        invitationToken,
        invitationSentAt: new Date(),
      },
    })

    // Send invitation email
    await sendInvitationEmail(email, `${firstName} ${lastName}`, invitationToken)

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        status: client.status,
      },
    })
  } catch (error) {
    console.error('Failed to invite client:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
