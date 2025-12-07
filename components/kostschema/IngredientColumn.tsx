'use client'

import { RefreshCw } from 'lucide-react'
import { ScaledIngredient } from '@/lib/kostschema/types'

interface IngredientColumnProps {
  title: string
  ingredients: ScaledIngredient[]
  color: string
  category: 'protein' | 'kolhydrat' | 'fett'
  onChangeIngredient?: (category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
}

export function IngredientColumn({
  title,
  ingredients,
  color,
  category,
  onChangeIngredient
}: IngredientColumnProps) {
  if (ingredients.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className={`text-sm font-semibold ${color}`}>{title}</h4>
      <div className="space-y-1">
        {ingredients.map((ingredient, index) => (
          <div key={ingredient.id} className="flex items-start gap-2 text-sm group">
            {index > 0 && (
              <span className="text-zinc-500 text-xs shrink-0">eller</span>
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-300">{ingredient.name}</span>
                  {onChangeIngredient && (
                    <button
                      onClick={() => onChangeIngredient(category, index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-700 rounded"
                      title="Byt ingrediens"
                    >
                      <RefreshCw className="h-3 w-3 text-gold-500" />
                    </button>
                  )}
                </div>
                <span className="text-gold-500 font-medium shrink-0 ml-2">
                  {Math.round(ingredient.scaledAmount)} {ingredient.unit}
                </span>
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                P: {ingredient.macros.protein}g | K: {ingredient.macros.carbs}g | F: {ingredient.macros.fat}g
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
