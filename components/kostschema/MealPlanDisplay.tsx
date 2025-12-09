'use client'

import { Trash2, Dumbbell, Clock } from 'lucide-react'
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
  isTrainingDay?: boolean
  trainingTime?: string
}

// Workout separator component
function WorkoutSeparator({ time }: { time?: string }) {
  return (
    <div className="relative py-4">
      {/* Background lines */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      </div>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent translate-y-1" />
      </div>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent -translate-y-1" />
      </div>

      {/* Center badge */}
      <div className="relative flex justify-center">
        <div className="flex items-center gap-4 px-8 py-3 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-full shadow-xl shadow-emerald-500/30 border border-emerald-400/50">
          <div className="flex items-center gap-1">
            <Dumbbell className="w-5 h-5 text-white animate-pulse" />
            <Dumbbell className="w-4 h-4 text-emerald-200 -ml-2 rotate-45" />
          </div>
          <div className="text-center">
            <span className="text-base font-black text-white tracking-widest drop-shadow-lg">
              TRÄNINGSPASS
            </span>
            {time && (
              <div className="flex items-center justify-center gap-1 text-emerald-100 mt-0.5">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-semibold">{time}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Dumbbell className="w-4 h-4 text-emerald-200 -mr-2 -rotate-45" />
            <Dumbbell className="w-5 h-5 text-white animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
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
  mealTimings,
  isTrainingDay,
  trainingTime
}: MealPlanDisplayProps) {
  const totals = calculateDailyTotals(meals)

  // Find the index where we should insert the workout separator
  // It goes after the last pre-workout meal and before the first post-workout meal
  const workoutInsertIndex = isTrainingDay
    ? meals.findIndex(meal => meal.mealTiming?.isPostWorkout)
    : -1

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

      {/* Meal cards with workout separator */}
      <div className="space-y-4">
        {meals.map((meal, index) => (
          <div key={meal.type}>
            {/* Insert workout separator before post-workout meal */}
            {workoutInsertIndex === index && (
              <div className="mb-4">
                <WorkoutSeparator time={trainingTime} />
              </div>
            )}
            <MealCard
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
          </div>
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
