// Subcategory definitions for product categories
// Starting with Frukt, can be expanded to other categories later

export interface Subcategory {
  key: string
  label: string
  keywords: string[] // Used to auto-classify products by name
}

export interface CategoryWithSubcategories {
  categoryId: string
  subcategories: Subcategory[]
}

// Frukt subcategories based on ICA's categorization
export const FRUKT_SUBCATEGORIES: Subcategory[] = [
  {
    key: 'banan',
    label: 'Banan',
    keywords: ['banan', 'plantain']
  },
  {
    key: 'apple',
    label: 'Äpple',
    keywords: ['äpple', 'gala', 'granny', 'royal gala', 'pink lady', 'braeburn']
  },
  {
    key: 'paron',
    label: 'Päron',
    keywords: ['päron', 'pear', 'conference']
  },
  {
    key: 'citrusfrukt',
    label: 'Citrusfrukt',
    keywords: ['apelsin', 'citron', 'lime', 'grapefrukt', 'clementin', 'mandarin', 'pomelo', 'orange', 'lemon', 'citrus', 'satsuma']
  },
  {
    key: 'druvor',
    label: 'Druvor',
    keywords: ['druv', 'grape', 'vindruv']
  },
  {
    key: 'melon',
    label: 'Melon',
    keywords: ['melon', 'vattenmelon', 'honungsmelon', 'cantaloupe', 'galia']
  },
  {
    key: 'exotisk',
    label: 'Exotisk frukt',
    keywords: ['mango', 'papaya', 'passionsfrukt', 'ananas', 'kiwi', 'kokos', 'granatäpple', 'lychee', 'litchi', 'dragon', 'pitaya', 'physalis', 'kumquat', 'starfruit', 'carambola', 'fikon', 'dadel', 'physalis']
  },
  {
    key: 'avokado',
    label: 'Avokado',
    keywords: ['avokado', 'avocado']
  },
  {
    key: 'bar',
    label: 'Bär',
    keywords: ['jordgubb', 'hallon', 'blåbär', 'björnbär', 'lingon', 'tranbär', 'vinbär', 'krusbär', 'smultron', 'berry', 'strawberry', 'raspberry', 'blueberry']
  },
  {
    key: 'stonfrukter',
    label: 'Stenfrukter',
    keywords: ['persika', 'nektarin', 'plommon', 'aprikos', 'körsbär', 'cherry', 'peach', 'plum', 'apricot']
  },
]

// Map of category IDs to their subcategories
export const SUBCATEGORIES_BY_CATEGORY: Record<string, Subcategory[]> = {
  frukt: FRUKT_SUBCATEGORIES,
  // Add more categories here as needed:
  // mejeri: MEJERI_SUBCATEGORIES,
  // kött: KOTT_SUBCATEGORIES,
}

// Helper to classify a product by name
// Prioritizes longer keyword matches to avoid "granatäpple" matching "äpple"
export function classifyProductSubcategory(
  productName: string,
  categoryId: string
): string | null {
  const subcategories = SUBCATEGORIES_BY_CATEGORY[categoryId.toLowerCase()]
  if (!subcategories) return null

  const nameLower = productName.toLowerCase()

  // Collect all matches with their keyword lengths
  const matches: { key: string; keywordLength: number }[] = []

  for (const subcat of subcategories) {
    for (const keyword of subcat.keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        matches.push({ key: subcat.key, keywordLength: keyword.length })
        break // Only count first match per subcategory
      }
    }
  }

  if (matches.length === 0) return null

  // Return the subcategory with the longest matching keyword
  // This ensures "granatäpple" matches exotisk (11 chars) over "äpple" (5 chars)
  matches.sort((a, b) => b.keywordLength - a.keywordLength)
  return matches[0].key
}

// Get all subcategory keys for a category
export function getSubcategoryKeys(categoryId: string): string[] {
  const subcategories = SUBCATEGORIES_BY_CATEGORY[categoryId.toLowerCase()]
  return subcategories?.map(s => s.key) || []
}

// Get subcategory label by key
export function getSubcategoryLabel(categoryId: string, subcategoryKey: string): string | null {
  const subcategories = SUBCATEGORIES_BY_CATEGORY[categoryId.toLowerCase()]
  if (!subcategories) return null
  const subcat = subcategories.find(s => s.key === subcategoryKey)
  return subcat?.label || null
}
