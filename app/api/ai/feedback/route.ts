/**
 * AI Feedback API Endpoint
 *
 * POST /api/ai/feedback
 *
 * Sparar feedback på AI-svar för att förbättra agenten över tid.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AIFeedbackRequest } from '@/lib/ai/types';

export async function POST(request: Request) {
  try {
    const body: AIFeedbackRequest = await request.json();
    const { nutritionPlanId, messageIndex, rating, typ, kommentar } = body;

    if (!nutritionPlanId || messageIndex === undefined || !rating || !typ) {
      return NextResponse.json(
        { error: 'nutritionPlanId, messageIndex, rating och typ krävs' },
        { status: 400 }
      );
    }

    // Validera rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating måste vara mellan 1 och 5' },
        { status: 400 }
      );
    }

    // Validera typ
    if (!['bra', 'kan_forbattras', 'fel'].includes(typ)) {
      return NextResponse.json(
        { error: 'typ måste vara "bra", "kan_forbattras" eller "fel"' },
        { status: 400 }
      );
    }

    // Verifiera att kostplanen finns
    const plan = await prisma.clientNutritionPlan.findUnique({
      where: { id: nutritionPlanId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Kostplan hittades inte' },
        { status: 404 }
      );
    }

    // Spara feedback
    const feedback = await prisma.aIFeedback.create({
      data: {
        nutritionPlanId,
        messageIndex,
        rating,
        typ,
        kommentar: kommentar || null,
      },
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Kunde inte spara feedback' },
      { status: 500 }
    );
  }
}

// GET - Hämta feedbackstatistik för en coach
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const nutritionPlanId = searchParams.get('nutritionPlanId');

    let where: any = {};

    if (nutritionPlanId) {
      where.nutritionPlanId = nutritionPlanId;
    } else if (coachId) {
      // Hämta alla kostplaner för coachen
      const plans = await prisma.clientNutritionPlan.findMany({
        where: { coachId },
        select: { id: true },
      });
      where.nutritionPlanId = { in: plans.map(p => p.id) };
    }

    // Hämta all feedback
    const feedback = await prisma.aIFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Beräkna statistik
    const totalFeedback = feedback.length;
    const avgRating =
      totalFeedback > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
        : 0;

    const typCounts = {
      bra: feedback.filter(f => f.typ === 'bra').length,
      kan_forbattras: feedback.filter(f => f.typ === 'kan_forbattras').length,
      fel: feedback.filter(f => f.typ === 'fel').length,
    };

    const ratingDistribution = {
      1: feedback.filter(f => f.rating === 1).length,
      2: feedback.filter(f => f.rating === 2).length,
      3: feedback.filter(f => f.rating === 3).length,
      4: feedback.filter(f => f.rating === 4).length,
      5: feedback.filter(f => f.rating === 5).length,
    };

    return NextResponse.json({
      totalFeedback,
      avgRating: Math.round(avgRating * 10) / 10,
      typCounts,
      ratingDistribution,
      recentFeedback: feedback.slice(0, 10),
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta feedback' },
      { status: 500 }
    );
  }
}
