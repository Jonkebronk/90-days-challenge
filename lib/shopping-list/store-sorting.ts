/**
 * Butikssortering för inköpslista
 *
 * Sorterar varor efter ICA-butikslayout för effektiv shopping.
 * Användare kan anpassa ordningen baserat på sin lokala butik.
 */

// Default ICA store aisle order
export const DEFAULT_CATEGORY_ORDER = [
  'Frukt & Grönt',
  'Bröd & Baka',
  'Mejeri',
  'Ost',
  'Chark & Pålägg',
  'Kött & Fågel',
  'Fisk & Skaldjur',
  'Fryst',
  'Skafferi',
  'Konserv',
  'Dryck',
  'Godis & Snacks',
  'Hygien & Hem',
  'Övrigt',
]

// Category keywords for auto-assignment from ICA product categoryPath
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Frukt & Grönt': ['frukt', 'grönt', 'grönsak', 'bär', 'potatis', 'lök', 'svamp'],
  'Bröd & Baka': ['bröd', 'baka', 'mjöl', 'deg', 'kaka'],
  'Mejeri': ['mejeri', 'mjölk', 'fil', 'yoghurt', 'grädde', 'smör', 'margarin', 'ägg'],
  'Ost': ['ost'],
  'Chark & Pålägg': ['chark', 'pålägg', 'skinka', 'bacon', 'korv', 'salami', 'leverpastej'],
  'Kött & Fågel': ['kött', 'fågel', 'kyckling', 'nöt', 'fläsk', 'lamm', 'kalkon', 'köttfärs'],
  'Fisk & Skaldjur': ['fisk', 'skaldjur', 'lax', 'torsk', 'räk', 'sill', 'tonfisk'],
  'Fryst': ['fryst', 'frysta', 'glass'],
  'Skafferi': ['skafferi', 'ris', 'pasta', 'nudlar', 'müsli', 'havre', 'konserv', 'burk', 'olja', 'vinäger', 'sås', 'krydd'],
  'Konserv': ['konserv', 'burk', 'kross', 'passerade'],
  'Dryck': ['dryck', 'läsk', 'juice', 'vatten', 'kaffe', 'te', 'öl', 'vin'],
  'Godis & Snacks': ['godis', 'snacks', 'chips', 'choklad', 'nötter', 'popcorn'],
  'Hygien & Hem': ['hygien', 'tvål', 'schampo', 'städ', 'tvätt', 'hushåll', 'papper'],
}

export interface ShoppingItem {
  id: string
  name: string
  category: string
  [key: string]: any
}

/**
 * Sortera inköpslista efter butikslayout
 */
export function sortByStoreLayout<T extends ShoppingItem>(
  items: T[],
  customOrder?: string[]
): T[] {
  const order = customOrder || DEFAULT_CATEGORY_ORDER

  return [...items].sort((a, b) => {
    const aIndex = order.indexOf(a.category)
    const bIndex = order.indexOf(b.category)

    // Unknown categories go to end
    const aPos = aIndex === -1 ? order.length : aIndex
    const bPos = bIndex === -1 ? order.length : bIndex

    if (aPos !== bPos) return aPos - bPos

    // Within same category, sort alphabetically by name
    return a.name.localeCompare(b.name, 'sv')
  })
}

/**
 * Mappa ICA categoryPath till inköpskategori
 */
export function mapIcaCategoryToShoppingCategory(categoryPath: string | null | undefined): string {
  if (!categoryPath) return 'Övrigt'

  const lowerPath = categoryPath.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerPath.includes(keyword)) {
        return category
      }
    }
  }

  return 'Övrigt'
}

/**
 * Gruppera items efter kategori
 */
export function groupItemsByCategory<T extends ShoppingItem>(
  items: T[],
  customOrder?: string[]
): { category: string; items: T[] }[] {
  const order = customOrder || DEFAULT_CATEGORY_ORDER
  const groups: Record<string, T[]> = {}

  // Group items
  for (const item of items) {
    if (!groups[item.category]) {
      groups[item.category] = []
    }
    groups[item.category].push(item)
  }

  // Sort items within each group
  for (const category of Object.keys(groups)) {
    groups[category].sort((a, b) => a.name.localeCompare(b.name, 'sv'))
  }

  // Return as sorted array
  const result: { category: string; items: T[] }[] = []

  // Add categories in order
  for (const category of order) {
    if (groups[category] && groups[category].length > 0) {
      result.push({ category, items: groups[category] })
      delete groups[category]
    }
  }

  // Add remaining categories (not in order)
  for (const category of Object.keys(groups)) {
    if (groups[category].length > 0) {
      result.push({ category, items: groups[category] })
    }
  }

  return result
}

/**
 * Beräkna statistik för inköpslista
 */
export function calculateListStats(items: ShoppingItem[]): {
  totalItems: number
  checkedItems: number
  categories: number
  estimatedTotal: number
} {
  const categories = new Set(items.map((item) => item.category))

  return {
    totalItems: items.length,
    checkedItems: items.filter((item) => item.checked).length,
    categories: categories.size,
    estimatedTotal: items.reduce((sum, item) => sum + (Number(item.estimatedPrice) || 0), 0),
  }
}

/**
 * Filtrera items baserat på checkstatus
 */
export function filterByCheckedStatus<T extends ShoppingItem & { checked?: boolean }>(
  items: T[],
  showChecked: boolean
): T[] {
  if (showChecked) return items
  return items.filter((item) => !item.checked)
}
