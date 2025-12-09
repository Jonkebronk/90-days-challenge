'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Loader2, Check, X, Edit2 } from 'lucide-react'
import { useFoodLogStore } from '@/lib/stores/food-log-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function PhotoCaptureTab() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const {
    isLoading,
    error,
    pendingAnalysis,
    pendingImage,
    analyzePhoto,
    setPendingAnalysis,
    clearPendingAnalysis,
    createLog
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
      kcal: Math.round(item.kcal * ratio),
      protein: Math.round(item.protein * ratio * 10) / 10,
      carbs: Math.round(item.carbs * ratio * 10) / 10,
      fat: Math.round(item.fat * ratio * 10) / 10
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
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-600">Identifierade livsmedel</h3>
          {pendingAnalysis.items.map((item, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="font-semibold text-gold-primary">{Math.round(item.kcal)} kcal</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {editingIdx === idx ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handlePortionSave()
                          if (e.key === 'Escape') setEditingIdx(null)
                        }}
                      />
                      <span className="text-xs text-gray-500">g</span>
                      <Button size="sm" variant="ghost" onClick={handlePortionSave} className="h-8 w-8 p-0">
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePortionEdit(idx)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <span>{Math.round(item.portion_g)}g</span>
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  P: {Math.round(item.protein)}g · K: {Math.round(item.carbs)}g · F: {Math.round(item.fat)}g
                </div>
              </div>
            </div>
          ))}
        </div>

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
