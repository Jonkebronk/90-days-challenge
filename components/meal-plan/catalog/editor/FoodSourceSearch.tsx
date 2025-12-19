'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Database, BookOpen, Apple, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types for different food sources
interface SlvFood {
  slvNummer: number
  name: string
  protein: number
  carbs: number
  fat: number
  kcal: number
}

interface FoodItem {
  id: string
  name: string
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  calories: number | null
  commonServingSize: number | null
  foodCategory?: { name: string; color: string }
}

interface Recipe {
  id: string
  title: string
  servings: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

interface NormalizedFood {
  id: string
  source: 'slv' | 'library' | 'recipe'
  name: string
  protein: number
  carbs: number
  fat: number
  kcal: number
  defaultAmount: number
  sourceData?: any
}

interface FoodSourceSearchProps {
  onSelect: (food: NormalizedFood) => void
  category?: 'protein' | 'kolhydrat' | 'fett' | 'grönsak'
}

export function FoodSourceSearch({ onSelect, category }: FoodSourceSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'slv' | 'library' | 'recipe'>('library')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<NormalizedFood[]>([])

  // Debounced search - empty query loads default results
  const searchFoods = useCallback(async (query: string, source: string) => {
    setIsLoading(true)
    try {
      let normalizedResults: NormalizedFood[] = []

      if (source === 'slv') {
        // Search Livsmedelsverket - use category or common term if no query
        const categoryParam = category === 'grönsak' ? '' : category || ''
        const searchTerm = query || (category === 'protein' ? 'kyckling' : category === 'kolhydrat' ? 'ris' : category === 'fett' ? 'olja' : 'mat')
        const res = await fetch(`/api/slv-proxy?q=${encodeURIComponent(searchTerm)}&category=${categoryParam}&limit=20`)
        if (res.ok) {
          const data = await res.json()
          normalizedResults = (data.foods || []).map((f: SlvFood) => ({
            id: `slv-${f.slvNummer}`,
            source: 'slv' as const,
            name: f.name,
            protein: f.protein || 0,
            carbs: f.carbs || 0,
            fat: f.fat || 0,
            kcal: f.kcal || 0,
            defaultAmount: 100,
            sourceData: f
          }))
        }
      } else if (source === 'library') {
        // Search Food Library - load all if no query
        const searchParam = query ? `search=${encodeURIComponent(query)}&` : ''
        const res = await fetch(`/api/food-items?${searchParam}limit=30`)
        if (res.ok) {
          const data = await res.json()
          normalizedResults = (data.items || []).map((f: FoodItem) => ({
            id: `lib-${f.id}`,
            source: 'library' as const,
            name: f.name,
            protein: f.proteinG || 0,
            carbs: f.carbsG || 0,
            fat: f.fatG || 0,
            kcal: f.calories || 0,
            defaultAmount: f.commonServingSize || 100,
            sourceData: f
          }))
        }
      } else if (source === 'recipe') {
        // Search Recipes - load all if no query
        const res = await fetch(`/api/recipes?published=true`)
        if (res.ok) {
          const data = await res.json()
          const recipes = data.recipes || []
          const filtered = query
            ? recipes.filter((r: Recipe) => r.title.toLowerCase().includes(query.toLowerCase()))
            : recipes
          normalizedResults = filtered.slice(0, 30).map((r: Recipe) => ({
            id: `recipe-${r.id}`,
            source: 'recipe' as const,
            name: r.title,
            protein: r.protein || 0,
            carbs: r.carbs || 0,
            fat: r.fat || 0,
            kcal: r.calories || 0,
            defaultAmount: r.servings > 0 ? Math.round(100 / r.servings) * 100 : 100,
            sourceData: r
          }))
        }
      }

      setResults(normalizedResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [category])

  // Debounce search - runs on mount and when query/tab changes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFoods(searchQuery, activeTab)
    }, searchQuery ? 300 : 0) // Immediate on mount, debounced when typing

    return () => clearTimeout(timer)
  }, [searchQuery, activeTab, searchFoods])

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'slv': return <Database className="w-3 h-3" />
      case 'library': return <Apple className="w-3 h-3" />
      case 'recipe': return <BookOpen className="w-3 h-3" />
      default: return null
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'slv': return 'bg-blue-100 text-blue-700'
      case 'library': return 'bg-green-100 text-green-700'
      case 'recipe': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-3">
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

      {/* Source Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="library" className="text-xs">
            <Apple className="w-3 h-3 mr-1" />
            Livsmedel
          </TabsTrigger>
          <TabsTrigger value="slv" className="text-xs">
            <Database className="w-3 h-3 mr-1" />
            SLV
          </TabsTrigger>
          <TabsTrigger value="recipe" className="text-xs">
            <BookOpen className="w-3 h-3 mr-1" />
            Recept
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-2">
          <ScrollArea className="h-[300px]">
            {results.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Inga resultat hittades
              </div>
            )}
            <div className="space-y-1">
              {results.map((food) => (
                <button
                  key={food.id}
                  onClick={() => onSelect(food)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-xs px-1.5', getSourceColor(food.source))}>
                        {getSourceIcon(food.source)}
                      </Badge>
                      <span className="font-medium text-gray-900 truncate">{food.name}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span className="text-red-600">{food.protein}g P</span>
                      <span className="text-amber-600">{food.carbs}g K</span>
                      <span className="text-blue-600">{food.fat}g F</span>
                      <span>{food.kcal} kcal</span>
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
