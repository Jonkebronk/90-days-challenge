import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch lead with AI plan
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (!lead.aiGeneratedPlan) {
      return NextResponse.json(
        { error: 'No AI plan found for this lead' },
        { status: 400 }
      );
    }

    const aiPlan = lead.aiGeneratedPlan as any;

    // Check if lead is already converted to client
    const existingClient = await prisma.user.findUnique({
      where: { email: lead.email || '' },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Lead must be converted to client first' },
        { status: 400 }
      );
    }

    // Create CaloriePlan from AI plan data
    const caloriePlan = await prisma.caloriePlan.upsert({
      where: { userId: existingClient.id },
      update: {
        weight: lead.currentWeight ? parseFloat(lead.currentWeight.toString()) : null,
        activityLevel: aiPlan.activity?.dailySteps ?
          (aiPlan.activity.dailySteps < 5000 ? '25' :
           aiPlan.activity.dailySteps < 10000 ? '30' : '35') : null,
        deficit: aiPlan.calories?.deficit || 0,
        dailySteps: aiPlan.activity?.dailySteps || null,
        proteinPerKg: lead.currentWeight ?
          (aiPlan.macros?.protein / parseFloat(lead.currentWeight.toString())) : null,
        fatPerKg: lead.currentWeight ?
          (aiPlan.macros?.fat / parseFloat(lead.currentWeight.toString())) : null,
        numMeals: aiPlan.mealDistribution?.numberOfMeals || 3,
        customDistribution: false,
        mealCalories: aiPlan.mealDistribution?.meals?.map((m: any) => m.calories) || [],
        customMacros: aiPlan.mealDistribution?.meals || null,
      },
      create: {
        userId: existingClient.id,
        weight: lead.currentWeight ? parseFloat(lead.currentWeight.toString()) : null,
        activityLevel: aiPlan.activity?.dailySteps ?
          (aiPlan.activity.dailySteps < 5000 ? '25' :
           aiPlan.activity.dailySteps < 10000 ? '30' : '35') : null,
        deficit: aiPlan.calories?.deficit || 0,
        dailySteps: aiPlan.activity?.dailySteps || null,
        proteinPerKg: lead.currentWeight ?
          (aiPlan.macros?.protein / parseFloat(lead.currentWeight.toString())) : null,
        fatPerKg: lead.currentWeight ?
          (aiPlan.macros?.fat / parseFloat(lead.currentWeight.toString())) : null,
        numMeals: aiPlan.mealDistribution?.numberOfMeals || 3,
        customDistribution: false,
        mealCalories: aiPlan.mealDistribution?.meals?.map((m: any) => m.calories) || [],
        customMacros: aiPlan.mealDistribution?.meals || null,
      },
    });

    // Mark plan as approved on lead
    await prisma.lead.update({
      where: { id },
      data: {
        planApproved: true,
        planApprovedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      caloriePlan,
      message: 'Plan godkänd och sparad i klientens journal',
    });
  } catch (error) {
    console.error('Failed to approve plan:', error);
    return NextResponse.json(
      { error: 'Failed to approve plan' },
      { status: 500 }
    );
  }
}
