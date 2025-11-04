'use client'

import { useClientPlan } from '../context/ClientPlanContext'
import { Calculator, TrendingDown } from 'lucide-react'

export default function CalorieTool() {
  const { localPlan, updateLocalPlan, selectedClient } = useClientPlan()

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

  const bmr = calculateBMR()
  const targetCalories = calculateTargetCalories()
  const stepsCalories = calculateStepsCalories()
  const targetWithSteps = calculateTargetWithSteps()
  const macros = calculateMacros()

  if (!selectedClient) {
    return (
      <div className="text-center py-12">
        <p className="text-[rgba(255,255,255,0.6)]">Välj en klient för att börja</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Calculator className="text-[#FFD700]" size={32} />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
          Kaloriverktyg
        </h1>
      </div>

      {/* Sektion 1: Beräkna BMR */}
      <div className="p-6 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Calculator size={20} className="text-blue-400" />
          Beräkna Kaloribehov
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
              Kroppsvikt (kg)
            </label>
            <input
              type="number"
              value={localPlan.weight || ''}
              onChange={(e) => updateLocalPlan({ weight: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#FFD700]"
              placeholder="75"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
              Aktivitetsnivå
            </label>
            <select
              value={localPlan.activityLevel || '30'}
              onChange={(e) => updateLocalPlan({ activityLevel: e.target.value })}
              className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="25">x25 - Stillasittande</option>
              <option value="30">x30 - Måttlig aktivitet (2-4 ggr/vecka)</option>
              <option value="35">x35 - Hög aktivitet (4+ ggr/vecka, fysiskt jobb)</option>
            </select>
          </div>
        </div>

        {localPlan.weight && (
          <div className="mt-4 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
            <p className="text-lg text-white">
              <span className="font-semibold">Beräknat kaloribehov:</span>{' '}
              <span className="text-2xl font-bold text-blue-400">{bmr.toFixed(0)}</span> kcal/dag
            </p>
          </div>
        )}
      </div>

      {/* Sektion 2: Underskott */}
      <div className="p-6 bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.3)] rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingDown size={20} className="text-orange-400" />
          Sätt Underskott
        </h2>

        {/* Info-ruta */}
        <div className="mb-4 p-4 bg-[rgba(59,130,246,0.15)] border-l-4 border-blue-400 rounded-lg">
          <h3 className="font-semibold text-white mb-2">Guide: Rekommenderade underskott</h3>
          <div className="space-y-2 text-sm text-[rgba(255,255,255,0.8)]">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-400 min-w-[100px]">250g/vecka:</span>
              <span>Lågt underskott, lätt att hålla långsiktigt (ca 275 kcal/dag)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-400 min-w-[100px]">500g/vecka:</span>
              <span>Underskott som de flesta klarar av (ca 550 kcal/dag)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-orange-400 min-w-[100px]">700g/vecka:</span>
              <span>Tuffare, men fortfarande något en majoritet klarar (ca 770 kcal/dag)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-red-400 min-w-[100px]">1000g/vecka:</span>
              <span>Här är det fler som misslyckas än lyckas över tid (ca 1100 kcal/dag)</span>
            </div>
          </div>
        </div>

        {/* Snabbknappar */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
            Välj förinställt underskott
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => updateLocalPlan({ deficit: 275 })}
              className="px-4 py-3 bg-[rgba(59,130,246,0.2)] hover:bg-[rgba(59,130,246,0.3)] text-blue-300 rounded-lg font-medium transition-colors border-2 border-blue-400"
            >
              250g/vecka
              <div className="text-xs font-normal">275 kcal/dag</div>
            </button>
            <button
              onClick={() => updateLocalPlan({ deficit: 550 })}
              className="px-4 py-3 bg-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.3)] text-green-300 rounded-lg font-medium transition-colors border-2 border-green-400"
            >
              500g/vecka
              <div className="text-xs font-normal">550 kcal/dag</div>
            </button>
            <button
              onClick={() => updateLocalPlan({ deficit: 770 })}
              className="px-4 py-3 bg-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.3)] text-orange-300 rounded-lg font-medium transition-colors border-2 border-orange-400"
            >
              700g/vecka
              <div className="text-xs font-normal">770 kcal/dag</div>
            </button>
            <button
              onClick={() => updateLocalPlan({ deficit: 1100 })}
              className="px-4 py-3 bg-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.3)] text-red-300 rounded-lg font-medium transition-colors border-2 border-red-400"
            >
              1000g/vecka
              <div className="text-xs font-normal">1100 kcal/dag</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
            Eller ange eget kaloriunderskott (kcal/dag)
          </label>
          <input
            type="number"
            value={localPlan.deficit || 0}
            onChange={(e) => updateLocalPlan({ deficit: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#FFD700]"
            placeholder="0"
          />
        </div>

        {localPlan.weight && (
          <div className="mt-4 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
            <p className="text-lg text-white">
              <span className="font-semibold">Målkaloriintag (basintag):</span>{' '}
              <span className="text-2xl font-bold text-orange-400">{targetCalories.toFixed(0)}</span> kcal/dag
            </p>
            {(localPlan.deficit || 0) > 0 && (
              <p className="text-sm text-[rgba(255,255,255,0.6)] mt-2">
                ({bmr.toFixed(0)} - {localPlan.deficit} = {targetCalories.toFixed(0)} kcal)
              </p>
            )}
            {stepsCalories > 0 && (
              <div className="mt-3 pt-3 border-t border-[rgba(255,215,0,0.2)]">
                <p className="text-lg text-white">
                  <span className="font-semibold">Totalt intag (inkl. steg):</span>{' '}
                  <span className="text-2xl font-bold text-purple-400">{targetWithSteps.toFixed(0)}</span> kcal/dag
                </p>
                <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">
                  ({targetCalories.toFixed(0)} + {stepsCalories} från steg)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sektion 3: Makronutrienter */}
      <div className="p-6 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Calculator size={20} className="text-green-400" />
          Makronutrienter
        </h2>

        {localPlan.weight && targetCalories > 0 && (
          <div className="p-4 bg-[rgba(255,255,255,0.05)] border-2 border-green-400 rounded-xl">
            <h3 className="font-semibold text-white mb-3">Makronutrientfördelning</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
                Protein per kg kroppsvikt
              </label>
              <select
                value={localPlan.proteinPerKg || 2.0}
                onChange={(e) => updateLocalPlan({ proteinPerKg: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
              >
                <option value="1.6">1.6 g/kg</option>
                <option value="1.8">1.8 g/kg</option>
                <option value="2.0">2.0 g/kg</option>
                <option value="2.2">2.2 g/kg</option>
                <option value="2.5">2.5 g/kg</option>
              </select>
            </div>

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

            <div className="mt-4 p-3 bg-[rgba(59,130,246,0.1)] border-l-4 border-blue-400 rounded-lg">
              <p className="text-sm text-[rgba(255,255,255,0.8)]">
                För att fördela makros på måltider, gå till <span className="font-semibold text-[#FFD700]">Måltidsfördelning</span> i vänster meny
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
