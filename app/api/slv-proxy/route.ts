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

/**
 * GET /api/slv-proxy
 * Search Livsmedelsverket's food database
 *
 * Query params:
 * - q: Search query (filters by name)
 * - nummer: Get specific food by SLV number
 * - limit: Max results (default 20)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const nummer = searchParams.get('nummer')
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

    // Search for foods
    const foods = await searchFoods(query || '', limit)
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
 * Fetch a single food item with its nutritional values
 */
async function fetchFoodWithNutrition(nummer: number): Promise<TransformedFood | null> {
  try {
    // Fetch food item
    const foodResponse = await fetch(`${SLV_BASE_URL}/livsmedel/${nummer}`, {
      headers: { 'Accept': 'application/json' }
    })

    if (!foodResponse.ok) return null
    const foodData: SLVFoodItem = await foodResponse.json()

    // Fetch nutritional values
    const nutritionResponse = await fetch(
      `${SLV_BASE_URL}/livsmedel/${nummer}/naringsvarden`,
      { headers: { 'Accept': 'application/json' } }
    )

    const nutrients: SLVNutrient[] = nutritionResponse.ok
      ? await nutritionResponse.json()
      : []

    return transformFood(foodData, nutrients)
  } catch (error) {
    console.error(`Error fetching food ${nummer}:`, error)
    return null
  }
}

/**
 * Search foods and fetch nutrition for matches
 */
async function searchFoods(query: string, limit: number): Promise<TransformedFood[]> {
  // Fetch a larger batch to filter from (SLV API doesn't have text search)
  const response = await fetch(
    `${SLV_BASE_URL}/livsmedel?limit=500&offset=0`,
    { headers: { 'Accept': 'application/json' } }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch foods from SLV')
  }

  const data = await response.json()
  const foods: SLVFoodItem[] = data.livsmedel || []

  // Filter by search query
  const filtered = query
    ? foods.filter(f => f.namn.toLowerCase().includes(query.toLowerCase()))
    : foods

  // Limit results
  const limited = filtered.slice(0, limit)

  // Fetch nutrition for each (in parallel, max 10 at a time)
  const results: TransformedFood[] = []

  for (let i = 0; i < limited.length; i += 10) {
    const batch = limited.slice(i, i + 10)
    const batchResults = await Promise.all(
      batch.map(food => fetchFoodWithNutrition(food.nummer))
    )
    results.push(...batchResults.filter((f): f is TransformedFood => f !== null))
  }

  return results
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
