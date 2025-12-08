'use client'

import { Loader2 } from 'lucide-react'
import { IngredientCard } from './IngredientCard'
import { Category, MealType } from '@/lib/stores/ingredient-library-store'

interface TransformedFood {
  slvNummer: number
  name: string
  protein: number
  carbs: number
  fat: number
  kcal: number
}

interface IngredientGridProps {
  foods: TransformedFood[]
  category: Category
  meal: MealType
  isLoading: boolean
}

export function IngredientGrid({ foods, category, meal, isLoading }: IngredientGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
      </div>
    )
  }

  if (foods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-zinc-400">Inga råvaror hittades</p>
        <p className="text-sm text-zinc-500 mt-1">Prova att söka eller välj en annan kategori</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {foods.map((food) => (
        <IngredientCard
          key={food.slvNummer}
          food={food}
          category={category}
          meal={meal}
        />
      ))}
    </div>
  )
}
