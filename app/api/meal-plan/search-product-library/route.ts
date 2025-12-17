import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/meal-plan/search-product-library
 * Search the product library (coach's own products) for a food
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    // Search in product library (global, not per coach)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        brand: true,
        kcal: true,
        protein: true,
        carbs: true,
        fat: true,
        image: true,
      },
      take: 10,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error searching product library:', error);
    return NextResponse.json(
      { error: 'Failed to search product library' },
      { status: 500 }
    );
  }
}
