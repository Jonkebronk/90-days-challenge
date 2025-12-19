'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  Search,
  Database,
  RefreshCw,
  Loader2,
  Calendar,
  Package,
  Beef,
  Fish,
  Milk,
  Carrot,
  Apple,
  Wheat,
  Cookie,
  Wine,
  Soup,
  Leaf,
  Baby,
  MoreHorizontal,
  LayoutGrid,
  List,
  Flame,
  Dumbbell,
  Zap,
  ChevronDown
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

// Meta-categories to group 118 categories into ~12 manageable groups
const META_CATEGORIES: Record<string, { icon: any; color: string; gradient: string; subCategories: string[] }> = {
  'Kött & Fågel': {
    icon: Beef,
    color: 'rose',
    gradient: 'from-rose-500 to-red-600',
    subCategories: [
      'Blodmat', 'Blodprodukter blodrätter', 'Fågel ', 'Fågelprodukter fågelrätter',
      'Inälvor och organ', 'Inälvor organ produkter o rätter', 'Korv', 'Korvrätter',
      'Kött färskt fryst tillagat ', 'Kött processat', 'Köttprodukter kötträtter', 'Sylta',
      'Övrigt animaliskt "kött", grodlår, sniglar, säl - färskt, fryst, tillagat'
    ]
  },
  'Fisk & Skaldjur': {
    icon: Fish,
    color: 'sky',
    gradient: 'from-sky-500 to-blue-600',
    subCategories: [
      'Fisk färsk fryst kokt', 'Fisk o skaldjursprodukter o rätter', 'Fisk rökt',
      'Fisk stekt ej panerad', 'Rom, kaviar', 'Skaldjur bläckfisk färsk fryst kokt'
    ]
  },
  'Mejeri & Ägg': {
    icon: Milk,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    subCategories: [
      'Dessertost', 'Färskost o kvarg', 'Grädde creme fraiche', 'Hård ost mm', 'Mesvaror',
      'Mjölk', 'Mjölkdryck chokladdryck milkshake smothie m yoghurt', 'Naturell fil yoghurt',
      'Ost med vegetabiliskt fett', 'Osträtter', 'Smaksatt fil yoghurt', 'Smältost', 'Smör',
      'Ägg ', 'Äggprodukter o rätter'
    ]
  },
  'Grönsaker & Baljväxter': {
    icon: Carrot,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    subCategories: [
      'Algprodukter', 'Baljväxter (bönor, linser och ärter)', 'Grönsaker',
      'Grönsaks- rotfrukts- baljväxträtter o produkter', 'Grönsaksblandningar med rotfrukter och eller baljväxter',
      'Grönsaksjuice rotfruktsjuice', 'Potatis', 'Potatisprodukter potatisrätter', 'Rotfrukter', 'Svamp'
    ]
  },
  'Frukt & Bär': {
    icon: Apple,
    color: 'red',
    gradient: 'from-red-500 to-orange-600',
    subCategories: [
      'Bär färska frysta', 'Frukt färsk fryst', 'Frukt o bär konserverade',
      'Frukt o bär torkade', 'Frukt o nötblandningar bars', 'Nötter frön'
    ]
  },
  'Bröd & Spannmål': {
    icon: Wheat,
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-600',
    subCategories: [
      'Flingor - frukostflingor', 'Grynrätter', 'Gröt', 'Hårt bröd ', 'Matgryn',
      'Mjukt bröd ', 'Mjöl stärkelse kli', 'Pasta', 'Pastarätter', 'Ris risnudlar',
      'Riskakor', 'Risrätter', 'Smörgåskex'
    ]
  },
  'Snacks & Godis': {
    icon: Cookie,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    subCategories: [
      'Bullar kakor tårtor mm', 'Chips popcorn o dyl', 'Choklad ', 'Efterrätter', 'Glass',
      'Godis choklad tuggummi', 'Godis ej choklad', 'Godis som innehåller choklad',
      'Sockerfritt godis', 'Sylt marmelad gelé äppelmos o dyl', 'Söta soppor kräm o efterrättssås'
    ]
  },
  'Drycker': {
    icon: Wine,
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    subCategories: [
      'Cider alkoläsk drink', 'Dryck', 'Fruktjuice mm', 'Kaffe', 'Lightdrycker u energi', 'Likör',
      'Saft läsk cider u alkohol ', 'Sportdrycker energidrycker', 'Starksprit', 'Te',
      'Vatten mineralvatten', 'Vin', 'Öl', 'Övriga sötade drycker vattenchoklad'
    ]
  },
  'Matlagning & Kryddor': {
    icon: Soup,
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600',
    subCategories: [
      'Buljong', 'Flytande matfettsblandning', 'Gelatin agar agar', 'Hård matfettsblandning',
      'Jäst bakpulver', 'Kryddor ', 'Majonnässallad röror', 'Olja', 'Salt',
      'Senap ketchup HP-sås soja "smaksättare"', 'Socker sirap honung', 'Sås dressing majonnäs ',
      'Sötningsmedel', 'Ättika vinäger', 'Övrigt fett (ister, talg, kokosfett)'
    ]
  },
  'Färdigrätter': {
    icon: Package,
    color: 'slate',
    gradient: 'from-slate-500 to-gray-600',
    subCategories: [
      'Hamburgare med  bröd (kött, fisk, fågel, vegetarisk)', 'Pannkakor, våfflor, crêpes',
      'Pizza paj pirog färdig smörgås', 'Sallad blandad mat', 'Soppa mat', 'Tacoskal',
      'Övriga ospecificerade blandade rätter'
    ]
  },
  'Vegetariskt': {
    icon: Leaf,
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600',
    subCategories: [
      'Vegetabiliska produkter och mjölkersättning', 'Vegetabiliskt protein produkter och rätter'
    ]
  },
  'Övrigt': {
    icon: MoreHorizontal,
    color: 'gray',
    gradient: 'from-gray-500 to-slate-600',
    subCategories: [
      'Barnmatsprodukter exkl. välling o gröt', 'Kost- o näringspreparat', 'Välling',
      'Kakaoprodukter', 'Tuggummi', 'Övrigt'
    ]
  }
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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
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
        toast.success(`Uppdaterat! ${result.totalCount} livsmedel i ${result.categoryCount} kategorier.`)
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

  // Get all foods for current filters
  const filteredFoods = useMemo(() => {
    if (!data) return []

    const query = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0)
    const filterFn = NUTRITION_FILTERS[nutritionFilter].fn

    let foods: SLVFood[] = []

    // Get foods from selected category or all categories
    if (selectedCategory) {
      const metaConfig = META_CATEGORIES[selectedCategory]
      if (metaConfig) {
        if (selectedSubcategory) {
          // Only from selected subcategory
          foods = data.categories[selectedSubcategory] || []
        } else {
          // From all subcategories of the meta category
          for (const subCat of metaConfig.subCategories) {
            foods = [...foods, ...(data.categories[subCat] || [])]
          }
        }
      }
    } else {
      // All foods from all categories
      for (const categoryFoods of Object.values(data.categories)) {
        foods = [...foods, ...categoryFoods]
      }
    }

    // Apply search filter
    if (query.length > 0) {
      foods = foods.filter(food => {
        const name = food.namn.toLowerCase()
        return query.every(word => name.includes(word))
      })
    }

    // Apply nutrition filter
    foods = foods.filter(filterFn)

    // Sort alphabetically
    foods = foods.sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))

    return foods
  }, [data, searchQuery, selectedCategory, selectedSubcategory, nutritionFilter])

  // Get category counts
  const categoryCounts = useMemo(() => {
    if (!data) return {}

    const counts: Record<string, number> = {}
    for (const [metaName, metaConfig] of Object.entries(META_CATEGORIES)) {
      let count = 0
      for (const subCat of metaConfig.subCategories) {
        count += (data.categories[subCat] || []).length
      }
      counts[metaName] = count
    }
    return counts
  }, [data])

  // Get subcategory counts for selected category
  const subCategoryCounts = useMemo(() => {
    if (!data || !selectedCategory) return {}

    const metaConfig = META_CATEGORIES[selectedCategory]
    if (!metaConfig) return {}

    const counts: Record<string, number> = {}
    for (const subCat of metaConfig.subCategories) {
      counts[subCat] = (data.categories[subCat] || []).length
    }
    return counts
  }, [data, selectedCategory])

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

  const mainCategories = Object.entries(META_CATEGORIES).slice(0, 6)
  const secondaryCategories = Object.entries(META_CATEGORIES).slice(6)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="px-4 py-3 sm:py-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Livsmedelsdatabas</h1>
              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                <span>{data.totalCount} livsmedel</span>
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

          {/* Main categories - 6 items */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 mb-2">
            {mainCategories.map(([name, config]) => {
              const Icon = config.icon
              const count = categoryCounts[name] || 0
              const isActive = selectedCategory === name

              return (
                <button
                  key={name}
                  onClick={() => {
                    if (isActive) {
                      setSelectedCategory(null)
                    } else {
                      setSelectedCategory(name)
                    }
                    setSelectedSubcategory(null)
                  }}
                  className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg scale-[1.02]`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-0.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="text-[9px] sm:text-xs font-semibold text-center leading-tight line-clamp-1">{name.split(' ')[0]}</span>
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

          {/* Secondary categories - 6 items */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 mb-3">
            {secondaryCategories.map(([name, config]) => {
              const Icon = config.icon
              const count = categoryCounts[name] || 0
              const isActive = selectedCategory === name

              return (
                <button
                  key={name}
                  onClick={() => {
                    if (isActive) {
                      setSelectedCategory(null)
                    } else {
                      setSelectedCategory(name)
                    }
                    setSelectedSubcategory(null)
                  }}
                  className={`relative flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg scale-[1.02]`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="text-[9px] sm:text-xs font-semibold line-clamp-1">{name.split(' ')[0]}</span>
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

        {/* Subcategories when category is selected */}
        {selectedCategory && META_CATEGORIES[selectedCategory] && (
          <div className="px-4 pb-3 border-t border-gray-200 pt-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`px-2.5 py-1 rounded-full text-sm transition-colors ${
                  !selectedSubcategory
                    ? 'bg-gray-800 text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Alla
              </button>
              {META_CATEGORIES[selectedCategory].subCategories.map(subCat => {
                const count = subCategoryCounts[subCat] || 0
                if (count === 0) return null
                const isActive = selectedSubcategory === subCat

                return (
                  <button
                    key={subCat}
                    onClick={() => setSelectedSubcategory(isActive ? null : subCat)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-800 text-white font-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="truncate max-w-[150px]">{subCat}</span>
                    <span className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-3 px-1">
        <p className="text-sm text-gray-500">
          {filteredFoods.length} livsmedel
          {selectedCategory && ` i ${selectedCategory}`}
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
