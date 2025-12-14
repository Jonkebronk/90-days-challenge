// API Route: /api/nutrition-plans
// GET: List nutrition plans for coach
// POST: Create new nutrition plan

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateAllNutrition } from '@/lib/calculations/nutrition-plan-formulas';
import type { CreateNutritionPlanRequest } from '@/lib/types/client-nutrition-plan';

// GET: List nutrition plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    // Build query
    const where: Record<string, unknown> = {
      coachId: session.user.id,
    };

    // Filter by client if provided
    if (clientId) {
      where.clientId = clientId;
    }

    const plans = await prisma.clientNutritionPlan.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching nutrition plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nutrition plans' },
      { status: 500 }
    );
  }
}

// POST: Create new nutrition plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a coach
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'coach') {
      return NextResponse.json(
        { error: 'Only coaches can create nutrition plans' },
        { status: 403 }
      );
    }

    const body: CreateNutritionPlanRequest = await request.json();

    // Validate required fields
    if (!body.clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Verify client belongs to this coach
    const client = await prisma.user.findFirst({
      where: {
        id: body.clientId,
        coachId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or does not belong to this coach' },
        { status: 404 }
      );
    }

    // Calculate all nutrition values
    const calculations = calculateAllNutrition({
      weight: body.weight,
      height: body.height,
      age: body.age,
      gender: body.gender,
      lifestyleActivity: body.lifestyleActivity,
      exerciseActivity: body.exerciseActivity,
      caloricAdjustmentPercent: body.caloricAdjustmentPercent,
      proteinPerKg: body.proteinPerKg,
      fatPerKg: body.fatPerKg,
    });

    // Create the nutrition plan
    const plan = await prisma.clientNutritionPlan.create({
      data: {
        clientId: body.clientId,
        coachId: session.user.id,
        name: body.name || null,
        status: 'ACTIVE',
        calculationMethod: body.calculationMethod,
        calculationType: body.calculationType || null,
        weight: body.weight,
        height: body.height,
        age: body.age,
        gender: body.gender,
        lifestyleActivity: body.lifestyleActivity,
        exerciseActivity: body.exerciseActivity,
        lifestyleFactor: calculations.lifestyleFactor,
        exerciseFactor: calculations.exerciseFactor,
        lbm: calculations.lbm,
        bmr: calculations.bmr,
        tdee: calculations.tdee,
        caloricAdjustmentPercent: body.caloricAdjustmentPercent,
        dailyCalorieTarget: calculations.dailyCalorieTarget,
        proteinPerKg: body.proteinPerKg,
        proteinGrams: calculations.proteinGrams,
        fatPerKg: body.fatPerKg,
        fatGrams: calculations.fatGrams,
        carbGrams: calculations.carbGrams,
        hasTrainingDays: body.hasTrainingDays,
        hasNonTrainingDays: body.hasNonTrainingDays,
        mealsPerDay: body.mealsPerDay,
        workoutTime: body.workoutTime || null,
        nutritionSystem: body.nutritionSystem,
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

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating nutrition plan:', error);
    return NextResponse.json(
      { error: 'Failed to create nutrition plan' },
      { status: 500 }
    );
  }
}
