import { NextRequest, NextResponse } from 'next/server';
import { QUICK_TRACK_CATEGORIES, getCategoriesArray } from '@/lib/social-meal/quick-track-categories';
import {
  FAMILY_DINNER_PRESETS,
  getAllTags,
  getDinnersByTag,
  searchDinners,
  getDinnersGrouped
} from '@/lib/social-meal/family-dinners';

// GET - Fetch quick track categories and/or family dinner presets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'categories', 'presets', 'tags', or 'all'
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const grouped = searchParams.get('grouped') === 'true';

    const response: Record<string, unknown> = {};

    // Return categories
    if (!type || type === 'categories' || type === 'all') {
      response.categories = getCategoriesArray().map((cat) => ({
        id: cat.id,
        icon: cat.icon,
        label: cat.label,
        color: cat.color,
        itemCount: cat.commonItems.length,
        items: cat.commonItems.map((item) => ({
          id: item.id,
          name: item.name,
          portions: item.portions,
          per100g: item.per100g,
        })),
      }));
    }

    // Return presets
    if (!type || type === 'presets' || type === 'all') {
      let presets = FAMILY_DINNER_PRESETS;

      // Filter by tag if provided
      if (tag) {
        presets = getDinnersByTag(tag);
      }

      // Search if query provided
      if (search) {
        presets = searchDinners(search);
      }

      // Group by category if requested
      if (grouped) {
        response.presetsGrouped = getDinnersGrouped();
      } else {
        response.presets = presets;
      }
    }

    // Return tags
    if (type === 'tags' || type === 'all') {
      response.tags = getAllTags();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching presets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presets' },
      { status: 500 }
    );
  }
}
