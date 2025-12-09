'use client'

import { Trash2, Dumbbell } from 'lucide-react'
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
  onUpdateName?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number, name: string) => void
  onFindProducts?: (ingredientName: string, mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddTillagg?: (mealType: string, text: string) => void
  onRemoveTillagg?: (mealType: string, index: number) => void
  onAddSupplement?: (mealType: string, text: string) => void
  onRemoveSupplement?: (mealType: string, index: number) => void
  onClearMealPlan?: () => void
  onUpdateMealName?: (mealType: string, name: string) => void
  onUpdateInstructions?: (mealType: string, instructions: string) => void
  mealTimings?: MealTiming[]
  isTrainingDay?: boolean
  trainingTime?: string
  mealInstructions?: Record<string, string>
}

// Workout separator component - minimal design
function WorkoutSeparator({ time }: { time?: string }) {
  return (
    <div className="relative py-3">
      {/* Simple line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-emerald-500/30" />
      </div>

      {/* Center badge */}
      <div className="relative flex justify-center">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
          <Dumbbell className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">
            Träning
          </span>
          {time && (
            <span className="text-xs text-emerald-500/70">{time}</span>
          )}
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
  onUpdateName,
  onFindProducts,
  onAddTillagg,
  onRemoveTillagg,
  onAddSupplement,
  onRemoveSupplement,
  onClearMealPlan,
  onUpdateMealName,
  onUpdateInstructions,
  isTrainingDay,
  trainingTime,
  mealInstructions = {}
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Måltidsplan</h2>
        </div>
        <div className="flex items-center gap-3">
          {onClearMealPlan && (
            <button
              onClick={onClearMealPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Töm
            </button>
          )}
          <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
            {mealCountOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setMealCount(option.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mealCount === option.value
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {option.value}
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
              onUpdateName={onUpdateName}
              onFindProducts={onFindProducts}
              onAddTillagg={onAddTillagg}
              onRemoveTillagg={onRemoveTillagg}
              onAddSupplement={onAddSupplement}
              onRemoveSupplement={onRemoveSupplement}
              onUpdateMealName={onUpdateMealName}
              onUpdateInstructions={onUpdateInstructions}
              instructions={mealInstructions[meal.type] || ''}
            />
          </div>
        ))}
      </div>

      {/* Daily totals */}
      {meals.length > 0 && (
        <div className="flex items-center justify-between py-4 px-5 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
          <span className="text-sm text-zinc-400 font-medium">Dagstotalt</span>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-white">{totals.kcal} kcal</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-rose-400">P {totals.protein}g</span>
              <span className="text-blue-400">K {totals.carbs}g</span>
              <span className="text-amber-400">F {totals.fat}g</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
