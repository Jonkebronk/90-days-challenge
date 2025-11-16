'use client'

import { useClientPlan } from '../context/ClientPlanContext'
import { TrendingUp, Utensils, Activity, Zap } from 'lucide-react'

export default function LivePreview() {
  const { selectedClient, localPlan, clients } = useClientPlan()

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
    if (!localPlan.weight) return { protein: 0, fat: 0, carbs: 0 }

    const proteinGrams = localPlan.weight * (localPlan.proteinPerKg || 2.0)
    const fatGrams = localPlan.weight * (localPlan.fatPerKg || 0.7)

    const proteinCal = proteinGrams * 4
    const fatCal = fatGrams * 9
    const carbsCal = Math.max(0, calculateTargetWithSteps() - proteinCal - fatCal)
    const carbsGrams = carbsCal / 4

    return {
      protein: Math.round(proteinGrams),
      fat: Math.round(fatGrams),
      carbs: Math.round(carbsGrams)
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

  const bmr = calculateBMR()
  const targetCalories = calculateTargetCalories()
  const stepsCalories = calculateStepsCalories()
  const targetWithSteps = calculateTargetWithSteps()
  const macros = calculateMacros()
  const meals = distributeMeals()

  const selectedClientData = clients.find(c => c.id === selectedClient)

  if (!selectedClient) {
    return (
      <div className="w-96 flex-shrink-0">
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-6 backdrop-blur-[10px] h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Zap size={48} className="mx-auto mb-4 text-gold-light opacity-50" />
            <p className="text-lg font-semibold mb-2">Ingen klient vald</p>
            <p className="text-sm">Välj en klient för att se live preview</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 flex-shrink-0">
      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-6 backdrop-blur-[10px] h-full overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="text-gold-light" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-white">Live Preview</h3>
            <p className="text-xs text-gray-500">
              {selectedClientData?.name || selectedClientData?.email}
            </p>
          </div>
        </div>

        {/* Kalori-sammanfattning */}
        <div className="mb-6 p-4 bg-[rgba(59,130,246,0.1)] border-2 border-blue-400 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-blue-400" />
            <h4 className="font-semibold text-white">Kalorier</h4>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">BMR</span>
              <span className="font-bold text-blue-400">{bmr.toFixed(0)} kcal</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Underskott</span>
              <span className="font-bold text-orange-400">-{localPlan.deficit || 0} kcal</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Basintag</span>
              <span className="font-bold text-white">{targetCalories.toFixed(0)} kcal</span>
            </div>
            {stepsCalories > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">+ Steg</span>
                <span className="font-bold text-purple-400">+{stepsCalories} kcal</span>
              </div>
            )}
            <div className="pt-3 border-t border-[rgba(255,255,255,0.1)] flex justify-between items-center">
              <span className="text-sm font-semibold text-white">Totalt intag</span>
              <span className="text-xl font-bold text-gold-light">{targetWithSteps.toFixed(0)} kcal</span>
            </div>
          </div>
        </div>

        {/* Makronutrienter */}
        {localPlan.weight && (
          <div className="mb-6 p-4 bg-[rgba(34,197,94,0.1)] border-2 border-green-400 rounded-xl">
            <h4 className="font-semibold text-white mb-3">Makronutrienter</h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Protein</span>
                <span className="font-bold text-red-400">{macros.protein}g</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Fett</span>
                <span className="font-bold text-yellow-400">{macros.fat}g</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Kolhydrater</span>
                <span className="font-bold text-blue-400">{macros.carbs}g</span>
              </div>
            </div>
          </div>
        )}

        {/* Måltidsfördelning */}
        {localPlan.weight && (
          <div className="mb-6 p-4 bg-[rgba(168,85,247,0.1)] border-2 border-purple-400 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Utensils size={18} className="text-purple-400" />
              <h4 className="font-semibold text-white">Måltider</h4>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Antal måltider</span>
                <span className="font-bold text-purple-400">{localPlan.numMeals || 3}</span>
              </div>
              {meals.map((calories, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Måltid {index + 1}</span>
                  <span className="font-semibold text-white">{calories} kcal</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stegmål */}
        <div className="p-4 bg-[rgba(249,115,22,0.1)] border-2 border-orange-400 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-orange-400" />
            <h4 className="font-semibold text-white">Aktivitet</h4>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Dagliga steg</span>
              <span className="font-bold text-orange-400">{(localPlan.dailySteps || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Extra kalorier</span>
              <span className="font-bold text-orange-400">+{stepsCalories} kcal</span>
            </div>
          </div>
        </div>

        {/* Live Update Indicator */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[rgba(34,197,94,0.1)] border border-green-400 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Live uppdateringar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
