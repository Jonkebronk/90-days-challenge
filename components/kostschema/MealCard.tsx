'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScaledMeal } from '@/lib/kostschema/types'
import { IngredientColumn } from './IngredientColumn'

interface MealCardProps {
  meal: ScaledMeal
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
}

export function MealCard({ meal, onChangeIngredient }: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleChangeIngredient = (category: 'protein' | 'kolhydrat' | 'fett', index: number) => {
    onChangeIngredient?.(meal.type, category, index)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <CardHeader
        className="cursor-pointer py-3 px-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-white">{meal.name}</div>
            <div className="text-xs text-zinc-500">({meal.kcalPercent}% av dagsbehov)</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-3 text-sm">
              <span className="text-orange-400">{meal.kcal} kcal</span>
              <span className="text-red-400">P: {meal.protein}g</span>
              <span className="text-blue-400">K: {meal.carbs}g</span>
              <span className="text-yellow-400">F: {meal.fat}g</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4 border-t border-zinc-800">
          <div className="grid grid-cols-3 gap-6 mt-4">
            <IngredientColumn
              title="Kolhydrater"
              ingredients={meal.template.kolhydrat}
              color="text-blue-400"
              category="kolhydrat"
              onChangeIngredient={handleChangeIngredient}
            />
            <IngredientColumn
              title="Protein"
              ingredients={meal.template.protein}
              color="text-red-400"
              category="protein"
              onChangeIngredient={handleChangeIngredient}
            />
            <IngredientColumn
              title="Fett"
              ingredients={meal.template.fett}
              color="text-yellow-400"
              category="fett"
              onChangeIngredient={handleChangeIngredient}
            />
          </div>

          {/* Tillägg (additions) */}
          {meal.template.tillagg.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-semibold text-green-400 mb-2">Tillägg</h4>
              <div className="flex flex-wrap gap-3">
                {meal.template.tillagg.map((item) => (
                  <div key={item.id} className="text-sm text-zinc-300">
                    {item.name}: <span className="text-gold-500">{Math.round(item.scaledAmount)} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kosttillskott (supplements) */}
          {meal.template.kosttillskott && meal.template.kosttillskott.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-semibold text-purple-400 mb-2">Kosttillskott</h4>
              <div className="flex flex-wrap gap-3">
                {meal.template.kosttillskott.map((item) => (
                  <div key={item.id} className="text-sm text-zinc-300">
                    {item.name}: <span className="text-gold-500">{item.amount} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
