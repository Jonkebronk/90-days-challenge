'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Search, Package, Trash2 } from 'lucide-react'
import { useIngredientLibraryStore } from '@/lib/stores/ingredient-library-store'
import { IngredientGrid } from './IngredientGrid'
import { IngredientPresets } from './IngredientPresets'

interface TransformedFood {
  slvNummer: number
  name: string
  type?: string
  protein: number
  carbs: number
  fat: number
  kcal: number
}

interface IngredientLibraryPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function IngredientLibraryPanel({ isOpen, onClose }: IngredientLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'protein' | 'kolhydrat' | 'fett'>('protein')
  const [foods, setFoods] = useState<TransformedFood[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const store = useIngredientLibraryStore()

  // Fetch foods from SLV API
  const fetchFoods = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        category: activeCategory,
        limit: '200',
      })
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim())
      }

      const res = await fetch(`/api/slv-proxy?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setFoods(data.results || [])
    } catch (error) {
      console.error('Error fetching foods:', error)
      setFoods([])
    } finally {
      setIsLoading(false)
    }
  }, [activeCategory, searchQuery])

  // Debounced fetch
  useEffect(() => {
    if (!isOpen) return

    const debounce = setTimeout(fetchFoods, 300)
    return () => clearTimeout(debounce)
  }, [isOpen, fetchFoods])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const totalCount = store.protein.length + store.kolhydrat.length + store.fett.length

  const getCategoryLabel = (cat: 'protein' | 'kolhydrat' | 'fett') => {
    switch (cat) {
      case 'protein': return 'Protein'
      case 'kolhydrat': return 'Kolhydrat'
      case 'fett': return 'Fett'
    }
  }

  const getCategoryColor = (cat: 'protein' | 'kolhydrat' | 'fett', isActive: boolean) => {
    if (isActive) {
      switch (cat) {
        case 'protein': return 'bg-rose-600 text-white'
        case 'kolhydrat': return 'bg-blue-600 text-white'
        case 'fett': return 'bg-amber-600 text-white'
      }
    }
    return 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="w-[750px] max-w-[90vw] bg-zinc-900 border-l border-zinc-700 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-700 flex justify-between items-center bg-zinc-900/95">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-gold-500" />
            Råvarubibliotek
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök bland alla råvaror..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50"
            />
          </div>
        </div>

        {/* Presets */}
        <IngredientPresets />

        {/* Category tabs */}
        <div className="px-4 py-3 border-b border-zinc-700 flex gap-2">
          {(['protein', 'kolhydrat', 'fett'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${getCategoryColor(cat, activeCategory === cat)}`}
            >
              {getCategoryLabel(cat)} ({store[cat].length})
            </button>
          ))}
        </div>

        {/* Selected items preview */}
        {store[activeCategory].length > 0 && (
          <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Valda {getCategoryLabel(activeCategory).toLowerCase()}källor
              </p>
              <button
                onClick={() => store.clearCategory(activeCategory)}
                className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Rensa
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {store[activeCategory].map(item => (
                <span
                  key={item.slvNummer}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold-500/20 border border-gold-500/30 rounded-full text-xs text-gold-400 font-medium"
                >
                  {item.name}
                  <button
                    onClick={() => store.removeIngredient(activeCategory, item.slvNummer)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          <IngredientGrid
            foods={foods}
            category={activeCategory}
            isLoading={isLoading}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700 flex justify-between items-center bg-zinc-900/95">
          <div className="text-zinc-400 text-sm">
            <span className="font-medium text-white">{totalCount}</span> råvaror valda
            {totalCount > 0 && (
              <button
                onClick={store.clearAll}
                className="ml-3 text-zinc-500 hover:text-red-400 transition-colors"
              >
                Rensa alla
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gold-600 text-white rounded-lg font-medium hover:bg-gold-700 transition-colors"
          >
            Spara & Stäng
          </button>
        </div>
      </div>
    </div>
  )
}
