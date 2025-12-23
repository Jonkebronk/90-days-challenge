import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/nutrition-logs - Get nutrition logs for a date range
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId') || session.user.id;

    // Check if user has permission to view this data
    if (userId !== session.user.id) {
      // Verify coach has access to this client
      const client = await prisma.user.findFirst({
        where: {
          id: userId,
          coachId: session.user.id,
        },
      });
      if (!client) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const logs = await prisma.dailyNutritionLog.findMany({
      where: {
        userId,
        ...(startDate && endDate
          ? {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
      include: {
        deviationMeal: {
          include: {
            components: true,
          },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching nutrition logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nutrition logs' },
      { status: 500 }
    );
  }
}
