'use client'

import { Database, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface SLVFood {
  nummer: number
  namn: string
  typ: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number | null
  sugar: number | null
  salt: number | null
  saturatedFat: number | null
  vitaminA: number | null
  vitaminD: number | null
  vitaminC: number | null
  vitaminB12: number | null
  folate: number | null
  calcium: number | null
  iron: number | null
  magnesium: number | null
  potassium: number | null
  zinc: number | null
  iodine: number | null
}

interface SLVFoodDetailModalProps {
  isOpen: boolean
  food: SLVFood | null
  onClose: () => void
}

function MacroCard({
  label,
  value,
  unit,
  color
}: {
  label: string
  value: number | null
  unit: string
  color: 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'orange'
}) {
  if (value === null) return null

  const colorClasses = {
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
    green: 'bg-green-500/10 border-green-500/30 text-green-500',
    red: 'bg-red-500/10 border-red-500/30 text-red-500',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  }

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-lg font-bold">
        {value} <span className="text-xs font-normal opacity-70">{unit}</span>
      </p>
    </div>
  )
}

function NutrientRow({
  label,
  value,
  unit
}: {
  label: string
  value: number | null
  unit: string
}) {
  if (value === null) return null

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium">
        {value} <span className="text-gray-500 text-sm">{unit}</span>
      </span>
    </div>
  )
}

export function SLVFoodDetailModal({ isOpen, food, onClose }: SLVFoodDetailModalProps) {
  if (!food) return null

  const hasVitamins = food.vitaminA || food.vitaminD || food.vitaminC || food.vitaminB12 || food.folate
  const hasMinerals = food.calcium || food.iron || food.magnesium || food.potassium || food.zinc || food.iodine

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-gray-800 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-gray-400 text-sm font-normal">
            <Database className="w-5 h-5" />
            Livsmedelsverket
          </DialogTitle>
        </DialogHeader>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Food name */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
              <Database className="w-10 h-10 text-amber-500" />
            </div>

            <h1 className="text-xl font-bold text-amber-500 mb-1">
              {food.namn}
            </h1>
            <p className="text-gray-500 text-sm">
              SLV #{food.nummer} • {food.typ}
            </p>
          </div>

          {/* Main macros */}
          <div>
            <h2 className="text-amber-500 font-semibold mb-3">Makronäringsämnen</h2>
            <p className="text-gray-400 text-sm mb-4">Per 100g</p>

            <div className="grid grid-cols-2 gap-3">
              <MacroCard label="Energi" value={food.kcal} unit="kcal" color="amber" />
              <MacroCard label="Protein" value={food.protein} unit="g" color="blue" />
              <MacroCard label="Kolhydrater" value={food.carbs} unit="g" color="green" />
              <MacroCard label="Fett" value={food.fat} unit="g" color="red" />
            </div>
          </div>

          {/* Additional macros */}
          {(food.fiber || food.sugar || food.salt || food.saturatedFat) && (
            <div>
              <h2 className="text-amber-500 font-semibold mb-3">Övrigt</h2>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <NutrientRow label="Fiber" value={food.fiber} unit="g" />
                <NutrientRow label="Socker" value={food.sugar} unit="g" />
                <NutrientRow label="Mättat fett" value={food.saturatedFat} unit="g" />
                <NutrientRow label="Salt" value={food.salt} unit="g" />
              </div>
            </div>
          )}

          {/* Vitamins */}
          {hasVitamins && (
            <div>
              <h2 className="text-amber-500 font-semibold mb-3">Vitaminer</h2>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <NutrientRow label="Vitamin A" value={food.vitaminA} unit="µg" />
                <NutrientRow label="Vitamin D" value={food.vitaminD} unit="µg" />
                <NutrientRow label="Vitamin C" value={food.vitaminC} unit="mg" />
                <NutrientRow label="Vitamin B12" value={food.vitaminB12} unit="µg" />
                <NutrientRow label="Folat" value={food.folate} unit="µg" />
              </div>
            </div>
          )}

          {/* Minerals */}
          {hasMinerals && (
            <div>
              <h2 className="text-amber-500 font-semibold mb-3">Mineraler</h2>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <NutrientRow label="Kalcium" value={food.calcium} unit="mg" />
                <NutrientRow label="Järn" value={food.iron} unit="mg" />
                <NutrientRow label="Magnesium" value={food.magnesium} unit="mg" />
                <NutrientRow label="Kalium" value={food.potassium} unit="mg" />
                <NutrientRow label="Zink" value={food.zinc} unit="mg" />
                <NutrientRow label="Jod" value={food.iodine} unit="µg" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <p className="text-center text-gray-500 text-xs">
            Källa: Livsmedelsverkets livsmedelsdatabas
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
