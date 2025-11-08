/**
 * API Route: /api/ai-coach/process-application
 * Processerar klientansökningar och genererar automatiska tränings- och nutritionsplaner
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  processClientApplication,
  generateAIRecommendations,
  validateApplicationData,
  type ApplicationData,
  type CalculatedPlan
} from '@/lib/ai-coaching-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validera inkommande data
    const validation = validateApplicationData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Valideringsfel', details: validation.errors },
        { status: 400 }
      );
    }

    const applicationData: ApplicationData = body;

    // 2. Processa ansökan och generera beräkningar
    const calculatedPlan: CalculatedPlan = await processClientApplication(applicationData);

    // 3. Generera avancerade AI-rekommendationer (om Claude API finns)
    let aiRecommendations = '';
    try {
      aiRecommendations = await generateAIRecommendations(applicationData, calculatedPlan);
    } catch (error) {
      console.error('AI-rekommendationer misslyckades:', error);
      // Fortsätt ändå med grundläggande rekommendationer
    }

    // 4. Spara i databasen (Lead + CaloriePlan)
    const lead = await prisma.lead.create({
      data: {
        fullName: applicationData.fullName,
        email: applicationData.email,
        phone: applicationData.phone || '',
        city: applicationData.city || '',
        country: applicationData.country || '',
        age: applicationData.age,
        height: applicationData.height,
        currentWeight: applicationData.currentWeight,
        gender: applicationData.gender,

        // Träningsdata
        currentTraining: applicationData.currentTraining,
        trainingExperience: applicationData.trainingExperience,
        trainingGoal: applicationData.trainingGoal,
        injuries: applicationData.injuries,
        availableTime: applicationData.availableTime,
        preferredSchedule: applicationData.preferredSchedule,

        // Näringsdata
        dietHistory: applicationData.dietHistory,
        macroExperience: applicationData.macroExperience,
        digestionIssues: applicationData.digestionIssues,
        allergies: applicationData.allergies,
        favoriteFood: applicationData.favoriteFood,
        dislikedFood: applicationData.dislikedFood,
        supplements: applicationData.supplements,
        previousCoaching: applicationData.previousCoaching,

        // Livsstil
        stressLevel: applicationData.stressLevel,
        sleepHours: applicationData.sleepHours,
        occupation: applicationData.occupation,
        lifestyle: applicationData.lifestyle,

        // Motivation
        whyJoin: applicationData.whyJoin,
        canFollowPlan: applicationData.canFollowPlan,
        expectations: applicationData.expectations,
        biggestChallenges: applicationData.biggestChallenges,

        // Bilder
        frontPhoto: applicationData.frontPhoto,
        sidePhoto: applicationData.sidePhoto,
        backPhoto: applicationData.backPhoto,

        // Status
        status: 'NEW',

        // AI-genererad data som JSON
        aiGeneratedPlan: {
          calories: calculatedPlan.calories,
          macros: calculatedPlan.macros,
          mealDistribution: calculatedPlan.mealDistribution,
          activity: calculatedPlan.activity,
          recommendations: calculatedPlan.recommendations,
          aiRecommendations: aiRecommendations || undefined
        },
        aiProcessedAt: new Date(),
        aiModelVersion: 'claude-sonnet-4-20250514'
      }
    });

    // 5. Returnera komplett plan
    return NextResponse.json({
      success: true,
      leadId: lead.id,
      plan: {
        ...calculatedPlan,
        aiRecommendations: aiRecommendations || calculatedPlan.recommendations
      },
      message: 'Ansökan mottagen och plan genererad!'
    });

  } catch (error) {
    console.error('Fel vid bearbetning av ansökan:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod vid bearbetning av din ansökan' },
      { status: 500 }
    );
  }
}

/**
 * GET: Hämta beräknad plan för en specifik lead
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId krävs' },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        fullName: true,
        email: true,
        aiGeneratedPlan: true,
        createdAt: true
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        fullName: lead.fullName,
        email: lead.email,
        createdAt: lead.createdAt,
        plan: lead.aiGeneratedPlan
      }
    });

  } catch (error) {
    console.error('Fel vid hämtning av plan:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    );
  }
}
