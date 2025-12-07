'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScaledMeal } from '@/lib/kostschema/types'
import { MealCard } from './MealCard'
import { calculateDailyTotals } from '@/lib/kostschema/hooks/useScaledMeals'

interface MealPlanDisplayProps {
  meals: ScaledMeal[]
  mealCount: number
  setMealCount: (count: number) => void
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
}

const mealCountOptions = [
  { value: 4, label: '4 måltider' },
  { value: 5, label: '5 måltider' },
  { value: 6, label: '6 måltider' }
]

export function MealPlanDisplay({ meals, mealCount, setMealCount, onChangeIngredient, onAddIngredient }: MealPlanDisplayProps) {
  const totals = calculateDailyTotals(meals)

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">Måltidsplan</CardTitle>
          <div className="flex gap-2">
            {mealCountOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setMealCount(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mealCount === option.value
                    ? 'bg-gold-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {meals.map((meal) => (
          <MealCard
            key={meal.type}
            meal={meal}
            onChangeIngredient={onChangeIngredient}
            onAddIngredient={onAddIngredient}
          />
        ))}

        {/* Daily totals */}
        {meals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400 font-medium">Dagssumma (baserat på första alternativet)</span>
              <div className="flex gap-4">
                <span className="text-orange-400 font-semibold">{totals.kcal} kcal</span>
                <span className="text-red-400">P: {totals.protein}g</span>
                <span className="text-blue-400">K: {totals.carbs}g</span>
                <span className="text-yellow-400">F: {totals.fat}g</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
