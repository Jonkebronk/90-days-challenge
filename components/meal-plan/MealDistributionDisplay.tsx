'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, RotateCcw, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MealMacros {
  protein: number
  carbs: number
  fat: number
  kcal: number
}

interface MealDistribution {
  type: string
  label: string
  targetMacros: MealMacros
  isCustomized?: boolean
}

interface MealDistributionDisplayProps {
  meals: MealDistribution[]
  dailyTarget: MealMacros
  onUpdateMealMacros: (mealIndex: number, macros: MealMacros) => Promise<void>
  onResetToRecommended: () => Promise<void>
  isLoading?: boolean
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  frukost: 'Frukost',
  mellanmål: 'Mellanmål',
  lunch: 'Lunch',
  middag: 'Middag',
  kvällsmål: 'Kvällsmål',
}

export function MealDistributionDisplay({
  meals,
  dailyTarget,
  onUpdateMealMacros,
  onResetToRecommended,
  isLoading,
}: MealDistributionDisplayProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<MealMacros | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Calculate totals
  const totals = meals.reduce(
    (acc, meal) => ({
      protein: acc.protein + (meal.targetMacros?.protein || 0),
      carbs: acc.carbs + (meal.targetMacros?.carbs || 0),
      fat: acc.fat + (meal.targetMacros?.fat || 0),
      kcal: acc.kcal + (meal.targetMacros?.kcal || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, kcal: 0 }
  )

  // Check if any meal has been customized
  const hasCustomized = meals.some(m => m.isCustomized)

  // Check if totals match daily target (within 1g/kcal tolerance)
  const totalsMatch =
    Math.abs(totals.protein - dailyTarget.protein) <= 1 &&
    Math.abs(totals.carbs - dailyTarget.carbs) <= 1 &&
    Math.abs(totals.fat - dailyTarget.fat) <= 1 &&
    Math.abs(totals.kcal - dailyTarget.kcal) <= 5

  const handleEdit = (index: number, macros: MealMacros) => {
    setEditingIndex(index)
    setEditValues({ ...macros })
  }

  const handleSave = async () => {
    if (editingIndex === null || !editValues) return

    setIsSaving(true)
    try {
      await onUpdateMealMacros(editingIndex, editValues)
      setEditingIndex(null)
      setEditValues(null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setEditValues(null)
  }

  // Count meals by type for numbering
  const getMealLabel = (meal: MealDistribution, index: number): string => {
    const sameTypeBefore = meals.slice(0, index).filter(m => m.type === meal.type).length
    const totalOfType = meals.filter(m => m.type === meal.type).length
    const baseLabel = MEAL_TYPE_LABELS[meal.type] || meal.type
    return totalOfType > 1 ? `${baseLabel} ${sameTypeBefore + 1}` : baseLabel
  }

  if (meals.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Fördelning per måltid
        </h3>
        {hasCustomized && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetToRecommended}
            disabled={isLoading}
            className="text-gray-500 hover:text-amber-600 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Återställ
          </Button>
        )}
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 gap-2 text-xs font-medium text-gray-500 uppercase mb-2 px-2">
        <div className="col-span-2">Måltid</div>
        <div className="text-center">P</div>
        <div className="text-center">K</div>
        <div className="text-center">F</div>
        <div className="text-center">kcal</div>
      </div>

      {/* Meals */}
      <div className="space-y-1">
        {meals.map((meal, index) => (
          <div
            key={index}
            className={cn(
              "grid grid-cols-6 gap-2 items-center py-2 px-2 rounded-lg transition-colors",
              meal.isCustomized ? "bg-amber-50" : "hover:bg-gray-50"
            )}
          >
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">
                {getMealLabel(meal, index)}
              </span>
              {meal.isCustomized && (
                <span className="text-xs text-amber-600">*</span>
              )}
            </div>
            <div className="text-center text-sm text-gray-600">
              {Math.round(meal.targetMacros?.protein || 0)}g
            </div>
            <div className="text-center text-sm text-gray-600">
              {meal.targetMacros?.carbs ? `${Math.round(meal.targetMacros.carbs)}g` : '-'}
            </div>
            <div className="text-center text-sm text-gray-600">
              {meal.targetMacros?.fat ? `${Math.round(meal.targetMacros.fat)}g` : '-'}
            </div>
            <div className="text-center flex items-center justify-center gap-1">
              <span className="text-sm text-gray-600">
                {Math.round(meal.targetMacros?.kcal || 0)}
              </span>
              <button
                onClick={() => handleEdit(index, meal.targetMacros)}
                className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                title="Redigera"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Row */}
      <div className={cn(
        "grid grid-cols-6 gap-2 items-center py-2 px-2 mt-2 border-t border-gray-200 font-semibold",
        totalsMatch ? "text-green-600" : "text-amber-600"
      )}>
        <div className="col-span-2 text-sm">
          Totalt
          {!totalsMatch && (
            <span className="text-xs font-normal ml-1">(avviker)</span>
          )}
        </div>
        <div className="text-center text-sm">{Math.round(totals.protein)}g</div>
        <div className="text-center text-sm">{Math.round(totals.carbs)}g</div>
        <div className="text-center text-sm">{Math.round(totals.fat)}g</div>
        <div className="text-center text-sm">{Math.round(totals.kcal)}</div>
      </div>

      {/* Daily Target Row */}
      <div className="grid grid-cols-6 gap-2 items-center py-1 px-2 text-xs text-gray-400">
        <div className="col-span-2">Dagsmål</div>
        <div className="text-center">{Math.round(dailyTarget.protein)}g</div>
        <div className="text-center">{Math.round(dailyTarget.carbs)}g</div>
        <div className="text-center">{Math.round(dailyTarget.fat)}g</div>
        <div className="text-center">{Math.round(dailyTarget.kcal)}</div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              Redigera makros - {editingIndex !== null ? getMealLabel(meals[editingIndex], editingIndex) : ''}
            </DialogTitle>
          </DialogHeader>
          {editValues && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Protein (g)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={Math.round(editValues.protein)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditValues({
                        ...editValues,
                        protein: val,
                        kcal: val * 4 + editValues.carbs * 4 + editValues.fat * 9
                      });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Kolhydrater (g)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={Math.round(editValues.carbs)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditValues({
                        ...editValues,
                        carbs: val,
                        kcal: editValues.protein * 4 + val * 4 + editValues.fat * 9
                      });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fett (g)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={Math.round(editValues.fat)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditValues({
                        ...editValues,
                        fat: val,
                        kcal: editValues.protein * 4 + editValues.carbs * 4 + val * 9
                      });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Kalorier</label>
                  <Input
                    type="text"
                    value={Math.round(editValues.kcal)}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Kalorier beräknas automatiskt: P×4 + K×4 + F×9
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Avbryt
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Spara
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
