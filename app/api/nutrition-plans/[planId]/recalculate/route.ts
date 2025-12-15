// API Route: /api/nutrition-plans/[planId]/recalculate
// POST: Recalculate nutrition plan values based on stored parameters

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  METABOLISM_MULTIPLIERS,
  CALORIE_GOAL_CONFIG,
  MetabolismActivityLevel,
  CalorieGoal,
} from '@/lib/types/client-nutrition-plan';

interface RouteParams {
  params: Promise<{ planId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await params;

    // Get existing plan
    const existingPlan = await prisma.clientNutritionPlan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Nutrition plan not found' },
        { status: 404 }
      );
    }

    // Only coach can recalculate
    if (existingPlan.coachId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the coach can recalculate this plan' },
        { status: 403 }
      );
    }

    // Calculate new values based on calculation method
    let dailyCalorieTarget: number;
    let proteinGrams: number;
    let fatGrams: number;
    let carbGrams: number;
    let tdee: number;

    const weight = Number(existingPlan.weight);
    const proteinPerKg = Number(existingPlan.proteinPerKg);
    const fatPerKg = Number(existingPlan.fatPerKg);

    if (existingPlan.calculationMethod === 'metabolism' && existingPlan.metabolismActivityLevel) {
      // Metabolism method calculation
      const activityLevel = existingPlan.metabolismActivityLevel as MetabolismActivityLevel;
      const multiplier = METABOLISM_MULTIPLIERS[activityLevel] || 30;
      const metabolism = weight * multiplier;

      // Apply calorie goal adjustment
      const calorieGoal = (existingPlan.calorieGoal as CalorieGoal) || 'maintenance';
      const config = CALORIE_GOAL_CONFIG[calorieGoal];
      const adjustment = config?.adjustmentPerDay || 0;

      tdee = Math.round(metabolism);
      dailyCalorieTarget = Math.round(Math.max(1200, metabolism + adjustment));

      // Calculate macros
      proteinGrams = Math.round(weight * proteinPerKg);
      fatGrams = Math.round(weight * fatPerKg);
      const remainingCals = dailyCalorieTarget - (proteinGrams * 4) - (fatGrams * 9);
      carbGrams = Math.round(Math.max(0, remainingCals / 4));
    } else {
      // For non-metabolism methods, keep existing values or recalculate based on stored data
      // For now, just keep existing values since we don't have the formula
      return NextResponse.json(
        { error: 'Recalculation is only supported for metabolism method plans' },
        { status: 400 }
      );
    }

    // Update the plan
    const updatedPlan = await prisma.clientNutritionPlan.update({
      where: { id: planId },
      data: {
        tdee,
        dailyCalorieTarget,
        proteinGrams,
        fatGrams,
        carbGrams,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      recalculated: {
        tdee,
        dailyCalorieTarget,
        proteinGrams,
        fatGrams,
        carbGrams,
      },
    });
  } catch (error) {
    console.error('Error recalculating nutrition plan:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate nutrition plan' },
      { status: 500 }
    );
  }
}
