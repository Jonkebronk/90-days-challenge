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

    // Fetch products with nutrition data
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        kcal: true,
        protein: true,
        carbs: true,
        fat: true,
        macroCategory: true,
        mealTypes: true,
        image: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });

    // Transform to generator format
    const transformedFoods = products.map((product) => ({
      id: product.id,
      name: product.name,
      calories: product.kcal ? Number(product.kcal) : 0,
      proteinG: product.protein ? Number(product.protein) : 0,
      carbsG: product.carbs ? Number(product.carbs) : 0,
      fatG: product.fat ? Number(product.fat) : 0,
      macroCategory: product.macroCategory as MacroCategory,
      mealTypes: (product.mealTypes || []) as MealType[],
      isRecommended: false,
      image: product.image,
    }));

    return NextResponse.json(transformedFoods);
  } catch (error) {
    console.error('Error fetching foods by category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch foods' },
      { status: 500 }
    );
  }
}
