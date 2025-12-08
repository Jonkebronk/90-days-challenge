'use client'

import { useState } from 'react'
import { Check, X, Pill } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supplementsList } from '@/lib/kostschema/meal-templates'

interface SupplementPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (supplement: { id: number; amount: number; unit: string; name: string }) => void
  existingSupplements: { id: number; amount: number; unit: string; name: string }[]
}

export function SupplementPickerModal({
  isOpen,
  onClose,
  onSelect,
  existingSupplements
}: SupplementPickerModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [amount, setAmount] = useState<number>(1)

  const existingIds = new Set(existingSupplements.map(s => s.id))

  const handleSelect = (supplement: typeof supplementsList[0]) => {
    if (existingIds.has(supplement.id)) return
    setSelectedId(supplement.id)
    setAmount(supplement.defaultAmount)
  }

  const handleConfirm = () => {
    const supplement = supplementsList.find(s => s.id === selectedId)
    if (supplement) {
      onSelect({
        id: supplement.id,
        amount,
        unit: supplement.unit,
        name: supplement.name
      })
      setSelectedId(null)
      setAmount(1)
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedId(null)
    setAmount(1)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md p-0">
        <div className="bg-gradient-to-b from-purple-500/20 to-transparent border-b border-zinc-700/50 p-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-purple-400" />
              Välj kosttillskott
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
            {supplementsList.map((supplement) => {
              const isExisting = existingIds.has(supplement.id)
              const isSelected = selectedId === supplement.id

              return (
                <button
                  key={supplement.id}
                  onClick={() => handleSelect(supplement)}
                  disabled={isExisting}
                  className={`p-3 rounded-xl text-left transition-all ${
                    isExisting
                      ? 'bg-zinc-800/30 border border-zinc-700/30 opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'bg-purple-500/20 border-2 border-purple-500'
                        : 'bg-zinc-800/60 border border-zinc-700/50 hover:border-purple-500/50 hover:bg-zinc-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                      {supplement.name}
                    </span>
                    {isExisting && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {supplement.defaultAmount} {supplement.unit}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Amount input when selected */}
          {selectedId && (
            <div className="mt-4 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-300">
                  {supplementsList.find(s => s.id === selectedId)?.name}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 text-sm bg-zinc-800 border border-purple-500/50 rounded text-white text-center focus:outline-none focus:border-purple-400"
                    min="1"
                  />
                  <span className="text-sm text-zinc-400">
                    {supplementsList.find(s => s.id === selectedId)?.unit}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white font-medium transition-all"
          >
            Avbryt
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="flex-1 py-2.5 px-4 bg-purple-500 hover:bg-purple-400 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-xl text-white font-medium transition-all disabled:cursor-not-allowed"
          >
            Lägg till
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
