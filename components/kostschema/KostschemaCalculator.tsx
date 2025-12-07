'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { ActivityLevel, IngredientOverrides, CustomFood } from '@/lib/kostschema/types'
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

interface OriginalIngredient {
  amount: number
  macroPer100g: number
  macroType: 'protein' | 'carbs' | 'fat'
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

export function KostschemaCalculator() {
  // Form state
  const [bodyWeight, setBodyWeight] = useState<number>(85)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [weightLossTempo, setWeightLossTempo] = useState<number>(700)
  const [proteinFactor, setProteinFactor] = useState<number>(2.0)
  const [mealCount, setMealCount] = useState<number>(5)

  // Modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [changeTarget, setChangeTarget] = useState<IngredientChangeTarget | null>(null)

  // Custom ingredient overrides
  const [ingredientOverrides, setIngredientOverrides] = useState<IngredientOverrides>({})

  // Calculate macros based on input
  const macroTargets = useMacroCalculation({
    bodyWeight,
    activityLevel,
    weightLossTempo,
    proteinFactor
  })

  // Get scaled meals based on macro targets and overrides
  const meals = useScaledMeals(macroTargets, mealCount, ingredientOverrides)

  // Compute original ingredient data for substitution preview
  const originalIngredient = useMemo((): OriginalIngredient | undefined => {
    if (!changeTarget) return undefined

    // Find the meal matching the target
    const meal = meals.find(m => m.type === changeTarget.mealType)
    if (!meal) return undefined

    // Get the ingredient from the appropriate category
    const categoryKey = changeTarget.category === 'kolhydrat' ? 'kolhydrat'
      : changeTarget.category === 'protein' ? 'protein' : 'fett'
    const ingredient = meal.template[categoryKey]?.[changeTarget.index]
    if (!ingredient) return undefined

    // Map category to macro type
    const macroType: 'protein' | 'carbs' | 'fat' =
      changeTarget.category === 'protein' ? 'protein'
        : changeTarget.category === 'kolhydrat' ? 'carbs' : 'fat'

    // Calculate macro per 100g from the scaled ingredient's macros
    // Formula: macroPer100g = (macros[type] / scaledAmount) * 100
    const macroValue = macroType === 'protein' ? ingredient.macros.protein
      : macroType === 'carbs' ? ingredient.macros.carbs : ingredient.macros.fat
    const macroPer100g = ingredient.scaledAmount > 0
      ? (macroValue / ingredient.scaledAmount) * 100
      : 0

    return {
      amount: ingredient.scaledAmount,
      macroPer100g,
      macroType
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
    // Find the current meal to get the next available index
    const meal = meals.find(m => m.type === mealType)
    if (!meal) return

    const currentCount = meal.template[category].length
    setChangeTarget({ mealType, category, index: currentCount })
    setIsSearchModalOpen(true)
  }

  // Handle food selection from SLV
  const handleFoodSelect = (food: CustomFood) => {
    if (!changeTarget) return

    // Create override key and add to state
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
          meals={meals}
          mealCount={mealCount}
          setMealCount={setMealCount}
          onChangeIngredient={handleChangeIngredient}
          onAddIngredient={handleAddIngredient}
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
