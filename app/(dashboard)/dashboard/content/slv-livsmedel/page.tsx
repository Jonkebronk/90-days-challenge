'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  Search,
  Database,
  RefreshCw,
  Loader2,
  Calendar,
  Beef,
  Wheat,
  Droplets,
  Carrot,
  UtensilsCrossed,
  Leaf,
  Flame,
  MoreHorizontal,
  LayoutGrid,
  List,
  Dumbbell,
  Zap
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { SLVFoodDetailModal, type SLVFood } from '@/components/slv/SLVFoodDetailModal'

interface SLVData {
  lastUpdated: string
  totalCount: number
  categoryCount: number
  categories: Record<string, SLVFood[]>
}

// Extended SLV food with slvCategory for filtering
interface SLVFoodWithCategory extends SLVFood {
  slvCategory?: string
}

// Macro-based categories (same as Livsmedel/Products page)
const MACRO_CATEGORIES = [
  { id: 'proteinkallor', label: 'Proteinkällor', icon: Beef, color: 'rose', gradient: 'from-rose-500 to-red-600' },
  { id: 'kolhydratkallor', label: 'Kolhydratskällor', icon: Wheat, color: 'amber', gradient: 'from-amber-500 to-yellow-600' },
  { id: 'fettkallor', label: 'Fettkällor', icon: Droplets, color: 'blue', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'gronsaker', label: 'Grönsaker', icon: Carrot, color: 'green', gradient: 'from-green-500 to-emerald-600' },
  { id: 'sasar', label: 'Såser', icon: UtensilsCrossed, color: 'orange', gradient: 'from-orange-500 to-amber-600' },
  { id: 'kryddor', label: 'Kryddor', icon: Leaf, color: 'emerald', gradient: 'from-emerald-500 to-green-600' },
  { id: 'matlagningsfett', label: 'Matlagningsfett', icon: Flame, color: 'yellow', gradient: 'from-yellow-500 to-orange-600' },
  { id: 'ovrigt', label: 'Övrigt', icon: MoreHorizontal, color: 'gray', gradient: 'from-gray-500 to-slate-600' },
]

// SLV categories that map to specific macro categories
const SLV_CATEGORY_MAPPINGS: Record<string, string> = {
  // Såser
  'Sås dressing majonnäs ': 'sasar',
  'Majonnässallad röror': 'sasar',
  'Senap ketchup HP-sås soja "smaksättare"': 'sasar',
  // Kryddor
  'Kryddor ': 'kryddor',
  'Salt': 'kryddor',
  'Buljong': 'kryddor',
  // Matlagningsfett
  'Olja': 'matlagningsfett',
  'Smör': 'matlagningsfett',
  'Flytande matfettsblandning': 'matlagningsfett',
  'Hård matfettsblandning': 'matlagningsfett',
  'Övrigt fett (ister, talg, kokosfett)': 'matlagningsfett',
  // Grönsaker (explicit)
  'Grönsaker': 'gronsaker',
  'Rotfrukter': 'gronsaker',
  'Svamp': 'gronsaker',
  'Algprodukter': 'gronsaker',
}

// Categorize food by macro content
function categorizeByMacro(food: SLVFoodWithCategory): string {
  const slvCat = food.slvCategory || ''

  // First check explicit SLV category mappings
  for (const [slvName, macroId] of Object.entries(SLV_CATEGORY_MAPPINGS)) {
    if (slvCat === slvName || slvCat.includes(slvName.replace(' ', ''))) {
      return macroId
    }
  }

  // Then use nutritional values
  const { protein, carbs, fat, kcal, fiber } = food

  // Proteinkällor: protein > 15g per 100g
  if (protein > 15) return 'proteinkallor'

  // Kolhydratskällor: carbs > 20g && protein < 15g
  if (carbs > 20 && protein < 15) return 'kolhydratkallor'

  // Fettkällor: fat > 15g && carbs < 10g && protein < 15g
  if (fat > 15 && carbs < 10 && protein < 15) return 'fettkallor'

  // Grönsaker: kcal < 50 && fiber > 1
  if (kcal < 50 && (fiber ?? 0) > 1) return 'gronsaker'

  // Övrigt: allt annat
  return 'ovrigt'
}

type NutritionFilter = 'all' | 'high-protein' | 'low-kcal' | 'low-carb' | 'high-fiber'
type ViewMode = 'grid' | 'list'

const NUTRITION_FILTERS: Record<NutritionFilter, { label: string; icon: any; fn: (food: SLVFood) => boolean }> = {
  'all': { label: 'Alla', icon: Database, fn: () => true },
  'high-protein': { label: 'Hög protein', icon: Dumbbell, fn: (food) => food.protein >= 20 },
  'low-kcal': { label: 'Låg kcal', icon: Flame, fn: (food) => food.kcal <= 100 },
  'low-carb': { label: 'Låg kolhydrat', icon: Zap, fn: (food) => food.carbs <= 5 },
  'high-fiber': { label: 'Hög fiber', icon: Leaf, fn: (food) => (food.fiber ?? 0) >= 5 },
}

export default function SLVLivsmedelPage() {
  const { data: session } = useSession()
  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

  const [data, setData] = useState<SLVData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedFood, setSelectedFood] = useState<SLVFood | null>(null)
  const [nutritionFilter, setNutritionFilter] = useState<NutritionFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/data/slv-foods.json')
      if (response.ok) {
        const jsonData = await response.json()
        setData(jsonData)
      } else {
        toast.error('Kunde inte ladda SLV-data')
      }
    } catch (error) {
      console.error('Error fetching SLV data:', error)
      toast.error('Kunde inte ladda SLV-data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRebuild = async () => {
    if (!isCoach) return

    try {
      setIsRebuilding(true)
      toast.info('Uppdaterar data från Livsmedelsverket... Detta kan ta några minuter.')

      const response = await fetch('/api/slv-rebuild', { method: 'POST' })
      const result = await response.json()

      if (response.ok) {
        toast.success(`Uppdaterat! ${result.totalCount || 0} livsmedel i ${result.categoryCount || 0} kategorier.`)
        await fetchData()
      } else {
        toast.error(result.error || 'Kunde inte uppdatera data')
      }
    } catch (error) {
      console.error('Error rebuilding:', error)
      toast.error('Ett fel uppstod vid uppdatering')
    } finally {
      setIsRebuilding(false)
    }
  }

  // Flatten all foods with their SLV category attached
  const allFoodsWithCategory = useMemo(() => {
    if (!data) return []

    const foods: SLVFoodWithCategory[] = []
    for (const [slvCategory, categoryFoods] of Object.entries(data.categories)) {
      for (const food of categoryFoods) {
        foods.push({ ...food, slvCategory })
      }
    }
    return foods
  }, [data])

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of MACRO_CATEGORIES) {
      counts[cat.id] = 0
    }
    for (const food of allFoodsWithCategory) {
      const macroCategory = categorizeByMacro(food)
      counts[macroCategory] = (counts[macroCategory] || 0) + 1
    }
    return counts
  }, [allFoodsWithCategory])

  // Get filtered foods
  const filteredFoods = useMemo(() => {
    const query = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0)
    const nutritionFilterFn = NUTRITION_FILTERS[nutritionFilter].fn

    let foods = allFoodsWithCategory

    // Apply macro category filter
    if (selectedCategory) {
      foods = foods.filter(food => categorizeByMacro(food) === selectedCategory)
    }

    // Apply search filter
    if (query.length > 0) {
      foods = foods.filter(food => {
        const name = food.namn.toLowerCase()
        return query.every(word => name.includes(word))
      })
    }

    // Apply nutrition filter
    foods = foods.filter(nutritionFilterFn)

    // Sort alphabetically
    foods = foods.sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))

    return foods
  }, [allFoodsWithCategory, searchQuery, selectedCategory, nutritionFilter])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500">Laddar livsmedel...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Ingen data hittades</p>
          {isCoach && (
            <Button onClick={handleRebuild} disabled={isRebuilding}>
              {isRebuilding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Hämtar data...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Hämta från Livsmedelsverket
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  const lastUpdated = new Date(data.lastUpdated).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Split categories into main (first 4) and secondary (rest)
  const mainCategories = MACRO_CATEGORIES.slice(0, 4)
  const secondaryCategories = MACRO_CATEGORIES.slice(4)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="px-4 py-3 sm:py-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">SLV-databas</h1>
              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                <span>{allFoodsWithCategory.length} livsmedel</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {lastUpdated}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isCoach && (
                <Button
                  onClick={handleRebuild}
                  disabled={isRebuilding}
                  variant="outline"
                  size="sm"
                >
                  {isRebuilding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Uppdatera data</span>
                    </>
                  )}
                </Button>
              )}
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-emerald-600 text-white' : ''}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-emerald-600 text-white' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main categories - 4 items */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2">
            {mainCategories.map((cat) => {
              const Icon = cat.icon
              const count = categoryCounts[cat.id] || 0
              const isActive = selectedCategory === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(isActive ? null : cat.id)
                  }}
                  className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-br ${cat.gradient} text-white shadow-lg scale-[1.02]`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-0.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="text-[9px] sm:text-xs font-semibold text-center leading-tight line-clamp-1">
                    {cat.label.split('källor')[0]}
                  </span>
                  {count > 0 && (
                    <span className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 text-[8px] sm:text-[10px] px-1 py-0.5 rounded-full ${
                      isActive ? 'bg-white/30 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Secondary categories - 4 items */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3">
            {secondaryCategories.map((cat) => {
              const Icon = cat.icon
              const count = categoryCounts[cat.id] || 0
              const isActive = selectedCategory === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(isActive ? null : cat.id)
                  }}
                  className={`relative flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-br ${cat.gradient} text-white shadow-lg scale-[1.02]`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="text-[9px] sm:text-xs font-semibold line-clamp-1">{cat.label}</span>
                  {count > 0 && (
                    <span className={`text-[8px] sm:text-[10px] px-1 py-0.5 rounded-full ${
                      isActive ? 'bg-white/30 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Nutrition filters */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
            {Object.entries(NUTRITION_FILTERS).map(([key, { label, icon: Icon }]) => {
              const isActive = nutritionFilter === key

              return (
                <button
                  key={key}
                  onClick={() => setNutritionFilter(key as NutritionFilter)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all text-sm ${
                    isActive
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Sök livsmedel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-3 px-1">
        <p className="text-sm text-gray-500">
          {filteredFoods.length} livsmedel
          {selectedCategory && ` i ${MACRO_CATEGORIES.find(c => c.id === selectedCategory)?.label}`}
          {searchQuery && ` som matchar "${searchQuery}"`}
        </p>
      </div>

      {/* Content */}
      <div>
        {filteredFoods.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Database className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm sm:text-base">Inga livsmedel hittades</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Prova att ändra dina filter eller sökord
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {filteredFoods.slice(0, 100).map(food => (
              <FoodCard
                key={food.nummer}
                food={food}
                onClick={() => setSelectedFood(food)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFoods.slice(0, 100).map(food => (
              <FoodRow
                key={food.nummer}
                food={food}
                onClick={() => setSelectedFood(food)}
              />
            ))}
          </div>
        )}

        {filteredFoods.length > 100 && (
          <p className="text-center text-sm text-gray-500 mt-4 py-4">
            Visar 100 av {filteredFoods.length} livsmedel. Använd sökning för att hitta specifika livsmedel.
          </p>
        )}
      </div>

      {/* Detail Modal */}
      <SLVFoodDetailModal
        isOpen={!!selectedFood}
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
      />
    </div>
  )
}

function FoodCard({ food, onClick }: { food: SLVFood; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all text-left w-full"
    >
      {/* Placeholder image area */}
      <div className="aspect-square bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
        <Database className="w-10 h-10 text-emerald-300" />
      </div>

      {/* Info */}
      <div className="px-2.5 py-2.5">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">{food.namn}</h3>
        <p className="text-[10px] text-gray-500 font-medium">Per 100g:</p>
        <div className="text-[11px] text-gray-700 mt-0.5 space-y-px">
          <p>• Energi: <span className="font-semibold text-emerald-600">{Math.round(food.kcal)} kcal</span></p>
          <p>• Protein: <span className="font-semibold">{Math.round(food.protein)} g</span></p>
          <p>• Kolhydrater: <span className="font-semibold">{Math.round(food.carbs)} g</span></p>
          <p>• Fett: <span className="font-semibold">{Math.round(food.fat)} g</span></p>
        </div>
      </div>
    </button>
  )
}

function FoodRow({ food, onClick }: { food: SLVFood; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:shadow-md transition-all w-full text-left"
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg flex-shrink-0 flex items-center justify-center">
        <Database className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{food.namn}</h3>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{food.typ}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">Per 100g:</p>
        <div className="font-semibold text-emerald-600 text-xs sm:text-base">{Math.round(food.kcal)} kcal</div>
        <div className="text-[9px] sm:text-[10px] text-gray-600 mt-0.5">
          P: {Math.round(food.protein)}g • K: {Math.round(food.carbs)}g • F: {Math.round(food.fat)}g
        </div>
      </div>
    </button>
  )
}
