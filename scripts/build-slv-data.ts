/**
 * Build script to fetch all foods from Livsmedelsverket and save to JSON
 *
 * Usage: npx tsx scripts/build-slv-data.ts
 *
 * This fetches ~2575 foods with their classifications and nutrition data,
 * groups them by "Huvudgrupp" category, and saves to public/data/slv-foods.json
 */

import * as fs from 'fs'
import * as path from 'path'

const SLV_BASE_URL = 'https://dataportal.livsmedelsverket.se/livsmedel/api/v1'
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'slv-foods.json')

// Batch size for parallel requests
const BATCH_SIZE = 30
const DELAY_BETWEEN_BATCHES = 500 // ms

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
  namn?: string
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

interface OutputData {
  lastUpdated: string
  totalCount: number
  categoryCount: number
  categories: Record<string, ProcessedFood[]>
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })
      if (response.ok) return response
      if (response.status === 429) {
        // Rate limited, wait and retry
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function round(val: number | null, decimals = 1): number | null {
  if (val === null) return null
  const factor = Math.pow(10, decimals)
  return Math.round(val * factor) / factor
}

async function fetchAllFoods(): Promise<SLVFood[]> {
  console.log('Fetching all foods from SLV...')
  const response = await fetchWithRetry(`${SLV_BASE_URL}/livsmedel?limit=3000`)
  const data = await response.json()
  console.log(`Found ${data.livsmedel.length} foods`)
  return data.livsmedel
}

async function fetchClassification(nummer: number): Promise<string> {
  try {
    const response = await fetchWithRetry(`${SLV_BASE_URL}/livsmedel/${nummer}/klassificeringar`)
    const classifications: SLVClassification[] = await response.json()

    // Find "Huvudgrupp" classification
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

async function processBatch(
  foods: SLVFood[],
  startIdx: number
): Promise<{ food: ProcessedFood; category: string }[]> {
  const results: { food: ProcessedFood; category: string }[] = []

  const promises = foods.map(async (food) => {
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

  const batchResults = await Promise.all(promises)
  return batchResults
}

async function main() {
  console.log('=== SLV Data Builder ===\n')

  // Fetch all foods
  const allFoods = await fetchAllFoods()

  // Process in batches
  const categories: Record<string, ProcessedFood[]> = {}
  let processed = 0

  for (let i = 0; i < allFoods.length; i += BATCH_SIZE) {
    const batch = allFoods.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(allFoods.length / BATCH_SIZE)

    console.log(`Processing batch ${batchNum}/${totalBatches} (${processed}/${allFoods.length} foods)...`)

    const results = await processBatch(batch, i)

    for (const { food, category } of results) {
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(food)
      processed++
    }

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < allFoods.length) {
      await sleep(DELAY_BETWEEN_BATCHES)
    }
  }

  // Sort categories alphabetically
  const sortedCategories: Record<string, ProcessedFood[]> = {}
  const sortedKeys = Object.keys(categories).sort((a, b) => a.localeCompare(b, 'sv'))

  for (const key of sortedKeys) {
    // Sort foods within each category
    sortedCategories[key] = categories[key].sort((a, b) =>
      a.namn.localeCompare(b.namn, 'sv')
    )
  }

  // Create output
  const output: OutputData = {
    lastUpdated: new Date().toISOString(),
    totalCount: allFoods.length,
    categoryCount: Object.keys(sortedCategories).length,
    categories: sortedCategories
  }

  // Ensure directory exists
  const dir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Write to file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')

  console.log(`\n=== Done! ===`)
  console.log(`Total foods: ${output.totalCount}`)
  console.log(`Categories: ${output.categoryCount}`)
  console.log(`Output: ${OUTPUT_PATH}`)

  // Print category summary
  console.log('\nCategories:')
  for (const [cat, foods] of Object.entries(sortedCategories)) {
    console.log(`  ${cat}: ${foods.length} foods`)
  }
}

main().catch(console.error)
