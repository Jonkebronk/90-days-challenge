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
      tags,
      checkInPeriod,
      checkInDay,
      // Onboarding fields
      primaryGoal,
      heightCm,
      currentWeightKg,
      genderAtBirth,
      birthDate,
      activityLevelFree,
      activityLevelWork,
      nutritionNotes,
      allergies,
      dietaryPreferences,
      excludedIngredients,
      nutritionMissing,
      trainingDays,
      trainingExperience,
      trainingDetails,
      lifestyleNotes,
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

    // Generate unique golden ticket code (format: GOLD-XXXX-XXXX)
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed ambiguous characters
      const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      return `GOLD-${part1}-${part2}`
    }

    let inviteCode = generateInviteCode()
    // Ensure code is unique
    let existingCode = await prisma.user.findUnique({ where: { inviteCode } })
    while (existingCode) {
      inviteCode = generateInviteCode()
      existingCode = await prisma.user.findUnique({ where: { inviteCode } })
    }

    // Code expires in 30 days
    const inviteCodeExpiresAt = new Date()
    inviteCodeExpiresAt.setDate(inviteCodeExpiresAt.getDate() + 30)

    // Create the client user with pending status
    // Membership starts today and lasts 3 months (90 days)
    const client = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        phone: phone || null,
        birthdate: birthDate ? new Date(birthDate) : null,
        gender: genderAtBirth || null,
        countryCode: '+46', // Default to Sweden
        country: 'Sverige', // Default to Sweden
        language: 'Svenska', // Default to Swedish
        tags: tags || [],
        membershipStartDate: new Date(),
        membershipStatus: 'Pågående',
        checkInFrequency: '1', // Always 1
        checkInPeriod,
        checkInDay,
        role: 'client',
        status: 'pending',
        coachId: coach.id,
        invitationToken,
        invitationSentAt: new Date(),
        inviteCode,
        inviteCodeExpiresAt,
        // Create UserProfile with onboarding data
        userProfile: {
          create: {
            primaryGoal: primaryGoal || null,
            heightCm: heightCm ? parseFloat(heightCm) : null,
            currentWeightKg: currentWeightKg ? parseFloat(currentWeightKg) : null,
            genderAtBirth: genderAtBirth || null,
            activityLevelFree: activityLevelFree || null,
            activityLevelWork: activityLevelWork || null,
            nutritionNotes: nutritionNotes || null,
            allergies: allergies || [],
            dietaryPreferences: dietaryPreferences || [],
            excludedIngredients: excludedIngredients ? [excludedIngredients] : [],
            nutritionMissing: nutritionMissing || null,
            trainingDays: trainingDays || [],
            trainingExperience: trainingExperience || null,
            trainingDetails: trainingDetails || null,
            lifestyleNotes: lifestyleNotes || null,
            onboardingCompleted: true, // Mark as completed since coach filled it out
          },
        },
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
        inviteCode: client.inviteCode,
        inviteCodeExpiresAt: client.inviteCodeExpiresAt,
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
