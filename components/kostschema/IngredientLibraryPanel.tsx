'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Search, Package, Trash2, Coffee, Cookie, UtensilsCrossed, Moon } from 'lucide-react'
import { useIngredientLibraryStore, MEAL_LABELS, MealType, Category } from '@/lib/stores/ingredient-library-store'
import { IngredientGrid } from './IngredientGrid'

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

const MEAL_ICONS: Record<MealType, React.ReactNode> = {
  frukost: <Coffee className="h-3.5 w-3.5" />,
  mellanmal: <Cookie className="h-3.5 w-3.5" />,
  lunch: <UtensilsCrossed className="h-3.5 w-3.5" />,
  middag: <UtensilsCrossed className="h-3.5 w-3.5" />,
  kvallsmal: <Moon className="h-3.5 w-3.5" />
}

export function IngredientLibraryPanel({ isOpen, onClose }: IngredientLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('protein')
  const [foods, setFoods] = useState<TransformedFood[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const store = useIngredientLibraryStore()
  const activeMeal = store.activeMeal
  const currentMealIngredients = store.meals[activeMeal]

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
      setFoods(data.foods || [])
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

  const totalCount = store.getTotalCount()
  const mealCount = store.getMealCount(activeMeal)

  const getCategoryLabel = (cat: Category) => {
    switch (cat) {
      case 'protein': return 'Protein'
      case 'kolhydrat': return 'Kolhydrat'
      case 'fett': return 'Fett'
    }
  }

  const getCategoryColor = (cat: Category, isActive: boolean) => {
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

        {/* Meal tabs */}
        <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Välj måltid</p>
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(MEAL_LABELS) as MealType[]).map(meal => {
              const count = store.getMealCount(meal)
              const isActive = activeMeal === meal
              return (
                <button
                  key={meal}
                  onClick={() => store.setActiveMeal(meal)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gold-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {MEAL_ICONS[meal]}
                  {MEAL_LABELS[meal]}
                  {count > 0 && (
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20' : 'bg-gold-500/30 text-gold-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
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

        {/* Category tabs */}
        <div className="px-4 py-3 border-b border-zinc-700 flex gap-2">
          {(['protein', 'kolhydrat', 'fett'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${getCategoryColor(cat, activeCategory === cat)}`}
            >
              {getCategoryLabel(cat)} ({currentMealIngredients[cat].length})
            </button>
          ))}
        </div>

        {/* Selected items preview */}
        {currentMealIngredients[activeCategory].length > 0 && (
          <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Valda {getCategoryLabel(activeCategory).toLowerCase()}källor för {MEAL_LABELS[activeMeal].toLowerCase()}
              </p>
              <button
                onClick={() => store.clearCategory(activeMeal, activeCategory)}
                className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Rensa
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentMealIngredients[activeCategory].map(item => (
                <span
                  key={item.slvNummer}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold-500/20 border border-gold-500/30 rounded-full text-xs text-gold-400 font-medium"
                >
                  {item.name}
                  <button
                    onClick={() => store.removeIngredient(activeMeal, activeCategory, item.slvNummer)}
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
        <div className="flex-1 overflow-auto p-4 bg-zinc-800">
          <IngredientGrid
            foods={foods}
            category={activeCategory}
            meal={activeMeal}
            isLoading={isLoading}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700 flex justify-between items-center bg-zinc-900/95">
          <div className="text-zinc-400 text-sm">
            <span className="font-medium text-white">{mealCount}</span> råvaror för {MEAL_LABELS[activeMeal].toLowerCase()}
            {' · '}
            <span className="text-zinc-500">{totalCount} totalt</span>
            {mealCount > 0 && (
              <button
                onClick={() => store.clearMeal(activeMeal)}
                className="ml-3 text-zinc-500 hover:text-red-400 transition-colors"
              >
                Rensa måltid
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
