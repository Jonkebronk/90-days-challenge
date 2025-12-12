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
  Package
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

export default function SLVLivsmedelPage() {
  const { data: session } = useSession()
  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

  const [data, setData] = useState<SLVData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedFood, setSelectedFood] = useState<SLVFood | null>(null)

  // Fetch data on mount
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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const expandAll = () => {
    if (data) {
      setExpandedCategories(new Set(Object.keys(data.categories)))
    }
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  // Filter foods based on search
  const filteredCategories = useMemo(() => {
    if (!data) return {}
    if (!searchQuery.trim()) return data.categories

    const query = searchQuery.toLowerCase()
    const filtered: Record<string, SLVFood[]> = {}

    for (const [category, foods] of Object.entries(data.categories)) {
      const matchingFoods = foods.filter(food =>
        food.namn.toLowerCase().includes(query)
      )
      if (matchingFoods.length > 0) {
        filtered[category] = matchingFoods
      }
    }

    return filtered
  }, [data, searchQuery])

  const totalFiltered = useMemo(() => {
    return Object.values(filteredCategories).reduce((sum, foods) => sum + foods.length, 0)
  }, [filteredCategories])

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
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Livsmedelsverkets databas
            </h1>
            <div className="flex items-center gap-4 text-gray-400 text-sm mt-1">
              <span>{data.totalCount} livsmedel</span>
              <span>•</span>
              <span>{data.categoryCount} kategorier</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {lastUpdated}
              </span>
            </div>
          </div>

          {isCoach && (
            <Button
              onClick={handleRebuild}
              disabled={isRebuilding}
              variant="outline"
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
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

        {/* Expand/Collapse buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
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
          {searchQuery && (
            <span className="text-gray-500 text-sm ml-auto">
              {totalFiltered} träffar
            </span>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto space-y-2">
        {Object.entries(filteredCategories).map(([category, foods]) => {
          const isExpanded = expandedCategories.has(category)

          return (
            <div
              key={category}
              className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-amber-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-medium">{category}</span>
                </div>
                <span className="text-gray-500 text-sm">
                  {foods.length} st
                </span>
              </button>

              {/* Foods grid */}
              {isExpanded && (
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {foods.map((food) => (
                      <button
                        key={food.nummer}
                        onClick={() => setSelectedFood(food)}
                        className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-amber-500/30 rounded-lg p-3 text-left transition-all group"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Package className="w-4 h-4 text-gray-500 group-hover:text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm font-medium text-gray-200 group-hover:text-white line-clamp-2">
                            {food.namn}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {food.kcal} kcal • {food.protein}g P
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {Object.keys(filteredCategories).length === 0 && (
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
