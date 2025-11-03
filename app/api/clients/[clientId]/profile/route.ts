import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
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

    const { clientId } = await params
    const body = await request.json()

    // Find the client
    const client = await prisma.user.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Verify the client belongs to this coach
    if (client.coachId !== coach.id) {
      return NextResponse.json(
        { error: 'You can only edit your own clients' },
        { status: 403 }
      )
    }

    // Convert birthdate string to DateTime if provided
    let birthdateValue = undefined
    if (body.birthdate) {
      birthdateValue = new Date(body.birthdate)
    }

    // Update or create the user profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: clientId },
      update: {
        birthdate: birthdateValue,
        genderAtBirth: body.gender,
        heightCm: body.heightCm ? parseFloat(body.heightCm) : null,
        currentWeightKg: body.currentWeightKg ? parseFloat(body.currentWeightKg) : null,
        primaryGoal: body.primaryGoal,
        activityLevelFree: body.activityLevelFree,
        activityLevelWork: body.activityLevelWork,
        trainingExperience: body.trainingExperience,
        trainingDetails: body.trainingDetails,
        trainingDays: body.trainingDays || [],
        nutritionNotes: body.nutritionNotes,
        allergies: body.allergies || [],
        dietaryPreferences: body.dietaryPreferences || [],
        excludedIngredients: body.excludedIngredients || [],
        nutritionMissing: body.nutritionMissing,
        lifestyleNotes: body.lifestyleNotes,
        onboardingCompleted: true,
      },
      create: {
        userId: clientId,
        birthdate: birthdateValue,
        genderAtBirth: body.gender,
        heightCm: body.heightCm ? parseFloat(body.heightCm) : null,
        currentWeightKg: body.currentWeightKg ? parseFloat(body.currentWeightKg) : null,
        primaryGoal: body.primaryGoal,
        activityLevelFree: body.activityLevelFree,
        activityLevelWork: body.activityLevelWork,
        trainingExperience: body.trainingExperience,
        trainingDetails: body.trainingDetails,
        trainingDays: body.trainingDays || [],
        nutritionNotes: body.nutritionNotes,
        allergies: body.allergies || [],
        dietaryPreferences: body.dietaryPreferences || [],
        excludedIngredients: body.excludedIngredients || [],
        nutritionMissing: body.nutritionMissing,
        lifestyleNotes: body.lifestyleNotes,
        onboardingCompleted: true,
      },
    })

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error('Failed to save profile:', error)
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}
