'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingDown, Utensils, Settings, Save, User } from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string | null
  email: string
}

export default function CalorieCoachTool() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [weight, setWeight] = useState('')
  const [activityLevel, setActivityLevel] = useState('30')
  const [deficit, setDeficit] = useState('0')
  const [numMeals, setNumMeals] = useState('3')
  const [mealDistribution, setMealDistribution] = useState<number[]>([])
  const [customDistribution, setCustomDistribution] = useState(false)
  const [proteinPerKg, setProteinPerKg] = useState('2.0')
  const [fatPerKg] = useState('0.7')
  const [customMacros, setCustomMacros] = useState<Array<{protein: number, fat: number, carbs: number}>>([])
  const [dailySteps, setDailySteps] = useState('5000')

  // Fetch clients on mount
  useEffect(() => {
    fetchClients()
  }, [])

  // Load data when client is selected
  useEffect(() => {
    if (selectedClient) {
      loadClientData(selectedClient)
    }
  }, [selectedClient])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients.filter((c: Client) => c.name))
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const loadClientData = async (clientId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/calorie-plan?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.caloriePlan) {
          const plan = data.caloriePlan
          setWeight(plan.weight?.toString() || '')
          setActivityLevel(plan.activityLevel || '30')
          setDeficit(plan.deficit?.toString() || '0')
          setDailySteps(plan.dailySteps?.toString() || '5000')
          setProteinPerKg(plan.proteinPerKg?.toString() || '2.0')
          setNumMeals(plan.numMeals?.toString() || '3')
          setCustomDistribution(plan.customDistribution || false)
          setMealDistribution(plan.mealCalories || [])
          setCustomMacros(plan.customMacros ? JSON.parse(JSON.stringify(plan.customMacros)) : [])
        }
      }
    } catch (error) {
      console.error('Failed to load client data:', error)
      toast.error('Kunde inte ladda klientdata')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedClient) {
      toast.error('Välj en klient först')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/calorie-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          weight: weight ? parseFloat(weight) : null,
          activityLevel,
          deficit: parseInt(deficit),
          dailySteps: parseInt(dailySteps),
          proteinPerKg: parseFloat(proteinPerKg),
          fatPerKg: parseFloat(fatPerKg),
          numMeals: parseInt(numMeals),
          customDistribution,
          mealCalories: mealDistribution,
          customMacros: customMacros.length > 0 ? customMacros : null
        })
      })

      if (response.ok) {
        toast.success('Kaloriplan sparad!')
      } else {
        toast.error('Kunde inte spara kaloriplan')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Något gick fel')
    } finally {
      setIsSaving(false)
    }
  }

  const calculateBMR = () => {
    if (!weight) return 0
    return parseFloat(weight) * parseFloat(activityLevel)
  }

  const calculateStepsCalories = () => {
    const steps = parseFloat(dailySteps) || 0
    return Math.round((steps / 1000) * 50)
  }

  const calculateTargetCalories = () => {
    return calculateBMR() - parseFloat(deficit)
  }

  const calculateTargetWithSteps = () => {
    return calculateTargetCalories() + calculateStepsCalories()
  }

  const calculateMacros = () => {
    if (!weight) return { protein: 0, fat: 0, carbs: 0, proteinCal: 0, fatCal: 0, carbsCal: 0 }

    const w = parseFloat(weight)
    const proteinGrams = w * parseFloat(proteinPerKg)
    const fatGrams = w * parseFloat(fatPerKg)

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
    const meals = parseInt(numMeals)

    if (customDistribution && mealDistribution.length === meals) {
      return mealDistribution
    }

    const caloriesPerMeal = Math.round(target / meals)
    return Array(meals).fill(caloriesPerMeal)
  }

  const handleNumMealsChange = (value: string) => {
    setNumMeals(value)
    setCustomDistribution(false)
    setMealDistribution([])
    setCustomMacros([])
  }

  const handleCustomMealChange = (index: number, value: string) => {
    const newDist = [...mealDistribution]
    newDist[index] = parseFloat(value) || 0
    setMealDistribution(newDist)

    if (customMacros.length > 0) {
      const newMacros = [...customMacros]
      const totalCal = calculateTargetWithSteps()
      const mealRatio = newDist[index] / totalCal
      const totalMacros = calculateMacros()

      newMacros[index] = {
        protein: Math.round(totalMacros.protein * mealRatio),
        fat: Math.round(totalMacros.fat * mealRatio),
        carbs: Math.round(totalMacros.carbs * mealRatio)
      }
      setCustomMacros(newMacros)
    }
  }

  const handleMacroChange = (mealIndex: number, macro: string, value: string) => {
    const newMacros = [...customMacros]
    newMacros[mealIndex] = {
      ...newMacros[mealIndex],
      [macro]: parseFloat(value) || 0
    }
    setCustomMacros(newMacros)
  }

  const getMealMacros = () => {
    const meals = parseInt(numMeals)
    const totalMacros = calculateMacros()

    if (customMacros.length === meals) {
      return customMacros
    }

    const macrosPerMeal = {
      protein: Math.round(totalMacros.protein / meals),
      fat: Math.round(totalMacros.fat / meals),
      carbs: Math.round(totalMacros.carbs / meals)
    }

    return Array(meals).fill(macrosPerMeal)
  }

  const enableCustomDistribution = () => {
    setCustomDistribution(true)
    setMealDistribution(distributeMeals())
    setCustomMacros(getMealMacros())
  }

  const bmr = calculateBMR()
  const targetCalories = calculateTargetCalories()
  const stepsCalories = calculateStepsCalories()
  const targetWithSteps = calculateTargetWithSteps()
  const meals = distributeMeals()
  const totalCustom = mealDistribution.reduce((sum, cal) => sum + cal, 0)
  const macros = calculateMacros()
  const mealMacros = getMealMacros()

  const totalCustomMacros = customMacros.length > 0 ? {
    protein: customMacros.reduce((sum, m) => sum + m.protein, 0),
    fat: customMacros.reduce((sum, m) => sum + m.fat, 0),
    carbs: customMacros.reduce((sum, m) => sum + m.carbs, 0)
  } : null

  return (
    <div className="space-y-6">
      <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-2xl p-8 backdrop-blur-[10px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calculator className="text-[#FFD700]" size={32} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Kaloriverktyg för Coaches
            </h1>
          </div>

          {/* Client Selector and Save Button */}
          <div className="flex items-center gap-3">
            <div className="min-w-[250px]">
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                disabled={isLoading}
              >
                <option value="">Välj klient...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.email}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={!selectedClient || isSaving}
              className="px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={18} />
              {isSaving ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="mb-6 p-4 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-lg text-center text-white">
            Laddar klientdata...
          </div>
        )}

        {/* Sektion 1: Beräkna BMR */}
        <div className="mb-8 p-6 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-xl">
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
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#FFD700]"
                placeholder="75"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
                Aktivitetsnivå
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
              >
                <option value="25">x25 - Stillasittande</option>
                <option value="30">x30 - Måttlig aktivitet (2-4 ggr/vecka)</option>
                <option value="35">x35 - Hög aktivitet (4+ ggr/vecka, fysiskt jobb)</option>
              </select>
            </div>
          </div>

          {weight && (
            <div className="mt-4 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
              <p className="text-lg text-white">
                <span className="font-semibold">Beräknat kaloribehov:</span>{' '}
                <span className="text-2xl font-bold text-blue-400">{bmr.toFixed(0)}</span> kcal/dag
              </p>
            </div>
          )}
        </div>

        {/* Sektion 2: Underskott */}
        <div className="mb-8 p-6 bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.3)] rounded-xl">
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
                onClick={() => setDeficit('275')}
                className="px-4 py-3 bg-[rgba(59,130,246,0.2)] hover:bg-[rgba(59,130,246,0.3)] text-blue-300 rounded-lg font-medium transition-colors border-2 border-blue-400"
              >
                250g/vecka
                <div className="text-xs font-normal">275 kcal/dag</div>
              </button>
              <button
                onClick={() => setDeficit('550')}
                className="px-4 py-3 bg-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.3)] text-green-300 rounded-lg font-medium transition-colors border-2 border-green-400"
              >
                500g/vecka
                <div className="text-xs font-normal">550 kcal/dag</div>
              </button>
              <button
                onClick={() => setDeficit('770')}
                className="px-4 py-3 bg-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.3)] text-orange-300 rounded-lg font-medium transition-colors border-2 border-orange-400"
              >
                700g/vecka
                <div className="text-xs font-normal">770 kcal/dag</div>
              </button>
              <button
                onClick={() => setDeficit('1100')}
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
              value={deficit}
              onChange={(e) => setDeficit(e.target.value)}
              className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#FFD700]"
              placeholder="0"
            />
          </div>

          {weight && (
            <div className="mt-4 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
              <p className="text-lg text-white">
                <span className="font-semibold">Målkaloriintag (basintag):</span>{' '}
                <span className="text-2xl font-bold text-orange-400">{targetCalories.toFixed(0)}</span> kcal/dag
              </p>
              {parseFloat(deficit) > 0 && (
                <p className="text-sm text-[rgba(255,255,255,0.6)] mt-2">
                  ({bmr.toFixed(0)} - {deficit} = {targetCalories.toFixed(0)} kcal)
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

        {/* Sektion 3: Måltidsfördelning */}
        <div className="mb-8 p-6 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Utensils size={20} className="text-green-400" />
            Måltidsfördelning & Makronutrienter
          </h2>

          {/* Daglig aktivitetsnivå - Steg */}
          <div className="mb-6 p-4 bg-[rgba(168,85,247,0.1)] border-2 border-purple-400 rounded-xl">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Daglig Aktivitetsnivå (Steg)
            </h3>

            <div className="mb-3">
              <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
                Antal steg per dag
              </label>
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={dailySteps}
                onChange={(e) => setDailySteps(e.target.value)}
                className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[rgba(255,255,255,0.6)] mt-1">
                <span>1,000</span>
                <span>15,000</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-[rgba(255,255,255,0.05)] p-3 rounded-lg">
                <p className="text-sm text-[rgba(255,255,255,0.6)]">Valda steg</p>
                <p className="text-2xl font-bold text-purple-400">{parseInt(dailySteps).toLocaleString()}</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.05)] p-3 rounded-lg">
                <p className="text-sm text-[rgba(255,255,255,0.6)]">Extra kalorier från steg</p>
                <p className="text-2xl font-bold text-purple-400">+{stepsCalories} kcal</p>
              </div>
            </div>

            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-2">
              1,000 steg ≈ 50 kcal
            </p>
          </div>

          {/* Makronutrienter */}
          {weight && targetCalories > 0 && (
            <div className="mb-6 p-4 bg-[rgba(255,255,255,0.05)] border-2 border-green-400 rounded-xl">
              <h3 className="font-semibold text-white mb-3">Makronutrientfördelning</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
                  Protein per kg kroppsvikt
                </label>
                <select
                  value={proteinPerKg}
                  onChange={(e) => setProteinPerKg(e.target.value)}
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
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
              Antal måltider
            </label>
            <select
              value={numMeals}
              onChange={(e) => handleNumMealsChange(e.target.value)}
              className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
            >
              {[2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} måltider</option>
              ))}
            </select>
          </div>

          {weight && targetCalories > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white">Fördelning per måltid:</h3>
                {!customDistribution && (
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
                      {customDistribution ? (
                        <div className="flex-1">
                          <label className="text-xs text-[rgba(255,255,255,0.6)]">Kalorier</label>
                          <input
                            type="number"
                            value={mealDistribution[index] || 0}
                            onChange={(e) => handleCustomMealChange(index, e.target.value)}
                            className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                          />
                        </div>
                      ) : (
                        <span className="flex-1 text-xl font-bold text-green-400">
                          {calories} kcal
                        </span>
                      )}
                    </div>

                    {customDistribution ? (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div>
                          <label className="text-xs text-[rgba(255,255,255,0.6)]">Protein (g)</label>
                          <input
                            type="number"
                            value={mealMacro?.protein || 0}
                            onChange={(e) => handleMacroChange(index, 'protein', e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-[rgba(0,0,0,0.3)] border border-red-400 rounded text-white focus:outline-none focus:border-red-300"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[rgba(255,255,255,0.6)]">Fett (g)</label>
                          <input
                            type="number"
                            value={mealMacro?.fat || 0}
                            onChange={(e) => handleMacroChange(index, 'fat', e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-[rgba(0,0,0,0.3)] border border-yellow-400 rounded text-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[rgba(255,255,255,0.6)]">Kolh. (g)</label>
                          <input
                            type="number"
                            value={mealMacro?.carbs || 0}
                            onChange={(e) => handleMacroChange(index, 'carbs', e.target.value)}
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

              {customDistribution && (
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
          )}
        </div>

        {/* Sammanfattning */}
        {weight && (
          <div className="p-6 bg-[rgba(99,102,241,0.1)] border-2 border-indigo-400 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Sammanfattning</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg">
                <p className="text-sm text-[rgba(255,255,255,0.6)]">Kaloribehov</p>
                <p className="text-2xl font-bold text-blue-400">{bmr.toFixed(0)}</p>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">kcal/dag</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg">
                <p className="text-sm text-[rgba(255,255,255,0.6)]">Efter underskott</p>
                <p className="text-2xl font-bold text-orange-400">{targetCalories.toFixed(0)}</p>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">kcal/dag</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg">
                <p className="text-sm text-[rgba(255,255,255,0.6)]">Totalt intag</p>
                <p className="text-2xl font-bold text-purple-400">{targetWithSteps.toFixed(0)}</p>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">inkl. {stepsCalories} från steg</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg">
                <p className="text-sm text-[rgba(255,255,255,0.6)]">Antal måltider</p>
                <p className="text-2xl font-bold text-green-400">{numMeals}</p>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">per dag</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
