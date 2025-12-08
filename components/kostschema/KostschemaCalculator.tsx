'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { ActivityLevel, IngredientOverrides, CustomFood, DeletedIngredients, FreeTextItem } from '@/lib/kostschema/types'
import { useMacroCalculation } from '@/lib/kostschema/hooks/useMacroCalculation'
import { useScaledMeals } from '@/lib/kostschema/hooks/useScaledMeals'
import { MacroCalculatorForm } from './MacroCalculatorForm'
import { MacroSummary } from './MacroSummary'
import { MealPlanDisplay } from './MealPlanDisplay'
import { SLVFoodSearchModal } from './SLVFoodSearchModal'

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

export function KostschemaCalculator() {
  // Form state
  const [bodyWeight, setBodyWeight] = useState<number>(85)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [weightLossTempo, setWeightLossTempo] = useState<number>(700)
  const [proteinFactor, setProteinFactor] = useState<number>(2.5)
  const [mealCount, setMealCount] = useState<number>(5)

  // Modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [changeTarget, setChangeTarget] = useState<IngredientChangeTarget | null>(null)

  // Custom ingredient overrides
  const [ingredientOverrides, setIngredientOverrides] = useState<IngredientOverrides>({})

  // Deleted ingredients
  const [deletedIngredients, setDeletedIngredients] = useState<DeletedIngredients>(new Set())

  // Free text items for tillägg and supplements
  const [tillaggOverrides, setTillaggOverrides] = useState<FreeTextOverrides>({})
  const [supplementOverrides, setSupplementOverrides] = useState<FreeTextOverrides>({})

  // ID counter for free text items
  const [nextId, setNextId] = useState(1)

  // Calculate macros based on input
  const macroTargets = useMacroCalculation({
    bodyWeight,
    activityLevel,
    weightLossTempo,
    proteinFactor
  })

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

  // Add tillaggItems and supplementItems to meals
  const mealsWithExtras = useMemo(() => {
    return meals.map(meal => ({
      ...meal,
      tillaggItems: tillaggOverrides[meal.type] || [],
      supplementItems: supplementOverrides[meal.type] || []
    }))
  }, [meals, tillaggOverrides, supplementOverrides])

  return (
    <div className="space-y-6">
      {/* Input form */}
      <MacroCalculatorForm
        bodyWeight={bodyWeight}
        setBodyWeight={setBodyWeight}
        activityLevel={activityLevel}
        setActivityLevel={setActivityLevel}
        weightLossTempo={weightLossTempo}
        setWeightLossTempo={setWeightLossTempo}
        proteinFactor={proteinFactor}
        setProteinFactor={setProteinFactor}
      />

      {/* Calculated macros */}
      {bodyWeight > 0 && <MacroSummary macros={macroTargets} />}

      {/* Meal plan */}
      {bodyWeight > 0 && (
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
        />
      )}

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
    </div>
  )
}
