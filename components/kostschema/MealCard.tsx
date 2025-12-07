'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScaledMeal, ScaledIngredient } from '@/lib/kostschema/types'

interface MealCardProps {
  meal: ScaledMeal
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onRemoveIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
}

function IngredientInput({
  ingredient,
  onClick,
  onRemove,
  showRemove = true
}: {
  ingredient: ScaledIngredient
  onClick: () => void
  onRemove?: () => void
  showRemove?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-left hover:border-gold-500/50 hover:bg-zinc-800 transition-all group"
      >
        <span className="text-zinc-500">•</span>
        <span className="text-white">
          {Math.round(ingredient.scaledAmount)}g {ingredient.name}
        </span>
      </button>
      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function IngredientColumn({
  title,
  ingredients,
  category,
  mealType,
  onChangeIngredient,
  onRemoveIngredient,
  onAddIngredient
}: {
  title: string
  ingredients: ScaledIngredient[]
  category: 'protein' | 'kolhydrat' | 'fett'
  mealType: string
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onRemoveIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-zinc-400">{title}</h4>
      <div className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <div key={ingredient.id}>
            {index > 0 && (
              <div className="text-center py-1">
                <span className="text-xs font-semibold text-gold-500">ELLER</span>
              </div>
            )}
            <IngredientInput
              ingredient={ingredient}
              onClick={() => onChangeIngredient?.(mealType, category, index)}
              onRemove={ingredients.length > 1 ? () => onRemoveIngredient?.(mealType, category, index) : undefined}
              showRemove={ingredients.length > 1}
            />
          </div>
        ))}

        {/* Add alternative button */}
        {onAddIngredient && (
          <button
            onClick={() => onAddIngredient(mealType, category)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-zinc-700 rounded-lg text-gold-500 text-sm hover:border-gold-500/50 hover:bg-zinc-800/50 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Lägg till alternativ</span>
          </button>
        )}
      </div>
    </div>
  )
}

export function MealCard({ meal, onChangeIngredient, onRemoveIngredient, onAddIngredient }: MealCardProps) {
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
              title="Kolhydratskälla"
              ingredients={meal.template.kolhydrat}
              category="kolhydrat"
              mealType={meal.type}
              onChangeIngredient={onChangeIngredient}
              onRemoveIngredient={onRemoveIngredient}
              onAddIngredient={onAddIngredient}
            />
            <IngredientColumn
              title="Proteinkälla"
              ingredients={meal.template.protein}
              category="protein"
              mealType={meal.type}
              onChangeIngredient={onChangeIngredient}
              onRemoveIngredient={onRemoveIngredient}
              onAddIngredient={onAddIngredient}
            />
            <IngredientColumn
              title="Fettkälla"
              ingredients={meal.template.fett}
              category="fett"
              mealType={meal.type}
              onChangeIngredient={onChangeIngredient}
              onRemoveIngredient={onRemoveIngredient}
              onAddIngredient={onAddIngredient}
            />
          </div>

          {/* Tillägg (additions) */}
          {meal.template.tillagg.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Tillägg</h4>
              <div className="flex flex-wrap gap-2">
                {meal.template.tillagg.map((item) => (
                  <div key={item.id} className="px-3 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-300">
                    {Math.round(item.scaledAmount)}g {item.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kosttillskott (supplements) */}
          {meal.template.kosttillskott && meal.template.kosttillskott.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Kosttillskott</h4>
              <div className="flex flex-wrap gap-2">
                {meal.template.kosttillskott.map((item) => (
                  <div key={item.id} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm text-purple-300">
                    {item.amount} {item.unit} {item.name}
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
