// API Route: /api/nutrition-plans/[planId]
// GET: Get single nutrition plan
// PATCH: Update nutrition plan
// DELETE: Delete nutrition plan

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ planId: string }>;
}

// GET: Get single nutrition plan
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await params;

    const plan = await prisma.clientNutritionPlan.findUnique({
      where: { id: planId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        coach: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Nutrition plan not found' },
        { status: 404 }
      );
    }

    // Verify ownership (coach or client)
    if (plan.coachId !== session.user.id && plan.clientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching nutrition plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nutrition plan' },
      { status: 500 }
    );
  }
}

// PATCH: Update nutrition plan
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Only coach can update
    if (existingPlan.coachId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the coach can update this plan' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Update the plan
    const updatedPlan = await prisma.clientNutritionPlan.update({
      where: { id: planId },
      data: body,
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

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating nutrition plan:', error);
    return NextResponse.json(
      { error: 'Failed to update nutrition plan' },
      { status: 500 }
    );
  }
}

// DELETE: Delete nutrition plan
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Only coach can delete
    if (existingPlan.coachId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the coach can delete this plan' },
        { status: 403 }
      );
    }

    await prisma.clientNutritionPlan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nutrition plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete nutrition plan' },
      { status: 500 }
    );
  }
}
