'use client'

import { Button } from '@/components/ui/button'
import { Scale, RotateCcw } from 'lucide-react'
import { calculateScaleFactor } from '@/lib/kostschema/catalog'

interface MacroScalerProps {
  originalKcal: number
  targetKcal?: number
  isScaled: boolean
  onToggleScale: () => void
}

export function MacroScaler({ originalKcal, targetKcal, isScaled, onToggleScale }: MacroScalerProps) {
  if (!targetKcal || targetKcal === originalKcal) {
    return null
  }

  const factor = calculateScaleFactor(originalKcal, targetKcal)
  const percentChange = Math.round((factor - 1) * 100)
  const isIncrease = percentChange > 0

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm">
          <Scale className="w-4 h-4 text-gray-500" />
          {isScaled ? (
            <span className="text-gray-700">
              Skalat till <span className="font-semibold text-gold-primary">{targetKcal} kcal</span>
              <span className="text-gray-500 ml-1">
                ({isIncrease ? '+' : ''}{percentChange}%)
              </span>
            </span>
          ) : (
            <span className="text-gray-700">
              Original: <span className="font-semibold">{originalKcal} kcal</span>
              <span className="text-gray-500 ml-1">
                (ditt mål: {targetKcal} kcal)
              </span>
            </span>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleScale}
        className={isScaled
          ? "border-gray-300 hover:bg-gray-100"
          : "border-gold-primary text-gold-primary hover:bg-gold-primary/10"
        }
      >
        {isScaled ? (
          <>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Visa original
          </>
        ) : (
          <>
            <Scale className="w-4 h-4 mr-1.5" />
            Skala till {targetKcal} kcal
          </>
        )}
      </Button>
    </div>
  )
}
