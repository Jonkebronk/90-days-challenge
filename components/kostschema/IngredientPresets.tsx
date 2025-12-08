'use client'

import { Sparkles, Dumbbell, Salad, Leaf } from 'lucide-react'
import { useIngredientLibraryStore } from '@/lib/stores/ingredient-library-store'

const presets = [
  {
    id: 'standard' as const,
    name: 'Standard',
    icon: Sparkles,
    description: 'Balanserat urval'
  },
  {
    id: 'bulking' as const,
    name: 'Bulking',
    icon: Dumbbell,
    description: 'Högre kalorier'
  },
  {
    id: 'cutting' as const,
    name: 'Cutting',
    icon: Salad,
    description: 'Låg fett'
  },
  {
    id: 'vegetarian' as const,
    name: 'Vegetariskt',
    icon: Leaf,
    description: 'Utan kött/fisk'
  }
]

export function IngredientPresets() {
  const { applyPreset } = useIngredientLibraryStore()

  return (
    <div className="px-4 py-3 border-b border-zinc-700">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Snabbval</p>
      <div className="flex gap-2 flex-wrap">
        {presets.map((preset) => {
          const Icon = preset.icon
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 hover:text-white transition-colors"
              title={preset.description}
            >
              <Icon className="h-4 w-4 text-gold-500" />
              <span>{preset.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
