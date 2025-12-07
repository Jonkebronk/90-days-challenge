'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, X, Database } from 'lucide-react'
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

  // Search function - can be called with or without query
  const searchFoods = useCallback(async (query: string = '') => {
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
      // Build URL with category and meal filters
      let url = `/api/slv-proxy?limit=15`
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
    } catch (err) {
      setError('Kunde inte hämta data från Livsmedelsverket')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [category, mealType])

  // Auto-search when modal opens with a category
  useEffect(() => {
    if (isOpen && category && !searchTerm) {
      searchFoods('')
    }
  }, [isOpen, category, searchFoods, searchTerm])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchFoods(searchTerm)
      } else if (category) {
        // Re-search with just category when search term is cleared
        searchFoods('')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, searchFoods, category])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setResults([])
      setError(null)
      setHasSearched(false)
    }
  }, [isOpen])

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

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={category
              ? `Filtrera ${getCategoryLabel()}r...`
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
              Inga livsmedel hittades för &quot;{searchTerm}&quot;
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
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
          )}

          {!isLoading && !hasSearched && !category && (
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
