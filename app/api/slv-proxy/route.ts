import { NextRequest, NextResponse } from 'next/server'

const SLV_BASE_URL = 'https://dataportal.livsmedelsverket.se/livsmedel/api/v1'

interface SLVFoodItem {
  nummer: number
  namn: string
  livsmedelsTyp: string
  projekt: string
}

interface SLVNutrient {
  namn: string
  forkortning: string
  värde: number | null
  enhet: string
}

interface TransformedFood {
  slvNummer: number
  name: string
  type: string
  protein: number
  carbs: number
  fat: number
  kcal: number
}

// Category-specific search terms to help filter results
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  protein: ['kyckling', 'kalkon', 'nöt', 'fläsk', 'fisk', 'lax', 'torsk', 'räk', 'ägg', 'kvarg', 'keso', 'cottage', 'skinka', 'köttfärs', 'biff', 'filé', 'sej', 'tonfisk', 'makrill', 'protein', 'whey', 'casein'],
  kolhydrat: ['ris', 'pasta', 'potatis', 'bröd', 'havre', 'müsli', 'gryn', 'flingor', 'quinoa', 'couscous', 'bulgur', 'bönor', 'linser', 'majs', 'vete', 'råg', 'korn', 'bovete', 'amarant', 'hirs'],
  fett: ['olja', 'olivolja', 'rapsolja', 'kokosolja', 'smör', 'nötter', 'mandel', 'valnöt', 'cashew', 'jordnöt', 'avokado', 'frön', 'linfrön', 'chiafrön', 'solrosfrön', 'pumpafrön', 'ost', 'grädde', 'majonnäs']
}

/**
 * GET /api/slv-proxy
 * Search Livsmedelsverket's food database
 *
 * Query params:
 * - q: Search query (filters by name)
 * - nummer: Get specific food by SLV number
 * - category: Filter by category (protein, kolhydrat, fett)
 * - limit: Max results (default 20)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const nummer = searchParams.get('nummer')
  const category = searchParams.get('category') as 'protein' | 'kolhydrat' | 'fett' | null
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    // If specific nummer is requested, fetch that food with nutrition
    if (nummer) {
      const food = await fetchFoodWithNutrition(parseInt(nummer))
      if (!food) {
        return NextResponse.json({ error: 'Food not found' }, { status: 404 })
      }
      return NextResponse.json({ food })
    }

    // Search for foods with optional category filter
    const foods = await searchFoods(query || '', limit, category)
    return NextResponse.json({ foods, count: foods.length })

  } catch (error) {
    console.error('SLV Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Livsmedelsverket' },
      { status: 500 }
    )
  }
}

/**
 * Fetch with timeout helper
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Fetch a single food item with its nutritional values
 */
async function fetchFoodWithNutrition(nummer: number): Promise<TransformedFood | null> {
  try {
    // Fetch food item and nutrition in parallel
    const [foodResponse, nutritionResponse] = await Promise.all([
      fetchWithTimeout(`${SLV_BASE_URL}/livsmedel/${nummer}`, 5000),
      fetchWithTimeout(`${SLV_BASE_URL}/livsmedel/${nummer}/naringsvarden`, 5000)
    ])

    if (!foodResponse.ok) return null
    const foodData: SLVFoodItem = await foodResponse.json()

    const nutrients: SLVNutrient[] = nutritionResponse.ok
      ? await nutritionResponse.json()
      : []

    return transformFood(foodData, nutrients)
  } catch (error) {
    // Silently fail for individual foods - don't log to avoid spam
    return null
  }
}

/**
 * Check if a food name matches any category keywords
 * Uses word boundary matching to avoid false positives (e.g., "ris" in "Gris")
 */
function matchesCategoryKeywords(name: string, category: string): boolean {
  const keywords = CATEGORY_KEYWORDS[category] || []
  const lowerName = name.toLowerCase()

  return keywords.some(keyword => {
    // Create regex with word boundary or start/end of string
    // This prevents "ris" from matching "Gris"
    const regex = new RegExp(`(^|\\s|-)${keyword}`, 'i')
    return regex.test(lowerName)
  })
}

/**
 * Filter foods by nutritional profile based on category
 */
function matchesCategoryNutrition(food: TransformedFood, category: string): boolean {
  switch (category) {
    case 'protein':
      // High protein: >15g protein per 100g AND protein is dominant macro
      return food.protein > 15 && food.protein > food.carbs && food.protein > food.fat
    case 'kolhydrat':
      // High carb: >30g carbs per 100g AND carbs is dominant macro
      return food.carbs > 30 && food.carbs > food.protein
    case 'fett':
      // High fat: >15g fat per 100g AND fat is significant
      return food.fat > 15
    default:
      return true
  }
}

/**
 * Fetch all foods from SLV database (in batches)
 */
async function fetchAllFoods(): Promise<SLVFoodItem[]> {
  const allFoods: SLVFoodItem[] = []
  const batchSize = 1000
  const offsets = [0, 1000, 2000] // Cover all ~2575 items

  const batchPromises = offsets.map(offset =>
    fetch(`${SLV_BASE_URL}/livsmedel?limit=${batchSize}&offset=${offset}`, {
      headers: { 'Accept': 'application/json' }
    }).then(res => res.ok ? res.json() : { livsmedel: [] })
  )

  const results = await Promise.all(batchPromises)
  results.forEach(data => {
    if (data.livsmedel) {
      allFoods.push(...data.livsmedel)
    }
  })

  return allFoods
}

/**
 * Search foods and fetch nutrition for matches
 */
async function searchFoods(
  query: string,
  limit: number,
  category: 'protein' | 'kolhydrat' | 'fett' | null = null
): Promise<TransformedFood[]> {
  // Fetch all foods from SLV database
  const foods = await fetchAllFoods()

  // Filter by search query
  let filtered = foods
  if (query) {
    filtered = foods.filter(f => f.namn.toLowerCase().includes(query.toLowerCase()))
  }

  // If category specified but no query, use category keywords to pre-filter
  if (category && !query) {
    filtered = foods.filter(f => matchesCategoryKeywords(f.namn, category))
  }

  // If we have a query AND category, filter by both
  if (query && category) {
    filtered = filtered.filter(f => matchesCategoryKeywords(f.namn, category))
  }

  // Limit to fetch nutrition for - keep it small to avoid timeouts
  // 20 items × 2 requests each = 40 API calls (more manageable)
  const toFetch = filtered.slice(0, Math.min(20, filtered.length))

  // Fetch nutrition for each (in parallel, max 5 at a time to avoid rate limiting)
  const results: TransformedFood[] = []

  for (let i = 0; i < toFetch.length; i += 5) {
    const batch = toFetch.slice(i, i + 5)
    const batchResults = await Promise.all(
      batch.map(food => fetchFoodWithNutrition(food.nummer))
    )
    results.push(...batchResults.filter((f): f is TransformedFood => f !== null))
  }

  // Filter by nutritional profile if category is specified
  let finalResults = results
  if (category) {
    finalResults = results.filter(f => matchesCategoryNutrition(f, category))
  }

  // Sort by relevance (highest macro content for category)
  if (category) {
    finalResults.sort((a, b) => {
      switch (category) {
        case 'protein': return b.protein - a.protein
        case 'kolhydrat': return b.carbs - a.carbs
        case 'fett': return b.fat - a.fat
        default: return 0
      }
    })
  }

  return finalResults.slice(0, limit)
}

/**
 * Transform SLV data to our format
 */
function transformFood(food: SLVFoodItem, nutrients: SLVNutrient[]): TransformedFood {
  const getNutrientValue = (abbreviation: string): number => {
    const nutrient = nutrients.find(n => n.forkortning === abbreviation)
    return nutrient?.värde ?? 0
  }

  return {
    slvNummer: food.nummer,
    name: food.namn,
    type: food.livsmedelsTyp,
    protein: Math.round(getNutrientValue('PROT') * 10) / 10,
    carbs: Math.round(getNutrientValue('CHO') * 10) / 10,
    fat: Math.round(getNutrientValue('FAT') * 10) / 10,
    kcal: Math.round(getNutrientValue('ENER'))
  }
}
