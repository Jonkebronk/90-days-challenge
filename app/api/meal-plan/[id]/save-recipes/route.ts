import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { mealRecipes } = body;

    // Get the meal plan
    const mealPlan = await prisma.generatedMealPlan.findUnique({
      where: { id },
      include: {
        nutritionPlan: {
          select: {
            coachId: true,
            clientId: true,
          },
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Check access - coach or client can update
    const userId = (session.user as any).id;
    const isCoach = mealPlan.nutritionPlan.coachId === userId;
    const isClient = mealPlan.nutritionPlan.clientId === userId;

    if (!isCoach && !isClient) {
      return NextResponse.json(
        { error: 'You do not have access to this plan' },
        { status: 403 }
      );
    }

    // Update meal recipes
    const updatedPlan = await prisma.generatedMealPlan.update({
      where: { id },
      data: {
        mealRecipes: mealRecipes || {},
      },
    });

    return NextResponse.json({ success: true, mealRecipes: updatedPlan.mealRecipes });
  } catch (error) {
    console.error('Error saving meal recipes:', error);
    return NextResponse.json(
      { error: 'Failed to save meal recipes' },
      { status: 500 }
    );
  }
}
