'use client'

import { Check } from 'lucide-react'
import { useIngredientLibraryStore, SelectedIngredient, Category, MealType } from '@/lib/stores/ingredient-library-store'

interface TransformedFood {
  slvNummer: number
  name: string
  protein: number
  carbs: number
  fat: number
  kcal: number
}

interface IngredientCardProps {
  food: TransformedFood
  category: Category
  meal: MealType
}

export function IngredientCard({ food, category, meal }: IngredientCardProps) {
  const { isSelected, toggleIngredient } = useIngredientLibraryStore()
  const selected = isSelected(meal, category, food.slvNummer)

  const handleToggle = () => {
    const ingredient: SelectedIngredient = {
      slvNummer: food.slvNummer,
      name: food.name,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      kcal: food.kcal
    }
    toggleIngredient(meal, category, ingredient)
  }

  // Highlight the dominant macro based on category
  const getCategoryColor = () => {
    switch (category) {
      case 'protein': return 'rose'
      case 'kolhydrat': return 'blue'
      case 'fett': return 'amber'
    }
  }

  const color = getCategoryColor()

  return (
    <button
      onClick={handleToggle}
      className={`p-3 rounded-xl border transition-all text-left w-full ${
        selected
          ? 'bg-gold-500/20 border-gold-500 ring-2 ring-gold-500/50'
          : 'bg-zinc-100 border-zinc-200 hover:border-gold-400 hover:bg-zinc-50'
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <span className={`text-sm font-medium line-clamp-2 flex-1 ${selected ? 'text-white' : 'text-zinc-800'}`}>
          {food.name}
        </span>
        {selected && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-black" />
          </div>
        )}
      </div>

      <div className="flex gap-2 text-xs flex-wrap">
        <span className={`${color === 'rose' ? 'text-rose-600 font-semibold' : 'text-rose-500/80'}`}>
          P: {Math.round(food.protein)}g
        </span>
        <span className={`${color === 'blue' ? 'text-blue-600 font-semibold' : 'text-blue-500/80'}`}>
          K: {Math.round(food.carbs)}g
        </span>
        <span className={`${color === 'amber' ? 'text-amber-600 font-semibold' : 'text-amber-500/80'}`}>
          F: {Math.round(food.fat)}g
        </span>
      </div>

      <div className={`text-xs mt-1.5 ${selected ? 'text-zinc-400' : 'text-zinc-500'}`}>
        {Math.round(food.kcal)} kcal/100g
      </div>
    </button>
  )
}
