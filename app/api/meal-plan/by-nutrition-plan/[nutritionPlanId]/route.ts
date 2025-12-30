import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/meal-plan/by-nutrition-plan/[nutritionPlanId]
 * Get a generated meal plan by its nutrition plan ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nutritionPlanId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nutritionPlanId } = await params;
    const { searchParams } = new URL(request.url);
    const isSuggestion = searchParams.get('isSuggestion') === 'true';

    const generatedPlan = await prisma.generatedMealPlan.findFirst({
      where: { nutritionPlanId, isSuggestion },
      include: {
        nutritionPlan: {
          select: {
            id: true,
            name: true,
            clientId: true,
            coachId: true,
            proteinGrams: true,
            carbGrams: true,
            fatGrams: true,
            dailyCalorieTarget: true,
          },
        },
      },
    });

    if (!generatedPlan) {
      return NextResponse.json(null);
    }

    // Check access (coach who owns the plan or client it's assigned to)
    const userId = (session.user as any).id;
    if (
      generatedPlan.nutritionPlan.coachId !== userId &&
      generatedPlan.nutritionPlan.clientId !== userId
    ) {
      return NextResponse.json(
        { error: 'You do not have access to this plan' },
        { status: 403 }
      );
    }

    return NextResponse.json(generatedPlan);
  } catch (error) {
    console.error('Error fetching meal plan by nutrition plan ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    );
  }
}
