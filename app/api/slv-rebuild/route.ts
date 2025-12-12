import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as fs from 'fs'
import * as path from 'path'

const SLV_BASE_URL = 'https://dataportal.livsmedelsverket.se/livsmedel/api/v1'
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'slv-foods.json')

const BATCH_SIZE = 30
const DELAY_BETWEEN_BATCHES = 500

interface SLVFood {
  nummer: number
  namn: string
  livsmedelsTyp: string
}

interface SLVNutrient {
  forkortning: string
  varde: number | null
  enhet: string
}

interface SLVClassification {
  typ: string
  kod?: string
}

interface ProcessedFood {
  nummer: number
  namn: string
  typ: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number | null
  sugar: number | null
  salt: number | null
  saturatedFat: number | null
  vitaminA: number | null
  vitaminD: number | null
  vitaminC: number | null
  vitaminB12: number | null
  folate: number | null
  calcium: number | null
  iron: number | null
  magnesium: number | null
  potassium: number | null
  zinc: number | null
  iodine: number | null
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function round(val: number | null, decimals = 1): number | null {
  if (val === null) return null
  const factor = Math.pow(10, decimals)
  return Math.round(val * factor) / factor
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })
      if (response.ok) return response
      if (response.status === 429) {
        await sleep(2000 * (i + 1))
        continue
      }
      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      if (i === retries - 1) throw error
      await sleep(1000 * (i + 1))
    }
  }
  throw new Error('Max retries exceeded')
}

async function fetchClassification(nummer: number): Promise<string> {
  try {
    const response = await fetchWithRetry(`${SLV_BASE_URL}/livsmedel/${nummer}/klassificeringar`)
    const classifications: SLVClassification[] = await response.json()
    const huvudgrupp = classifications.find(c => c.typ === 'Huvudgrupp')
    return huvudgrupp?.kod || 'Övrigt'
  } catch {
    return 'Övrigt'
  }
}

async function fetchNutrition(nummer: number): Promise<SLVNutrient[]> {
  try {
    const response = await fetchWithRetry(`${SLV_BASE_URL}/livsmedel/${nummer}/naringsvarden`)
    return await response.json()
  } catch {
    return []
  }
}

function processNutrition(nutrients: SLVNutrient[]): Partial<ProcessedFood> {
  const getNutrient = (abbr: string, unit?: string): number | null => {
    const nutrient = nutrients.find(n =>
      n.forkortning === abbr && (!unit || n.enhet === unit)
    )
    return nutrient?.varde ?? null
  }

  return {
    kcal: Math.round(getNutrient('Ener', 'kcal') ?? 0),
    protein: round(getNutrient('Prot')) ?? 0,
    carbs: round(getNutrient('Kolh')) ?? 0,
    fat: round(getNutrient('Fett')) ?? 0,
    fiber: round(getNutrient('Fibe')),
    sugar: round(getNutrient('Mono/disack')),
    salt: round(getNutrient('NaCl'), 2),
    saturatedFat: round(getNutrient('Mfet')),
    vitaminA: round(getNutrient('VitA')),
    vitaminD: round(getNutrient('VitD'), 2),
    vitaminC: round(getNutrient('VitC')),
    vitaminB12: round(getNutrient('VitB12'), 3),
    folate: round(getNutrient('Folat')),
    calcium: round(getNutrient('Ca')),
    iron: round(getNutrient('Fe'), 2),
    magnesium: round(getNutrient('Mg')),
    potassium: round(getNutrient('K')),
    zinc: round(getNutrient('Zn'), 2),
    iodine: round(getNutrient('I'), 2),
  }
}

// POST /api/slv-rebuild - Rebuild SLV data (coach only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role?.toUpperCase()
    if (role !== 'COACH') {
      return NextResponse.json({ error: 'Coach access required' }, { status: 403 })
    }

    console.log('Starting SLV data rebuild...')

    // Fetch all foods
    const response = await fetchWithRetry(`${SLV_BASE_URL}/livsmedel?limit=3000`)
    const data = await response.json()
    const allFoods: SLVFood[] = data.livsmedel

    console.log(`Found ${allFoods.length} foods`)

    // Process in batches
    const categories: Record<string, ProcessedFood[]> = {}

    for (let i = 0; i < allFoods.length; i += BATCH_SIZE) {
      const batch = allFoods.slice(i, i + BATCH_SIZE)

      const promises = batch.map(async (food) => {
        const [category, nutrients] = await Promise.all([
          fetchClassification(food.nummer),
          fetchNutrition(food.nummer)
        ])

        const nutrition = processNutrition(nutrients)

        return {
          category,
          food: {
            nummer: food.nummer,
            namn: food.namn,
            typ: food.livsmedelsTyp,
            ...nutrition
          } as ProcessedFood
        }
      })

      const results = await Promise.all(promises)

      for (const { food, category } of results) {
        if (!categories[category]) {
          categories[category] = []
        }
        categories[category].push(food)
      }

      if (i + BATCH_SIZE < allFoods.length) {
        await sleep(DELAY_BETWEEN_BATCHES)
      }
    }

    // Sort categories
    const sortedCategories: Record<string, ProcessedFood[]> = {}
    const sortedKeys = Object.keys(categories).sort((a, b) => a.localeCompare(b, 'sv'))

    for (const key of sortedKeys) {
      sortedCategories[key] = categories[key].sort((a, b) =>
        a.namn.localeCompare(b.namn, 'sv')
      )
    }

    const output = {
      lastUpdated: new Date().toISOString(),
      totalCount: allFoods.length,
      categoryCount: Object.keys(sortedCategories).length,
      categories: sortedCategories
    }

    // Write to file
    const dir = path.dirname(OUTPUT_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')

    console.log('SLV data rebuild complete')

    return NextResponse.json({
      success: true,
      totalCount: output.totalCount,
      categoryCount: output.categoryCount,
      lastUpdated: output.lastUpdated
    })
  } catch (error) {
    console.error('Error rebuilding SLV data:', error)
    return NextResponse.json(
      { error: 'Failed to rebuild SLV data' },
      { status: 500 }
    )
  }
}

// GET /api/slv-rebuild - Get status of last rebuild
export async function GET() {
  try {
    if (fs.existsSync(OUTPUT_PATH)) {
      const content = fs.readFileSync(OUTPUT_PATH, 'utf-8')
      const data = JSON.parse(content)
      return NextResponse.json({
        exists: true,
        lastUpdated: data.lastUpdated,
        totalCount: data.totalCount,
        categoryCount: data.categoryCount
      })
    }
    return NextResponse.json({ exists: false })
  } catch (error) {
    return NextResponse.json({ exists: false, error: 'Failed to read data' })
  }
}
