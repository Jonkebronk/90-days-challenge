'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  Search,
  Database,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
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
  ArrowUpDown,
  LayoutGrid,
  List,
  Flame,
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

// Meta-categories to group 118 categories into ~12 manageable groups
const META_CATEGORIES: Record<string, { icon: any; color: string; subCategories: string[] }> = {
  'Kött & Fågel': {
    icon: Beef,
    color: 'rose',
    subCategories: [
      'Blodmat',
      'Blodprodukter blodrätter',
      'Fågel ',
      'Fågelprodukter fågelrätter',
      'Inälvor och organ',
      'Inälvor organ produkter o rätter',
      'Korv',
      'Korvrätter',
      'Kött färskt fryst tillagat ',
      'Kött processat',
      'Köttprodukter kötträtter',
      'Sylta',
      'Övrigt animaliskt "kött", grodlår, sniglar, säl - färskt, fryst, tillagat'
    ]
  },
  'Fisk & Skaldjur': {
    icon: Fish,
    color: 'sky',
    subCategories: [
      'Fisk färsk fryst kokt',
      'Fisk o skaldjursprodukter o rätter',
      'Fisk rökt',
      'Fisk stekt ej panerad',
      'Rom, kaviar',
      'Skaldjur bläckfisk färsk fryst kokt'
    ]
  },
  'Mejeri & Ägg': {
    icon: Milk,
    color: 'blue',
    subCategories: [
      'Dessertost',
      'Färskost o kvarg',
      'Grädde creme fraiche',
      'Hård ost mm',
      'Mesvaror',
      'Mjölk',
      'Mjölkdryck chokladdryck milkshake smothie m yoghurt',
      'Naturell fil yoghurt',
      'Ost med vegetabiliskt fett',
      'Osträtter',
      'Smaksatt fil yoghurt',
      'Smältost',
      'Smör',
      'Ägg ',
      'Äggprodukter o rätter'
    ]
  },
  'Grönsaker & Baljväxter': {
    icon: Carrot,
    color: 'green',
    subCategories: [
      'Algprodukter',
      'Baljväxter (bönor, linser och ärter)',
      'Grönsaker',
      'Grönsaks- rotfrukts- baljväxträtter o produkter',
      'Grönsaksblandningar med rotfrukter och eller baljväxter',
      'Grönsaksjuice rotfruktsjuice',
      'Potatis',
      'Potatisprodukter potatisrätter',
      'Rotfrukter',
      'Svamp'
    ]
  },
  'Frukt & Bär': {
    icon: Apple,
    color: 'red',
    subCategories: [
      'Bär färska frysta',
      'Frukt färsk fryst',
      'Frukt o bär konserverade',
      'Frukt o bär torkade',
      'Frukt o nötblandningar bars',
      'Nötter frön'
    ]
  },
  'Bröd & Spannmål': {
    icon: Wheat,
    color: 'amber',
    subCategories: [
      'Flingor - frukostflingor',
      'Grynrätter',
      'Gröt',
      'Hårt bröd ',
      'Matgryn',
      'Mjukt bröd ',
      'Mjöl stärkelse kli',
      'Pasta',
      'Pastarätter',
      'Ris risnudlar',
      'Riskakor',
      'Risrätter',
      'Smörgåskex'
    ]
  },
  'Snacks & Godis': {
    icon: Cookie,
    color: 'pink',
    subCategories: [
      'Bullar kakor tårtor mm',
      'Chips popcorn o dyl',
      'Choklad ',
      'Efterrätter',
      'Glass',
      'Godis choklad tuggummi',
      'Godis ej choklad',
      'Godis som innehåller choklad',
      'Sockerfritt godis',
      'Sylt marmelad gelé äppelmos o dyl',
      'Söta soppor kräm o efterrättssås'
    ]
  },
  'Drycker': {
    icon: Wine,
    color: 'purple',
    subCategories: [
      'Cider alkoläsk drink',
      'Dryck',
      'Fruktjuice mm',
      'Kaffe',
      'Lightdrycker u energi',
      'Likör',
      'Saft läsk cider u alkohol ',
      'Sportdrycker energidrycker',
      'Starksprit',
      'Te',
      'Vatten mineralvatten',
      'Vin',
      'Öl',
      'Övriga sötade drycker vattenchoklad'
    ]
  },
  'Matlagning & Kryddor': {
    icon: Soup,
    color: 'orange',
    subCategories: [
      'Buljong',
      'Flytande matfettsblandning',
      'Gelatin agar agar',
      'Hård matfettsblandning',
      'Jäst bakpulver',
      'Kryddor ',
      'Majonnässallad röror',
      'Olja',
      'Salt',
      'Senap ketchup HP-sås soja "smaksättare"',
      'Socker sirap honung',
      'Sås dressing majonnäs ',
      'Sötningsmedel',
      'Ättika vinäger',
      'Övrigt fett (ister, talg, kokosfett)'
    ]
  },
  'Färdigrätter': {
    icon: Package,
    color: 'slate',
    subCategories: [
      'Hamburgare med  bröd (kött, fisk, fågel, vegetarisk)',
      'Pannkakor, våfflor, crêpes',
      'Pizza paj pirog färdig smörgås',
      'Sallad blandad mat',
      'Soppa mat',
      'Tacoskal',
      'Övriga ospecificerade blandade rätter'
    ]
  },
  'Vegetariskt': {
    icon: Leaf,
    color: 'emerald',
    subCategories: [
      'Vegetabiliska produkter och mjölkersättning',
      'Vegetabiliskt protein produkter och rätter'
    ]
  },
  'Barn & Kosttillskott': {
    icon: Baby,
    color: 'cyan',
    subCategories: [
      'Barnmatsprodukter exkl. välling o gröt',
      'Kost- o näringspreparat',
      'Välling'
    ]
  },
  'Övrigt': {
    icon: MoreHorizontal,
    color: 'gray',
    subCategories: [
      'Kakaoprodukter',
      'Tuggummi',
      'Övrigt'
    ]
  }
}

// Color classes for each meta-category
const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-400', iconBg: 'bg-rose-500/10' },
  sky: { bg: 'bg-sky-500/5', border: 'border-sky-500/20', text: 'text-sky-400', iconBg: 'bg-sky-500/10' },
  blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', iconBg: 'bg-blue-500/10' },
  green: { bg: 'bg-green-500/5', border: 'border-green-500/20', text: 'text-green-400', iconBg: 'bg-green-500/10' },
  red: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400', iconBg: 'bg-red-500/10' },
  amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', iconBg: 'bg-amber-500/10' },
  pink: { bg: 'bg-pink-500/5', border: 'border-pink-500/20', text: 'text-pink-400', iconBg: 'bg-pink-500/10' },
  purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400', iconBg: 'bg-purple-500/10' },
  orange: { bg: 'bg-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400', iconBg: 'bg-orange-500/10' },
  slate: { bg: 'bg-slate-500/5', border: 'border-slate-500/20', text: 'text-slate-400', iconBg: 'bg-slate-500/10' },
  emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
  cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400', iconBg: 'bg-cyan-500/10' },
  gray: { bg: 'bg-gray-500/5', border: 'border-gray-500/20', text: 'text-gray-400', iconBg: 'bg-gray-500/10' },
}

type SortField = 'namn' | 'kcal' | 'protein' | 'carbs' | 'fat'
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
  const [expandedMetas, setExpandedMetas] = useState<Set<string>>(new Set())
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set())
  const [selectedFood, setSelectedFood] = useState<SLVFood | null>(null)
  const [sortField, setSortField] = useState<SortField>('namn')
  const [sortAsc, setSortAsc] = useState(true)
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

  const toggleMeta = (meta: string) => {
    setExpandedMetas(prev => {
      const next = new Set(prev)
      if (next.has(meta)) {
        next.delete(meta)
      } else {
        next.add(meta)
      }
      return next
    })
  }

  const toggleSub = (sub: string) => {
    setExpandedSubs(prev => {
      const next = new Set(prev)
      if (next.has(sub)) {
        next.delete(sub)
      } else {
        next.add(sub)
      }
      return next
    })
  }

  const expandAllMetas = () => {
    setExpandedMetas(new Set(Object.keys(META_CATEGORIES)))
  }

  const collapseAll = () => {
    setExpandedMetas(new Set())
    setExpandedSubs(new Set())
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(field === 'namn')
    }
  }

  // Build grouped data by meta-category
  const groupedData = useMemo(() => {
    if (!data) return {}

    const result: Record<string, { subCategories: Record<string, SLVFood[]>; totalCount: number }> = {}
    const query = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0)
    const filterFn = NUTRITION_FILTERS[nutritionFilter].fn

    for (const [metaName, metaConfig] of Object.entries(META_CATEGORIES)) {
      const subCategories: Record<string, SLVFood[]> = {}
      let metaTotal = 0

      for (const subCat of metaConfig.subCategories) {
        const foods = data.categories[subCat] || []
        let filtered = foods

        // Apply search filter
        if (query.length > 0) {
          filtered = filtered.filter(food => {
            const name = food.namn.toLowerCase()
            return query.every(word => name.includes(word))
          })
        }

        // Apply nutrition filter
        filtered = filtered.filter(filterFn)

        // Apply sorting
        filtered = [...filtered].sort((a, b) => {
          let cmp = 0
          if (sortField === 'namn') {
            cmp = a.namn.localeCompare(b.namn, 'sv')
          } else {
            cmp = (a[sortField] ?? 0) - (b[sortField] ?? 0)
          }
          return sortAsc ? cmp : -cmp
        })

        if (filtered.length > 0) {
          subCategories[subCat] = filtered
          metaTotal += filtered.length
        }
      }

      if (metaTotal > 0) {
        result[metaName] = { subCategories, totalCount: metaTotal }
      }
    }

    return result
  }, [data, searchQuery, nutritionFilter, sortField, sortAsc])

  const totalFiltered = useMemo(() => {
    return Object.values(groupedData).reduce((sum, meta) => sum + meta.totalCount, 0)
  }, [groupedData])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">Laddar livsmedel...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Ingen data hittades</p>
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
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-3 sm:mb-4 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl md:text-3xl font-black tracking-[1px] sm:tracking-[2px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-2">
          Livsmedelsverkets databas
        </h1>
        <div className="flex items-center justify-center gap-2 sm:gap-4 text-gray-400 text-xs sm:text-sm">
          <span>{data.totalCount} livsmedel</span>
          <span>•</span>
          <span>{Object.keys(META_CATEGORIES).length} kategorier</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {lastUpdated}
          </span>
        </div>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-3 sm:mt-4 opacity-30" />

        {isCoach && (
          <Button
            onClick={handleRebuild}
            disabled={isRebuilding}
            variant="outline"
            className="mt-4 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
          >
            {isRebuilding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uppdaterar...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Uppdatera data
              </>
            )}
          </Button>
        )}
      </div>

      <div className="max-w-6xl mx-auto">

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Sök livsmedel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(NUTRITION_FILTERS).map(([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => setNutritionFilter(key as NutritionFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                nutritionFilter === key
                  ? 'bg-amber-500 text-gray-900 font-medium'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          {/* Expand/Collapse */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAllMetas}
              className="text-gray-400 hover:text-white"
            >
              Expandera alla
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="text-gray-400 hover:text-white"
            >
              Minimera alla
            </Button>
          </div>

          {/* Sort & View */}
          <div className="flex items-center gap-4">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Sortera:</span>
              <div className="flex gap-1">
                {(['namn', 'kcal', 'protein', 'carbs', 'fat'] as SortField[]).map((field) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${
                      sortField === field
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {field === 'namn' ? 'Namn' : field === 'kcal' ? 'Kcal' : field === 'protein' ? 'Protein' : field === 'carbs' ? 'Kolh.' : 'Fett'}
                    {sortField === field && (
                      <ArrowUpDown className={`w-3 h-3 ${sortAsc ? '' : 'rotate-180'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        {(searchQuery || nutritionFilter !== 'all') && (
          <p className="text-gray-500 text-sm mb-4">
            {totalFiltered} träffar
          </p>
        )}
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto space-y-3">
        {Object.entries(groupedData).map(([metaName, { subCategories, totalCount }]) => {
          const metaConfig = META_CATEGORIES[metaName]
          const Icon = metaConfig.icon
          const colors = COLOR_CLASSES[metaConfig.color]
          const isMetaExpanded = expandedMetas.has(metaName)

          return (
            <div
              key={metaName}
              className={`rounded-xl overflow-hidden border ${colors.border} ${colors.bg}`}
            >
              {/* Meta Category Header */}
              <button
                onClick={() => toggleMeta(metaName)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.iconBg}`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-white">{metaName}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      ({Object.keys(subCategories).length} underkategorier)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${colors.text}`}>
                    {totalCount} st
                  </span>
                  {isMetaExpanded ? (
                    <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Sub-categories */}
              {isMetaExpanded && (
                <div className="border-t border-gray-800/50">
                  {Object.entries(subCategories).map(([subName, foods]) => {
                    const isSubExpanded = expandedSubs.has(subName)

                    return (
                      <div key={subName} className="border-b border-gray-800/30 last:border-0">
                        {/* Sub-category header */}
                        <button
                          onClick={() => toggleSub(subName)}
                          className="w-full flex items-center justify-between px-4 py-3 pl-14 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isSubExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-gray-300 text-sm">{subName}</span>
                          </div>
                          <span className="text-gray-500 text-xs">
                            {foods.length} st
                          </span>
                        </button>

                        {/* Foods */}
                        {isSubExpanded && (
                          <div className="px-4 pb-4 pl-14">
                            {viewMode === 'grid' ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {foods.map((food) => (
                                  <button
                                    key={food.nummer}
                                    onClick={() => setSelectedFood(food)}
                                    className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-amber-500/30 rounded-lg p-3 text-left transition-all group"
                                  >
                                    <span className="text-sm font-medium text-gray-200 group-hover:text-white line-clamp-2 block mb-2">
                                      {food.namn}
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">
                                        {food.kcal} kcal
                                      </span>
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                                        {food.protein}g P
                                      </span>
                                    </div>
                                    {food.protein >= 20 && (
                                      <span className="inline-flex items-center gap-1 text-xs text-green-400 mt-2">
                                        <Dumbbell className="w-3 h-3" /> Proteinrik
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {foods.map((food) => (
                                  <button
                                    key={food.nummer}
                                    onClick={() => setSelectedFood(food)}
                                    className="w-full flex items-center justify-between bg-gray-800/30 hover:bg-gray-700/30 border border-gray-700/30 hover:border-amber-500/30 rounded-lg px-3 py-2 text-left transition-all group"
                                  >
                                    <span className="text-sm text-gray-200 group-hover:text-white truncate flex-1 mr-4">
                                      {food.namn}
                                    </span>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                                      <span className="w-16 text-right">{food.kcal} kcal</span>
                                      <span className="w-12 text-right text-blue-400">{food.protein}g P</span>
                                      <span className="w-12 text-right text-green-400">{food.carbs}g K</span>
                                      <span className="w-12 text-right text-red-400">{food.fat}g F</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {Object.keys(groupedData).length === 0 && (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Inga livsmedel hittades</p>
          </div>
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
