import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import type { MealType, SocialContext, InputMethod, DataSource, ConfidenceLevel } from '@/lib/social-meal/types';

// GET - Fetch user's social meals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const mealType = searchParams.get('mealType') as MealType | null;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (mealType) {
      where.mealType = mealType;
    }

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        (where.timestamp as Record<string, Date>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.timestamp as Record<string, Date>).lte = new Date(dateTo);
      }
    }

    const [meals, total] = await Promise.all([
      prisma.socialMeal.findMany({
        where,
        include: {
          components: true,
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.socialMeal.count({ where }),
    ]);

    return NextResponse.json({
      meals,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching social meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social meals' },
      { status: 500 }
    );
  }
}

// POST - Create a new social meal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      mealType,
      socialContext,
      inputMethod = 'quick_track',
      kcal,
      kcalMin,
      kcalMax,
      protein,
      carbs,
      fat,
      fiber,
      confidence,
      dataSource = 'quick_track',
      presetDinnerId,
      presetDinnerName,
      notes,
      components,
      timestamp,
      isDeviation = false,
      deviationDate,
    } = body as {
      mealType: MealType;
      socialContext?: SocialContext;
      inputMethod?: InputMethod;
      kcal: number;
      kcalMin?: number;
      kcalMax?: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      confidence?: ConfidenceLevel;
      dataSource?: DataSource;
      presetDinnerId?: string;
      presetDinnerName?: string;
      notes?: string;
      components: Array<{
        category: string;
        foodItemId: string;
        foodItemName: string;
        portionSize: string;
        grams: number;
        kcal: number;
        protein: number;
        carbs: number;
        fat: number;
      }>;
      timestamp?: string;
      isDeviation?: boolean;
      deviationDate?: string;
    };

    // Validate required fields
    if (!mealType || kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the social meal with components
    const socialMeal = await prisma.socialMeal.create({
      data: {
        userId: session.user.id,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        mealType,
        socialContext,
        inputMethod,
        kcal,
        kcalMin,
        kcalMax,
        protein,
        carbs,
        fat,
        fiber,
        confidence,
        dataSource,
        presetDinnerId,
        presetDinnerName,
        notes,
        isDeviation,
        deviationDate: deviationDate ? new Date(deviationDate) : null,
        components: {
          create: components?.map((comp) => ({
            category: comp.category,
            foodItemId: comp.foodItemId,
            foodItemName: comp.foodItemName,
            portionSize: comp.portionSize,
            grams: comp.grams,
            kcal: comp.kcal,
            protein: comp.protein,
            carbs: comp.carbs,
            fat: comp.fat,
          })) || [],
        },
      },
      include: {
        components: true,
      },
    });

    return NextResponse.json({ meal: socialMeal }, { status: 201 });
  } catch (error) {
    console.error('Error creating social meal:', error);
    return NextResponse.json(
      { error: 'Failed to create social meal' },
      { status: 500 }
    );
  }
}
