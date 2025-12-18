'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ChevronDown, Check, Info } from 'lucide-react'

// Types
type ActivityLevel = 'sedentary' | 'moderate' | 'very_active'
type Goal = 'loss_500' | 'loss_700' | 'loss_1000' | 'maintain' | 'gain' | 'reverse'
type ReverseRate = 'conservative' | 'aggressive'

interface WizardState {
  // Step 1: Metabolism
  weight: number
  activityLevel: ActivityLevel
  bmr: number // Calculated

  // Step 2: Goal
  goal: Goal
  currentCalories: number // For reverse diet
  reverseRate: ReverseRate
  targetCalories: number // Calculated

  // Step 3: Macros
  proteinPerKg: number
  fatPerKg: number
  proteinGrams: number // Calculated
  fatGrams: number // Calculated
  carbGrams: number // Calculated

  // Step 4: Meals
  mealsPerDay: number
}

interface AdjustMacrosWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSettings?: {
    weight?: number
    calories?: number
    protein?: number
    fat?: number
    carbs?: number
    mealsPerDay?: number
  }
  onSave: (settings: {
    weight: number
    activityLevel: ActivityLevel
    goal: Goal
    proteinPerKg: number
    fatPerKg: number
    mealsPerDay: number
    targetCalories: number
    proteinGrams: number
    fatGrams: number
    carbGrams: number
  }) => Promise<void>
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 25,
  moderate: 30,
  very_active: 35,
}

const GOAL_ADJUSTMENTS: Record<Exclude<Goal, 'reverse'>, number> = {
  loss_500: -550,
  loss_700: -770,
  loss_1000: -1100,
  maintain: 0,
  gain: 350,
}

const ACTIVITY_OPTIONS = [
  { value: 'sedentary' as ActivityLevel, label: 'Stillasittande', desc: 'Kroppsvikt x 25 = kcal/dag', multiplier: 25 },
  { value: 'moderate' as ActivityLevel, label: 'Måttligt aktiv (träning 2-4 ggr/vecka)', desc: 'Kroppsvikt x 30 = kcal/dag', multiplier: 30 },
  { value: 'very_active' as ActivityLevel, label: 'Mycket aktiv (tung träning 4+ ggr/vecka)', desc: 'Kroppsvikt x 35 = kcal/dag', multiplier: 35 },
]

const GOAL_OPTIONS = [
  { value: 'loss_500' as Goal, label: '500g/vecka', desc: 'Konservativt, bra för nybörjare', adjustment: -550, category: 'loss' },
  { value: 'loss_700' as Goal, label: '700g/vecka', desc: 'Optimal balans för de flesta', adjustment: -770, category: 'loss' },
  { value: 'loss_1000' as Goal, label: '1000g/vecka', desc: 'Aggressivt, kräver hög motivation', adjustment: -1100, category: 'loss' },
  { value: 'maintain' as Goal, label: 'Behåll vikt', desc: 'Behåll nuvarande vikt och kroppssammansättning', adjustment: 0, category: 'maintain' },
  { value: 'gain' as Goal, label: 'Viktuppgång', desc: 'Bygg muskelmassa med ett överskott på 350 kcal/dag', adjustment: 350, category: 'gain' },
  { value: 'reverse' as Goal, label: 'Reverse diet', desc: 'Gradvis ökning efter diet för att undvika metabolisk anpassning', adjustment: 0, category: 'reverse' },
]

export function AdjustMacrosWizard({ open, onOpenChange, currentSettings, onSave }: AdjustMacrosWizardProps) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const [state, setState] = useState<WizardState>({
    weight: currentSettings?.weight || 0,
    activityLevel: 'moderate',
    bmr: 0,
    goal: 'loss_700',
    currentCalories: currentSettings?.calories || 1500,
    reverseRate: 'conservative',
    targetCalories: 0,
    proteinPerKg: 2.5,
    fatPerKg: 0.7,
    proteinGrams: 0,
    fatGrams: 0,
    carbGrams: 0,
    mealsPerDay: 5,
  })

  // Calculate BMR when weight or activity changes
  useEffect(() => {
    const bmr = state.weight * ACTIVITY_MULTIPLIERS[state.activityLevel]
    setState(s => ({ ...s, bmr }))
  }, [state.weight, state.activityLevel])

  // Calculate target calories when goal changes
  useEffect(() => {
    let targetCalories: number

    if (state.goal === 'reverse') {
      // Reverse diet: start at current + 300, but max at estimated actual TDEE (90% of theoretical)
      const theoreticalTDEE = state.bmr
      const estimatedActualTDEE = theoreticalTDEE * 0.9
      const reverseStart = state.currentCalories + 300
      targetCalories = Math.min(reverseStart, estimatedActualTDEE)
    } else {
      targetCalories = state.bmr + GOAL_ADJUSTMENTS[state.goal]
    }

    setState(s => ({ ...s, targetCalories: Math.round(targetCalories) }))
  }, [state.bmr, state.goal, state.currentCalories])

  // Calculate macros when target calories or ratios change
  useEffect(() => {
    const proteinGrams = Math.round(state.weight * state.proteinPerKg)
    const fatGrams = Math.round(state.weight * state.fatPerKg)
    const proteinCals = proteinGrams * 4
    const fatCals = fatGrams * 9
    const remainingCals = state.targetCalories - proteinCals - fatCals
    const carbGrams = Math.max(0, Math.round(remainingCals / 4))

    setState(s => ({ ...s, proteinGrams, fatGrams, carbGrams }))
  }, [state.targetCalories, state.weight, state.proteinPerKg, state.fatPerKg])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        weight: state.weight,
        activityLevel: state.activityLevel,
        goal: state.goal,
        proteinPerKg: state.proteinPerKg,
        fatPerKg: state.fatPerKg,
        mealsPerDay: state.mealsPerDay,
        targetCalories: state.targetCalories,
        proteinGrams: state.proteinGrams,
        fatGrams: state.fatGrams,
        carbGrams: state.carbGrams,
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
      case 1: return state.weight > 0
      case 2: return state.goal !== null
      case 3: return state.proteinPerKg >= 1.6 && state.fatPerKg >= 0.5
      case 4: return state.mealsPerDay >= 2 && state.mealsPerDay <= 7
      default: return true
    }
  }

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Justera kostplan</DialogTitle>
          {/* Progress indicator */}
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
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
          {/* Step 1: Metabolism */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Beräkna ämnesomsättning</h3>
                <p className="text-sm text-gray-500">Använd formeln baserat på klientens aktivitetsnivå</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="weight">Kroppsvikt</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="weight"
                      type="number"
                      value={state.weight || ''}
                      onChange={(e) => setState(s => ({ ...s, weight: parseFloat(e.target.value) || 0 }))}
                      placeholder="Ange vikt"
                      className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-gray-500">kg</span>
                  </div>
                </div>

                <div>
                  <Label>Aktivitetsnivå</Label>
                  <div className="space-y-2 mt-2">
                    {ACTIVITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setState(s => ({ ...s, activityLevel: option.value }))}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-colors",
                          state.activityLevel === option.value
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Result preview */}
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Beräknat dagligt energibehov</div>
                <div className="text-2xl font-bold text-amber-600">{state.bmr} kcal/dag</div>
                <div className="text-sm text-gray-500">{state.weight} kg x {ACTIVITY_MULTIPLIERS[state.activityLevel]} = {state.bmr} kcal</div>
              </div>
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Välj mål</h3>
                <p className="text-sm text-gray-500">Välj om klienten ska gå ner, behålla eller gå upp i vikt</p>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong>Kom ihåg:</strong> 1 kg kroppsfett = 7 700 kcal
                </div>
              </div>

              {/* Collapsible Goal Categories */}
              <div className="space-y-2">
                {/* Weight Loss */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === 'loss' ? null : 'loss')}
                    className={cn(
                      "w-full p-3 flex items-center justify-between transition-colors",
                      expandedCategory === 'loss' ? "bg-gray-50" : "hover:bg-gray-50",
                      GOAL_OPTIONS.filter(o => o.category === 'loss').some(o => o.value === state.goal) && "bg-amber-50 border-amber-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">↘</span>
                      <span className="font-medium text-gray-700">VIKTMINSKNING</span>
                      {GOAL_OPTIONS.filter(o => o.category === 'loss').some(o => o.value === state.goal) && (
                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                          {GOAL_OPTIONS.find(o => o.value === state.goal)?.label}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", expandedCategory === 'loss' && "rotate-180")} />
                  </button>
                  {expandedCategory === 'loss' && (
                    <div className="p-2 space-y-2 border-t border-gray-100">
                      {GOAL_OPTIONS.filter(o => o.category === 'loss').map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setState(s => ({ ...s, goal: option.value }))}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left transition-colors",
                            state.goal === option.value
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.adjustment} kcal/dag</div>
                          </div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Maintain */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === 'maintain' ? null : 'maintain')}
                    className={cn(
                      "w-full p-3 flex items-center justify-between transition-colors",
                      expandedCategory === 'maintain' ? "bg-gray-50" : "hover:bg-gray-50",
                      state.goal === 'maintain' && "bg-amber-50 border-amber-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">—</span>
                      <span className="font-medium text-gray-700">BALANS</span>
                      {state.goal === 'maintain' && (
                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Vald</span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", expandedCategory === 'maintain' && "rotate-180")} />
                  </button>
                  {expandedCategory === 'maintain' && (
                    <div className="p-2 border-t border-gray-100">
                      {GOAL_OPTIONS.filter(o => o.category === 'maintain').map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setState(s => ({ ...s, goal: option.value }))}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left transition-colors",
                            state.goal === option.value
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weight Gain */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === 'gain' ? null : 'gain')}
                    className={cn(
                      "w-full p-3 flex items-center justify-between transition-colors",
                      expandedCategory === 'gain' ? "bg-gray-50" : "hover:bg-gray-50",
                      state.goal === 'gain' && "bg-amber-50 border-amber-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">↗</span>
                      <span className="font-medium text-gray-700">VIKTUPPGÅNG</span>
                      {state.goal === 'gain' && (
                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Vald</span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", expandedCategory === 'gain' && "rotate-180")} />
                  </button>
                  {expandedCategory === 'gain' && (
                    <div className="p-2 border-t border-gray-100">
                      {GOAL_OPTIONS.filter(o => o.category === 'gain').map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setState(s => ({ ...s, goal: option.value }))}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left transition-colors",
                            state.goal === option.value
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reverse Diet */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === 'reverse' ? null : 'reverse')}
                    className={cn(
                      "w-full p-3 flex items-center justify-between transition-colors",
                      expandedCategory === 'reverse' ? "bg-gray-50" : "hover:bg-gray-50",
                      state.goal === 'reverse' && "bg-amber-50 border-amber-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">↺</span>
                      <span className="font-medium text-gray-700">REVERSE DIET</span>
                      {state.goal === 'reverse' && (
                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Vald</span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", expandedCategory === 'reverse' && "rotate-180")} />
                  </button>
                  {expandedCategory === 'reverse' && (
                    <div className="p-2 border-t border-gray-100">
                      {GOAL_OPTIONS.filter(o => o.category === 'reverse').map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setState(s => ({ ...s, goal: option.value }))}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left transition-colors",
                            state.goal === option.value
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reverse diet extra fields */}
              {state.goal === 'reverse' && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div>
                    <Label htmlFor="currentCalories">Nuvarande kalorier (slutkalorier från diet)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="currentCalories"
                        type="number"
                        value={state.currentCalories}
                        onChange={(e) => setState(s => ({ ...s, currentCalories: parseInt(e.target.value) || 0 }))}
                        className="w-32"
                      />
                      <span className="text-gray-500">kcal</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Startkalorier:</strong> {state.currentCalories + 300} kcal (nuvarande + 300)</p>
                    <p><strong>Målkalorier:</strong> {state.bmr} kcal (teoretisk TDEE)</p>
                    <p><strong>Höjning:</strong> 5-10% var 14:e dag</p>
                  </div>
                </div>
              )}

              {/* Result preview */}
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Dagligt kaloriintag</div>
                <div className="text-2xl font-bold text-amber-600">{state.targetCalories} kcal</div>
                {state.goal !== 'reverse' && state.goal !== 'maintain' && (
                  <div className="text-sm text-gray-500">
                    {state.bmr} {GOAL_ADJUSTMENTS[state.goal] > 0 ? '+' : ''}{GOAL_ADJUSTMENTS[state.goal]} = {state.targetCalories} kcal
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Macros */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Fördela makronutrienter</h3>
                <p className="text-sm text-gray-500">Ställ in proteinmål och se fördelningen</p>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong>Energivärden:</strong> Protein 4 kcal/g, Kolhydrater 4 kcal/g, Fett 9 kcal/g
                </div>
              </div>

              {/* Protein slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Protein per kg kroppsvikt</Label>
                  <span className="text-lg font-semibold text-rose-600">{state.proteinPerKg}g/kg</span>
                </div>
                <input
                  type="range"
                  min="1.6"
                  max="2.5"
                  step="0.1"
                  value={state.proteinPerKg}
                  onChange={(e) => setState(s => ({ ...s, proteinPerKg: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1.6g/kg</span>
                  <span>2.5g/kg</span>
                </div>
              </div>

              {/* Fat slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Fett per kg kroppsvikt</Label>
                  <span className="text-lg font-semibold text-amber-600">{state.fatPerKg}g/kg</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.2"
                  step="0.1"
                  value={state.fatPerKg}
                  onChange={(e) => setState(s => ({ ...s, fatPerKg: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5g/kg (min)</span>
                  <span className="text-amber-600">0.7g/kg (rek.)</span>
                  <span>1.2g/kg</span>
                </div>
              </div>

              {/* Standard distribution info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Standardfördelning:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Protein:</div>
                  <div className="text-right">{state.proteinPerKg}g per kg kroppsvikt</div>
                  <div>Fett:</div>
                  <div className="text-right">{state.fatPerKg}g per kg kroppsvikt</div>
                  <div>Kolhydrater:</div>
                  <div className="text-right">Resterande kalorier</div>
                </div>
              </div>

              {/* Macro results */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-rose-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-rose-600 uppercase font-medium">Protein</div>
                  <div className="text-xl font-bold text-rose-700">{state.proteinGrams}g</div>
                  <div className="text-xs text-gray-500">{state.proteinGrams * 4} kcal</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-amber-600 uppercase font-medium">Fett</div>
                  <div className="text-xl font-bold text-amber-700">{state.fatGrams}g</div>
                  <div className="text-xs text-gray-500">{state.fatGrams * 9} kcal</div>
                </div>
                <div className="bg-sky-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-sky-600 uppercase font-medium">Kolhydrater</div>
                  <div className="text-xl font-bold text-sky-700">{state.carbGrams}g</div>
                  <div className="text-xs text-gray-500">{state.carbGrams * 4} kcal</div>
                </div>
              </div>

              {/* Total check */}
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600">
                  Totalt: {state.proteinGrams * 4 + state.fatGrams * 9 + state.carbGrams * 4} kcal / {state.targetCalories} kcal mål
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Meals per day */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Måltider per dag</h3>
                <p className="text-sm text-gray-500">Konfigurera måltidsfrekvens</p>
              </div>

              <div className="space-y-2">
                {[2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => setState(s => ({ ...s, mealsPerDay: num }))}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-colors flex justify-between items-center",
                      state.mealsPerDay === num
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span className="font-medium">{num} måltider</span>
                    {state.mealsPerDay === num && <Check className="w-5 h-5 text-amber-600" />}
                  </button>
                ))}
              </div>

              {/* Preview of calories per meal */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Ungefärlig fördelning:</div>
                <div className="text-sm text-gray-600">
                  ~{Math.round(state.targetCalories / state.mealsPerDay)} kcal per måltid
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Summary */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Sammanställning</h3>
                <p className="text-sm text-gray-500">Granska alla val och spara</p>
              </div>

              {/* Summary card */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                {/* Energy & Macros */}
                <div className="border-b border-gray-200 pb-3">
                  <div className="text-sm font-medium text-gray-500 mb-2">ENERGI & MAKROS</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Ämnesomsättning</div>
                    <div className="text-right font-medium">{state.bmr} kcal</div>
                    <div>Underskott/överskott</div>
                    <div className="text-right font-medium">
                      {state.goal === 'reverse'
                        ? `+${state.targetCalories - state.currentCalories} kcal`
                        : state.goal === 'maintain'
                          ? '0 kcal'
                          : `${GOAL_ADJUSTMENTS[state.goal]} kcal`}
                    </div>
                    <div className="font-medium">Dagligt energimål</div>
                    <div className="text-right font-bold text-amber-600">{state.targetCalories} kcal</div>
                  </div>
                </div>

                {/* Macronutrients */}
                <div className="border-b border-gray-200 pb-3">
                  <div className="text-sm font-medium text-gray-500 mb-2">MAKRONUTRIENTER</div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-rose-600 font-bold">{state.proteinGrams}g</div>
                      <div className="text-xs text-gray-500">{state.proteinPerKg}g/kg</div>
                      <div className="text-xs text-gray-400">Protein</div>
                    </div>
                    <div>
                      <div className="text-amber-600 font-bold">{state.fatGrams}g</div>
                      <div className="text-xs text-gray-500">{state.fatPerKg}g/kg</div>
                      <div className="text-xs text-gray-400">Fett</div>
                    </div>
                    <div>
                      <div className="text-sky-600 font-bold">{state.carbGrams}g</div>
                      <div className="text-xs text-gray-500">resterande</div>
                      <div className="text-xs text-gray-400">Kolhydrater</div>
                    </div>
                  </div>
                </div>

                {/* Meal plan */}
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">MÅLTIDSPLAN</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Måltider per dag</div>
                    <div className="text-right font-medium">{state.mealsPerDay}</div>
                  </div>
                </div>
              </div>

              {/* Result table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Makro</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Gram</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Kcal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-2 text-rose-600">Protein</td>
                      <td className="px-4 py-2 text-right">{state.proteinGrams}g</td>
                      <td className="px-4 py-2 text-right">{state.proteinGrams * 4}</td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-2 text-amber-600">Fett</td>
                      <td className="px-4 py-2 text-right">{state.fatGrams}g</td>
                      <td className="px-4 py-2 text-right">{state.fatGrams * 9}</td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-2 text-sky-600">Kolhydrater</td>
                      <td className="px-4 py-2 text-right">{state.carbGrams}g</td>
                      <td className="px-4 py-2 text-right">{state.carbGrams * 4}</td>
                    </tr>
                    <tr className="border-t border-gray-200 bg-amber-50">
                      <td className="px-4 py-2 font-medium">Totalt</td>
                      <td className="px-4 py-2 text-right">-</td>
                      <td className="px-4 py-2 text-right font-bold text-amber-600">{state.targetCalories} kcal</td>
                    </tr>
                  </tbody>
                </table>
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

          {step < 5 ? (
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
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {saving ? 'Sparar...' : 'Spara plan'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
