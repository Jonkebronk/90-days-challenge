'use client'

import { Trash2 } from 'lucide-react'
import { ScaledMeal, MealTiming } from '@/lib/kostschema/types'
import { MealCard } from './MealCard'
import { calculateDailyTotals } from '@/lib/kostschema/hooks/useScaledMeals'

interface MealPlanDisplayProps {
  meals: (ScaledMeal & { mealTiming?: MealTiming })[]
  mealCount: number
  setMealCount: (count: number) => void
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
  onDeleteIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onUpdateGrams?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number, grams: number) => void
  onAddTillagg?: (mealType: string, text: string) => void
  onRemoveTillagg?: (mealType: string, index: number) => void
  onAddSupplement?: (mealType: string, text: string) => void
  onRemoveSupplement?: (mealType: string, index: number) => void
  onClearMealPlan?: () => void
  mealTimings?: MealTiming[]
}

const mealCountOptions = [
  { value: 4, label: '4 måltider' },
  { value: 5, label: '5 måltider' },
  { value: 6, label: '6 måltider' }
]

export function MealPlanDisplay({
  meals,
  mealCount,
  setMealCount,
  onChangeIngredient,
  onAddIngredient,
  onDeleteIngredient,
  onUpdateGrams,
  onAddTillagg,
  onRemoveTillagg,
  onAddSupplement,
  onRemoveSupplement,
  onClearMealPlan,
  mealTimings
}: MealPlanDisplayProps) {
  const totals = calculateDailyTotals(meals)

  return (
    <div className="space-y-4">
      {/* Header with meal count selector */}
      <div className="flex items-center justify-between bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 rounded-2xl p-5 border border-zinc-700/50">
        <div>
          <h2 className="text-xl font-bold text-white">Måltidsplan</h2>
          <p className="text-sm text-zinc-400 mt-1">Klicka på en ingrediens för att byta</p>
        </div>
        <div className="flex items-center gap-3">
          {onClearMealPlan && (
            <button
              onClick={onClearMealPlan}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Töm måltidsplan
            </button>
          )}
          <div className="flex gap-2">
            {mealCountOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setMealCount(option.value)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mealCount === option.value
                    ? 'bg-gold-600 text-white shadow-lg shadow-gold-600/25'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meal cards */}
      <div className="space-y-4">
        {meals.map((meal) => (
          <MealCard
            key={meal.type}
            meal={meal}
            onChangeIngredient={onChangeIngredient}
            onAddIngredient={onAddIngredient}
            onDeleteIngredient={onDeleteIngredient}
            onUpdateGrams={onUpdateGrams}
            onAddTillagg={onAddTillagg}
            onRemoveTillagg={onRemoveTillagg}
            onAddSupplement={onAddSupplement}
            onRemoveSupplement={onRemoveSupplement}
          />
        ))}
      </div>

      {/* Daily totals */}
      {meals.length > 0 && (
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl p-5 border border-zinc-700/50">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-zinc-400 font-medium">Dagssumma</span>
              <p className="text-xs text-zinc-500 mt-0.5">Baserat på första alternativet per kategori</p>
            </div>
            <div className="flex gap-3">
              <span className="px-4 py-2 rounded-xl text-sm font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20">
                {totals.kcal} kcal
              </span>
              <span className="px-3 py-2 rounded-xl text-sm font-semibold bg-rose-500/15 text-rose-400">
                P: {totals.protein}g
              </span>
              <span className="px-3 py-2 rounded-xl text-sm font-semibold bg-blue-500/15 text-blue-400">
                K: {totals.carbs}g
              </span>
              <span className="px-3 py-2 rounded-xl text-sm font-semibold bg-amber-500/15 text-amber-400">
                F: {totals.fat}g
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
