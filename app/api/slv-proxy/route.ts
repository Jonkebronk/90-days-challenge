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
  varde: number | null
  enhet: string
}

interface TransformedFood {
  slvNummer: number
  name: string
  type: string
  // Macros
  protein: number
  carbs: number
  fat: number
  kcal: number
  fiber: number | null
  sugar: number | null
  salt: number | null
  // Fat breakdown
  saturatedFat: number | null
  monounsatFat: number | null
  polyunsatFat: number | null
  cholesterol: number | null
  // Vitamins
  vitaminA: number | null
  vitaminD: number | null
  vitaminE: number | null
  vitaminC: number | null
  vitaminB6: number | null
  vitaminB12: number | null
  thiamin: number | null
  riboflavin: number | null
  niacin: number | null
  folate: number | null
  // Minerals
  calcium: number | null
  iron: number | null
  magnesium: number | null
  phosphorus: number | null
  potassium: number | null
  zinc: number | null
  selenium: number | null
  iodine: number | null
}

// Category-specific search terms to help filter results
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  protein: ['kyckling', 'kalkon', 'nöt', 'fläsk', 'fisk', 'lax', 'torsk', 'räk', 'ägg', 'kvarg', 'keso', 'cottage', 'skinka', 'köttfärs', 'biff', 'filé', 'sej', 'tonfisk', 'makrill', 'protein', 'whey', 'casein'],
  kolhydrat: ['ris', 'pasta', 'potatis', 'bröd', 'havre', 'müsli', 'gryn', 'flingor', 'quinoa', 'couscous', 'bulgur', 'bönor', 'linser', 'majs', 'vete', 'råg', 'korn', 'bovete', 'amarant', 'hirs'],
  fett: ['olja', 'olivolja', 'rapsolja', 'kokosolja', 'smör', 'nötter', 'mandel', 'valnöt', 'cashew', 'jordnöt', 'avokado', 'frön', 'linfrön', 'chiafrön', 'solrosfrön', 'pumpafrön', 'ost', 'grädde', 'majonnäs']
}

// Meal-specific keywords for each category
const MEAL_SPECIFIC_KEYWORDS: Record<string, Record<string, string[]>> = {
  breakfast: {
    kolhydrat: ['havre', 'gryn', 'gröt', 'müsli', 'flingor', 'bröd', 'knäckebröd', 'yoghurt', 'fil', 'smoothie', 'juice', 'frukt', 'banan', 'äpple', 'blåbär', 'hallon', 'jordgubb'],
    protein: ['ägg', 'kvarg', 'keso', 'cottage', 'yoghurt', 'skinka', 'kalkon', 'protein', 'whey'],
    fett: ['ägg', 'avokado', 'nötter', 'mandel', 'jordnötssmör', 'ost', 'smör']
  },
  lunch: {
    kolhydrat: ['ris', 'pasta', 'potatis', 'bröd', 'bulgur', 'quinoa', 'couscous', 'nudlar', 'tortilla', 'wrap'],
    protein: ['kyckling', 'kalkon', 'nöt', 'fläsk', 'fisk', 'lax', 'tonfisk', 'ägg', 'bönor', 'linser', 'tofu'],
    fett: ['avokado', 'olja', 'olivolja', 'nötter', 'frön', 'ost', 'dressing']
  },
  dinner: {
    kolhydrat: ['ris', 'pasta', 'potatis', 'sötpotatis', 'bulgur', 'quinoa', 'couscous', 'nudlar', 'bröd'],
    protein: ['kyckling', 'kalkon', 'nöt', 'fläsk', 'fisk', 'lax', 'torsk', 'sej', 'räk', 'köttfärs', 'biff', 'filé'],
    fett: ['avokado', 'olja', 'olivolja', 'smör', 'grädde', 'ost', 'nötter']
  },
  snack: {
    kolhydrat: ['frukt', 'banan', 'äpple', 'päron', 'bär', 'knäckebröd', 'riskakor', 'müslibar', 'smoothie'],
    protein: ['kvarg', 'keso', 'cottage', 'yoghurt', 'ägg', 'skinka', 'protein', 'nötter'],
    fett: ['nötter', 'mandel', 'cashew', 'jordnötssmör', 'avokado', 'frön', 'ost']
  },
  evening: {
    kolhydrat: ['kvarg', 'keso', 'yoghurt', 'frukt', 'bär', 'hallon', 'blåbär'],
    protein: ['kvarg', 'keso', 'cottage', 'casein', 'ägg', 'yoghurt'],
    fett: ['nötter', 'mandel', 'jordnötssmör', 'ost', 'avokado']
  }
}

/**
 * GET /api/slv-proxy
 * Search Livsmedelsverket's food database
 *
 * Query params:
 * - q: Search query (filters by name)
 * - nummer: Get specific food by SLV number
 * - category: Filter by category (protein, kolhydrat, fett)
 * - meal: Filter by meal type (breakfast, lunch, dinner, snack, evening)
 * - limit: Max results per page (default 20)
 * - page: Page number (default 1)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const nummer = searchParams.get('nummer')
  const category = searchParams.get('category') as 'protein' | 'kolhydrat' | 'fett' | null
  const meal = searchParams.get('meal') as 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'evening' | null
  const limit = parseInt(searchParams.get('limit') || '20')
  const page = parseInt(searchParams.get('page') || '1')

  try {
    // If specific nummer is requested, fetch that food with nutrition
    if (nummer) {
      const food = await fetchFoodWithNutrition(parseInt(nummer))
      if (!food) {
        return NextResponse.json({ error: 'Food not found' }, { status: 404 })
      }
      return NextResponse.json({ food })
    }

    // Search for foods with optional category and meal filter
    const result = await searchFoods(query || '', limit, page, category, meal)
    return NextResponse.json(result)

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
 * If meal type is specified, use meal-specific keywords for better relevance
 */
function matchesCategoryKeywords(name: string, category: string, meal?: string | null): boolean {
  // Use meal-specific keywords if available, otherwise fallback to general
  let keywords: string[]
  if (meal && MEAL_SPECIFIC_KEYWORDS[meal]?.[category]) {
    keywords = MEAL_SPECIFIC_KEYWORDS[meal][category]
  } else {
    keywords = CATEGORY_KEYWORDS[category] || []
  }

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

interface SearchResult {
  foods: TransformedFood[]
  totalCount: number
  totalPages: number
  currentPage: number
}

/**
 * Search foods and fetch nutrition for matches with pagination
 */
async function searchFoods(
  query: string,
  limit: number,
  page: number,
  category: 'protein' | 'kolhydrat' | 'fett' | null = null,
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'evening' | null = null
): Promise<SearchResult> {
  // Fetch all foods from SLV database
  const allFoods = await fetchAllFoods()

  // Filter out recipes/prepared foods by excluding common recipe indicators in names
  const recipePatterns = [
    // Prepared/homemade indicators
    /hemlagad/i,
    /tillagad/i,
    /restaurang/i,
    /servering/i,
    /färdiglagad/i,
    // Cooking methods with ingredients
    /stekt m\./i,
    /kokt m\./i,
    /friterad/i,
    /ugns(?:bakad|stekt|gratinerad)/i,
    /panerad/i,
    // Dishes and meals
    /gratäng/i,
    /gryta/i,
    /sås m\./i,
    /sallad m\./i,
    /soppa m\./i,
    /paj m\./i,
    /pizza/i,
    /lasagne/i,
    /pannkak/i,
    /våffla m\./i,
    /tårta/i,
    /kaka m\./i,
    /bulle m\./i,
    /smörgås/i,
    /macka/i,
    /wrap m\./i,
    /rulle m\./i,
    /wok/i,
    /curry m\./i,
    /stuvning/i,
    /köttbull/i,
    /frikadell/i,
    // Context indicators
    /buffé/i,
    /måltid/i,
    /portion/i,
    /tallrik/i,
    /skolmat/i,
    /snabbmat/i,
    // Compound dishes (contains "med" + multiple ingredients)
    / med .+ och /i,
  ]

  const foods = allFoods.filter(f => {
    const name = f.namn.toLowerCase()
    // Exclude if name matches any recipe pattern
    return !recipePatterns.some(pattern => pattern.test(name))
  })

  // Filter by search query - match all words in any order
  let filtered = foods
  if (query) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0)
    filtered = foods.filter(f => {
      const name = f.namn.toLowerCase()
      // All query words must appear in the name (in any order)
      return queryWords.every(word => name.includes(word))
    })
  }

  // If category specified but no query, use category keywords to pre-filter
  if (category && !query) {
    const keywords = meal && MEAL_SPECIFIC_KEYWORDS[meal]?.[category]
      ? MEAL_SPECIFIC_KEYWORDS[meal][category]
      : CATEGORY_KEYWORDS[category] || []

    // Get all matches for all keywords
    const allMatches: SLVFoodItem[] = []
    for (const keyword of keywords) {
      const regex = new RegExp(`(^|\\s|-)${keyword}`, 'i')
      const matches = foods.filter(f => regex.test(f.namn.toLowerCase()))
      for (const match of matches) {
        if (!allMatches.find(m => m.nummer === match.nummer)) {
          allMatches.push(match)
        }
      }
    }
    filtered = allMatches
  }

  // If we have a query AND category, filter by both
  if (query && category) {
    filtered = filtered.filter(f => matchesCategoryKeywords(f.namn, category, meal))
  }

  // Calculate pagination
  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / limit)
  const offset = (page - 1) * limit

  // Get items for current page
  const pageItems = filtered.slice(offset, offset + limit)

  // Fetch nutrition for page items (in parallel, max 15 at a time)
  const results: TransformedFood[] = []

  for (let i = 0; i < pageItems.length; i += 15) {
    const batch = pageItems.slice(i, i + 15)
    const batchResults = await Promise.all(
      batch.map(food => fetchFoodWithNutrition(food.nummer))
    )
    results.push(...batchResults.filter((f): f is TransformedFood => f !== null))
  }

  // Sort by relevance (highest macro content for category)
  if (category) {
    results.sort((a, b) => {
      switch (category) {
        case 'protein': return b.protein - a.protein
        case 'kolhydrat': return b.carbs - a.carbs
        case 'fett': return b.fat - a.fat
        default: return 0
      }
    })
  }

  return {
    foods: results,
    totalCount,
    totalPages,
    currentPage: page
  }
}

/**
 * Transform SLV data to our format
 */
function transformFood(food: SLVFoodItem, nutrients: SLVNutrient[]): TransformedFood {
  const getNutrientValue = (abbreviation: string, unit?: string): number | null => {
    const nutrient = nutrients.find(n =>
      n.forkortning === abbreviation && (!unit || n.enhet === unit)
    )
    return nutrient?.varde ?? null
  }

  const round = (val: number | null, decimals: number = 1): number | null => {
    if (val === null) return null
    const factor = Math.pow(10, decimals)
    return Math.round(val * factor) / factor
  }

  return {
    slvNummer: food.nummer,
    name: food.namn,
    type: food.livsmedelsTyp,
    // Macros (required, default to 0)
    protein: round(getNutrientValue('Prot')) ?? 0,
    carbs: round(getNutrientValue('Kolh')) ?? 0,
    fat: round(getNutrientValue('Fett')) ?? 0,
    kcal: Math.round(getNutrientValue('Ener', 'kcal') ?? 0),
    fiber: round(getNutrientValue('Fibe')),
    sugar: round(getNutrientValue('Mono/disack')),  // Total sugars
    salt: round(getNutrientValue('NaCl'), 2),
    // Fat breakdown
    saturatedFat: round(getNutrientValue('Mfet')),
    monounsatFat: round(getNutrientValue('Mone')),
    polyunsatFat: round(getNutrientValue('Pole')),
    cholesterol: round(getNutrientValue('Kole')),
    // Vitamins
    vitaminA: round(getNutrientValue('VitA')),
    vitaminD: round(getNutrientValue('VitD'), 2),
    vitaminE: round(getNutrientValue('VitE'), 2),
    vitaminC: round(getNutrientValue('VitC')),
    vitaminB6: round(getNutrientValue('VitB6'), 3),
    vitaminB12: round(getNutrientValue('VitB12'), 3),
    thiamin: round(getNutrientValue('Tiam'), 3),
    riboflavin: round(getNutrientValue('Ribo'), 3),
    niacin: round(getNutrientValue('Niac'), 2),
    folate: round(getNutrientValue('Folat')),
    // Minerals
    calcium: round(getNutrientValue('Ca')),
    iron: round(getNutrientValue('Fe'), 2),
    magnesium: round(getNutrientValue('Mg')),
    phosphorus: round(getNutrientValue('P')),
    potassium: round(getNutrientValue('K')),
    zinc: round(getNutrientValue('Zn'), 2),
    selenium: round(getNutrientValue('Se'), 2),
    iodine: round(getNutrientValue('I'), 2),
  }
}
