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

interface SLVFoodSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (food: SLVFood) => void
  category?: 'protein' | 'kolhydrat' | 'fett'
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'evening'
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
      { label: 'Frukt', searchTerm: 'frukt' },
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
  },
  snack: {
    kolhydrat: [
      { label: 'Frukt', searchTerm: 'frukt' },
      { label: 'Banan', searchTerm: 'banan' },
      { label: 'Äpple', searchTerm: 'äpple' },
      { label: 'Knäckebröd', searchTerm: 'knäckebröd' },
      { label: 'Riskakor', searchTerm: 'riskakor' },
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
  },
}

// Default subcategories when no meal type specified
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
}

export function SLVFoodSearchModal({
  isOpen,
  onClose,
  onSelect,
  category,
  mealType
}: SLVFoodSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SLVFood[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const ITEMS_PER_PAGE = 20

  // Get subcategories for current meal type and category (memoized)
  const subcategories = useMemo(() => {
    if (mealType && category && SUBCATEGORIES[mealType]?.[category]) {
      return SUBCATEGORIES[mealType][category]
    }
    if (category && DEFAULT_SUBCATEGORIES[category]) {
      return DEFAULT_SUBCATEGORIES[category]
    }
    return []
  }, [mealType, category])

  // Search function - can be called with or without query and page
  const searchFoods = useCallback(async (query: string = '', page: number = 1) => {
    // Allow empty query when category is specified (for auto-search)
    if (query.length < 2 && query.length > 0) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      // Build URL with category, meal filters and pagination
      let url = `/api/slv-proxy?limit=${ITEMS_PER_PAGE}&page=${page}`
      if (query) {
        url += `&q=${encodeURIComponent(query)}`
      }
      if (category) {
        url += `&category=${category}`
      }
      if (mealType) {
        url += `&meal=${mealType}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Sökningen misslyckades')

      const data = await response.json()
      setResults(data.foods || [])
      setTotalCount(data.totalCount || 0)
      setTotalPages(data.totalPages || 1)
      setCurrentPage(data.currentPage || 1)
    } catch (err) {
      setError('Kunde inte hämta data från Livsmedelsverket')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [category, mealType])

  // Auto-search when modal opens with a category (only if no subcategories available)
  useEffect(() => {
    if (isOpen && category && !searchTerm && !selectedSubcategory) {
      // Check if we have subcategories to show - if so, don't auto-search
      const subs = mealType && SUBCATEGORIES[mealType]?.[category]
        ? SUBCATEGORIES[mealType][category]
        : DEFAULT_SUBCATEGORIES[category]
      if (!subs || subs.length === 0) {
        searchFoods('')
      }
    }
  }, [isOpen, category, mealType, searchTerm, selectedSubcategory, searchFoods])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        // Combine search term with selected subcategory if any
        if (selectedSubcategory) {
          const sub = subcategories.find(s => s.label === selectedSubcategory)
          if (sub) {
            // Search within the subcategory
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

  // Reset state when modal closes
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

  // Handle subcategory selection
  const handleSubcategorySelect = (searchTermValue: string, label: string) => {
    setSelectedSubcategory(label)
    setCurrentPage(1)
    searchFoods(searchTermValue, 1)
  }

  // Go back to subcategory selection
  const handleBack = () => {
    setSelectedSubcategory(null)
    setResults([])
    setSearchTerm('')
    setHasSearched(false)
    setCurrentPage(1)
    setTotalPages(1)
    setTotalCount(0)
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)

    // Re-search with new page
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
      default: return 'ingrediens'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-gold-500" />
            Sök i Livsmedelsverkets databas
          </DialogTitle>
          {category && (
            <p className="text-sm text-zinc-400">
              Byt {getCategoryLabel()}
            </p>
          )}
        </DialogHeader>

        {/* Back button - shown prominently when subcategory is selected */}
        {selectedSubcategory && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors w-fit"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Tillbaka till kategorier</span>
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
            className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto mt-4 min-h-[200px]">
          {/* Step 1: Show subcategory buttons when no subcategory selected */}
          {!selectedSubcategory && subcategories.length > 0 && !searchTerm && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400 mb-3">Välj kategori:</p>
              <div className="grid grid-cols-2 gap-2">
                {subcategories.map((sub) => (
                  <button
                    key={sub.label}
                    onClick={() => handleSubcategorySelect(sub.searchTerm, sub.label)}
                    className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-gold-500/50 transition-all text-left"
                  >
                    <span className="text-white font-medium">{sub.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
              <span className="ml-2 text-zinc-400">Söker...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-400">
              {error}
            </div>
          )}

          {!isLoading && !error && hasSearched && results.length === 0 && (
            <div className="text-center py-8 text-zinc-400">
              Inga livsmedel hittades för &quot;{selectedSubcategory || searchTerm}&quot;
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <>
              {/* Results count */}
              <div className="text-xs text-zinc-500 mb-2">
                Visar {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} av {totalCount} resultat
              </div>

              <div className="space-y-2">
                {results.map((food) => (
                  <button
                    key={food.slvNummer}
                    onClick={() => handleSelect(food)}
                    className="w-full p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-gold-500/50 transition-all text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-white">{food.name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          SLV #{food.slvNummer} · {food.type}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-orange-400 font-medium">{food.kcal} kcal</div>
                        <div className="text-xs text-zinc-500">/100g</div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-red-400">P: {food.protein}g</span>
                      <span className="text-blue-400">K: {food.carbs}g</span>
                      <span className="text-yellow-400">F: {food.fat}g</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Föregående
                  </button>

                  <span className="text-sm text-zinc-400">
                    Sida {currentPage} av {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Nästa
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {!isLoading && !hasSearched && !category && !searchTerm && (
            <div className="text-center py-8 text-zinc-500">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Skriv minst 2 tecken för att söka</p>
              <p className="text-xs mt-1">Data från Livsmedelsverkets livsmedelsdatabas</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Avbryt
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
