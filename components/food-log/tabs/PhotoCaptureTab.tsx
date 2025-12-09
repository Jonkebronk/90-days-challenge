'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Loader2, Check, X, Edit2, Database, Sparkles, Search, ChevronRight, Bot } from 'lucide-react'
import { useFoodLogStore } from '@/lib/stores/food-log-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SLVFood {
  slvNummer: number
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}

export function PhotoCaptureTab() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  // SLV search modal state
  const [searchModalIdx, setSearchModalIdx] = useState<number | null>(null)
  const [slvSearchQuery, setSlvSearchQuery] = useState('')
  const [slvSearchResults, setSlvSearchResults] = useState<SLVFood[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const {
    isLoading,
    error,
    pendingAnalysis,
    pendingImage,
    analyzePhoto,
    setPendingAnalysis,
    clearPendingAnalysis,
    createLog,
    setItemSource
  } = useFoodLogStore()

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setCapturedImage(base64)
      await analyzePhoto(base64)
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [analyzePhoto])

  const handleConfirm = async () => {
    if (!pendingAnalysis) return

    const items = pendingAnalysis.items.map(item => ({
      name: item.name,
      portionG: item.portion_g,
      kcal: item.kcal,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat
    }))

    await createLog({
      type: 'ai',
      items,
      image: pendingImage || undefined
    })

    setCapturedImage(null)
  }

  const handleCancel = () => {
    clearPendingAnalysis()
    setCapturedImage(null)
  }

  const updateItemPortion = (idx: number, newPortion: number) => {
    if (!pendingAnalysis) return

    const item = pendingAnalysis.items[idx]
    const ratio = newPortion / item.portion_g

    const updatedItems = [...pendingAnalysis.items]
    updatedItems[idx] = {
      ...item,
      portion_g: newPortion,
      // Update active values
      kcal: Math.round(item.kcal * ratio),
      protein: Math.round(item.protein * ratio * 10) / 10,
      carbs: Math.round(item.carbs * ratio * 10) / 10,
      fat: Math.round(item.fat * ratio * 10) / 10,
      // Update AI estimate
      ai_estimate: item.ai_estimate ? {
        kcal: Math.round(item.ai_estimate.kcal * ratio),
        protein: Math.round(item.ai_estimate.protein * ratio * 10) / 10,
        carbs: Math.round(item.ai_estimate.carbs * ratio * 10) / 10,
        fat: Math.round(item.ai_estimate.fat * ratio * 10) / 10
      } : item.ai_estimate,
      // Update SLV values
      slv_values: item.slv_values ? {
        ...item.slv_values,
        kcal: Math.round(item.slv_values.kcal * ratio),
        protein: Math.round(item.slv_values.protein * ratio * 10) / 10,
        carbs: Math.round(item.slv_values.carbs * ratio * 10) / 10,
        fat: Math.round(item.slv_values.fat * ratio * 10) / 10
      } : null
    }

    const total = updatedItems.reduce(
      (acc, i) => ({
        kcal: acc.kcal + i.kcal,
        protein: acc.protein + i.protein,
        carbs: acc.carbs + i.carbs,
        fat: acc.fat + i.fat
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    )

    setPendingAnalysis({ items: updatedItems, total }, pendingImage)
  }

  const handlePortionEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditValue(String(Math.round(pendingAnalysis!.items[idx].portion_g)))
  }

  const handlePortionSave = () => {
    if (editingIdx !== null) {
      const newPortion = parseFloat(editValue)
      if (!isNaN(newPortion) && newPortion > 0) {
        updateItemPortion(editingIdx, newPortion)
      }
      setEditingIdx(null)
      setEditValue('')
    }
  }

  // Open SLV search modal for an item
  const openSlvSearch = (idx: number) => {
    const item = pendingAnalysis?.items[idx]
    if (item) {
      setSearchModalIdx(idx)
      setSlvSearchQuery(item.name)
      setSlvSearchResults([])
      // Auto-search with current name
      searchSlv(item.name)
    }
  }

  // Search SLV database
  const searchSlv = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch(`/api/slv-proxy?q=${encodeURIComponent(query)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setSlvSearchResults(data.foods || [])
      }
    } catch (error) {
      console.error('SLV search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Select a SLV result to replace the current item
  const selectSlvResult = (slvFood: SLVFood) => {
    if (searchModalIdx === null || !pendingAnalysis) return

    const currentItem = pendingAnalysis.items[searchModalIdx]
    const portion = currentItem.portion_g
    const ratio = portion / 100 // SLV values are per 100g

    const updatedItems = [...pendingAnalysis.items]
    updatedItems[searchModalIdx] = {
      ...currentItem,
      name: slvFood.name,
      slv_name: slvFood.name,
      slv_nummer: slvFood.slvNummer,
      source: 'slv' as const,
      kcal: Math.round(slvFood.kcal * ratio),
      protein: Math.round(slvFood.protein * ratio * 10) / 10,
      carbs: Math.round(slvFood.carbs * ratio * 10) / 10,
      fat: Math.round(slvFood.fat * ratio * 10) / 10
    }

    const total = updatedItems.reduce(
      (acc, i) => ({
        kcal: acc.kcal + i.kcal,
        protein: acc.protein + i.protein,
        carbs: acc.carbs + i.carbs,
        fat: acc.fat + i.fat
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    )

    setPendingAnalysis({ items: updatedItems, total, notes: pendingAnalysis.notes }, pendingImage)
    setSearchModalIdx(null)
    setSlvSearchQuery('')
    setSlvSearchResults([])
  }

  // Show analysis results
  if (pendingAnalysis) {
    return (
      <div className="space-y-4">
        {/* Preview image */}
        {capturedImage && (
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={capturedImage}
              alt="Captured food"
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] px-3 py-1 rounded-full text-xs font-bold">
              Analyserad
            </div>
          </div>
        )}

        {/* Items list */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-600">Identifierade livsmedel</h3>
          {pendingAnalysis.items.map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Header with name and portion */}
              <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
                <button
                  onClick={() => openSlvSearch(idx)}
                  className="flex items-center gap-2 text-left hover:text-gold-primary transition-colors"
                >
                  <span className="font-semibold text-gray-900">{item.name}</span>
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <div className="flex items-center gap-2">
                  {editingIdx === idx ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-16 h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handlePortionSave()
                          if (e.key === 'Escape') setEditingIdx(null)
                        }}
                      />
                      <span className="text-xs text-gray-500">g</span>
                      <Button size="sm" variant="ghost" onClick={handlePortionSave} className="h-7 w-7 p-0">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePortionEdit(idx)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 bg-white px-2 py-1 rounded border border-gray-200"
                    >
                      <span>{Math.round(item.portion_g)}g</span>
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Dual source comparison */}
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                {/* AI Estimate */}
                <button
                  onClick={() => item.ai_estimate && setItemSource(idx, 'ai')}
                  className={`p-3 text-left transition-all ${
                    item.selected_source === 'ai'
                      ? 'bg-purple-50 ring-2 ring-inset ring-purple-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">AI uppskattning</span>
                    {item.selected_source === 'ai' && (
                      <Check className="w-3.5 h-3.5 text-purple-600 ml-auto" />
                    )}
                  </div>
                  {item.ai_estimate ? (
                    <>
                      <div className="text-lg font-bold text-purple-700">
                        {Math.round(item.ai_estimate.kcal)} kcal
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        P: {Math.round(item.ai_estimate.protein)}g · K: {Math.round(item.ai_estimate.carbs)}g · F: {Math.round(item.ai_estimate.fat)}g
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400">Ej tillgänglig</div>
                  )}
                </button>

                {/* SLV Values */}
                <button
                  onClick={() => item.slv_values && setItemSource(idx, 'slv')}
                  disabled={!item.slv_values}
                  className={`p-3 text-left transition-all ${
                    item.selected_source === 'slv'
                      ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-200'
                      : item.slv_values ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Livsmedelsverket</span>
                    {item.selected_source === 'slv' && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />
                    )}
                  </div>
                  {item.slv_values ? (
                    <>
                      <div className="text-lg font-bold text-emerald-700">
                        {Math.round(item.slv_values.kcal)} kcal
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        P: {Math.round(item.slv_values.protein)}g · K: {Math.round(item.slv_values.carbs)}g · F: {Math.round(item.slv_values.fat)}g
                      </div>
                      {item.slv_values.slv_name && (
                        <div className="text-[10px] text-emerald-600 mt-1 truncate">
                          {item.slv_values.slv_name}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-gray-400">
                      Ingen träff i SLV
                      <button
                        onClick={(e) => { e.stopPropagation(); openSlvSearch(idx); }}
                        className="block text-amber-600 hover:underline mt-1"
                      >
                        Sök manuellt
                      </button>
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* AI Notes */}
        {pendingAnalysis.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <span className="font-medium">OBS:</span> {pendingAnalysis.notes}
          </div>
        )}

        {/* Totals */}
        <div className="bg-gradient-to-r from-gold-primary/10 to-orange-100 border border-gold-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Totalt</span>
            <span className="font-bold text-lg bg-gradient-to-r from-gold-primary to-orange-500 bg-clip-text text-transparent">
              {Math.round(pendingAnalysis.total.kcal)} kcal
            </span>
          </div>
          <div className="text-sm text-gray-600 text-right mt-1">
            P: {Math.round(pendingAnalysis.total.protein)}g · K: {Math.round(pendingAnalysis.total.carbs)}g · F: {Math.round(pendingAnalysis.total.fat)}g
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 border-gray-300"
          >
            <X className="w-4 h-4 mr-2" />
            Avbryt
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Bekräfta & logga
          </Button>
        </div>

        {/* SLV Search Modal */}
        {searchModalIdx !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-gray-900">Sök i Livsmedelsverket</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchModalIdx(null)
                    setSlvSearchQuery('')
                    setSlvSearchResults([])
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search input */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Sök livsmedel..."
                    value={slvSearchQuery}
                    onChange={(e) => setSlvSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchSlv(slvSearchQuery)
                      }
                    }}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={() => searchSlv(slvSearchQuery)}
                  disabled={isSearching || !slvSearchQuery.trim()}
                  className="w-full mt-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Sök
                </Button>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto p-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gold-primary" />
                  </div>
                ) : slvSearchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {slvSearchQuery ? 'Inga resultat hittades' : 'Skriv för att söka'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {slvSearchResults.map((food) => (
                      <button
                        key={food.slvNummer}
                        onClick={() => selectSlvResult(food)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {food.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              SLV #{food.slvNummer}
                            </p>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <p className="text-sm font-semibold text-gold-primary">
                              {Math.round(food.kcal)} kcal
                            </p>
                            <p className="text-xs text-gray-500">
                              P: {Math.round(food.protein)}g
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show capture UI
  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Image preview if captured */}
      {capturedImage && !pendingAnalysis && (
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={capturedImage}
            alt="Captured food"
            className="w-full h-48 object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm font-medium">Analyserar bild...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capture button */}
      {!capturedImage && (
        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-12 rounded-xl border-2 border-dashed border-gray-300 hover:border-gold-primary hover:bg-gold-primary/5 transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-primary/20 to-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8 text-gold-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">Ta foto eller välj bild</p>
              <p className="text-sm text-gray-500 mt-1">AI analyserar automatiskt innehållet</p>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}
    </div>
  )
}
