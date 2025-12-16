import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  MacroCategory,
  GeneratedMeal,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';

/**
 * POST /api/meal-plan/[id]/add-alternative
 * Add an alternative food to an existing meal item
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
    const { mealIndex, category, productId, grams, macros } = body as {
      mealIndex: number;
      category: MacroCategory;
      productId: string;
      grams: number;
      macros: CalculatedMacros;
    };

    // Validate required fields
    if (
      mealIndex === undefined ||
      !category ||
      !productId ||
      grams === undefined ||
      !macros
    ) {
      return NextResponse.json(
        { error: 'mealIndex, category, productId, grams, and macros are required' },
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

    // Fetch the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
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
        { error: 'Category item not found. You must first select a primary food for this category.' },
        { status: 404 }
      );
    }

    const item = meal.items[itemIndex];

    // Check if this product is already an alternative
    const existingAlt = item.alternatives.find((alt) => alt.foodId === product.id);
    if (existingAlt) {
      return NextResponse.json(
        { error: 'This product is already an alternative' },
        { status: 400 }
      );
    }

    // Check if this product is the selected food
    if (item.selected.foodId === product.id) {
      return NextResponse.json(
        { error: 'This product is already the selected food' },
        { status: 400 }
      );
    }

    // Create the new alternative
    const newAlternative = {
      foodId: product.id,
      name: product.name,
      grams: grams,
      macros: macros,
      image: product.image,
    };

    // Add the alternative to the item
    const updatedItem = {
      ...item,
      alternatives: [...item.alternatives, newAlternative],
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
    console.error('Error adding alternative:', error);
    return NextResponse.json(
      { error: 'Failed to add alternative' },
      { status: 500 }
    );
  }
}
