import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { MacroCategory, MealType } from '@/lib/types/meal-plan-generator';

/**
 * GET /api/foods/by-category
 * Get foods filtered by macro category and optionally meal type
 * Query params:
 *   - category: protein | carb | fat | vegetable | sauce
 *   - meal: frukost | mellanmål | lunch | middag | kvällsmål (optional)
 *   - limit: number (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as MacroCategory | null;
    const meal = searchParams.get('meal') as MealType | null;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      macroCategory: category,
    };

    // Filter by meal type if provided
    if (meal) {
      where.mealTypes = {
        has: meal,
      };
    }

    // Fetch foods with nutrition data
    const foods = await prisma.foodItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        calories: true,
        proteinG: true,
        carbsG: true,
        fatG: true,
        macroCategory: true,
        mealTypes: true,
        isRecommended: true,
        imageUrl: true,
        subcategory: true,
      },
      orderBy: [
        { isRecommended: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
    });

    // Transform to generator format
    const transformedFoods = foods.map((food) => ({
      id: food.id,
      name: food.name,
      calories: food.calories ? Number(food.calories) : 0,
      proteinG: food.proteinG ? Number(food.proteinG) : 0,
      carbsG: food.carbsG ? Number(food.carbsG) : 0,
      fatG: food.fatG ? Number(food.fatG) : 0,
      macroCategory: food.macroCategory as MacroCategory,
      mealTypes: food.mealTypes as MealType[],
      isRecommended: food.isRecommended,
      imageUrl: food.imageUrl,
      subcategory: food.subcategory,
    }));

    return NextResponse.json({
      foods: transformedFoods,
      total: transformedFoods.length,
    });
  } catch (error) {
    console.error('Error fetching foods by category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch foods' },
      { status: 500 }
    );
  }
}
