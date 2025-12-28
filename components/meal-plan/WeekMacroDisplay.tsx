'use client'

import { Button } from '@/components/ui/button'
import { Settings2 } from 'lucide-react'

interface DailyTarget {
  id: string
  dayOfWeek: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

interface WeekMacroDisplayProps {
  dailyTargets: DailyTarget[]
  selectedDay: number
  onDaySelect: (day: number) => void
  defaultCalories?: number
  calories: number
  protein: number
  fat: number
  carbs: number
  onAdjustClick: () => void
}

const WEEKDAY_LABELS = ['M', 'T', 'O', 'T', 'F', 'L', 'S']

export function WeekMacroDisplay({
  dailyTargets,
  selectedDay,
  onDaySelect,
  defaultCalories = 2000,
  calories,
  protein,
  fat,
  carbs,
  onAdjustClick
}: WeekMacroDisplayProps) {
  // Get current day of week (0 = Monday in our system)
  const today = new Date()
  const jsDay = today.getDay() // 0 = Sunday
  const currentDayOfWeek = jsDay === 0 ? 6 : jsDay - 1 // Convert to 0 = Monday

  // Get day number (1-7 for the week)
  const getWeekDayNumber = (dayIndex: number) => {
    const mondayDate = new Date(today)
    const diff = currentDayOfWeek - dayIndex
    mondayDate.setDate(today.getDate() - diff)
    return mondayDate.getDate()
  }

  // Get calories for a specific day
  const getCaloriesForDay = (dayOfWeek: number) => {
    const target = dailyTargets.find(t => t.dayOfWeek === dayOfWeek)
    return target ? Number(target.calories) : defaultCalories
  }

  // Calculate percentages for the macro bars (based on total grams)
  const totalGrams = protein + fat + carbs
  const proteinPercent = totalGrams > 0 ? (protein / totalGrams) * 100 : 33
  const fatPercent = totalGrams > 0 ? (fat / totalGrams) * 100 : 33
  const carbsPercent = totalGrams > 0 ? (carbs / totalGrams) * 100 : 34

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Week Calendar */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAY_LABELS.map((label, index) => {
            const isToday = index === currentDayOfWeek
            const isSelected = index === selectedDay
            const dayCalories = getCaloriesForDay(index)
            const dayNumber = getWeekDayNumber(index)

            return (
              <button
                key={index}
                onClick={() => onDaySelect(index)}
                className={`
                  flex flex-col items-center p-2 rounded-lg transition-all
                  ${isSelected ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}
                `}
              >
                {/* Weekday label */}
                <span className={`text-xs font-medium mb-1 ${
                  isSelected ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {label}
                </span>

                {/* Day number with circle for today */}
                <div className={`
                  w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mb-1
                  ${isToday && !isSelected ? 'bg-gray-900 text-white' : ''}
                  ${isSelected ? 'text-white' : 'text-gray-900'}
                `}>
                  {dayNumber}
                </div>

                {/* Calories */}
                <span className={`text-xs font-medium ${
                  isSelected ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {dayCalories}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Macro Display */}
      <div className="p-4">
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
                <linearGradient id="calorieGradientCombined" x1="0%" y1="0%" x2="100%" y2="0%">
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
                stroke="url(#calorieGradientCombined)"
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
    </div>
  )
}
