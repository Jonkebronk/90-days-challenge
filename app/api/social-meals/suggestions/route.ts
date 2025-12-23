import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get smart meal suggestions based on user history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mealType = searchParams.get('mealType');
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get user's recent meals
    const recentMeals = await prisma.socialMeal.findMany({
      where: {
        userId: session.user.id,
        ...(mealType && { mealType }),
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        components: true,
      },
    });

    // Get user's saved meals (favorites)
    const savedMeals = await prisma.savedMeal.findMany({
      where: { userId: session.user.id },
      orderBy: { useCount: 'desc' },
      take: 10,
    });

    // Analyze meal patterns
    const mealPatterns = analyzeMealPatterns(recentMeals);

    // Get time-based suggestions
    const timeBasedSuggestions = getTimeBasedSuggestions(mealType || undefined);

    // Combine and rank suggestions
    const suggestions = {
      // Frequently used meals (from history)
      frequent: mealPatterns.frequentMeals.slice(0, limit),

      // User's favorite saved meals
      favorites: savedMeals.map(meal => ({
        id: meal.id,
        name: meal.name,
        description: meal.description,
        components: meal.components,
        totalNutrition: meal.totalNutrition,
        useCount: meal.useCount,
        type: 'saved' as const,
      })).slice(0, limit),

      // Time-appropriate suggestions (e.g., lighter breakfast, heavier dinner)
      timeBased: timeBasedSuggestions,

      // User's portion preferences
      portionPreferences: mealPatterns.portionPreferences,

      // Stats
      stats: {
        totalMealsLogged: recentMeals.length,
        averageKcal: mealPatterns.averageKcal,
        mostCommonMealType: mealPatterns.mostCommonMealType,
      },
    };

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

interface MealWithComponents {
  id: string;
  mealType: string;
  kcal: number;
  protein: unknown;
  carbs: unknown;
  fat: unknown;
  presetDinnerId: string | null;
  presetDinnerName: string | null;
  components: {
    category: string;
    foodItemId: string;
    foodItemName: string;
    portionSize: string;
  }[];
}

function analyzeMealPatterns(meals: MealWithComponents[]) {
  if (meals.length === 0) {
    return {
      frequentMeals: [],
      portionPreferences: {},
      averageKcal: 0,
      mostCommonMealType: null,
    };
  }

  // Track meal combinations
  const mealCombinations: Record<string, {
    count: number;
    name: string;
    components: typeof meals[0]['components'];
    avgKcal: number;
    totalKcal: number;
    presetId?: string;
  }> = {};

  // Track portion preferences by category
  const portionsByCategory: Record<string, string[]> = {};

  // Track meal types
  const mealTypeCounts: Record<string, number> = {};

  let totalKcal = 0;

  for (const meal of meals) {
    totalKcal += meal.kcal;
    mealTypeCounts[meal.mealType] = (mealTypeCounts[meal.mealType] || 0) + 1;

    // Create a hash of the meal components
    const componentIds = meal.components
      .map(c => c.foodItemId)
      .sort()
      .join('|');

    if (componentIds) {
      if (!mealCombinations[componentIds]) {
        mealCombinations[componentIds] = {
          count: 0,
          name: meal.presetDinnerName || meal.components.map(c => c.foodItemName).join(' + '),
          components: meal.components,
          avgKcal: 0,
          totalKcal: 0,
          presetId: meal.presetDinnerId || undefined,
        };
      }
      mealCombinations[componentIds].count++;
      mealCombinations[componentIds].totalKcal += meal.kcal;
    }

    // Track portion sizes by category
    for (const comp of meal.components) {
      if (!portionsByCategory[comp.category]) {
        portionsByCategory[comp.category] = [];
      }
      portionsByCategory[comp.category].push(comp.portionSize);
    }
  }

  // Calculate average kcal for combinations
  for (const combo of Object.values(mealCombinations)) {
    combo.avgKcal = Math.round(combo.totalKcal / combo.count);
  }

  // Sort by frequency
  const frequentMeals = Object.values(mealCombinations)
    .filter(m => m.count >= 2) // At least used twice
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(m => ({
      name: m.name,
      components: m.components,
      frequency: m.count,
      avgKcal: m.avgKcal,
      presetId: m.presetId,
      type: 'frequent' as const,
    }));

  // Calculate most common portion per category
  const portionPreferences: Record<string, string> = {};
  for (const [category, portions] of Object.entries(portionsByCategory)) {
    const counts: Record<string, number> = {};
    for (const p of portions) {
      counts[p] = (counts[p] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      portionPreferences[category] = sorted[0][0];
    }
  }

  // Find most common meal type
  const sortedMealTypes = Object.entries(mealTypeCounts).sort((a, b) => b[1] - a[1]);
  const mostCommonMealType = sortedMealTypes.length > 0 ? sortedMealTypes[0][0] : null;

  return {
    frequentMeals,
    portionPreferences,
    averageKcal: Math.round(totalKcal / meals.length),
    mostCommonMealType,
  };
}

function getTimeBasedSuggestions(mealType?: string): string[] {
  const hour = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());

  const suggestions: string[] = [];

  if (!mealType) {
    // Suggest meal type based on time
    if (hour >= 6 && hour < 10) {
      suggestions.push('Det är frukosttid - kanske havregrynsgröt eller ägg?');
    } else if (hour >= 11 && hour < 14) {
      suggestions.push('Lunchtid - en sallad eller varm rätt?');
    } else if (hour >= 17 && hour < 21) {
      suggestions.push('Middagsdags - husmanskost eller något lättare?');
    } else if (hour >= 14 && hour < 17) {
      suggestions.push('Mellanmålstid - frukt, nötter eller fika?');
    }
  }

  if (isWeekend) {
    suggestions.push('Helg = ofta lite större portioner och mer social måltid');
  }

  if (mealType === 'dinner' && hour >= 19) {
    suggestions.push('Sen middag - kanske lättare alternativ?');
  }

  return suggestions;
}
