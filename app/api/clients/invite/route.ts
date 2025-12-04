import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

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
      city,
      country,
      age,
      gender,
      height,
      currentWeight,
      tags,
      checkInPeriod,
      checkInDay,
      // Application/Lead fields
      goals,
      biggestChallenges,
      previousCoaching,
      currentTraining,
      trainingExperience,
      injuries,
      dietHistory,
      foodPreferences,
      allergies,
      dailyRoutine,
      other,
      // Onboarding fields (legacy)
      primaryGoal,
      heightCm,
      currentWeightKg,
      genderAtBirth,
      birthDate,
      activityLevelFree,
      activityLevelWork,
      nutritionNotes,
      dietaryPreferences,
      excludedIngredients,
      nutritionMissing,
      trainingDays,
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
        city: city || null,
        birthdate: birthDate ? new Date(birthDate) : null,
        gender: gender || genderAtBirth || null,
        age: age ? parseInt(age) : null,
        height: height ? parseInt(height) : null,
        currentWeight: currentWeight ? parseFloat(currentWeight) : null,
        countryCode: '+46', // Default to Sweden
        country: country || 'Sverige',
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
        // Application/Lead data
        trainingGoal: goals || primaryGoal || null,
        biggestChallenges: biggestChallenges || null,
        previousCoaching: previousCoaching || null,
        currentTraining: currentTraining || null,
        trainingExperience: trainingExperience || null,
        injuries: injuries || null,
        dietHistory: dietHistory || null,
        favoriteFood: foodPreferences || null,
        allergies: allergies || null,
        lifestyle: dailyRoutine || lifestyleNotes || null,
        whyJoin: other || null,
        // Create UserProfile with onboarding data
        userProfile: {
          create: {
            primaryGoal: primaryGoal || goals || null,
            heightCm: heightCm ? parseFloat(heightCm) : (height ? parseFloat(height) : null),
            currentWeightKg: currentWeightKg ? parseFloat(currentWeightKg) : (currentWeight ? parseFloat(currentWeight) : null),
            genderAtBirth: genderAtBirth || gender || null,
            activityLevelFree: activityLevelFree || null,
            activityLevelWork: activityLevelWork || null,
            nutritionNotes: nutritionNotes || dietHistory || null,
            allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
            dietaryPreferences: dietaryPreferences || [],
            excludedIngredients: excludedIngredients ? [excludedIngredients] : [],
            nutritionMissing: nutritionMissing || null,
            trainingDays: trainingDays || [],
            trainingExperience: trainingExperience || null,
            trainingDetails: trainingDetails || currentTraining || null,
            lifestyleNotes: lifestyleNotes || dailyRoutine || null,
            onboardingCompleted: true, // Mark as completed since coach filled it out
          },
        },
      },
    })

    // Send invitation email
    const invitationUrl = `${process.env.NEXTAUTH_URL}/setup-account?token=${invitationToken}`
    const emailSent = await sendInvitationEmail(email, invitationUrl, `${firstName} ${lastName}`, coach.name || undefined)

    return NextResponse.json({
      success: true,
      emailSent,
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
