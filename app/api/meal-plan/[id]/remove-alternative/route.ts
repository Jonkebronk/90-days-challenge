import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { MacroCategory, GeneratedMeal } from '@/lib/types/meal-plan-generator';

/**
 * POST /api/meal-plan/[id]/remove-alternative
 * Remove an alternative food from a meal item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { mealIndex, category, foodId } = body as {
      mealIndex: number;
      category: MacroCategory;
      foodId: string;
    };

    // Validate required fields
    if (mealIndex === undefined || !category || !foodId) {
      return NextResponse.json(
        { error: 'mealIndex, category, and foodId are required' },
        { status: 400 }
      );
    }

    // Fetch the generated meal plan
    const generatedPlan = await prisma.generatedMealPlan.findUnique({
      where: { id },
      include: {
        nutritionPlan: true,
      },
    });

    if (!generatedPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Check coach access
    if (generatedPlan.nutritionPlan.coachId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'You do not have access to this plan' },
        { status: 403 }
      );
    }

    // Get current meals from plan
    const meals = generatedPlan.meals as unknown as GeneratedMeal[];

    if (mealIndex < 0 || mealIndex >= meals.length) {
      return NextResponse.json(
        { error: 'Invalid meal index' },
        { status: 400 }
      );
    }

    const meal = meals[mealIndex];

    // Find the item with the category
    const itemIndex = meal.items.findIndex((item) => item.category === category);

    if (itemIndex < 0) {
      return NextResponse.json(
        { error: 'Category item not found' },
        { status: 404 }
      );
    }

    // Remove the alternative from the item
    const updatedItem = {
      ...meal.items[itemIndex],
      alternatives: meal.items[itemIndex].alternatives.filter(
        (alt) => alt.foodId !== foodId
      ),
    };

    // Update the meal
    const updatedMeal: GeneratedMeal = {
      ...meal,
      items: meal.items.map((item, idx) =>
        idx === itemIndex ? updatedItem : item
      ),
    };

    // Update meals array
    const updatedMeals = [...meals];
    updatedMeals[mealIndex] = updatedMeal;

    // Save to database
    await prisma.generatedMealPlan.update({
      where: { id },
      data: {
        meals: updatedMeals as any,
      },
    });

    return NextResponse.json({
      meals: updatedMeals,
    });
  } catch (error) {
    console.error('Error removing alternative:', error);
    return NextResponse.json(
      { error: 'Failed to remove alternative' },
      { status: 500 }
    );
  }
}
