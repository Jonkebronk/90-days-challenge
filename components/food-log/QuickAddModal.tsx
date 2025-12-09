'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, Loader2, X, Plus, Database, Package, Minus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFoodLogStore } from '@/lib/stores/food-log-store'

interface SearchResult {
  id: string
  name: string
  brand?: string | null
  source: 'local' | 'slv'
  kcal: number
  protein: number
  carbs: number
  fat: number
  slvNummer?: number
}

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null)
  const [portionG, setPortionG] = useState(100)
  const [isSaving, setIsSaving] = useState(false)

  const { createLog } = useFoodLogStore()

  // Search both local products and SLV
  const searchFoods = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)

    try {
      // Search both sources in parallel
      const [localRes, slvRes] = await Promise.all([
        fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`),
        fetch(`/api/slv-proxy?q=${encodeURIComponent(query)}&limit=10`)
      ])

      const combined: SearchResult[] = []

      // Process local products
      if (localRes.ok) {
        const localData = await localRes.json()
        const localProducts = localData.products || []
        localProducts.forEach((p: any) => {
          combined.push({
            id: p.id,
            name: p.name,
            brand: p.brand,
            source: 'local',
            kcal: p.kcal || 0,
            protein: p.protein || 0,
            carbs: p.carbs || 0,
            fat: p.fat || 0
          })
        })
      }

      // Process SLV results
      if (slvRes.ok) {
        const slvData = await slvRes.json()
        const slvFoods = slvData.foods || []
        slvFoods.forEach((f: any) => {
          // Check if already in local results (by name similarity)
          const isDuplicate = combined.some(c =>
            c.name.toLowerCase().includes(f.name.toLowerCase().slice(0, 10)) ||
            f.name.toLowerCase().includes(c.name.toLowerCase().slice(0, 10))
          )
          if (!isDuplicate) {
            combined.push({
              id: `slv-${f.slvNummer}`,
              name: f.name,
              source: 'slv',
              kcal: f.kcal || 0,
              protein: f.protein || 0,
              carbs: f.carbs || 0,
              fat: f.fat || 0,
              slvNummer: f.slvNummer
            })
          }
        })
      }

      setResults(combined)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchFoods(searchTerm)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, searchFoods])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setResults([])
      setSelectedItem(null)
      setPortionG(100)
    }
  }, [isOpen])

  // Calculate macros for portion
  const calculateMacros = (item: SearchResult, grams: number) => {
    const factor = grams / 100
    return {
      kcal: Math.round(item.kcal * factor),
      protein: Math.round(item.protein * factor * 10) / 10,
      carbs: Math.round(item.carbs * factor * 10) / 10,
      fat: Math.round(item.fat * factor * 10) / 10
    }
  }

  // Handle adding item to food log
  const handleAdd = async () => {
    if (!selectedItem || portionG <= 0) return

    setIsSaving(true)

    const macros = calculateMacros(selectedItem, portionG)

    const result = await createLog({
      type: 'manual',
      items: [{
        name: selectedItem.brand ? `${selectedItem.name} (${selectedItem.brand})` : selectedItem.name,
        portionG,
        kcal: macros.kcal,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat
      }]
    })

    setIsSaving(false)

    if (result) {
      onClose()
    }
  }

  // Quick portion buttons
  const quickPortions = [50, 100, 150, 200, 250]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white border-gray-200 max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="bg-gradient-to-b from-gold-primary/20 to-transparent border-b border-gray-200 p-5">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-gold-primary" />
              Snabbregistrering
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Sök efter livsmedel i produktdatabasen eller Livsmedelsverket
            </p>
          </DialogHeader>
        </div>

        <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search Input */}
          {!selectedItem && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Sök livsmedel (t.ex. banan, kyckling, ris...)"
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-11 text-base focus:border-gold-primary focus:ring-gold-primary/20"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Selected Item View */}
          {selectedItem && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="text-sm text-gold-primary hover:underline flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Välj ett annat livsmedel
              </button>

              {/* Selected item card */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{selectedItem.name}</p>
                    {selectedItem.brand && (
                      <p className="text-sm text-gray-500">{selectedItem.brand}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {selectedItem.source === 'local' ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Produktdatabas
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Livsmedelsverket
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">per 100g</p>
                    <p className="font-semibold text-orange-600">{selectedItem.kcal} kcal</p>
                  </div>
                </div>

                {/* Macros per 100g */}
                <div className="flex gap-3 mt-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                    P: {selectedItem.protein}g
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    K: {selectedItem.carbs}g
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    F: {selectedItem.fat}g
                  </span>
                </div>
              </div>

              {/* Portion input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Mängd (gram)</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPortionG(Math.max(10, portionG - 10))}
                    className="border-gray-300"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={portionG}
                    onChange={(e) => setPortionG(Math.max(1, parseInt(e.target.value) || 0))}
                    className="text-center text-lg font-semibold w-24 border-gray-300"
                    min={1}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPortionG(portionG + 10)}
                    className="border-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-gray-600 font-medium">g</span>
                </div>

                {/* Quick portion buttons */}
                <div className="flex flex-wrap gap-2">
                  {quickPortions.map((g) => (
                    <button
                      key={g}
                      onClick={() => setPortionG(g)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        portionG === g
                          ? 'bg-gold-primary text-gray-900'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {g}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated macros for portion */}
              {portionG > 0 && (
                <div className="bg-gradient-to-r from-gold-primary/10 to-orange-500/10 rounded-xl p-4 border border-gold-primary/30">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Totalt för {portionG}g</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xl font-bold text-orange-600">
                        {calculateMacros(selectedItem, portionG).kcal}
                      </p>
                      <p className="text-xs text-gray-500">kcal</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-rose-600">
                        {calculateMacros(selectedItem, portionG).protein}
                      </p>
                      <p className="text-xs text-gray-500">protein</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-blue-600">
                        {calculateMacros(selectedItem, portionG).carbs}
                      </p>
                      <p className="text-xs text-gray-500">kolh.</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-amber-600">
                        {calculateMacros(selectedItem, portionG).fat}
                      </p>
                      <p className="text-xs text-gray-500">fett</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {!selectedItem && (
            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gold-primary mb-3" />
                  <span className="text-gray-500">Söker...</span>
                </div>
              )}

              {!isLoading && searchTerm.length >= 2 && results.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>Inga livsmedel hittades för &quot;{searchTerm}&quot;</p>
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div className="space-y-2">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="w-full p-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-gold-primary/50 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 group-hover:text-gold-primary transition-colors truncate">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {item.brand && (
                              <span className="text-xs text-gray-500">{item.brand}</span>
                            )}
                            {item.source === 'local' ? (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Package className="h-3 w-3" />
                                DB
                              </span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Database className="h-3 w-3" />
                                SLV
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-orange-600 font-semibold">{item.kcal} kcal</div>
                          <div className="text-xs text-gray-500">/100g</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600">
                          P: {item.protein}g
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          K: {item.carbs}g
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                          F: {item.fat}g
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!isLoading && !searchTerm && (
                <div className="text-center py-12 text-gray-400">
                  <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">Skriv minst 2 tecken för att söka</p>
                  <p className="text-xs mt-2">Söker i produktdatabasen och Livsmedelsverket</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-300"
          >
            Avbryt
          </Button>
          {selectedItem && (
            <Button
              onClick={handleAdd}
              disabled={isSaving || portionG <= 0}
              className="flex-1 bg-gradient-to-r from-gold-primary to-orange-500 text-gray-900 hover:opacity-90"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Lägg till
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
