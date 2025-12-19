'use client'

import { useState } from 'react'
import { CatalogSchema, calculateScaleFactor, calculateMacroPercentages } from '@/lib/kostschema/catalog'
import { CatalogMealCard } from './CatalogMealCard'
import { MacroScaler } from './MacroScaler'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { BookOpen, Pencil, Plus } from 'lucide-react'

interface CatalogDetailProps {
  schema: CatalogSchema | null
  clientKcal?: number
  onEditSchema?: (schemaId: string) => void
}

export function CatalogDetail({ schema, clientKcal, onEditSchema }: CatalogDetailProps) {
  const [isScaled, setIsScaled] = useState(false)

  if (!schema) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Inga scheman ännu
        </h3>
        <p className="text-sm text-gray-500 max-w-xs mb-4">
          Klicka på &quot;Nytt schema&quot; för att skapa ditt första kostschema.
        </p>
      </div>
    )
  }

  const scaleFactor = isScaled && clientKcal
    ? calculateScaleFactor(schema.totals.kcal, clientKcal)
    : 1

  const displayTotals = isScaled && clientKcal
    ? {
        protein: Math.round(schema.totals.protein * scaleFactor),
        carbs: Math.round(schema.totals.carbs * scaleFactor),
        fat: Math.round(schema.totals.fat * scaleFactor),
        kcal: Math.round(schema.totals.kcal * scaleFactor)
      }
    : schema.totals

  const macroPercentages = calculateMacroPercentages(displayTotals)

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Schema Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{schema.name}</h2>
            {schema.description && (
              <p className="text-sm text-gray-600">{schema.description}</p>
            )}
          </div>
          {onEditSchema && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditSchema(schema.id)}
              className="w-fit"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Redigera
            </Button>
          )}
        </div>

        {/* Macro Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 sm:p-5 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">
              Dagligt intag
            </h3>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {displayTotals.kcal} <span className="text-sm sm:text-base font-normal text-gray-500">kcal</span>
            </div>
          </div>

          {/* Macro Bars */}
          <div className="space-y-3">
            {/* Protein */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-red-600 font-medium">Protein</span>
                <span className="text-gray-700">{displayTotals.protein}g ({macroPercentages.protein}%)</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${macroPercentages.protein}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-amber-600 font-medium">Kolhydrater</span>
                <span className="text-gray-700">{displayTotals.carbs}g ({macroPercentages.carbs}%)</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${macroPercentages.carbs}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 font-medium">Fett</span>
                <span className="text-gray-700">{displayTotals.fat}g ({macroPercentages.fat}%)</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${macroPercentages.fat}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scaling Toggle */}
        {clientKcal && (
          <MacroScaler
            originalKcal={schema.totals.kcal}
            targetKcal={clientKcal}
            isScaled={isScaled}
            onToggleScale={() => setIsScaled(!isScaled)}
          />
        )}

        {/* Meals */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
            Måltider ({schema.meals.length} st)
          </h3>
          {schema.meals.map((meal) => (
            <CatalogMealCard
              key={meal.id}
              meal={meal}
              scaleFactor={scaleFactor}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
