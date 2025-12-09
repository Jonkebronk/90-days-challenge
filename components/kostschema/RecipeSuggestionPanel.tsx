'use client'

import { X, RefreshCw, Clock, ChefHat, Sparkles } from 'lucide-react'

interface Recipe {
  name: string
  description: string
  instructions: string[]
  tips: string
  suggestedSpices: string[]
  cookingTime: string
}

interface RecipeSuggestionPanelProps {
  recipe: Recipe
  isLoading?: boolean
  onClose: () => void
  onRefresh: () => void
}

export function RecipeSuggestionPanel({
  recipe,
  isLoading,
  onClose,
  onRefresh
}: RecipeSuggestionPanelProps) {
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
            <ChefHat className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-bold uppercase tracking-wider text-amber-700">
              Receptforslag
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              className="p-1.5 rounded hover:bg-amber-200 transition-colors"
              title="Generera nytt forslag"
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

        {/* Content */}
        <div className="p-4 bg-white/80 space-y-4">
          {/* Recipe name and time */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-zinc-800">{recipe.name}</h3>
              <p className="text-sm text-zinc-600 mt-0.5">{recipe.description}</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 rounded-full text-amber-700 text-xs font-medium whitespace-nowrap">
              <Clock className="h-3.5 w-3.5" />
              {recipe.cookingTime}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Tillagning
            </p>
            <ol className="space-y-2">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span className="text-zinc-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
              Tips
            </p>
            <p className="text-sm text-emerald-700">{recipe.tips}</p>
          </div>

          {/* Spices */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Foreslagna kryddor
            </p>
            <div className="flex flex-wrap gap-2">
              {recipe.suggestedSpices.map((spice, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-zinc-100 rounded-full text-xs text-zinc-600 font-medium"
                >
                  {spice}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
