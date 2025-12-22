'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Check, Info } from 'lucide-react'

// Default meal names based on meal count
const DEFAULT_MEAL_NAMES: Record<number, string[]> = {
  2: ['Måltid 1', 'Måltid 2'],
  3: ['Frukost', 'Lunch', 'Middag'],
  4: ['Frukost', 'Lunch', 'Mellanmål', 'Middag'],
  5: ['Frukost', 'Mellanmål', 'Lunch', 'Mellanmål', 'Middag'],
  6: ['Frukost', 'Mellanmål', 'Lunch', 'Mellanmål', 'Middag', 'Kvällsmål'],
  7: ['Frukost', 'Mellanmål', 'Lunch', 'Mellanmål', 'Middag', 'Mellanmål', 'Kvällsmål'],
}

// Default training placement based on meal count
const DEFAULT_TRAINING_PLACEMENT: Record<number, { pre: number; post: number }> = {
  2: { pre: 1, post: 2 },
  3: { pre: 1, post: 2 },
  4: { pre: 2, post: 3 },
  5: { pre: 3, post: 4 },
  6: { pre: 3, post: 4 },
  7: { pre: 4, post: 5 },
}

interface QuickRedistributeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentMealsPerDay?: number
  onSave: (settings: {
    mealsPerDay: number
    preWorkoutMeal: number
    postWorkoutMeal: number
    mealNames: string[]
  }) => Promise<void>
}

export function QuickRedistributeDialog({
  open,
  onOpenChange,
  currentMealsPerDay = 5,
  onSave,
}: QuickRedistributeDialogProps) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [mealsPerDay, setMealsPerDay] = useState(currentMealsPerDay)
  const [preWorkoutMeal, setPreWorkoutMeal] = useState(DEFAULT_TRAINING_PLACEMENT[currentMealsPerDay]?.pre || 3)
  const [postWorkoutMeal, setPostWorkoutMeal] = useState(DEFAULT_TRAINING_PLACEMENT[currentMealsPerDay]?.post || 4)
  const [mealNames, setMealNames] = useState(DEFAULT_MEAL_NAMES[currentMealsPerDay] || DEFAULT_MEAL_NAMES[5])

  // Update defaults when mealsPerDay changes
  useEffect(() => {
    const defaults = DEFAULT_TRAINING_PLACEMENT[mealsPerDay] || DEFAULT_TRAINING_PLACEMENT[5]
    const defaultNames = DEFAULT_MEAL_NAMES[mealsPerDay] || DEFAULT_MEAL_NAMES[5]
    setPreWorkoutMeal(defaults.pre)
    setPostWorkoutMeal(defaults.post)
    setMealNames(defaultNames)
  }, [mealsPerDay])

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1)
      setMealsPerDay(currentMealsPerDay)
    }
  }, [open, currentMealsPerDay])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        mealsPerDay,
        preWorkoutMeal,
        postWorkoutMeal,
        mealNames,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return mealsPerDay >= 2 && mealsPerDay <= 7
      case 2: return preWorkoutMeal > 0 && postWorkoutMeal > preWorkoutMeal
      default: return true
    }
  }

  // Estimated calories per meal
  const estimatedKcalPerMeal = '~300-500'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Justera kostplan</DialogTitle>
          {/* Progress indicator */}
          <div className="flex gap-1 mt-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-amber-500" : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Meals per day */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Måltider per dag</h3>
                <p className="text-sm text-gray-500">Konfigurera måltidsfrekvens</p>
              </div>

              <div className="space-y-2">
                {[2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => setMealsPerDay(num)}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-colors flex justify-between items-center",
                      mealsPerDay === num
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span className="font-medium">{num} måltider</span>
                    {mealsPerDay === num && <Check className="w-5 h-5 text-amber-600" />}
                  </button>
                ))}
              </div>

              {/* Preview of calories per meal */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Ungefärlig fördelning:</div>
                <div className="text-sm text-gray-600">
                  {estimatedKcalPerMeal} kcal per måltid
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Training placement */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Träningsplacering</h3>
                <p className="text-sm text-gray-500">Välj vilka måltider som är före och efter träning</p>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong>Riktlinjer:</strong> Protein sprids jämnt över dagens måltider, kolhydraterna läggs främst kring träningspassen, och fettintaget hålls lågt i anslutning till träning.
                </div>
              </div>

              {/* Carb-free snacks info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <strong>Mellanmål:</strong> Mellanmål hålls kolhydratfria – kolhydraterna läggs istället på pre/post-workout.
                </div>
              </div>

              {/* Meal names editor */}
              <div>
                <Label className="text-sm font-medium">Måltidsnamn</Label>
                <p className="text-xs text-gray-500 mb-2">Anpassa namnen på måltiderna</p>
                <div className="space-y-2">
                  {mealNames.map((name, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...mealNames]
                          newNames[i] = e.target.value
                          setMealNames(newNames)
                        }}
                        className="flex-1 h-9"
                        placeholder={`Måltid ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pre-workout selector */}
              <div>
                <label className="text-sm font-medium">Pre-workout måltid</label>
                <p className="text-xs text-gray-500 mb-2">Måltiden innan träning</p>
                <div className="space-y-2">
                  {Array.from({ length: mealsPerDay }, (_, i) => i + 1)
                    .filter(num => num < mealsPerDay) // Can't be the last meal
                    .map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setPreWorkoutMeal(num)
                          if (postWorkoutMeal <= num) {
                            setPostWorkoutMeal(num + 1)
                          }
                        }}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-colors flex justify-between items-center",
                          preWorkoutMeal === num
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <span className="font-medium">{mealNames[num - 1] || `Måltid ${num}`}</span>
                        {preWorkoutMeal === num && <Check className="w-5 h-5 text-amber-600" />}
                      </button>
                    ))}
                </div>
              </div>

              {/* Post-workout selector */}
              <div>
                <label className="text-sm font-medium">Post-workout måltid</label>
                <p className="text-xs text-gray-500 mb-2">Måltiden efter träning (måste vara efter pre-workout)</p>
                <div className="space-y-2">
                  {Array.from({ length: mealsPerDay }, (_, i) => i + 1)
                    .filter(num => num > preWorkoutMeal && num <= mealsPerDay)
                    .map((num) => (
                      <button
                        key={num}
                        onClick={() => setPostWorkoutMeal(num)}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-colors flex justify-between items-center",
                          postWorkoutMeal === num
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <span className="font-medium">{mealNames[num - 1] || `Måltid ${num}`}</span>
                        {postWorkoutMeal === num && <Check className="w-5 h-5 text-green-600" />}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Tillbaka
          </Button>

          {step < 2 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Nästa
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving || !canProceed()}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {saving ? 'Sparar...' : 'Spara'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
