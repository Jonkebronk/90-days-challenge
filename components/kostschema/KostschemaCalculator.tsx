'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Package, Upload } from 'lucide-react'
import {
  ActivityLevel,
  IngredientOverrides,
  CustomFood,
  DeletedIngredients,
  FreeTextItem,
  DayOfWeek,
  DayConfig,
  MacroSourceMode,
  MealTiming
} from '@/lib/kostschema/types'
import { useScaledMeals } from '@/lib/kostschema/hooks/useScaledMeals'
import { useIngredientLibraryStore } from '@/lib/stores/ingredient-library-store'
import { createDefaultWeekConfig, calculateMealDistribution } from '@/lib/kostschema/macro-distribution'
import { WeekDaySelector } from './WeekDaySelector'
import { MacroInputPanel } from './MacroInputPanel'
import { MealPlanDisplay } from './MealPlanDisplay'
import { SLVFoodSearchModal } from './SLVFoodSearchModal'
import { IngredientLibraryPanel } from './IngredientLibraryPanel'
import { ImportFromImageDialog } from '@/components/meal-plan/ImportFromImageDialog'

interface IngredientChangeTarget {
  mealType: string
  category: 'protein' | 'kolhydrat' | 'fett'
  index: number
}

// Map meal types to API meal filter
function getMealApiType(mealType: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'evening' | undefined {
  if (mealType === 'breakfast') return 'breakfast'
  if (mealType === 'lunch') return 'lunch'
  if (mealType === 'dinner') return 'dinner'
  if (mealType.startsWith('snack')) return 'snack'
  if (mealType === 'evening') return 'evening'
  return undefined
}

// Free text items per meal type
type FreeTextOverrides = Record<string, FreeTextItem[]>

// Get today's day of week
function getTodayDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

export function KostschemaCalculator() {
  // Week configuration state
  const [weekConfig, setWeekConfig] = useState<Record<DayOfWeek, DayConfig>>(() => createDefaultWeekConfig())
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek())
  const [macroSourceMode, setMacroSourceMode] = useState<MacroSourceMode>('manual')

  // Calculator inputs (for calculate mode)
  const [bodyWeight, setBodyWeight] = useState<number>(85)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [proteinFactor, setProteinFactor] = useState<number>(2.5)

  // Meal count
  const [mealCount, setMealCount] = useState<number>(5)

  // Modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [changeTarget, setChangeTarget] = useState<IngredientChangeTarget | null>(null)

  // Get selected ingredient count from store
  const ingredientStore = useIngredientLibraryStore()

  // Custom ingredient overrides
  const [ingredientOverrides, setIngredientOverrides] = useState<IngredientOverrides>({})

  // Deleted ingredients
  const [deletedIngredients, setDeletedIngredients] = useState<DeletedIngredients>(new Set())

  // Free text items for tillägg and supplements
  const [tillaggOverrides, setTillaggOverrides] = useState<FreeTextOverrides>({})
  const [supplementOverrides, setSupplementOverrides] = useState<FreeTextOverrides>({})

  // ID counter for free text items
  const [nextId, setNextId] = useState(1)

  // Track if meal plan is cleared (empty mode)
  const [isMealPlanCleared, setIsMealPlanCleared] = useState(false)

  // Current day's configuration
  const currentDayConfig = weekConfig[selectedDay]

  // Calculate meal timings with macro distribution
  const mealTimings = useMemo(() => {
    return calculateMealDistribution(currentDayConfig, mealCount)
  }, [currentDayConfig, mealCount])

  // Create macro targets from day config for useScaledMeals
  const macroTargets = useMemo(() => ({
    kcal: currentDayConfig.totalCalories,
    protein: currentDayConfig.totalProtein,
    carbs: currentDayConfig.totalCarbs,
    fat: currentDayConfig.totalFat,
    tdee: currentDayConfig.totalCalories // Not used for scaling
  }), [currentDayConfig])

  // Get scaled meals based on macro targets and overrides
  const meals = useScaledMeals(macroTargets, mealCount, ingredientOverrides, deletedIngredients)

  // Compute original ingredient data for substitution preview
  const originalIngredient = useMemo(() => {
    if (!changeTarget) return undefined

    const meal = meals.find(m => m.type === changeTarget.mealType)
    if (!meal) return undefined

    const ingredient = meal.template[changeTarget.category]?.[changeTarget.index]
    if (!ingredient) return undefined

    const macroType: 'protein' | 'carbs' | 'fat' =
      changeTarget.category === 'protein' ? 'protein'
        : changeTarget.category === 'kolhydrat' ? 'carbs' : 'fat'

    const macroValue = macroType === 'protein' ? ingredient.macros.protein
      : macroType === 'carbs' ? ingredient.macros.carbs : ingredient.macros.fat
    const macroPer100g = ingredient.scaledAmount > 0
      ? (macroValue / ingredient.scaledAmount) * 100
      : 0

    return {
      name: ingredient.name,
      amount: Math.round(ingredient.scaledAmount),
      macroPer100g,
      macroType,
      macros: {
        protein: Math.round(ingredient.macros.protein),
        carbs: Math.round(ingredient.macros.carbs),
        fat: Math.round(ingredient.macros.fat),
        kcal: Math.round(ingredient.macros.kcal)
      }
    }
  }, [changeTarget, meals])

  // Handle day config change
  const handleDayConfigChange = (newConfig: DayConfig) => {
    setWeekConfig(prev => ({
      ...prev,
      [selectedDay]: newConfig
    }))
  }

  // Handle toggle training for a day
  const handleToggleTraining = (day: DayOfWeek) => {
    setWeekConfig(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isTrainingDay: !prev[day].isTrainingDay,
        trainingTime: !prev[day].isTrainingDay ? '15:00' : undefined
      }
    }))
  }

  // Handle ingredient change request
  const handleChangeIngredient = (
    mealType: string,
    category: 'protein' | 'kolhydrat' | 'fett',
    index: number
  ) => {
    setChangeTarget({ mealType, category, index })
    setIsSearchModalOpen(true)
  }

  // Handle add ingredient (opens modal to add new alternative)
  const handleAddIngredient = (
    mealType: string,
    category: 'protein' | 'kolhydrat' | 'fett'
  ) => {
    const meal = meals.find(m => m.type === mealType)
    if (!meal) return

    const currentCount = meal.template[category].length
    setChangeTarget({ mealType, category, index: currentCount })
    setIsSearchModalOpen(true)
  }

  // Handle food selection from SLV
  const handleFoodSelect = (food: CustomFood) => {
    if (!changeTarget) return

    const overrideKey = `${changeTarget.mealType}:${changeTarget.category}:${changeTarget.index}`

    // Exit cleared mode when adding ingredient
    setIsMealPlanCleared(false)

    setIngredientOverrides(prev => ({
      ...prev,
      [overrideKey]: food
    }))

    toast.success(
      `Ingrediens bytt till: ${food.name}`,
      {
        description: `P: ${food.protein}g | K: ${food.carbs}g | F: ${food.fat}g | ${food.kcal} kcal/100g`
      }
    )

    setIsSearchModalOpen(false)
    setChangeTarget(null)
  }

  // Handle delete ingredient
  const handleDeleteIngredient = (
    mealType: string,
    category: 'protein' | 'kolhydrat' | 'fett',
    index: number
  ) => {
    const overrideKey = `${mealType}:${category}:${index}`
    setDeletedIngredients(prev => new Set([...prev, overrideKey]))
    toast.success('Ingrediens borttagen')
  }

  // Handle update grams
  const handleUpdateGrams = (
    mealType: string,
    category: 'protein' | 'kolhydrat' | 'fett',
    index: number,
    grams: number
  ) => {
    const overrideKey = `${mealType}:${category}:${index}`

    const meal = meals.find(m => m.type === mealType)
    if (!meal) return

    const ingredient = meal.template[category]?.[index]
    if (!ingredient) return

    const existingOverride = ingredientOverrides[overrideKey]

    if (existingOverride) {
      setIngredientOverrides(prev => ({
        ...prev,
        [overrideKey]: { ...existingOverride, customAmount: grams }
      }))
    } else {
      const factor = ingredient.scaledAmount > 0 ? 100 / ingredient.scaledAmount : 1
      setIngredientOverrides(prev => ({
        ...prev,
        [overrideKey]: {
          slvNummer: ingredient.slvNummer || 0,
          name: ingredient.name,
          protein: Math.round(ingredient.macros.protein * factor * 10) / 10,
          carbs: Math.round(ingredient.macros.carbs * factor * 10) / 10,
          fat: Math.round(ingredient.macros.fat * factor * 10) / 10,
          kcal: Math.round(ingredient.macros.kcal * factor),
          customAmount: grams
        }
      }))
    }
  }

  // Handle add tillägg (free text)
  const handleAddTillagg = (mealType: string, text: string) => {
    setTillaggOverrides(prev => ({
      ...prev,
      [mealType]: [...(prev[mealType] || []), { id: nextId, text }]
    }))
    setNextId(prev => prev + 1)
    toast.success(`Tillagt: ${text}`)
  }

  // Handle remove tillägg
  const handleRemoveTillagg = (mealType: string, index: number) => {
    setTillaggOverrides(prev => ({
      ...prev,
      [mealType]: (prev[mealType] || []).filter((_, i) => i !== index)
    }))
  }

  // Handle add supplement (free text)
  const handleAddSupplement = (mealType: string, text: string) => {
    setSupplementOverrides(prev => ({
      ...prev,
      [mealType]: [...(prev[mealType] || []), { id: nextId, text }]
    }))
    setNextId(prev => prev + 1)
    toast.success(`Tillagt: ${text}`)
  }

  // Handle remove supplement
  const handleRemoveSupplement = (mealType: string, index: number) => {
    setSupplementOverrides(prev => ({
      ...prev,
      [mealType]: (prev[mealType] || []).filter((_, i) => i !== index)
    }))
  }

  // Handle clear meal plan - completely empty the plan
  const handleClearMealPlan = () => {
    setIngredientOverrides({})
    setDeletedIngredients(new Set())
    setTillaggOverrides({})
    setSupplementOverrides({})
    setIsMealPlanCleared(true)
    toast.success('Måltidsplan tömd')
  }

  // Handle import from image - fill view directly
  const handleImportToView = (plan: any) => {
    // Clear existing overrides and exit cleared mode
    setIngredientOverrides({})
    setDeletedIngredients(new Set())
    setTillaggOverrides({})
    setSupplementOverrides({})
    setIsMealPlanCleared(false)

    // Update meal count to match imported plan
    const importedMealCount = plan.meals.length
    if (importedMealCount >= 4 && importedMealCount <= 6) {
      setMealCount(importedMealCount)
    }

    // Update day config with imported totals
    const newDayConfig: DayConfig = {
      ...currentDayConfig,
      totalCalories: Math.round(plan.totals.kcal),
      totalProtein: Math.round(plan.totals.protein),
      totalCarbs: Math.round(plan.totals.carbs),
      totalFat: Math.round(plan.totals.fat)
    }
    handleDayConfigChange(newDayConfig)

    // Map meal types based on meal count
    const mealTypeMap: Record<number, string[]> = {
      4: ['breakfast', 'lunch', 'dinner', 'evening'],
      5: ['breakfast', 'snack1', 'lunch', 'dinner', 'evening'],
      6: ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'evening']
    }
    const mealTypes = mealTypeMap[importedMealCount] || mealTypeMap[5]

    // Create ingredient overrides from imported items
    const newOverrides: IngredientOverrides = {}
    const newTillagg: Record<string, FreeTextItem[]> = {}
    const newSupplements: Record<string, FreeTextItem[]> = {}
    let itemId = 1

    plan.meals.forEach((meal: any, mealIndex: number) => {
      const mealType = mealTypes[mealIndex] || `meal_${mealIndex + 1}`

      meal.items.forEach((item: any, itemIndex: number) => {
        // Determine category based on macros (simplified heuristic)
        let category: 'protein' | 'kolhydrat' | 'fett' = 'protein'
        const proteinRatio = item.protein / (item.protein + item.carbs + item.fat + 0.1)
        const carbsRatio = item.carbs / (item.protein + item.carbs + item.fat + 0.1)
        const fatRatio = item.fat / (item.protein + item.carbs + item.fat + 0.1)

        if (carbsRatio > proteinRatio && carbsRatio > fatRatio) {
          category = 'kolhydrat'
        } else if (fatRatio > proteinRatio && fatRatio > carbsRatio) {
          category = 'fett'
        }

        // Check if it's a supplement (very low macros, usually vitamins/omega-3)
        const totalMacros = item.protein + item.carbs + item.fat
        if (totalMacros < 5 && item.amount <= 10) {
          // Add as supplement
          if (!newSupplements[mealType]) newSupplements[mealType] = []
          newSupplements[mealType].push({ id: itemId++, text: item.name })
          return
        }

        // Create override key
        const overrideKey = `${mealType}:${category}:${itemIndex}`

        // Create CustomFood from imported item
        const customFood: CustomFood = {
          slvNummer: item.slv_match?.slvNummer || 0,
          name: item.alternatives && item.alternatives.length > 0
            ? `${item.name} eller ${item.alternatives.join(' eller ')}`
            : item.name,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          kcal: item.kcal,
          customAmount: item.amount
        }

        newOverrides[overrideKey] = customFood
      })
    })

    // Apply all at once
    setIngredientOverrides(newOverrides)
    setTillaggOverrides(newTillagg)
    setSupplementOverrides(newSupplements)
    setNextId(itemId)

    toast.success('Kostschema importerat!', {
      description: `${plan.meals.length} måltider med ${plan.meals.reduce((acc: number, m: any) => acc + m.items.length, 0)} ingredienser`
    })

    setIsImportDialogOpen(false)
  }

  // Add tillaggItems, supplementItems, and mealTimings to meals
  // If meal plan is cleared, return empty meals (no ingredients)
  const mealsWithExtras = useMemo(() => {
    if (isMealPlanCleared) {
      // Return meal structure but with empty ingredients
      return meals.map((meal, index) => ({
        ...meal,
        template: {
          protein: [],
          kolhydrat: [],
          fett: [],
          tillagg: [],
          kosttillskott: []
        },
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        tillaggItems: [],
        supplementItems: [],
        mealTiming: mealTimings[index]
      }))
    }
    return meals.map((meal, index) => ({
      ...meal,
      tillaggItems: tillaggOverrides[meal.type] || [],
      supplementItems: supplementOverrides[meal.type] || [],
      mealTiming: mealTimings[index] // Add per-meal timing/targets
    }))
  }, [meals, tillaggOverrides, supplementOverrides, mealTimings, isMealPlanCleared])

  const selectedCount = ingredientStore.getTotalCount()

  return (
    <div className="space-y-6">
      {/* Header with buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kostschema Generator</h1>
          <p className="text-sm text-zinc-400 mt-1">Konfigurera makros per dag och skapa måltidsplan</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Importera från bild</span>
          </button>
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 hover:text-white transition-colors"
          >
            <Package className="h-4 w-4 text-gold-500" />
            <span>Välj råvaror</span>
            {selectedCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs font-medium rounded-full">
                {selectedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Week Day Selector */}
      <WeekDaySelector
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        weekConfig={weekConfig}
        onToggleTraining={handleToggleTraining}
      />

      {/* Macro Input Panel */}
      <MacroInputPanel
        dayConfig={currentDayConfig}
        selectedDay={selectedDay}
        macroSourceMode={macroSourceMode}
        onMacroSourceModeChange={setMacroSourceMode}
        onDayConfigChange={handleDayConfigChange}
        bodyWeight={bodyWeight}
        onBodyWeightChange={setBodyWeight}
        activityLevel={activityLevel}
        onActivityLevelChange={setActivityLevel}
        proteinFactor={proteinFactor}
        onProteinFactorChange={setProteinFactor}
      />

      {/* Meal plan */}
      <MealPlanDisplay
        meals={mealsWithExtras}
        mealCount={mealCount}
        setMealCount={setMealCount}
        onChangeIngredient={handleChangeIngredient}
        onAddIngredient={handleAddIngredient}
        onDeleteIngredient={handleDeleteIngredient}
        onUpdateGrams={handleUpdateGrams}
        onAddTillagg={handleAddTillagg}
        onRemoveTillagg={handleRemoveTillagg}
        onAddSupplement={handleAddSupplement}
        onRemoveSupplement={handleRemoveSupplement}
        onClearMealPlan={handleClearMealPlan}
        mealTimings={mealTimings}
      />

      {/* SLV Food Search Modal */}
      <SLVFoodSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => {
          setIsSearchModalOpen(false)
          setChangeTarget(null)
        }}
        onSelect={handleFoodSelect}
        category={changeTarget?.category}
        mealType={changeTarget ? getMealApiType(changeTarget.mealType) : undefined}
        originalIngredient={originalIngredient}
      />

      {/* Ingredient Library Panel */}
      <IngredientLibraryPanel
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />

      {/* Import from Image Dialog */}
      <ImportFromImageDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImportToView}
      />
    </div>
  )
}
