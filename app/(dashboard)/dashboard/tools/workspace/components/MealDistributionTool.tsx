'use client'

import { useClientPlan } from '../context/ClientPlanContext'
import { Utensils, Settings } from 'lucide-react'

export default function MealDistributionTool() {
  const { localPlan, updateLocalPlan, selectedClient } = useClientPlan()

  // Calculations
  const calculateBMR = () => {
    if (!localPlan.weight) return 0
    return localPlan.weight * parseFloat(localPlan.activityLevel || '30')
  }

  const calculateStepsCalories = () => {
    const steps = localPlan.dailySteps || 0
    return Math.round((steps / 1000) * 50)
  }

  const calculateTargetCalories = () => {
    return calculateBMR() - (localPlan.deficit || 0)
  }

  const calculateTargetWithSteps = () => {
    return calculateTargetCalories() + calculateStepsCalories()
  }

  const calculateMacros = () => {
    if (!localPlan.weight) return { protein: 0, fat: 0, carbs: 0, proteinCal: 0, fatCal: 0, carbsCal: 0 }

    const proteinGrams = localPlan.weight * (localPlan.proteinPerKg || 2.0)
    const fatGrams = localPlan.weight * (localPlan.fatPerKg || 0.7)

    const proteinCal = proteinGrams * 4
    const fatCal = fatGrams * 9
    const carbsCal = Math.max(0, calculateTargetWithSteps() - proteinCal - fatCal)
    const carbsGrams = carbsCal / 4

    return {
      protein: Math.round(proteinGrams),
      fat: Math.round(fatGrams),
      carbs: Math.round(carbsGrams),
      proteinCal: Math.round(proteinCal),
      fatCal: Math.round(fatCal),
      carbsCal: Math.round(carbsCal)
    }
  }

  const distributeMeals = () => {
    const target = calculateTargetWithSteps()
    const meals = localPlan.numMeals || 3

    if (localPlan.customDistribution && localPlan.mealCalories.length === meals) {
      return localPlan.mealCalories
    }

    const caloriesPerMeal = Math.round(target / meals)
    return Array(meals).fill(caloriesPerMeal)
  }

  const getMealMacros = () => {
    const meals = localPlan.numMeals || 3
    const totalMacros = calculateMacros()

    if (localPlan.customMacros && localPlan.customMacros.length === meals) {
      return localPlan.customMacros
    }

    const macrosPerMeal = {
      protein: Math.round(totalMacros.protein / meals),
      fat: Math.round(totalMacros.fat / meals),
      carbs: Math.round(totalMacros.carbs / meals)
    }

    return Array(meals).fill(macrosPerMeal)
  }

  const handleNumMealsChange = (value: number) => {
    updateLocalPlan({
      numMeals: value,
      customDistribution: false,
      mealCalories: [],
      customMacros: null
    })
  }

  const handleCustomMealChange = (index: number, value: number) => {
    const newDist = [...localPlan.mealCalories]
    newDist[index] = value

    // Update meal calories
    updateLocalPlan({ mealCalories: newDist })

    // If custom macros exist, recalculate them proportionally
    if (localPlan.customMacros && Array.isArray(localPlan.customMacros)) {
      const totalCal = calculateTargetWithSteps()
      const mealRatio = value / totalCal
      const totalMacros = calculateMacros()

      const newMacros = [...localPlan.customMacros]
      newMacros[index] = {
        protein: Math.round(totalMacros.protein * mealRatio),
        fat: Math.round(totalMacros.fat * mealRatio),
        carbs: Math.round(totalMacros.carbs * mealRatio)
      }
      updateLocalPlan({ customMacros: newMacros })
    }
  }

  const handleMacroChange = (mealIndex: number, macro: 'protein' | 'fat' | 'carbs', value: number) => {
    const newMacros = [...(localPlan.customMacros || getMealMacros())]
    newMacros[mealIndex] = {
      ...newMacros[mealIndex],
      [macro]: value
    }
    updateLocalPlan({ customMacros: newMacros })
  }

  const enableCustomDistribution = () => {
    updateLocalPlan({
      customDistribution: true,
      mealCalories: distributeMeals(),
      customMacros: getMealMacros()
    })
  }

  const targetWithSteps = calculateTargetWithSteps()
  const meals = distributeMeals()
  const totalCustom = localPlan.mealCalories.reduce((sum, cal) => sum + cal, 0)
  const macros = calculateMacros()
  const mealMacros = getMealMacros()

  const totalCustomMacros = localPlan.customMacros && Array.isArray(localPlan.customMacros) ? {
    protein: localPlan.customMacros.reduce((sum: number, m: any) => sum + (m.protein || 0), 0),
    fat: localPlan.customMacros.reduce((sum: number, m: any) => sum + (m.fat || 0), 0),
    carbs: localPlan.customMacros.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0)
  } : null

  if (!selectedClient) {
    return (
      <div className="text-center py-12">
        <p className="text-[rgba(255,255,255,0.6)]">Välj en klient för att börja</p>
      </div>
    )
  }

  if (!localPlan.weight) {
    return (
      <div className="text-center py-12">
        <div className="p-6 bg-[rgba(249,115,22,0.1)] border-l-4 border-orange-400 rounded-lg inline-block">
          <p className="text-white font-semibold mb-1">Ingen kaloriplan hittades</p>
          <p className="text-sm text-[rgba(255,255,255,0.7)]">
            Du måste först skapa en kaloriplan i Kaloriverktyget innan du kan fördela måltider.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Utensils className="text-[#FFD700]" size={32} />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
          Måltidsfördelning & Makronutrienter
        </h1>
      </div>

      {/* Makronutrienter */}
      <div className="p-6 bg-[rgba(255,255,255,0.05)] border-2 border-green-400 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Makronutrientfördelning</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-[rgba(239,68,68,0.1)] p-4 rounded-lg border-2 border-red-400">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-[rgba(255,255,255,0.8)]">Protein</span>
              <span className="text-xs text-[rgba(255,255,255,0.5)]">4 kcal/g</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{macros.protein}g</p>
            <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">{macros.proteinCal} kcal</p>
          </div>

          <div className="bg-[rgba(234,179,8,0.1)] p-4 rounded-lg border-2 border-yellow-400">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-[rgba(255,255,255,0.8)]">Fett</span>
              <span className="text-xs text-[rgba(255,255,255,0.5)]">9 kcal/g</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{macros.fat}g</p>
            <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">{macros.fatCal} kcal</p>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">0.7 g/kg</p>
          </div>

          <div className="bg-[rgba(59,130,246,0.1)] p-4 rounded-lg border-2 border-blue-400">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-[rgba(255,255,255,0.8)]">Kolhydrater</span>
              <span className="text-xs text-[rgba(255,255,255,0.5)]">4 kcal/g</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{macros.carbs}g</p>
            <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">{macros.carbsCal} kcal</p>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">Resterande kcal</p>
          </div>
        </div>
      </div>

      {/* Meal Distribution */}
      <div className="p-6 bg-[rgba(34,197,94,0.1)] border-2 border-green-400 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Måltidsfördelning</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
            Antal måltider
          </label>
          <select
            value={localPlan.numMeals || 3}
            onChange={(e) => handleNumMealsChange(parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
          >
            {[2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>{num} måltider</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white">Fördelning per måltid:</h3>
            {!localPlan.customDistribution && (
              <button
                onClick={enableCustomDistribution}
                className="text-sm text-green-400 hover:text-green-300 font-medium flex items-center gap-1"
              >
                <Settings size={16} />
                Anpassa
              </button>
            )}
          </div>

          {meals.map((calories, index) => {
            const mealMacro = mealMacros[index]
            return (
              <div key={index} className="p-4 bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(255,215,0,0.2)] rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-semibold text-white min-w-[80px]">Måltid {index + 1}</span>
                  {localPlan.customDistribution ? (
                    <div className="flex-1">
                      <label className="text-xs text-[rgba(255,255,255,0.6)]">Kalorier</label>
                      <input
                        type="number"
                        value={localPlan.mealCalories[index] || 0}
                        onChange={(e) => handleCustomMealChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                      />
                    </div>
                  ) : (
                    <span className="flex-1 text-xl font-bold text-green-400">
                      {calories} kcal
                    </span>
                  )}
                </div>

                {localPlan.customDistribution ? (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <label className="text-xs text-[rgba(255,255,255,0.6)]">Protein (g)</label>
                      <input
                        type="number"
                        value={mealMacro?.protein || 0}
                        onChange={(e) => handleMacroChange(index, 'protein', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm bg-[rgba(0,0,0,0.3)] border border-red-400 rounded text-white focus:outline-none focus:border-red-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[rgba(255,255,255,0.6)]">Fett (g)</label>
                      <input
                        type="number"
                        value={mealMacro?.fat || 0}
                        onChange={(e) => handleMacroChange(index, 'fat', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm bg-[rgba(0,0,0,0.3)] border border-yellow-400 rounded text-white focus:outline-none focus:border-yellow-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[rgba(255,255,255,0.6)]">Kolh. (g)</label>
                      <input
                        type="number"
                        value={mealMacro?.carbs || 0}
                        onChange={(e) => handleMacroChange(index, 'carbs', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm bg-[rgba(0,0,0,0.3)] border border-blue-400 rounded text-white focus:outline-none focus:border-blue-300"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                    <div className="bg-[rgba(239,68,68,0.1)] p-2 rounded border border-red-400">
                      <span className="text-[rgba(255,255,255,0.6)]">Protein: </span>
                      <span className="font-semibold text-red-400">{mealMacro?.protein}g</span>
                    </div>
                    <div className="bg-[rgba(234,179,8,0.1)] p-2 rounded border border-yellow-400">
                      <span className="text-[rgba(255,255,255,0.6)]">Fett: </span>
                      <span className="font-semibold text-yellow-400">{mealMacro?.fat}g</span>
                    </div>
                    <div className="bg-[rgba(59,130,246,0.1)] p-2 rounded border border-blue-400">
                      <span className="text-[rgba(255,255,255,0.6)]">Kolh.: </span>
                      <span className="font-semibold text-blue-400">{mealMacro?.carbs}g</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {localPlan.customDistribution && (
            <div className="mt-4 p-4 bg-[rgba(255,255,255,0.05)] border-2 border-green-400 rounded-lg">
              <h4 className="font-semibold text-white mb-3">Anpassad total</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white">Kalorier:</span>
                    <span className={`text-xl font-bold ${Math.abs(totalCustom - targetWithSteps) < 10 ? 'text-green-400' : 'text-orange-400'}`}>
                      {totalCustom.toFixed(0)} kcal
                    </span>
                  </div>
                  {Math.abs(totalCustom - targetWithSteps) >= 10 && (
                    <p className="text-sm text-orange-400">
                      Skillnad från mål: {(totalCustom - targetWithSteps).toFixed(0)} kcal
                    </p>
                  )}
                </div>

                {totalCustomMacros && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[rgba(255,255,255,0.6)]">Protein:</span>
                      <span className="font-semibold text-red-400">{totalCustomMacros.protein}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[rgba(255,255,255,0.6)]">Fett:</span>
                      <span className="font-semibold text-yellow-400">{totalCustomMacros.fat}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[rgba(255,255,255,0.6)]">Kolhydrater:</span>
                      <span className="font-semibold text-blue-400">{totalCustomMacros.carbs}g</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="p-6 bg-[rgba(99,102,241,0.1)] border-2 border-indigo-400 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-3">Sammanfattning</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-[rgba(255,255,255,0.05)] p-3 rounded-lg">
            <p className="text-[rgba(255,255,255,0.6)] mb-1">Totalt kaloriintag</p>
            <p className="text-xl font-bold text-purple-400">{targetWithSteps.toFixed(0)} kcal</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.05)] p-3 rounded-lg">
            <p className="text-[rgba(255,255,255,0.6)] mb-1">Antal måltider</p>
            <p className="text-xl font-bold text-green-400">{localPlan.numMeals || 3}</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.05)] p-3 rounded-lg">
            <p className="text-[rgba(255,255,255,0.6)] mb-1">Makros (P/F/K)</p>
            <p className="text-lg font-bold text-white">{macros.protein}g / {macros.fat}g / {macros.carbs}g</p>
          </div>
        </div>
      </div>
    </div>
  )
}
