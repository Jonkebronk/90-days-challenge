'use client'

import { CatalogMeal, CatalogFoodItem } from '@/lib/kostschema/catalog'
import { Clock } from 'lucide-react'

interface CatalogMealCardProps {
  meal: CatalogMeal
  scaleFactor?: number
}

function getCategoryColor(category: CatalogFoodItem['category']): string {
  switch (category) {
    case 'protein':
      return 'text-red-600'
    case 'kolhydrat':
      return 'text-amber-600'
    case 'fett':
      return 'text-blue-600'
    case 'grönsak':
      return 'text-green-600'
    case 'tillskott':
      return 'text-purple-600'
    default:
      return 'text-gray-600'
  }
}

function getCategoryBgColor(category: CatalogFoodItem['category']): string {
  switch (category) {
    case 'protein':
      return 'bg-red-50'
    case 'kolhydrat':
      return 'bg-amber-50'
    case 'fett':
      return 'bg-blue-50'
    case 'grönsak':
      return 'bg-green-50'
    case 'tillskott':
      return 'bg-purple-50'
    default:
      return 'bg-gray-50'
  }
}

export function CatalogMealCard({ meal, scaleFactor = 1 }: CatalogMealCardProps) {
  const scale = (value: number) => Math.round(value * scaleFactor)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-3 sm:px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{meal.name}</h3>
            <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{meal.time}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-900 font-medium">{scale(meal.totalKcal)} kcal</span>
          </div>
        </div>
      </div>

      {/* Food Items - Mobile (Card layout) */}
      <div className="sm:hidden p-3 space-y-3">
        {meal.foods.map((food, index) => (
          <div key={index} className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getCategoryBgColor(food.category)} border ${getCategoryColor(food.category).replace('text-', 'border-')}`}></span>
              <div className="min-w-0">
                <p className="text-sm text-gray-900 font-medium truncate">{food.name}</p>
                <p className="text-xs text-gray-500">{scale(food.amountG)}g</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="text-red-600">{(food.protein * scaleFactor).toFixed(0)}P</span>
              <span className="text-amber-600">{(food.carbs * scaleFactor).toFixed(0)}K</span>
              <span className="text-blue-600">{(food.fat * scaleFactor).toFixed(0)}F</span>
            </div>
          </div>
        ))}
        {/* Meal Totals Mobile */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">Totalt</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-600 font-medium">{scale(meal.totalProtein)}P</span>
              <span className="text-amber-600 font-medium">{scale(meal.totalCarbs)}K</span>
              <span className="text-blue-600 font-medium">{scale(meal.totalFat)}F</span>
              <span className="text-gray-900 font-semibold">{scale(meal.totalKcal)} kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Food Items - Desktop (Table layout) */}
      <div className="hidden sm:block p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left pb-2 font-medium">Livsmedel</th>
              <th className="text-right pb-2 font-medium w-16">Mängd</th>
              <th className="text-right pb-2 font-medium w-12">P</th>
              <th className="text-right pb-2 font-medium w-12">K</th>
              <th className="text-right pb-2 font-medium w-12">F</th>
              <th className="text-right pb-2 font-medium w-16">Kcal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {meal.foods.map((food, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getCategoryBgColor(food.category)} border ${getCategoryColor(food.category).replace('text-', 'border-')}`}></span>
                    <span className="text-gray-900">{food.name}</span>
                  </div>
                </td>
                <td className="py-2 text-right text-gray-600">{scale(food.amountG)}g</td>
                <td className="py-2 text-right text-red-600">{(food.protein * scaleFactor).toFixed(0)}</td>
                <td className="py-2 text-right text-amber-600">{(food.carbs * scaleFactor).toFixed(0)}</td>
                <td className="py-2 text-right text-blue-600">{(food.fat * scaleFactor).toFixed(0)}</td>
                <td className="py-2 text-right text-gray-900 font-medium">{scale(food.kcal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Meal Totals Desktop */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Totalt</span>
            <div className="flex items-center gap-4">
              <span className="text-red-600 font-medium">{scale(meal.totalProtein)}g P</span>
              <span className="text-amber-600 font-medium">{scale(meal.totalCarbs)}g K</span>
              <span className="text-blue-600 font-medium">{scale(meal.totalFat)}g F</span>
              <span className="text-gray-900 font-semibold">{scale(meal.totalKcal)} kcal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
