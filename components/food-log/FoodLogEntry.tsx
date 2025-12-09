'use client'

import { useState } from 'react'
import { Camera, Barcode, FileJson, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useFoodLogStore, FoodLog } from '@/lib/stores/food-log-store'

interface Props {
  log: FoodLog
}

const typeIcons = {
  ai: Camera,
  barcode: Barcode,
  manual: FileJson
}

const typeLabels = {
  ai: 'AI-analys',
  barcode: 'Streckkod',
  manual: 'Manuell'
}

export function FoodLogEntry({ log }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { deleteLog } = useFoodLogStore()

  const Icon = typeIcons[log.type] || FileJson

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  }

  const handleDelete = async () => {
    if (confirm('Ta bort denna matlogg?')) {
      await deleteLog(log.id)
    }
  }

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Icon className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{log.items.length} {log.items.length === 1 ? 'produkt' : 'produkter'}</span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                {typeLabels[log.type]}
              </span>
            </div>
            <div className="text-sm text-zinc-500">{formatTime(log.time)}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-medium text-emerald-400">{Math.round(log.totalKcal)} kcal</div>
            <div className="text-xs text-zinc-500">
              P: {Math.round(log.totalProtein)}g · K: {Math.round(log.totalCarbs)}g · F: {Math.round(log.totalFat)}g
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-500" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-zinc-800">
          {/* Items list */}
          <div className="p-4 space-y-2">
            {log.items.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                <div>
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-zinc-500">{Math.round(item.portionG)}g</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-emerald-400">{Math.round(item.kcal)} kcal</div>
                  <div className="text-xs text-zinc-500">
                    {Math.round(item.protein)}p · {Math.round(item.carbs)}k · {Math.round(item.fat)}f
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes if any */}
          {log.notes && (
            <div className="px-4 pb-4">
              <p className="text-sm text-zinc-400 italic">{log.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="px-4 pb-4">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Ta bort
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
