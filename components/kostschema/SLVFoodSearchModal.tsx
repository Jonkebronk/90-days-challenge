'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Loader2, X, Database, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface SLVFood {
  slvNummer: number
  name: string
  type: string
  protein: number
  carbs: number
  fat: number
  kcal: number
}

interface OriginalIngredient {
  name: string
  amount: number
  macroPer100g: number
  macroType: 'protein' | 'carbs' | 'fat'
  macros: {
    protein: number
    carbs: number
    fat: number
    kcal: number
  }
}

interface SLVFoodSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (food: SLVFood) => void
  category?: 'protein' | 'kolhydrat' | 'fett' | 'tillagg'
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'evening'
  originalIngredient?: OriginalIngredient
}

// Subcategories for each meal type and macro category
const SUBCATEGORIES: Record<string, Record<string, { label: string; searchTerm: string }[]>> = {
  breakfast: {
    kolhydrat: [
      { label: 'Havregryn', searchTerm: 'havregryn' },
      { label: 'Gröt', searchTerm: 'gröt' },
      { label: 'Müsli', searchTerm: 'müsli' },
      { label: 'Flingor', searchTerm: 'flingor' },
      { label: 'Bröd', searchTerm: 'bröd' },
      { label: 'Knäckebröd', searchTerm: 'knäckebröd' },
      { label: 'Yoghurt', searchTerm: 'yoghurt' },
      { label: 'Banan', searchTerm: 'banan' },
      { label: 'Äpple', searchTerm: 'äpple' },
      { label: 'Bär', searchTerm: 'bär' },
    ],
    protein: [
      { label: 'Ägg', searchTerm: 'ägg' },
      { label: 'Kvarg', searchTerm: 'kvarg' },
      { label: 'Keso', searchTerm: 'keso' },
      { label: 'Skinka', searchTerm: 'skinka' },
      { label: 'Kalkon', searchTerm: 'kalkon' },
    ],
    fett: [
      { label: 'Ägg', searchTerm: 'ägg' },
      { label: 'Avokado', searchTerm: 'avokado' },
      { label: 'Nötter', searchTerm: 'nötter' },
      { label: 'Ost', searchTerm: 'ost' },
      { label: 'Smör', searchTerm: 'smör' },
    ],
    tillagg: [
      { label: 'Tomat', searchTerm: 'tomat' },
      { label: 'Gurka', searchTerm: 'gurka' },
      { label: 'Paprika', searchTerm: 'paprika' },
      { label: 'Spenat', searchTerm: 'spenat' },
    ],
  },
  lunch: {
    kolhydrat: [
      { label: 'Ris', searchTerm: 'ris' },
      { label: 'Pasta', searchTerm: 'pasta' },
      { label: 'Potatis', searchTerm: 'potatis' },
      { label: 'Bulgur', searchTerm: 'bulgur' },
      { label: 'Quinoa', searchTerm: 'quinoa' },
      { label: 'Bröd', searchTerm: 'bröd' },
      { label: 'Tortilla', searchTerm: 'tortilla' },
    ],
    protein: [
      { label: 'Kyckling', searchTerm: 'kyckling' },
      { label: 'Kalkon', searchTerm: 'kalkon' },
      { label: 'Nötfärs', searchTerm: 'nötfärs' },
      { label: 'Fisk', searchTerm: 'fisk' },
      { label: 'Lax', searchTerm: 'lax' },
      { label: 'Tonfisk', searchTerm: 'tonfisk' },
      { label: 'Ägg', searchTerm: 'ägg' },
    ],
    fett: [
      { label: 'Avokado', searchTerm: 'avokado' },
      { label: 'Olivolja', searchTerm: 'olivolja' },
      { label: 'Nötter', searchTerm: 'nötter' },
      { label: 'Ost', searchTerm: 'ost' },
    ],
    tillagg: [
      { label: 'Sallad', searchTerm: 'sallad' },
      { label: 'Tomat', searchTerm: 'tomat' },
      { label: 'Gurka', searchTerm: 'gurka' },
      { label: 'Paprika', searchTerm: 'paprika' },
      { label: 'Broccoli', searchTerm: 'broccoli' },
      { label: 'Morot', searchTerm: 'morot' },
      { label: 'Lök', searchTerm: 'lök' },
    ],
  },
  dinner: {
    kolhydrat: [
      { label: 'Ris', searchTerm: 'ris' },
      { label: 'Pasta', searchTerm: 'pasta' },
      { label: 'Potatis', searchTerm: 'potatis' },
      { label: 'Sötpotatis', searchTerm: 'sötpotatis' },
      { label: 'Bulgur', searchTerm: 'bulgur' },
      { label: 'Couscous', searchTerm: 'couscous' },
    ],
    protein: [
      { label: 'Kyckling', searchTerm: 'kyckling' },
      { label: 'Nötfärs', searchTerm: 'nötfärs' },
      { label: 'Fläsk', searchTerm: 'fläsk' },
      { label: 'Lax', searchTerm: 'lax' },
      { label: 'Torsk', searchTerm: 'torsk' },
      { label: 'Räkor', searchTerm: 'räk' },
    ],
    fett: [
      { label: 'Olivolja', searchTerm: 'olivolja' },
      { label: 'Smör', searchTerm: 'smör' },
      { label: 'Grädde', searchTerm: 'grädde' },
      { label: 'Ost', searchTerm: 'ost' },
    ],
    tillagg: [
      { label: 'Sallad', searchTerm: 'sallad' },
      { label: 'Tomat', searchTerm: 'tomat' },
      { label: 'Gurka', searchTerm: 'gurka' },
      { label: 'Broccoli', searchTerm: 'broccoli' },
      { label: 'Sparris', searchTerm: 'sparris' },
      { label: 'Zucchini', searchTerm: 'zucchini' },
      { label: 'Svamp', searchTerm: 'svamp' },
    ],
  },
  snack: {
    kolhydrat: [
      { label: 'Banan', searchTerm: 'banan' },
      { label: 'Äpple', searchTerm: 'äpple' },
      { label: 'Päron', searchTerm: 'päron' },
      { label: 'Apelsin', searchTerm: 'apelsin' },
      { label: 'Bär', searchTerm: 'bär' },
      { label: 'Knäckebröd', searchTerm: 'knäckebröd' },
      { label: 'Riskakor', searchTerm: 'riskak' },
    ],
    protein: [
      { label: 'Kvarg', searchTerm: 'kvarg' },
      { label: 'Keso', searchTerm: 'keso' },
      { label: 'Yoghurt', searchTerm: 'yoghurt' },
      { label: 'Ägg', searchTerm: 'ägg' },
      { label: 'Nötter', searchTerm: 'nötter' },
    ],
    fett: [
      { label: 'Nötter', searchTerm: 'nötter' },
      { label: 'Mandlar', searchTerm: 'mandel' },
      { label: 'Jordnötssmör', searchTerm: 'jordnötssmör' },
      { label: 'Avokado', searchTerm: 'avokado' },
    ],
    tillagg: [
      { label: 'Morot', searchTerm: 'morot' },
      { label: 'Gurka', searchTerm: 'gurka' },
      { label: 'Selleri', searchTerm: 'selleri' },
      { label: 'Paprika', searchTerm: 'paprika' },
    ],
  },
  evening: {
    kolhydrat: [
      { label: 'Kvarg', searchTerm: 'kvarg' },
      { label: 'Yoghurt', searchTerm: 'yoghurt' },
      { label: 'Bär', searchTerm: 'bär' },
    ],
    protein: [
      { label: 'Kvarg', searchTerm: 'kvarg' },
      { label: 'Keso', searchTerm: 'keso' },
      { label: 'Ägg', searchTerm: 'ägg' },
    ],
    fett: [
      { label: 'Nötter', searchTerm: 'nötter' },
      { label: 'Jordnötssmör', searchTerm: 'jordnötssmör' },
      { label: 'Ost', searchTerm: 'ost' },
    ],
    tillagg: [
      { label: 'Gurka', searchTerm: 'gurka' },
      { label: 'Tomat', searchTerm: 'tomat' },
    ],
  },
}

const DEFAULT_SUBCATEGORIES: Record<string, { label: string; searchTerm: string }[]> = {
  kolhydrat: [
    { label: 'Ris', searchTerm: 'ris' },
    { label: 'Pasta', searchTerm: 'pasta' },
    { label: 'Potatis', searchTerm: 'potatis' },
    { label: 'Bröd', searchTerm: 'bröd' },
    { label: 'Havregryn', searchTerm: 'havregryn' },
  ],
  protein: [
    { label: 'Kyckling', searchTerm: 'kyckling' },
    { label: 'Nötfärs', searchTerm: 'nötfärs' },
    { label: 'Fisk', searchTerm: 'fisk' },
    { label: 'Ägg', searchTerm: 'ägg' },
    { label: 'Kvarg', searchTerm: 'kvarg' },
  ],
  fett: [
    { label: 'Avokado', searchTerm: 'avokado' },
    { label: 'Nötter', searchTerm: 'nötter' },
    { label: 'Olivolja', searchTerm: 'olivolja' },
    { label: 'Ost', searchTerm: 'ost' },
  ],
  tillagg: [
    { label: 'Sallad', searchTerm: 'sallad' },
    { label: 'Tomat', searchTerm: 'tomat' },
    { label: 'Gurka', searchTerm: 'gurka' },
    { label: 'Broccoli', searchTerm: 'broccoli' },
    { label: 'Morot', searchTerm: 'morot' },
    { label: 'Paprika', searchTerm: 'paprika' },
  ],
}

export function SLVFoodSearchModal({
  isOpen,
  onClose,
  onSelect,
  category,
  mealType,
  originalIngredient
}: SLVFoodSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SLVFood[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const ITEMS_PER_PAGE = 20

  const calculateNewWeight = useCallback((food: SLVFood): number | null => {
    if (!originalIngredient) return null
    const { amount, macroPer100g, macroType } = originalIngredient
    const newMacroPer100g = macroType === 'protein' ? food.protein
      : macroType === 'carbs' ? food.carbs
      : food.fat
    if (newMacroPer100g <= 0) return null
    const originalMacroAmount = amount * (macroPer100g / 100)
    return Math.round((originalMacroAmount / newMacroPer100g) * 100)
  }, [originalIngredient])

  const originalMacroAmount = useMemo(() => {
    if (!originalIngredient) return null
    return Math.round(originalIngredient.amount * (originalIngredient.macroPer100g / 100))
  }, [originalIngredient])

  const macroLabel = useMemo(() => {
    if (!originalIngredient) return ''
    switch (originalIngredient.macroType) {
      case 'protein': return 'protein'
      case 'carbs': return 'kolhydrater'
      case 'fat': return 'fett'
    }
  }, [originalIngredient])

  const subcategories = useMemo(() => {
    if (mealType && category && SUBCATEGORIES[mealType]?.[category]) {
      return SUBCATEGORIES[mealType][category]
    }
    if (category && DEFAULT_SUBCATEGORIES[category]) {
      return DEFAULT_SUBCATEGORIES[category]
    }
    return []
  }, [mealType, category])

  const searchFoods = useCallback(async (query: string = '', page: number = 1) => {
    if (query.length < 2 && query.length > 0) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      let url = `/api/slv-proxy?limit=${ITEMS_PER_PAGE}&page=${page}`
      if (query) url += `&q=${encodeURIComponent(query)}`
      if (category) url += `&category=${category}`
      if (mealType) url += `&meal=${mealType}`

      const response = await fetch(url)
      if (!response.ok) throw new Error('Sökningen misslyckades')

      const data = await response.json()
      setResults(data.foods || [])
      setTotalCount(data.totalCount || 0)
      setTotalPages(data.totalPages || 1)
      setCurrentPage(data.currentPage || 1)
    } catch {
      setError('Kunde inte hämta data från Livsmedelsverket')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [category, mealType])

  useEffect(() => {
    if (isOpen && category && !searchTerm && !selectedSubcategory) {
      const subs = mealType && SUBCATEGORIES[mealType]?.[category]
        ? SUBCATEGORIES[mealType][category]
        : DEFAULT_SUBCATEGORIES[category]
      if (!subs || subs.length === 0) {
        searchFoods('')
      }
    }
  }, [isOpen, category, mealType, searchTerm, selectedSubcategory, searchFoods])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        if (selectedSubcategory) {
          const sub = subcategories.find(s => s.label === selectedSubcategory)
          if (sub) {
            searchFoods(`${sub.searchTerm} ${searchTerm}`)
          } else {
            searchFoods(searchTerm)
          }
        } else {
          searchFoods(searchTerm)
        }
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, searchFoods, selectedSubcategory, subcategories])

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setResults([])
      setError(null)
      setHasSearched(false)
      setSelectedSubcategory(null)
      setCurrentPage(1)
      setTotalPages(1)
      setTotalCount(0)
    }
  }, [isOpen])

  const handleSubcategorySelect = (searchTermValue: string, label: string) => {
    setSelectedSubcategory(label)
    setCurrentPage(1)
    searchFoods(searchTermValue, 1)
  }

  const handleBack = () => {
    setSelectedSubcategory(null)
    setResults([])
    setSearchTerm('')
    setHasSearched(false)
    setCurrentPage(1)
    setTotalPages(1)
    setTotalCount(0)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    const query = selectedSubcategory
      ? subcategories.find(s => s.label === selectedSubcategory)?.searchTerm || ''
      : searchTerm
    searchFoods(query, newPage)
  }

  const handleSelect = (food: SLVFood) => {
    onSelect(food)
    onClose()
  }

  const getCategoryLabel = () => {
    switch (category) {
      case 'protein': return 'proteinkälla'
      case 'kolhydrat': return 'kolhydratskälla'
      case 'fett': return 'fettkälla'
      case 'tillagg': return 'grönsak/sallad'
      default: return 'ingrediens'
    }
  }

  const getCategoryColor = () => {
    switch (category) {
      case 'protein': return 'from-rose-500/20 to-transparent border-rose-500/30'
      case 'kolhydrat': return 'from-blue-500/20 to-transparent border-blue-500/30'
      case 'fett': return 'from-amber-500/20 to-transparent border-amber-500/30'
      case 'tillagg': return 'from-emerald-500/20 to-transparent border-emerald-500/30'
      default: return 'from-gold-500/20 to-transparent border-gold-500/30'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-b ${getCategoryColor()} border-b border-zinc-700/50 p-5`}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-gold-500" />
              Sök i Livsmedelsverkets databas
            </DialogTitle>
            {category && (
              <p className="text-sm text-zinc-300 mt-1">
                Byt {getCategoryLabel()}
              </p>
            )}
          </DialogHeader>
        </div>

        <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Nuvarande ingrediens */}
          {originalIngredient && (
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">Nuvarande</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">{originalIngredient.name}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-rose-400">P: {originalIngredient.macros.protein}g</span>
                    <span className="text-xs text-blue-400">K: {originalIngredient.macros.carbs}g</span>
                    <span className="text-xs text-amber-400">F: {originalIngredient.macros.fat}g</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gold-500">{originalIngredient.amount}g</p>
                  <p className="text-sm text-zinc-500">{originalIngredient.macros.kcal} kcal</p>
                </div>
              </div>
            </div>
          )}

          {/* Back button */}
          {selectedSubcategory && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 hover:text-white transition-all w-fit shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Tillbaka till kategorier</span>
            </button>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={selectedSubcategory
                ? `Filtrera inom ${selectedSubcategory}...`
                : category
                  ? `Sök ${getCategoryLabel()}r eller välj kategori...`
                  : "Sök livsmedel (t.ex. kyckling, havre, ägg...)"
              }
              className="pl-10 bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 h-11 text-base focus:border-gold-500 focus:ring-gold-500/20"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto min-h-[200px]">
            {/* Category buttons */}
            {!selectedSubcategory && subcategories.length > 0 && !searchTerm && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400 font-medium">Välj kategori:</p>
                <div className="grid grid-cols-2 gap-2">
                  {subcategories.map((sub) => (
                    <button
                      key={sub.label}
                      onClick={() => handleSubcategorySelect(sub.searchTerm, sub.label)}
                      className="p-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-gold-500/50 transition-all text-left group shadow-sm hover:shadow-md"
                    >
                      <span className="text-white font-medium group-hover:text-gold-400 transition-colors">{sub.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold-500 mb-3" />
                <span className="text-zinc-400">Söker...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-8 px-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {!isLoading && !error && hasSearched && results.length === 0 && (
              <div className="text-center py-12 text-zinc-400">
                <p>Inga livsmedel hittades för &quot;{selectedSubcategory || searchTerm}&quot;</p>
              </div>
            )}

            {!isLoading && !error && results.length > 0 && (
              <>
                <div className="text-xs text-zinc-500 mb-3 font-medium">
                  Visar {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} av {totalCount} resultat
                </div>

                <div className="space-y-2">
                  {results.map((food) => {
                    const newWeight = calculateNewWeight(food)
                    return (
                      <button
                        key={food.slvNummer}
                        onClick={() => handleSelect(food)}
                        className="w-full p-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700/50 hover:border-gold-500/50 transition-all text-left group shadow-sm hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white group-hover:text-gold-400 transition-colors truncate">
                              {food.name}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">
                              SLV #{food.slvNummer} · {food.type}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {newWeight ? (
                              <div className="bg-gold-500/20 border border-gold-500/30 rounded-lg px-3 py-1.5">
                                <div className="text-gold-400 font-bold text-lg">{newWeight}g</div>
                                <div className="text-xs text-gold-500/70">≈ {originalMacroAmount}g {macroLabel}</div>
                              </div>
                            ) : (
                              <div className="bg-zinc-700/50 rounded-lg px-3 py-1.5">
                                <div className="text-orange-400 font-semibold">{food.kcal} kcal</div>
                                <div className="text-xs text-zinc-500">/100g</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/20">
                            P: {food.protein}g
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20">
                            K: {food.carbs}g
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/20">
                            F: {food.fat}g
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Föregående
                    </button>
                    <span className="text-sm text-zinc-400 font-medium px-3">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Nästa
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}

            {!isLoading && !hasSearched && !category && !searchTerm && (
              <div className="text-center py-12 text-zinc-500">
                <Database className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Skriv minst 2 tecken för att söka</p>
                <p className="text-xs mt-2 text-zinc-600">Data från Livsmedelsverkets livsmedelsdatabas</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white font-medium transition-all"
          >
            Avbryt
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
