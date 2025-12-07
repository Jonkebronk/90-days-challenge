'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScaledMeal, ScaledIngredient } from '@/lib/kostschema/types'

interface MealCardProps {
  meal: ScaledMeal
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
}

function IngredientItem({
  ingredient,
  onClick,
  isAlternative = false
}: {
  ingredient: ScaledIngredient
  onClick: () => void
  isAlternative?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-800/60 rounded-lg text-left hover:bg-zinc-700/60 transition-colors group"
    >
      <RefreshCw className="h-3.5 w-3.5 text-zinc-500 group-hover:text-gold-500 transition-colors flex-shrink-0" />
      <span className="text-sm text-zinc-100 truncate">
        {isAlternative && <span className="text-zinc-500 mr-1">eller</span>}
        {Math.round(ingredient.scaledAmount)}g {ingredient.name}
      </span>
    </button>
  )
}

function IngredientColumn({
  title,
  ingredients,
  category,
  mealType,
  color,
  onChangeIngredient,
  onAddIngredient
}: {
  title: string
  ingredients: ScaledIngredient[]
  category: 'protein' | 'kolhydrat' | 'fett'
  mealType: string
  color: string
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
}) {
  return (
    <div className="space-y-1.5">
      <h4 className={`text-xs font-medium ${color} uppercase tracking-wide`}>{title}</h4>
      <div className="space-y-1">
        {ingredients.map((ingredient, index) => (
          <IngredientItem
            key={ingredient.id}
            ingredient={ingredient}
            onClick={() => onChangeIngredient?.(mealType, category, index)}
            isAlternative={index > 0}
          />
        ))}

        {ingredients.length === 0 && (
          <div className="px-3 py-2 text-sm text-zinc-500 italic">Ingen källa</div>
        )}

        {onAddIngredient && (
          <button
            onClick={() => onAddIngredient(mealType, category)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-500 hover:text-gold-500 text-xs transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Lägg till</span>
          </button>
        )}
      </div>
    </div>
  )
}

export function MealCard({ meal, onChangeIngredient, onAddIngredient }: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
      <CardHeader
        className="cursor-pointer py-3 px-4 hover:bg-zinc-800/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-white">{meal.name}</div>
            <div className="text-xs text-zinc-500">({meal.kcalPercent}%)</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-xs">
              <span className="text-orange-400 font-medium">{meal.kcal} kcal</span>
              <span className="text-red-400">P {meal.protein}g</span>
              <span className="text-blue-400">K {meal.carbs}g</span>
              <span className="text-yellow-400">F {meal.fat}g</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4">
          <div className="grid grid-cols-3 gap-4 pt-3">
            <IngredientColumn
              title="Kolhydrat"
              ingredients={meal.template.kolhydrat}
              category="kolhydrat"
              mealType={meal.type}
              color="text-blue-400"
              onChangeIngredient={onChangeIngredient}
              onAddIngredient={onAddIngredient}
            />
            <IngredientColumn
              title="Protein"
              ingredients={meal.template.protein}
              category="protein"
              mealType={meal.type}
              color="text-red-400"
              onChangeIngredient={onChangeIngredient}
              onAddIngredient={onAddIngredient}
            />
            <IngredientColumn
              title="Fett"
              ingredients={meal.template.fett}
              category="fett"
              mealType={meal.type}
              color="text-yellow-400"
              onChangeIngredient={onChangeIngredient}
              onAddIngredient={onAddIngredient}
            />
          </div>

          {/* Tillägg & Kosttillskott - kompakt rad */}
          {(meal.template.tillagg.length > 0 || (meal.template.kosttillskott && meal.template.kosttillskott.length > 0)) && (
            <div className="mt-3 pt-3 border-t border-zinc-800/50 flex flex-wrap gap-2">
              {meal.template.tillagg.map((item) => (
                <span key={item.id} className="px-2 py-1 bg-zinc-800/50 rounded text-xs text-zinc-400">
                  {Math.round(item.scaledAmount)}g {item.name}
                </span>
              ))}
              {meal.template.kosttillskott?.map((item) => (
                <span key={item.id} className="px-2 py-1 bg-purple-500/10 rounded text-xs text-purple-400">
                  {item.amount} {item.unit} {item.name}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
