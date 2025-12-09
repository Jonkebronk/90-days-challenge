/**
 * Import Swedish products from Open Food Facts
 * With ICA-style category structure
 *
 * Usage: npx tsx scripts/import-openfoodfacts-sweden.ts
 *
 * Options:
 *   --dry-run     Show what would be imported without saving
 *   --limit=N     Limit to N products (for testing)
 *   --page=N      Start from page N
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Open Food Facts API
const OFF_API_BASE = 'https://world.openfoodfacts.org/cgi/search.pl'
const PAGE_SIZE = 100 // Max allowed by OFF API

interface OFFProduct {
  code: string // EAN barcode
  product_name?: string
  brands?: string
  categories_tags?: string[]
  categories?: string
  image_url?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    'energy-kcal'?: number
    'energy_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
    sugars_100g?: number
    salt_100g?: number
  }
}

interface OFFSearchResponse {
  count: number
  page: number
  page_count: number
  page_size: number
  products: OFFProduct[]
}

// ICA-style main categories
const MAIN_CATEGORIES = [
  'Frukt & Grönt',
  'Kött, Chark & Fågel',
  'Fisk & Skaldjur',
  'Mejeri & Ost',
  'Bröd & Kakor',
  'Vegetariskt',
  'Färdigmat',
  'Glass, Godis & Snacks',
  'Dryck',
  'Skafferi',
  'Fryst',
  'Övrigt'
] as const

type MainCategory = typeof MAIN_CATEGORIES[number]

interface CategoryMapping {
  main: MainCategory
  sub: string
}

// Detailed category mapping from Open Food Facts tags to ICA structure
function mapCategory(offCategories?: string[], categoryText?: string): CategoryMapping {
  const defaultMapping: CategoryMapping = { main: 'Övrigt', sub: 'Övrigt' }

  if (!offCategories || offCategories.length === 0) {
    // Try to parse from category text
    if (categoryText) {
      return mapFromCategoryText(categoryText)
    }
    return defaultMapping
  }

  // Check tags in order of specificity
  for (const tag of offCategories) {
    const mapping = getTagMapping(tag)
    if (mapping) return mapping
  }

  // Fallback to category text
  if (categoryText) {
    return mapFromCategoryText(categoryText)
  }

  return defaultMapping
}

function getTagMapping(tag: string): CategoryMapping | null {
  const mappings: Record<string, CategoryMapping> = {
    // === MEJERI & OST ===
    'en:milks': { main: 'Mejeri & Ost', sub: 'Mjölk' },
    'en:milk': { main: 'Mejeri & Ost', sub: 'Mjölk' },
    'en:semi-skimmed-milk': { main: 'Mejeri & Ost', sub: 'Mjölk' },
    'en:skimmed-milk': { main: 'Mejeri & Ost', sub: 'Mjölk' },
    'en:whole-milk': { main: 'Mejeri & Ost', sub: 'Mjölk' },
    'en:yogurts': { main: 'Mejeri & Ost', sub: 'Yoghurt' },
    'en:yogurt': { main: 'Mejeri & Ost', sub: 'Yoghurt' },
    'en:greek-yogurts': { main: 'Mejeri & Ost', sub: 'Yoghurt' },
    'en:fruit-yogurts': { main: 'Mejeri & Ost', sub: 'Yoghurt' },
    'en:cheeses': { main: 'Mejeri & Ost', sub: 'Ost' },
    'en:cheese': { main: 'Mejeri & Ost', sub: 'Ost' },
    'en:hard-cheeses': { main: 'Mejeri & Ost', sub: 'Ost' },
    'en:soft-cheeses': { main: 'Mejeri & Ost', sub: 'Ost' },
    'en:cream-cheeses': { main: 'Mejeri & Ost', sub: 'Ost' },
    'en:cottage-cheese': { main: 'Mejeri & Ost', sub: 'Cottage cheese' },
    'en:butters': { main: 'Mejeri & Ost', sub: 'Smör & Margarin' },
    'en:butter': { main: 'Mejeri & Ost', sub: 'Smör & Margarin' },
    'en:margarines': { main: 'Mejeri & Ost', sub: 'Smör & Margarin' },
    'en:creams': { main: 'Mejeri & Ost', sub: 'Grädde' },
    'en:cream': { main: 'Mejeri & Ost', sub: 'Grädde' },
    'en:sour-cream': { main: 'Mejeri & Ost', sub: 'Gräddfil' },
    'en:creme-fraiche': { main: 'Mejeri & Ost', sub: 'Crème fraiche' },
    'en:eggs': { main: 'Mejeri & Ost', sub: 'Ägg & Jäst' },
    'en:egg': { main: 'Mejeri & Ost', sub: 'Ägg & Jäst' },
    'en:quark': { main: 'Mejeri & Ost', sub: 'Kvarg' },
    'en:dairies': { main: 'Mejeri & Ost', sub: 'Mejeri' },

    // === KÖTT, CHARK & FÅGEL ===
    'en:meats': { main: 'Kött, Chark & Fågel', sub: 'Kött' },
    'en:meat': { main: 'Kött, Chark & Fågel', sub: 'Kött' },
    'en:beef': { main: 'Kött, Chark & Fågel', sub: 'Kött' },
    'en:pork': { main: 'Kött, Chark & Fågel', sub: 'Kött' },
    'en:lamb': { main: 'Kött, Chark & Fågel', sub: 'Kött' },
    'en:ground-meat': { main: 'Kött, Chark & Fågel', sub: 'Köttfärs' },
    'en:minced-meat': { main: 'Kött, Chark & Fågel', sub: 'Köttfärs' },
    'en:sausages': { main: 'Kött, Chark & Fågel', sub: 'Korv' },
    'en:sausage': { main: 'Kött, Chark & Fågel', sub: 'Korv' },
    'en:frankfurters': { main: 'Kött, Chark & Fågel', sub: 'Korv' },
    'en:ham': { main: 'Kött, Chark & Fågel', sub: 'Pålägg' },
    'en:hams': { main: 'Kött, Chark & Fågel', sub: 'Pålägg' },
    'en:bacon': { main: 'Kött, Chark & Fågel', sub: 'Pålägg' },
    'en:cold-cuts': { main: 'Kött, Chark & Fågel', sub: 'Pålägg' },
    'en:deli-meats': { main: 'Kött, Chark & Fågel', sub: 'Delikatessschark' },
    'en:poultry': { main: 'Kött, Chark & Fågel', sub: 'Kyckling & Fågel' },
    'en:chicken': { main: 'Kött, Chark & Fågel', sub: 'Kyckling & Fågel' },
    'en:turkey': { main: 'Kött, Chark & Fågel', sub: 'Kyckling & Fågel' },

    // === FISK & SKALDJUR ===
    'en:fishes': { main: 'Fisk & Skaldjur', sub: 'Fisk' },
    'en:fish': { main: 'Fisk & Skaldjur', sub: 'Fisk' },
    'en:salmon': { main: 'Fisk & Skaldjur', sub: 'Fisk' },
    'en:tuna': { main: 'Fisk & Skaldjur', sub: 'Fisk' },
    'en:cod': { main: 'Fisk & Skaldjur', sub: 'Fisk' },
    'en:smoked-salmon': { main: 'Fisk & Skaldjur', sub: 'Fisk' },
    'en:seafood': { main: 'Fisk & Skaldjur', sub: 'Skaldjur' },
    'en:shrimps': { main: 'Fisk & Skaldjur', sub: 'Skaldjur' },
    'en:prawns': { main: 'Fisk & Skaldjur', sub: 'Skaldjur' },
    'en:mussels': { main: 'Fisk & Skaldjur', sub: 'Skaldjur' },
    'en:caviar': { main: 'Fisk & Skaldjur', sub: 'Kaviar & Rom' },
    'en:fish-roe': { main: 'Fisk & Skaldjur', sub: 'Kaviar & Rom' },
    'en:herring': { main: 'Fisk & Skaldjur', sub: 'Sill & Ansjovis' },
    'en:anchovies': { main: 'Fisk & Skaldjur', sub: 'Sill & Ansjovis' },

    // === FRUKT & GRÖNT ===
    'en:fruits': { main: 'Frukt & Grönt', sub: 'Frukt' },
    'en:fruit': { main: 'Frukt & Grönt', sub: 'Frukt' },
    'en:apples': { main: 'Frukt & Grönt', sub: 'Frukt' },
    'en:bananas': { main: 'Frukt & Grönt', sub: 'Frukt' },
    'en:oranges': { main: 'Frukt & Grönt', sub: 'Frukt' },
    'en:berries': { main: 'Frukt & Grönt', sub: 'Färska bär' },
    'en:strawberries': { main: 'Frukt & Grönt', sub: 'Färska bär' },
    'en:blueberries': { main: 'Frukt & Grönt', sub: 'Färska bär' },
    'en:raspberries': { main: 'Frukt & Grönt', sub: 'Färska bär' },
    'en:vegetables': { main: 'Frukt & Grönt', sub: 'Grönsaker' },
    'en:vegetable': { main: 'Frukt & Grönt', sub: 'Grönsaker' },
    'en:salads': { main: 'Frukt & Grönt', sub: 'Grönsaker' },
    'en:tomatoes': { main: 'Frukt & Grönt', sub: 'Grönsaker' },
    'en:carrots': { main: 'Frukt & Grönt', sub: 'Rotfrukter' },
    'en:potatoes': { main: 'Frukt & Grönt', sub: 'Potatis' },
    'en:potato': { main: 'Frukt & Grönt', sub: 'Potatis' },
    'en:onions': { main: 'Frukt & Grönt', sub: 'Lök' },
    'en:garlic': { main: 'Frukt & Grönt', sub: 'Lök' },
    'en:cabbages': { main: 'Frukt & Grönt', sub: 'Kål' },
    'en:mushrooms': { main: 'Frukt & Grönt', sub: 'Svamp' },
    'en:herbs': { main: 'Frukt & Grönt', sub: 'Färska kryddor' },

    // === BRÖD & KAKOR ===
    'en:breads': { main: 'Bröd & Kakor', sub: 'Bröd' },
    'en:bread': { main: 'Bröd & Kakor', sub: 'Bröd' },
    'en:white-breads': { main: 'Bröd & Kakor', sub: 'Bröd' },
    'en:whole-wheat-breads': { main: 'Bröd & Kakor', sub: 'Bröd' },
    'en:rye-breads': { main: 'Bröd & Kakor', sub: 'Bröd' },
    'en:crispbreads': { main: 'Bröd & Kakor', sub: 'Knäckebröd' },
    'en:cakes': { main: 'Bröd & Kakor', sub: 'Kakor' },
    'en:cookies': { main: 'Bröd & Kakor', sub: 'Kakor' },
    'en:biscuits': { main: 'Bröd & Kakor', sub: 'Kakor' },
    'en:pastries': { main: 'Bröd & Kakor', sub: 'Bakverk' },

    // === DRYCK ===
    'en:beverages': { main: 'Dryck', sub: 'Dryck' },
    'en:waters': { main: 'Dryck', sub: 'Vatten' },
    'en:mineral-waters': { main: 'Dryck', sub: 'Vatten' },
    'en:sodas': { main: 'Dryck', sub: 'Läsk' },
    'en:soft-drinks': { main: 'Dryck', sub: 'Läsk' },
    'en:colas': { main: 'Dryck', sub: 'Läsk' },
    'en:juices': { main: 'Dryck', sub: 'Juice' },
    'en:fruit-juices': { main: 'Dryck', sub: 'Juice' },
    'en:orange-juices': { main: 'Dryck', sub: 'Juice' },
    'en:apple-juices': { main: 'Dryck', sub: 'Juice' },
    'en:energy-drinks': { main: 'Dryck', sub: 'Energidryck' },
    'en:coffees': { main: 'Dryck', sub: 'Kaffe' },
    'en:coffee': { main: 'Dryck', sub: 'Kaffe' },
    'en:teas': { main: 'Dryck', sub: 'Te' },
    'en:tea': { main: 'Dryck', sub: 'Te' },
    'en:beers': { main: 'Dryck', sub: 'Öl' },
    'en:beer': { main: 'Dryck', sub: 'Öl' },

    // === GLASS, GODIS & SNACKS ===
    'en:ice-creams': { main: 'Glass, Godis & Snacks', sub: 'Glass' },
    'en:ice-cream': { main: 'Glass, Godis & Snacks', sub: 'Glass' },
    'en:chocolates': { main: 'Glass, Godis & Snacks', sub: 'Choklad' },
    'en:chocolate': { main: 'Glass, Godis & Snacks', sub: 'Choklad' },
    'en:candies': { main: 'Glass, Godis & Snacks', sub: 'Godis' },
    'en:sweets': { main: 'Glass, Godis & Snacks', sub: 'Godis' },
    'en:snacks': { main: 'Glass, Godis & Snacks', sub: 'Snacks' },
    'en:chips': { main: 'Glass, Godis & Snacks', sub: 'Chips' },
    'en:crisps': { main: 'Glass, Godis & Snacks', sub: 'Chips' },
    'en:nuts': { main: 'Glass, Godis & Snacks', sub: 'Nötter' },
    'en:peanuts': { main: 'Glass, Godis & Snacks', sub: 'Nötter' },
    'en:popcorn': { main: 'Glass, Godis & Snacks', sub: 'Popcorn' },

    // === SKAFFERI ===
    'en:pastas': { main: 'Skafferi', sub: 'Pasta' },
    'en:pasta': { main: 'Skafferi', sub: 'Pasta' },
    'en:spaghetti': { main: 'Skafferi', sub: 'Pasta' },
    'en:rices': { main: 'Skafferi', sub: 'Ris' },
    'en:rice': { main: 'Skafferi', sub: 'Ris' },
    'en:cereals': { main: 'Skafferi', sub: 'Flingor & Müsli' },
    'en:breakfast-cereals': { main: 'Skafferi', sub: 'Flingor & Müsli' },
    'en:mueslis': { main: 'Skafferi', sub: 'Flingor & Müsli' },
    'en:oatmeals': { main: 'Skafferi', sub: 'Flingor & Müsli' },
    'en:flours': { main: 'Skafferi', sub: 'Mjöl & Bakning' },
    'en:flour': { main: 'Skafferi', sub: 'Mjöl & Bakning' },
    'en:sugars': { main: 'Skafferi', sub: 'Socker & Sötning' },
    'en:sugar': { main: 'Skafferi', sub: 'Socker & Sötning' },
    'en:honeys': { main: 'Skafferi', sub: 'Socker & Sötning' },
    'en:sauces': { main: 'Skafferi', sub: 'Såser' },
    'en:ketchup': { main: 'Skafferi', sub: 'Såser' },
    'en:mayonnaise': { main: 'Skafferi', sub: 'Såser' },
    'en:mustard': { main: 'Skafferi', sub: 'Såser' },
    'en:oils': { main: 'Skafferi', sub: 'Olja & Vinäger' },
    'en:olive-oils': { main: 'Skafferi', sub: 'Olja & Vinäger' },
    'en:vinegars': { main: 'Skafferi', sub: 'Olja & Vinäger' },
    'en:canned-foods': { main: 'Skafferi', sub: 'Konserver' },
    'en:canned-vegetables': { main: 'Skafferi', sub: 'Konserver' },
    'en:canned-beans': { main: 'Skafferi', sub: 'Konserver' },
    'en:jams': { main: 'Skafferi', sub: 'Sylt & Marmelad' },
    'en:marmalades': { main: 'Skafferi', sub: 'Sylt & Marmelad' },
    'en:spreads': { main: 'Skafferi', sub: 'Pålägg & Bredbart' },
    'en:peanut-butters': { main: 'Skafferi', sub: 'Pålägg & Bredbart' },
    'en:spices': { main: 'Skafferi', sub: 'Kryddor' },
    'en:seasonings': { main: 'Skafferi', sub: 'Kryddor' },
    'en:legumes': { main: 'Skafferi', sub: 'Baljväxter' },
    'en:beans': { main: 'Skafferi', sub: 'Baljväxter' },
    'en:lentils': { main: 'Skafferi', sub: 'Baljväxter' },

    // === FRYST ===
    'en:frozen-foods': { main: 'Fryst', sub: 'Fryst' },
    'en:frozen-vegetables': { main: 'Fryst', sub: 'Frysta grönsaker' },
    'en:frozen-fruits': { main: 'Fryst', sub: 'Frysta bär & frukt' },
    'en:frozen-pizzas': { main: 'Fryst', sub: 'Frysta pizzor' },
    'en:frozen-meals': { main: 'Fryst', sub: 'Frysta rätter' },
    'en:frozen-fish': { main: 'Fryst', sub: 'Fryst fisk' },

    // === FÄRDIGMAT ===
    'en:meals': { main: 'Färdigmat', sub: 'Färdigrätter' },
    'en:ready-meals': { main: 'Färdigmat', sub: 'Färdigrätter' },
    'en:pizzas': { main: 'Färdigmat', sub: 'Pizza' },
    'en:sandwiches': { main: 'Färdigmat', sub: 'Smörgåsar' },
    'en:soups': { main: 'Färdigmat', sub: 'Soppor' },
    'en:prepared-salads': { main: 'Färdigmat', sub: 'Sallader' },

    // === VEGETARISKT ===
    'en:plant-based-foods': { main: 'Vegetariskt', sub: 'Vegetariskt' },
    'en:meat-alternatives': { main: 'Vegetariskt', sub: 'Vegetariskt' },
    'en:tofu': { main: 'Vegetariskt', sub: 'Tofu & Tempeh' },
    'en:tempeh': { main: 'Vegetariskt', sub: 'Tofu & Tempeh' },
    'en:plant-based-milks': { main: 'Vegetariskt', sub: 'Mjölkfritt mejeri' },
    'en:soy-milks': { main: 'Vegetariskt', sub: 'Mjölkfritt mejeri' },
    'en:oat-milks': { main: 'Vegetariskt', sub: 'Mjölkfritt mejeri' },
    'en:almond-milks': { main: 'Vegetariskt', sub: 'Mjölkfritt mejeri' },
    'en:vegan-cheeses': { main: 'Vegetariskt', sub: 'Vegansk ost' },
  }

  return mappings[tag] || null
}

// Fallback mapping from category text
function mapFromCategoryText(text: string): CategoryMapping {
  const lowerText = text.toLowerCase()

  // Check for keywords
  if (lowerText.includes('mjölk') || lowerText.includes('milk')) {
    return { main: 'Mejeri & Ost', sub: 'Mjölk' }
  }
  if (lowerText.includes('yoghurt') || lowerText.includes('yogurt')) {
    return { main: 'Mejeri & Ost', sub: 'Yoghurt' }
  }
  if (lowerText.includes('ost') || lowerText.includes('cheese')) {
    return { main: 'Mejeri & Ost', sub: 'Ost' }
  }
  if (lowerText.includes('kyckling') || lowerText.includes('chicken')) {
    return { main: 'Kött, Chark & Fågel', sub: 'Kyckling & Fågel' }
  }
  if (lowerText.includes('korv') || lowerText.includes('sausage')) {
    return { main: 'Kött, Chark & Fågel', sub: 'Korv' }
  }
  if (lowerText.includes('fisk') || lowerText.includes('fish') || lowerText.includes('salmon') || lowerText.includes('lax')) {
    return { main: 'Fisk & Skaldjur', sub: 'Fisk' }
  }
  if (lowerText.includes('bröd') || lowerText.includes('bread')) {
    return { main: 'Bröd & Kakor', sub: 'Bröd' }
  }
  if (lowerText.includes('juice') || lowerText.includes('läsk') || lowerText.includes('soda') || lowerText.includes('dryck')) {
    return { main: 'Dryck', sub: 'Dryck' }
  }
  if (lowerText.includes('glass') || lowerText.includes('ice cream')) {
    return { main: 'Glass, Godis & Snacks', sub: 'Glass' }
  }
  if (lowerText.includes('godis') || lowerText.includes('choklad') || lowerText.includes('chocolate') || lowerText.includes('candy')) {
    return { main: 'Glass, Godis & Snacks', sub: 'Godis' }
  }
  if (lowerText.includes('chips') || lowerText.includes('snacks')) {
    return { main: 'Glass, Godis & Snacks', sub: 'Snacks' }
  }
  if (lowerText.includes('pasta') || lowerText.includes('ris') || lowerText.includes('rice')) {
    return { main: 'Skafferi', sub: 'Pasta & Ris' }
  }
  if (lowerText.includes('fryst') || lowerText.includes('frozen')) {
    return { main: 'Fryst', sub: 'Fryst' }
  }

  return { main: 'Övrigt', sub: 'Övrigt' }
}

// Validate EAN-13 barcode
function isValidEAN13(code: string): boolean {
  if (!code || code.length !== 13 || !/^\d+$/.test(code)) {
    return false
  }
  return true
}

// Also accept EAN-8
function isValidEAN(code: string): boolean {
  if (!code || !/^\d+$/.test(code)) return false
  return code.length === 13 || code.length === 8
}

// Fetch products from Open Food Facts
async function fetchSwedishProducts(page: number): Promise<OFFSearchResponse> {
  const url = new URL(OFF_API_BASE)
  url.searchParams.set('countries_tags_en', 'sweden')
  url.searchParams.set('action', 'process')
  url.searchParams.set('json', '1')
  url.searchParams.set('page_size', PAGE_SIZE.toString())
  url.searchParams.set('page', page.toString())
  url.searchParams.set('fields', 'code,product_name,brands,categories_tags,categories,image_url,nutriments')

  console.log(`Fetching page ${page}...`)

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'FriskvardskompasApp/1.0 (contact@friskvardskompassen.se)'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Transform OFF product to our Product format
function transformProduct(offProduct: OFFProduct) {
  const nutriments = offProduct.nutriments || {}

  // Get kcal - try multiple formats
  let kcal = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0

  // If energy is in kJ, convert to kcal
  if (kcal === 0 && nutriments['energy_100g']) {
    kcal = Math.round(nutriments['energy_100g'] / 4.184)
  }

  // If still very high, probably kJ
  if (kcal > 900) {
    kcal = Math.round(kcal / 4.184)
  }

  // Get category mapping
  const categoryMapping = mapCategory(offProduct.categories_tags, offProduct.categories)

  return {
    ean: offProduct.code,
    name: offProduct.product_name || 'Okänd produkt',
    brand: offProduct.brands || null,
    mainCategory: categoryMapping.main,
    subCategory: categoryMapping.sub,
    category: categoryMapping.main, // Legacy field
    image: offProduct.image_url || null,
    kcal: kcal,
    protein: nutriments.proteins_100g || 0,
    carbs: nutriments.carbohydrates_100g || 0,
    fat: nutriments.fat_100g || 0,
    fiber: nutriments.fiber_100g || null,
    sugar: nutriments.sugars_100g || null,
    salt: nutriments.salt_100g || null,
    source: 'openfoodfacts'
  }
}

// Main import function
async function importSwedishProducts(options: {
  dryRun: boolean
  limit?: number
  startPage: number
}) {
  console.log('='.repeat(60))
  console.log('OPEN FOOD FACTS - Swedish Products Import')
  console.log('ICA-style Category Structure')
  console.log('='.repeat(60))
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`)
  if (options.limit) console.log(`Limit: ${options.limit} products`)
  console.log('')

  let page = options.startPage
  let totalImported = 0
  let totalSkipped = 0
  let totalErrors = 0
  let totalDuplicates = 0
  let hasMore = true

  // Category stats
  const categoryStats: Record<string, number> = {}

  // First fetch to get total count
  const firstResponse = await fetchSwedishProducts(1)
  const totalProducts = firstResponse.count
  const totalPages = Math.ceil(totalProducts / PAGE_SIZE)

  console.log(`Total Swedish products in OFF: ${totalProducts}`)
  console.log(`Total pages: ${totalPages}`)
  console.log('')

  while (hasMore) {
    try {
      const response = await fetchSwedishProducts(page)
      const products = response.products

      if (products.length === 0) {
        hasMore = false
        break
      }

      const validProducts = []

      for (const offProduct of products) {
        // Check limit
        if (options.limit && (totalImported + validProducts.length) >= options.limit) {
          hasMore = false
          break
        }

        // Validate EAN
        if (!isValidEAN(offProduct.code)) {
          totalSkipped++
          continue
        }

        // Must have product name
        if (!offProduct.product_name || offProduct.product_name.trim() === '') {
          totalSkipped++
          continue
        }

        // Must have at least some nutrition data
        const nutriments = offProduct.nutriments || {}
        if (!nutriments['energy-kcal_100g'] && !nutriments['energy-kcal'] && !nutriments['energy_100g'] && !nutriments.proteins_100g) {
          totalSkipped++
          continue
        }

        const product = transformProduct(offProduct)
        validProducts.push(product)

        // Track category stats
        const catKey = `${product.mainCategory} > ${product.subCategory}`
        categoryStats[catKey] = (categoryStats[catKey] || 0) + 1
      }

      if (!options.dryRun && validProducts.length > 0) {
        // Use upsert to handle duplicates
        for (const product of validProducts) {
          try {
            await prisma.product.upsert({
              where: { ean: product.ean },
              create: product,
              update: {
                name: product.name,
                brand: product.brand,
                mainCategory: product.mainCategory,
                subCategory: product.subCategory,
                category: product.category,
                image: product.image,
                kcal: product.kcal,
                protein: product.protein,
                carbs: product.carbs,
                fat: product.fat,
                fiber: product.fiber,
                sugar: product.sugar,
                salt: product.salt,
                source: product.source
              }
            })
            totalImported++
          } catch (error: any) {
            if (error.code === 'P2002') {
              totalDuplicates++
            } else {
              totalErrors++
              console.error(`Error importing ${product.ean}: ${error.message}`)
            }
          }
        }
      } else {
        totalImported += validProducts.length
      }

      // Progress log
      const progress = Math.round((page / totalPages) * 100)
      console.log(`Page ${page}/${totalPages} - Imported: ${validProducts.length}, Progress: ${progress}%`)

      // Rate limiting - be nice to OFF servers
      await new Promise(resolve => setTimeout(resolve, 300))

      page++

      // Check if we've reached the limit
      if (options.limit && totalImported >= options.limit) {
        hasMore = false
      }

    } catch (error: any) {
      console.error(`Error on page ${page}: ${error.message}`)
      totalErrors++
      page++

      if (totalErrors > 10) {
        console.error('Too many errors, stopping import')
        hasMore = false
      }
    }
  }

  console.log('')
  console.log('='.repeat(60))
  console.log('IMPORT COMPLETE')
  console.log('='.repeat(60))
  console.log(`Total imported: ${totalImported}`)
  console.log(`Total skipped (invalid): ${totalSkipped}`)
  console.log(`Total duplicates: ${totalDuplicates}`)
  console.log(`Total errors: ${totalErrors}`)
  console.log('')

  // Show category distribution
  console.log('Category Distribution:')
  console.log('-'.repeat(40))
  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])
  for (const [cat, count] of sortedCategories.slice(0, 20)) {
    console.log(`  ${cat}: ${count}`)
  }

  if (options.dryRun) {
    console.log('')
    console.log('This was a DRY RUN - no data was saved.')
    console.log('Run without --dry-run to import products.')
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined
const pageArg = args.find(a => a.startsWith('--page='))
const startPage = pageArg ? parseInt(pageArg.split('=')[1]) : 1

// Run import
importSwedishProducts({ dryRun, limit, startPage })
  .catch(console.error)
  .finally(() => prisma.$disconnect())
