import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import type { MealFeedbackCreate, FeedbackAccuracy } from '@/lib/social-meal/types';

// POST - Submit feedback for a meal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as MealFeedbackCreate;
    const {
      socialMealId,
      accuracy,
      adjustedKcal,
      adjustedProtein,
      adjustedCarbs,
      adjustedFat,
      originalKcal,
      originalProtein,
      originalCarbs,
      originalFat,
      notes,
    } = body;

    // Validate required fields
    if (!socialMealId || !accuracy || originalKcal === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the meal belongs to the user
    const meal = await prisma.socialMeal.findUnique({
      where: { id: socialMealId },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    if (meal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create or update feedback
    const feedback = await prisma.mealFeedback.upsert({
      where: { socialMealId },
      create: {
        userId: session.user.id,
        socialMealId,
        accuracy,
        adjustedKcal,
        adjustedProtein: adjustedProtein ?? null,
        adjustedCarbs: adjustedCarbs ?? null,
        adjustedFat: adjustedFat ?? null,
        originalKcal,
        originalProtein,
        originalCarbs,
        originalFat,
        notes,
      },
      update: {
        accuracy,
        adjustedKcal,
        adjustedProtein: adjustedProtein ?? null,
        adjustedCarbs: adjustedCarbs ?? null,
        adjustedFat: adjustedFat ?? null,
        notes,
      },
    });

    // Update user calibration based on feedback
    await updateUserCalibration(session.user.id);

    // If user provided adjusted values, update the meal
    if (adjustedKcal !== undefined || adjustedProtein !== undefined ||
        adjustedCarbs !== undefined || adjustedFat !== undefined) {
      await prisma.socialMeal.update({
        where: { id: socialMealId },
        data: {
          userAdjusted: true,
          ...(adjustedKcal !== undefined && { kcal: adjustedKcal }),
          ...(adjustedProtein !== undefined && { protein: adjustedProtein }),
          ...(adjustedCarbs !== undefined && { carbs: adjustedCarbs }),
          ...(adjustedFat !== undefined && { fat: adjustedFat }),
        },
      });
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// GET - Get feedback for a meal or user's feedback stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mealId = searchParams.get('mealId');

    if (mealId) {
      // Get feedback for specific meal
      const feedback = await prisma.mealFeedback.findUnique({
        where: { socialMealId: mealId },
      });

      if (feedback && feedback.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      return NextResponse.json({ feedback });
    }

    // Get user's calibration data
    const calibration = await prisma.userCalibration.findUnique({
      where: { userId: session.user.id },
    });

    // Get feedback stats
    const feedbackStats = await prisma.mealFeedback.groupBy({
      by: ['accuracy'],
      where: { userId: session.user.id },
      _count: { accuracy: true },
    });

    return NextResponse.json({
      calibration,
      feedbackStats,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// Helper function to update user calibration based on all feedback
async function updateUserCalibration(userId: string) {
  const allFeedback = await prisma.mealFeedback.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50, // Use last 50 feedback entries
  });

  if (allFeedback.length < 3) {
    // Need at least 3 feedbacks to start calibrating
    return;
  }

  // Calculate adjustment factors
  let kcalAdjustment = 1.0;
  let proteinAdjustment = 1.0;
  let carbsAdjustment = 1.0;
  let fatAdjustment = 1.0;

  const feedbackWithAdjustments = allFeedback.filter(f => f.adjustedKcal !== null);

  if (feedbackWithAdjustments.length > 0) {
    // Calculate average ratio for adjusted values
    const kcalRatios: number[] = [];
    const proteinRatios: number[] = [];
    const carbsRatios: number[] = [];
    const fatRatios: number[] = [];

    for (const fb of feedbackWithAdjustments) {
      if (fb.adjustedKcal && fb.originalKcal > 0) {
        kcalRatios.push(fb.adjustedKcal / fb.originalKcal);
      }
      if (fb.adjustedProtein && Number(fb.originalProtein) > 0) {
        proteinRatios.push(Number(fb.adjustedProtein) / Number(fb.originalProtein));
      }
      if (fb.adjustedCarbs && Number(fb.originalCarbs) > 0) {
        carbsRatios.push(Number(fb.adjustedCarbs) / Number(fb.originalCarbs));
      }
      if (fb.adjustedFat && Number(fb.originalFat) > 0) {
        fatRatios.push(Number(fb.adjustedFat) / Number(fb.originalFat));
      }
    }

    if (kcalRatios.length > 0) {
      kcalAdjustment = kcalRatios.reduce((a, b) => a + b, 0) / kcalRatios.length;
    }
    if (proteinRatios.length > 0) {
      proteinAdjustment = proteinRatios.reduce((a, b) => a + b, 0) / proteinRatios.length;
    }
    if (carbsRatios.length > 0) {
      carbsAdjustment = carbsRatios.reduce((a, b) => a + b, 0) / carbsRatios.length;
    }
    if (fatRatios.length > 0) {
      fatAdjustment = fatRatios.reduce((a, b) => a + b, 0) / fatRatios.length;
    }
  } else {
    // Use accuracy feedback to estimate adjustments
    const accuracyCounts: Record<FeedbackAccuracy, number> = {
      too_low: 0,
      about_right: 0,
      too_high: 0,
    };

    for (const fb of allFeedback) {
      accuracyCounts[fb.accuracy as FeedbackAccuracy]++;
    }

    // Calculate a simple adjustment based on feedback pattern
    const totalFeedback = allFeedback.length;
    const lowPct = accuracyCounts.too_low / totalFeedback;
    const highPct = accuracyCounts.too_high / totalFeedback;

    // If user consistently says "too_low", we need to increase our estimates
    // If user consistently says "too_high", we need to decrease
    const adjustment = 1 + (lowPct * 0.15) - (highPct * 0.15);
    kcalAdjustment = adjustment;
    proteinAdjustment = adjustment;
    carbsAdjustment = adjustment;
    fatAdjustment = adjustment;
  }

  // Clamp adjustments to reasonable range (0.7 - 1.5)
  const clamp = (val: number) => Math.min(1.5, Math.max(0.7, val));

  // Calculate confidence score (0-1)
  const confidenceScore = Math.min(1, allFeedback.length / 20);

  await prisma.userCalibration.upsert({
    where: { userId },
    create: {
      userId,
      kcalMultiplier: clamp(kcalAdjustment),
      proteinMultiplier: clamp(proteinAdjustment),
      carbsMultiplier: clamp(carbsAdjustment),
      fatMultiplier: clamp(fatAdjustment),
      feedbackCount: allFeedback.length,
      lastCalibratedAt: new Date(),
      confidenceScore,
    },
    update: {
      kcalMultiplier: clamp(kcalAdjustment),
      proteinMultiplier: clamp(proteinAdjustment),
      carbsMultiplier: clamp(carbsAdjustment),
      fatMultiplier: clamp(fatAdjustment),
      feedbackCount: allFeedback.length,
      lastCalibratedAt: new Date(),
      confidenceScore,
    },
  });
}
