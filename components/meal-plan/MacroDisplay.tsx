'use client'

import { Button } from '@/components/ui/button'
import { Settings2 } from 'lucide-react'

interface MacroDisplayProps {
  calories: number
  protein: number
  fat: number
  carbs: number
  onAdjustClick: () => void
}

export function MacroDisplay({ calories, protein, fat, carbs, onAdjustClick }: MacroDisplayProps) {
  // Calculate percentages for the macro bars (based on total grams)
  const totalGrams = protein + fat + carbs
  const proteinPercent = totalGrams > 0 ? (protein / totalGrams) * 100 : 33
  const fatPercent = totalGrams > 0 ? (fat / totalGrams) * 100 : 33
  const carbsPercent = totalGrams > 0 ? (carbs / totalGrams) * 100 : 34

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header with title and adjust button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Makros</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAdjustClick}
          className="text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          <Settings2 className="w-4 h-4 mr-1" />
          Justera
        </Button>
      </div>

      {/* Circular calorie display */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          {/* Circular progress ring */}
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
            </defs>
            {/* Progress circle - full ring to show goal */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#calorieGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset="0"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{Math.round(calories)}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">kcal/dag</span>
          </div>
        </div>
      </div>

      {/* Macro breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {/* Protein */}
        <div className="text-center">
          <div className="h-2 rounded-full bg-gray-100 mb-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-rose-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <div className="text-lg font-bold text-gray-900">{Math.round(protein)}g</div>
          <div className="text-xs text-gray-500 uppercase">Protein</div>
        </div>

        {/* Fat */}
        <div className="text-center">
          <div className="h-2 rounded-full bg-gray-100 mb-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <div className="text-lg font-bold text-gray-900">{Math.round(fat)}g</div>
          <div className="text-xs text-gray-500 uppercase">Fett</div>
        </div>

        {/* Carbs */}
        <div className="text-center">
          <div className="h-2 rounded-full bg-gray-100 mb-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <div className="text-lg font-bold text-gray-900">{Math.round(carbs)}g</div>
          <div className="text-xs text-gray-500 uppercase">Kolhydrater</div>
        </div>
      </div>
    </div>
  )
}
