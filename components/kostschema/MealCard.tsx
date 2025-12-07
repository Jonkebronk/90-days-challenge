'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, RefreshCw } from 'lucide-react'
import { ScaledMeal, ScaledIngredient } from '@/lib/kostschema/types'

interface MealCardProps {
  meal: ScaledMeal
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
}

function IngredientItem({
  ingredient,
  onClick
}: {
  ingredient: ScaledIngredient
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-zinc-900/60 hover:bg-zinc-800 rounded-lg text-left transition-all group border border-transparent hover:border-gold-500/30"
    >
      <RefreshCw className="h-3.5 w-3.5 text-zinc-600 group-hover:text-gold-500 transition-colors flex-shrink-0" />
      <span className="text-sm text-zinc-200 group-hover:text-white truncate">
        <span className="text-gold-500 font-semibold">{Math.round(ingredient.scaledAmount)}g</span>
        {' '}{ingredient.name}
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
  color: 'rose' | 'blue' | 'amber'
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
}) {
  const colorClasses = {
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
  }

  const headerColors = {
    rose: 'bg-rose-500/5 border-rose-500/10',
    blue: 'bg-blue-500/5 border-blue-500/10',
    amber: 'bg-amber-500/5 border-amber-500/10'
  }

  return (
    <div className={`rounded-xl overflow-hidden border ${headerColors[color]}`}>
      {/* Header */}
      <div className={`px-3 py-2.5 border-b ${headerColors[color]}`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${colorClasses[color].split(' ')[2]}`}>
          {title}
        </p>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-0 bg-zinc-800/30">
        {ingredients.map((ingredient, index) => (
          <div key={ingredient.id}>
            {index > 0 && (
              <div className="flex items-center gap-2 py-2">
                <div className="h-px flex-1 bg-zinc-700/50" />
                <span className="text-[10px] text-gold-500/80 font-bold uppercase tracking-wider px-1">eller</span>
                <div className="h-px flex-1 bg-zinc-700/50" />
              </div>
            )}
            <IngredientItem
              ingredient={ingredient}
              onClick={() => onChangeIngredient?.(mealType, category, index)}
            />
          </div>
        ))}

        {ingredients.length === 0 && (
          <div className="py-3 text-sm text-zinc-600 italic text-center">Ingen källa</div>
        )}

        {onAddIngredient && (
          <button
            onClick={() => onAddIngredient(mealType, category)}
            className="w-full flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-zinc-700/30 text-zinc-500 hover:text-gold-500 text-xs transition-colors py-1.5"
          >
            <Plus className="h-3 w-3" />
            <span>Lägg till alternativ</span>
          </button>
        )}
      </div>
    </div>
  )
}

export function MealCard({ meal, onChangeIngredient, onAddIngredient }: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-gradient-to-b from-zinc-800/80 to-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-700/50 shadow-lg">
      {/* Header */}
      <button
        className="w-full cursor-pointer py-4 px-5 hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-white text-lg">{meal.name}</div>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              {meal.kcalPercent}%
            </span>
          </div>
          <div className="flex items-center gap-5">
            {/* Macro pills */}
            <div className="flex gap-2">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20">
                {meal.kcal} kcal
              </span>
              <span className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400">
                P {meal.protein}g
              </span>
              <span className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400">
                K {meal.carbs}g
              </span>
              <span className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400">
                F {meal.fat}g
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-500" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-3">
            <IngredientColumn
              title="Kolhydrat"
              ingredients={meal.template.kolhydrat}
              category="kolhydrat"
              mealType={meal.type}
              color="blue"
              onChangeIngredient={onChangeIngredient}
              onAddIngredient={onAddIngredient}
            />
            <IngredientColumn
              title="Protein"
              ingredients={meal.template.protein}
              category="protein"
              mealType={meal.type}
              color="rose"
              onChangeIngredient={onChangeIngredient}
              onAddIngredient={onAddIngredient}
            />
            <IngredientColumn
              title="Fett"
              ingredients={meal.template.fett}
              category="fett"
              mealType={meal.type}
              color="amber"
              onChangeIngredient={onChangeIngredient}
              onAddIngredient={onAddIngredient}
            />
          </div>

          {/* Tillägg & Kosttillskott */}
          {(meal.template.tillagg.length > 0 || (meal.template.kosttillskott && meal.template.kosttillskott.length > 0)) && (
            <div className="mt-4 pt-4 border-t border-zinc-700/30 flex flex-wrap gap-2">
              {meal.template.tillagg.map((item) => (
                <span key={item.id} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium">
                  {Math.round(item.scaledAmount)}g {item.name}
                </span>
              ))}
              {meal.template.kosttillskott?.map((item) => (
                <span key={item.id} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400 font-medium">
                  {item.amount} {item.unit} {item.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
