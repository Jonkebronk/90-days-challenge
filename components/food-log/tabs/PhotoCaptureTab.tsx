'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Loader2, Check, X, Edit2 } from 'lucide-react'
import { useFoodLogStore } from '@/lib/stores/food-log-store'

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

    // Convert to base64
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setCapturedImage(base64)
      await analyzePhoto(base64)
    }
    reader.readAsDataURL(file)

    // Reset input
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
            <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded text-xs font-medium">
              Analyserad
            </div>
          </div>
        )}

        {/* Items list */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-zinc-400">Identifierade livsmedel</h3>
          {pendingAnalysis.items.map((item, idx) => (
            <div key={idx} className="bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{item.name}</div>
                <div className="text-emerald-400">{Math.round(item.kcal)} kcal</div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  {editingIdx === idx ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-16 bg-zinc-700 rounded px-2 py-1 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handlePortionSave()
                          if (e.key === 'Escape') setEditingIdx(null)
                        }}
                      />
                      <span className="text-xs text-zinc-500">g</span>
                      <button
                        onClick={handlePortionSave}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePortionEdit(idx)}
                      className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-300"
                    >
                      <span>{Math.round(item.portion_g)}g</span>
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  P: {Math.round(item.protein)}g · K: {Math.round(item.carbs)}g · F: {Math.round(item.fat)}g
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Totalt</span>
            <span className="text-emerald-400 font-bold">{Math.round(pendingAnalysis.total.kcal)} kcal</span>
          </div>
          <div className="text-sm text-zinc-400 text-right mt-1">
            P: {Math.round(pendingAnalysis.total.protein)}g · K: {Math.round(pendingAnalysis.total.carbs)}g · F: {Math.round(pendingAnalysis.total.fat)}g
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Avbryt
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Bekräfta & logga
          </button>
        </div>
      </div>
    )
  }

  // Show capture UI
  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
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
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
                <p className="text-sm">Analyserar bild...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capture buttons */}
      {!capturedImage && (
        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-12 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors flex flex-col items-center justify-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
              <Camera className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="font-medium">Ta foto eller välj bild</p>
              <p className="text-sm text-zinc-500 mt-1">AI analyserar automatiskt innehållet</p>
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
