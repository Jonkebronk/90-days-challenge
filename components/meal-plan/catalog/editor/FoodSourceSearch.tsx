'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2, Database, Apple, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Subkategorier för varje makrokategori
const SUBCATEGORIES: Record<string, { key: string; label: string; keywords: string[] }[]> = {
  protein: [
    { key: 'all', label: 'Alla', keywords: [] },
    { key: 'chicken', label: 'Kyckling', keywords: ['kyckling', 'höns'] },
    { key: 'beef', label: 'Nöt', keywords: ['nöt', 'biff', 'oxfilé', 'lövbiff', 'rostbiff', 'entrecote', 'färs'] },
    { key: 'pork', label: 'Fläsk', keywords: ['fläsk', 'kassler', 'bacon', 'skinka'] },
    { key: 'fish', label: 'Fisk', keywords: ['lax', 'torsk', 'sej', 'pollock', 'tonfisk', 'fisk', 'pangasius', 'makrill', 'sill'] },
    { key: 'seafood', label: 'Skaldjur', keywords: ['räk', 'krabba', 'musslor', 'bläckfisk'] },
    { key: 'egg', label: 'Ägg', keywords: ['ägg', 'äggvita'] },
    { key: 'dairy', label: 'Mejeri', keywords: ['kvarg', 'cottage', 'yoghurt', 'skyr', 'ost', 'fil'] },
    { key: 'game', label: 'Vilt', keywords: ['älg', 'vildsvin', 'rådjur', 'hjort', 'ren'] },
    { key: 'turkey', label: 'Kalkon', keywords: ['kalkon'] },
  ],
  kolhydrat: [
    { key: 'all', label: 'Alla', keywords: [] },
    { key: 'rice', label: 'Ris', keywords: ['ris', 'jasmin', 'basmati'] },
    { key: 'pasta', label: 'Pasta', keywords: ['pasta', 'spagetti', 'penne', 'fusilli', 'makaroner'] },
    { key: 'potato', label: 'Potatis', keywords: ['potatis', 'sötpotatis', 'potatismos'] },
    { key: 'bread', label: 'Bröd', keywords: ['bröd', 'knäcke', 'fralla', 'bagel'] },
    { key: 'oats', label: 'Havre', keywords: ['havre', 'gryn', 'havrefras', 'müsli'] },
    { key: 'fruit', label: 'Frukt', keywords: ['banan', 'äpple', 'apelsin', 'ananas', 'mango', 'frukt', 'päron', 'kiwi', 'vindruvor'] },
    { key: 'berry', label: 'Bär', keywords: ['bär', 'blåbär', 'hallon', 'jordgubb', 'björnbär', 'lingon', 'krusbär', 'vinbär', 'smultron'] },
    { key: 'beans', label: 'Baljväxter', keywords: ['bönor', 'linser', 'kikärter', 'ärtor'] },
    { key: 'couscous', label: 'Bulgur/Couscous', keywords: ['bulgur', 'couscous', 'quinoa'] },
  ],
  fett: [
    { key: 'all', label: 'Alla', keywords: [] },
    { key: 'nuts', label: 'Nötter', keywords: ['mandel', 'cashew', 'valnöt', 'hasselnöt', 'pistasch', 'jordnöt', 'nötter'] },
    { key: 'seeds', label: 'Frön', keywords: ['chia', 'lin', 'sesam', 'pumpa', 'solros', 'frö'] },
    { key: 'oil', label: 'Oljor', keywords: ['olja', 'olivolja', 'kokosolja', 'rapsolja'] },
    { key: 'avocado', label: 'Avokado', keywords: ['avokado'] },
    { key: 'butter', label: 'Smör/Ost', keywords: ['smör', 'ost', 'cream cheese', 'grädde'] },
    { key: 'nutbutter', label: 'Nötsmör', keywords: ['jordnötssmör', 'mandelsmör', 'peanut butter', 'nötsmör'] },
  ],
  grönsak: [
    { key: 'all', label: 'Alla', keywords: [] },
    { key: 'leafy', label: 'Bladgrönsaker', keywords: ['sallad', 'spenat', 'grönkål', 'ruccola'] },
    { key: 'root', label: 'Rotfrukter', keywords: ['morot', 'rödbetor', 'palsternacka', 'selleri'] },
    { key: 'cruciferous', label: 'Kål', keywords: ['broccoli', 'blomkål', 'vitkål', 'brysselkål'] },
    { key: 'other', label: 'Övrigt', keywords: ['tomat', 'gurka', 'paprika', 'zucchini', 'lök'] },
  ],
  sås: [
    { key: 'all', label: 'Alla', keywords: [] },
  ],
}

// Map category to macroCategory for API
const CATEGORY_TO_MACRO: Record<string, string> = {
  protein: 'protein',
  kolhydrat: 'carb',
  fett: 'fat',
  grönsak: 'vegetable',
  sås: 'sauce',
}

interface Product {
  id: string
  name: string
  brand?: string | null
  image?: string | null
  kcal: number
  protein: number
  carbs: number
  fat: number
  source?: 'product' | 'slv'
}

interface SlvFood {
  nummer: number
  namn: string
  typ: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number | null
}

interface NormalizedFood {
  id: string
  source: 'product' | 'slv'
  name: string
  brand?: string | null
  image?: string | null
  protein: number
  carbs: number
  fat: number
  kcal: number
  defaultAmount: number
}

interface FoodSourceSearchProps {
  onSelect: (food: NormalizedFood) => void
  category?: 'protein' | 'kolhydrat' | 'fett' | 'grönsak' | 'sås'
}

function matchesSubcategory(productName: string, subcategory: { key: string; keywords: string[] }): boolean {
  if (subcategory.key === 'all') return true
  const nameLower = productName.toLowerCase()
  return subcategory.keywords.some(keyword => nameLower.includes(keyword))
}

export function FoodSourceSearch({ onSelect, category = 'protein' }: FoodSourceSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'products' | 'slv'>('products')
  const [activeSubcategory, setActiveSubcategory] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [slvFoods, setSlvFoods] = useState<SlvFood[]>([])

  const subcategories = SUBCATEGORIES[category] || [{ key: 'all', label: 'Alla', keywords: [] }]
  const macroCategory = CATEGORY_TO_MACRO[category] || category

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [productsRes, slvRes] = await Promise.all([
          fetch(`/api/products?macroCategory=${macroCategory}`),
          fetch('/data/slv-foods.json'),
        ])

        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data.products || [])
        }

        if (slvRes.ok) {
          const slvData = await slvRes.json()
          const allFoods: SlvFood[] = []
          for (const categoryFoods of Object.values(slvData.categories || {})) {
            allFoods.push(...(categoryFoods as SlvFood[]))
          }
          setSlvFoods(allFoods)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [macroCategory])

  // Filter SLV foods by category
  const filterSlvByCategory = (foods: SlvFood[]): SlvFood[] => {
    switch (category) {
      case 'protein':
        return foods.filter(f => f.protein > 10)
      case 'kolhydrat':
        return foods.filter(f => f.carbs > 15 && f.protein < 10)
      case 'fett':
        return foods.filter(f => f.fat > 10 && f.carbs < 10)
      case 'grönsak':
        return foods.filter(f =>
          f.kcal < 50 && (f.fiber ?? 0) > 1 ||
          f.typ?.toLowerCase().includes('grönsak')
        )
      default:
        return foods
    }
  }

  // Convert SLV foods to normalized format
  const slvAsProducts: NormalizedFood[] = useMemo(() => {
    return filterSlvByCategory(slvFoods).map(f => ({
      id: `slv-${f.nummer}`,
      source: 'slv' as const,
      name: f.namn,
      brand: 'Livsmedelsverket',
      image: null,
      kcal: f.kcal,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      defaultAmount: 100,
    }))
  }, [slvFoods, category])

  // Convert products to normalized format
  const productsNormalized: NormalizedFood[] = useMemo(() => {
    return products.map(p => ({
      id: `product-${p.id}`,
      source: 'product' as const,
      name: p.name,
      brand: p.brand,
      image: p.image,
      kcal: p.kcal,
      protein: p.protein,
      carbs: p.carbs,
      fat: p.fat,
      defaultAmount: 100,
    }))
  }, [products])

  // Get active source items
  const sourceItems = activeTab === 'products' ? productsNormalized : slvAsProducts

  // Filter items
  const filteredItems = useMemo(() => {
    return sourceItems
      .filter((p) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(query) ||
          (p.brand && p.brand.toLowerCase().includes(query))
        )
      })
      .filter((p) => {
        const selectedSubcategory = subcategories.find(s => s.key === activeSubcategory)
        if (!selectedSubcategory) return true
        return matchesSubcategory(p.name, selectedSubcategory)
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
  }, [sourceItems, searchQuery, activeSubcategory, subcategories])

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Source tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'products'
              ? 'border-b-2 border-amber-500 text-amber-700'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Apple className="h-4 w-4" />
          Mina produkter
        </button>
        <button
          onClick={() => setActiveTab('slv')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'slv'
              ? 'border-b-2 border-green-500 text-green-700'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Database className="h-4 w-4" />
          Livsmedelsverket
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Sök livsmedel..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Subcategory chips */}
      {subcategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {subcategories.map((sub) => (
            <button
              key={sub.key}
              onClick={() => setActiveSubcategory(sub.key)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                activeSubcategory === sub.key
                  ? activeTab === 'slv'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              )}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Laddar...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {searchQuery ? 'Inga livsmedel matchar sökningen' : 'Inga livsmedel i denna kategori'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((food) => (
              <button
                key={food.id}
                onClick={() => onSelect(food)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors group',
                  activeTab === 'slv'
                    ? 'border-green-100 hover:border-green-300 hover:bg-green-50/50'
                    : 'border-gray-100 hover:border-amber-200 hover:bg-amber-50/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Product image or icon */}
                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                    />
                  ) : (
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      activeTab === 'slv' ? 'bg-green-100' : 'bg-gray-100'
                    )}>
                      {activeTab === 'slv' ? (
                        <Database className="h-5 w-5 text-green-600" />
                      ) : (
                        <Apple className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  )}

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'font-medium truncate text-gray-900',
                      activeTab === 'slv'
                        ? 'group-hover:text-green-700'
                        : 'group-hover:text-amber-700'
                    )}>
                      {food.name}
                    </div>
                    {food.brand && (
                      <div className="text-xs text-gray-500 truncate">{food.brand}</div>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span className="text-rose-600">{food.protein}g P</span>
                      <span className="text-amber-600">{food.carbs}g K</span>
                      <span className="text-sky-600">{food.fat}g F</span>
                      <span>{food.kcal} kcal</span>
                    </div>
                  </div>

                  <Plus className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
