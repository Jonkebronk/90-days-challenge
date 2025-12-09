'use client'

import { useState } from 'react'
import { X, RefreshCw, Clock, ChefHat, Sparkles, ChevronRight, ChevronDown } from 'lucide-react'

interface RecipeSuggestion {
  id: string
  name: string
  description: string
  estimatedMacros: {
    kcal: number
    protein: number
    carbs: number
    fat: number
  }
  cookingTime: string
  difficulty: 'enkel' | 'medel' | 'avancerad'
  instructions: string[]
  tips: string
  seasonings: string[]
}

interface RecipeSuggestionPanelProps {
  recipes: RecipeSuggestion[]
  isLoading?: boolean
  onClose: () => void
  onRefresh: () => void
}

function RecipeCard({
  recipe,
  isExpanded,
  onToggle
}: {
  recipe: RecipeSuggestion
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
      {/* Card header - always visible */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-50 transition-colors"
      >
        {/* Food icon/placeholder */}
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-6 h-6 text-amber-600" />
        </div>

        {/* Recipe info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-zinc-800 truncate">{recipe.name}</h4>
          <p className="text-xs text-zinc-500">
            {recipe.estimatedMacros.kcal} kcal • P: {recipe.estimatedMacros.protein}g • K: {recipe.estimatedMacros.carbs}g • F: {recipe.estimatedMacros.fat}g
          </p>
        </div>

        {/* Expand icon */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-zinc-100 p-4 bg-zinc-50 space-y-4">
          {/* Description */}
          <p className="text-sm text-zinc-600 italic">{recipe.description}</p>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {recipe.cookingTime}
            </span>
            <span className="px-2 py-0.5 bg-zinc-200 rounded-full capitalize">
              {recipe.difficulty}
            </span>
          </div>

          {/* Instructions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Tillagning
            </p>
            <ol className="space-y-2">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span className="text-zinc-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          {recipe.tips && (
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                Tips
              </p>
              <p className="text-sm text-emerald-700">{recipe.tips}</p>
            </div>
          )}

          {/* Seasonings */}
          {recipe.seasonings && recipe.seasonings.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.seasonings.map((seasoning, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-zinc-100 rounded-full text-xs text-zinc-600"
                >
                  {seasoning}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function RecipeSuggestionPanel({
  recipes,
  isLoading,
  onClose,
  onRefresh
}: RecipeSuggestionPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t border-zinc-200">
        <div className="rounded-xl overflow-hidden border bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="px-4 py-3 border-b bg-gradient-to-r from-amber-100 to-orange-100 border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-bold uppercase tracking-wider text-amber-700">
                Receptforslag
              </p>
            </div>
          </div>
          <div className="p-6 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <p className="text-sm text-amber-700">Genererar receptforslag...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-200">
      <div className="rounded-xl overflow-hidden border bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-amber-100 to-orange-100 border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-bold uppercase tracking-wider text-amber-700">
              Receptforslag
            </p>
            <span className="text-xs text-amber-600 bg-amber-200 px-2 py-0.5 rounded-full">
              {recipes.length} alternativ
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              className="p-1.5 rounded hover:bg-amber-200 transition-colors"
              title="Generera nya forslag"
            >
              <RefreshCw className="h-4 w-4 text-amber-600" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-amber-200 transition-colors"
              title="Stang"
            >
              <X className="h-4 w-4 text-amber-600" />
            </button>
          </div>
        </div>

        {/* Recipe cards */}
        <div className="p-3 space-y-2 bg-white/80">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isExpanded={expandedId === recipe.id}
              onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
