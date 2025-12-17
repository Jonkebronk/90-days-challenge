/**
 * SLV (Livsmedelsverket) Data Loader
 *
 * Laddar och cachar SLV-data från JSON-fil.
 * Innehåller 2575 livsmedel med fullständig näringsinformation.
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// TYPES
// =============================================================================

export interface SlvFood {
  nummer: number;
  namn: string;
  typ?: string;
  kcal?: number;
  protein?: number;
  kolhydrater?: number;
  fett?: number;
  fiber?: number;
  // Vitaminer
  vitamin_a?: number;
  vitamin_d?: number;
  vitamin_c?: number;
  vitamin_b12?: number;
  folat?: number;
  // Mineraler
  kalcium?: number;
  jarn?: number;
  magnesium?: number;
  kalium?: number;
  zink?: number;
  jod?: number;
}

export interface SlvData {
  categories: Record<string, SlvFood[]>;
  metadata?: {
    total_count: number;
    last_updated?: string;
  };
}

// =============================================================================
// CACHE
// =============================================================================

let cachedData: SlvData | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// =============================================================================
// LOADER
// =============================================================================

export async function loadSlvData(): Promise<SlvData> {
  // Check cache
  if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'slv-foods.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data: SlvData = JSON.parse(rawData);

    // Calculate metadata if not present
    if (!data.metadata) {
      let totalCount = 0;
      for (const foods of Object.values(data.categories)) {
        totalCount += foods.length;
      }
      data.metadata = { total_count: totalCount };
    }

    // Cache the data
    cachedData = data;
    cacheTimestamp = Date.now();

    return data;
  } catch (error) {
    console.error('Error loading SLV data:', error);

    // Return empty structure if file not found
    return {
      categories: {},
      metadata: { total_count: 0 }
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all foods as a flat array
 */
export async function getAllSlvFoods(): Promise<SlvFood[]> {
  const data = await loadSlvData();
  const allFoods: SlvFood[] = [];

  for (const foods of Object.values(data.categories)) {
    allFoods.push(...foods);
  }

  return allFoods;
}

/**
 * Search SLV foods by name
 */
export async function searchSlvFoods(
  query: string,
  options?: {
    category?: string;
    maxResults?: number;
  }
): Promise<SlvFood[]> {
  const data = await loadSlvData();
  const results: SlvFood[] = [];
  const queryLower = query.toLowerCase();
  const maxResults = options?.maxResults || 50;

  for (const [catName, foods] of Object.entries(data.categories)) {
    // Filter by category if specified
    if (options?.category && !catName.toLowerCase().includes(options.category.toLowerCase())) {
      continue;
    }

    for (const food of foods) {
      if (food.namn.toLowerCase().includes(queryLower)) {
        results.push(food);

        if (results.length >= maxResults) {
          break;
        }
      }
    }

    if (results.length >= maxResults) {
      break;
    }
  }

  // Sort by relevance (exact match first)
  results.sort((a, b) => {
    const aExact = a.namn.toLowerCase() === queryLower ? 0 : 1;
    const bExact = b.namn.toLowerCase() === queryLower ? 0 : 1;
    return aExact - bExact;
  });

  return results;
}

/**
 * Get SLV food by ID (nummer)
 */
export async function getSlvFoodById(nummer: number | string): Promise<SlvFood | null> {
  const data = await loadSlvData();
  const numId = typeof nummer === 'string' ? parseInt(nummer, 10) : nummer;

  for (const foods of Object.values(data.categories)) {
    const found = foods.find(f => f.nummer === numId);
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Get all categories
 */
export async function getSlvCategories(): Promise<string[]> {
  const data = await loadSlvData();
  return Object.keys(data.categories);
}

/**
 * Get foods by category
 */
export async function getSlvFoodsByCategory(category: string): Promise<SlvFood[]> {
  const data = await loadSlvData();

  // Try exact match first
  if (data.categories[category]) {
    return data.categories[category];
  }

  // Try partial match
  const categoryLower = category.toLowerCase();
  for (const [catName, foods] of Object.entries(data.categories)) {
    if (catName.toLowerCase().includes(categoryLower)) {
      return foods;
    }
  }

  return [];
}
