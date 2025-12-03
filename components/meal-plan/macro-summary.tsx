'use client'

interface MacroSummaryProps {
  current: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
  target: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
}

export function MacroSummary({ current, target }: MacroSummaryProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Calories */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <span className="text-gray-900 font-semibold">
            {Math.round(current.calories)}/{Math.round(target.calories)}
          </span>
        </div>

        {/* Protein */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#ef4444] flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="text-gray-900 font-semibold">
            {Math.round(current.protein)}/{Math.round(target.protein)}
          </span>
        </div>

        {/* Fat */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#f59e0b] flex items-center justify-center">
            <span className="text-white text-xs font-bold">F</span>
          </div>
          <span className="text-gray-900 font-semibold">
            {Math.round(current.fat)}/{Math.round(target.fat)}
          </span>
        </div>

        {/* Carbs */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-gray-900 font-semibold">
            {Math.round(current.carbs)}/{Math.round(target.carbs)}
          </span>
        </div>
      </div>
    </div>
  )
}

// Compact version for meal headers
interface MealMacrosProps {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export function MealMacros({ calories, protein, fat, carbs }: MealMacrosProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Calories */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded-full bg-[#22c55e] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">K</span>
        </div>
        <span className="text-gray-700 font-medium">{Math.round(calories)}</span>
      </div>

      {/* Protein */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded-full bg-[#ef4444] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">P</span>
        </div>
        <span className="text-gray-700 font-medium">{Math.round(protein)}</span>
      </div>

      {/* Fat */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded-full bg-[#f59e0b] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">F</span>
        </div>
        <span className="text-gray-700 font-medium">{Math.round(fat)}</span>
      </div>

      {/* Carbs */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded-full bg-[#3b82f6] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">C</span>
        </div>
        <span className="text-gray-700 font-medium">{Math.round(carbs)}</span>
      </div>
    </div>
  )
}
