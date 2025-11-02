import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      primaryGoal,
      heightCm,
      currentWeightKg,
      genderAtBirth,
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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create or update user profile with onboarding data
    const userProfile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        primaryGoal,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        currentWeightKg: currentWeightKg ? parseFloat(currentWeightKg) : null,
        genderAtBirth,
        activityLevelFree,
        activityLevelWork,
        nutritionNotes,
        allergies: allergies || [],
        dietaryPreferences: dietaryPreferences || [],
        excludedIngredients: excludedIngredients ? [excludedIngredients] : [],
        nutritionMissing,
        trainingDays: trainingDays || [],
        trainingExperience,
        trainingDetails,
        lifestyleNotes,
        onboardingCompleted: true,
      },
      update: {
        primaryGoal,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        currentWeightKg: currentWeightKg ? parseFloat(currentWeightKg) : null,
        genderAtBirth,
        activityLevelFree,
        activityLevelWork,
        nutritionNotes,
        allergies: allergies || [],
        dietaryPreferences: dietaryPreferences || [],
        excludedIngredients: excludedIngredients ? [excludedIngredients] : [],
        nutritionMissing,
        trainingDays: trainingDays || [],
        trainingExperience,
        trainingDetails,
        lifestyleNotes,
        onboardingCompleted: true,
      },
    })

    console.log('Onboarding completed for user:', userId)

    return NextResponse.json({
      success: true,
      profile: userProfile,
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
      { status: 500 }
    )
  }
}
