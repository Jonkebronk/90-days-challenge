'use client'

import { useState, useEffect } from 'react'
import { Utensils, Settings, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string | null
  email: string
}

export default function MealDistributionTool() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // State for calculations
  const [weight, setWeight] = useState('')
  const [activityLevel, setActivityLevel] = useState('30')
  const [deficit, setDeficit] = useState('0')
  const [dailySteps, setDailySteps] = useState('5000')
  const [proteinPerKg, setProteinPerKg] = useState('2.0')
  const [fatPerKg] = useState('0.7')
  const [numMeals, setNumMeals] = useState('3')
  const [mealDistribution, setMealDistribution] = useState<number[]>([])
  const [customDistribution, setCustomDistribution] = useState(false)
  const [customMacros, setCustomMacros] = useState<Array<{protein: number, fat: number, carbs: number}>>([])

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
      // Fetch existing calorie plan to preserve other data
      const getResponse = await fetch(`/api/calorie-plan?clientId=${selectedClient}`)
      const existingData = await getResponse.json()

      const response = await fetch('/api/calorie-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          ...existingData.caloriePlan,
          proteinPerKg: parseFloat(proteinPerKg),
          numMeals: parseInt(numMeals),
          customDistribution,
          mealCalories: mealDistribution,
          customMacros: customMacros.length > 0 ? customMacros : null
        })
      })

      if (response.ok) {
        toast.success('Måltidsfördelning sparad!')
      } else {
        toast.error('Kunde inte spara måltidsfördelning')
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
      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-8 backdrop-blur-[10px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Utensils className="text-gold-light" size={32} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-light to-orange-500 bg-clip-text text-transparent">
              Måltidsfördelning & Makronutrienter
            </h1>
          </div>

          {/* Client Selector and Save Button */}
          <div className="flex items-center gap-3">
            <div className="min-w-[250px]">
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-gold-primary/30 rounded-lg text-white focus:outline-none focus:border-gold-light"
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
              className="px-6 py-2 bg-gradient-to-r from-gold-light to-orange-500 hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

        {/* Info notice if no calorie plan exists */}
        {!weight && selectedClient && !isLoading && (
          <div className="mb-6 p-4 bg-[rgba(249,115,22,0.1)] border-l-4 border-orange-400 rounded-lg">
            <p className="text-white font-semibold mb-1">Ingen kaloriplan hittades</p>
            <p className="text-sm text-gray-300">
              Du måste först skapa en kaloriplan i Kaloriverktyget innan du kan fördela måltider.
            </p>
          </div>
        )}

        {/* Makronutrienter */}
        {weight && targetWithSteps > 0 && (
          <div className="mb-6 p-6 bg-[rgba(255,255,255,0.05)] border-2 border-green-400 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Makronutrientfördelning</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Protein per kg kroppsvikt
              </label>
              <select
                value={proteinPerKg}
                onChange={(e) => setProteinPerKg(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-gold-primary/30 rounded-lg text-white focus:outline-none focus:border-gold-light"
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
                  <span className="text-sm font-medium text-gray-200">Protein</span>
                  <span className="text-xs text-gray-500">4 kcal/g</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{macros.protein}g</p>
                <p className="text-sm text-gray-400 mt-1">{macros.proteinCal} kcal</p>
              </div>

              <div className="bg-[rgba(234,179,8,0.1)] p-4 rounded-lg border-2 border-yellow-400">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-200">Fett</span>
                  <span className="text-xs text-gray-500">9 kcal/g</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{macros.fat}g</p>
                <p className="text-sm text-gray-400 mt-1">{macros.fatCal} kcal</p>
                <p className="text-xs text-gray-500 mt-1">0.7 g/kg</p>
              </div>

              <div className="bg-[rgba(59,130,246,0.1)] p-4 rounded-lg border-2 border-blue-400">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-200">Kolhydrater</span>
                  <span className="text-xs text-gray-500">4 kcal/g</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{macros.carbs}g</p>
                <p className="text-sm text-gray-400 mt-1">{macros.carbsCal} kcal</p>
                <p className="text-xs text-gray-500 mt-1">Resterande kcal</p>
              </div>
            </div>
          </div>
        )}

        {/* Meal Distribution */}
        {weight && targetWithSteps > 0 && (
          <div className="p-6 bg-[rgba(34,197,94,0.1)] border-2 border-green-400 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Måltidsfördelning</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Antal måltider
              </label>
              <select
                value={numMeals}
                onChange={(e) => handleNumMealsChange(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-gold-primary/30 rounded-lg text-white focus:outline-none focus:border-gold-light"
              >
                {[2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} måltider</option>
                ))}
              </select>
            </div>

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
                  <div key={index} className="p-4 bg-[rgba(255,255,255,0.05)] border-2 border-gold-primary/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-semibold text-white min-w-[80px]">Måltid {index + 1}</span>
                      {customDistribution ? (
                        <div className="flex-1">
                          <label className="text-xs text-gray-400">Kalorier</label>
                          <input
                            type="number"
                            value={mealDistribution[index] || 0}
                            onChange={(e) => handleCustomMealChange(index, e.target.value)}
                            className="w-full px-3 py-2 bg-black/30 border border-gold-primary/30 rounded-lg text-white focus:outline-none focus:border-gold-light"
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
                          <label className="text-xs text-gray-400">Protein (g)</label>
                          <input
                            type="number"
                            value={mealMacro?.protein || 0}
                            onChange={(e) => handleMacroChange(index, 'protein', e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-black/30 border border-red-400 rounded text-white focus:outline-none focus:border-red-300"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Fett (g)</label>
                          <input
                            type="number"
                            value={mealMacro?.fat || 0}
                            onChange={(e) => handleMacroChange(index, 'fat', e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-black/30 border border-yellow-400 rounded text-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Kolh. (g)</label>
                          <input
                            type="number"
                            value={mealMacro?.carbs || 0}
                            onChange={(e) => handleMacroChange(index, 'carbs', e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-black/30 border border-blue-400 rounded text-white focus:outline-none focus:border-blue-300"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                        <div className="bg-[rgba(239,68,68,0.1)] p-2 rounded border border-red-400">
                          <span className="text-gray-400">Protein: </span>
                          <span className="font-semibold text-red-400">{mealMacro?.protein}g</span>
                        </div>
                        <div className="bg-[rgba(234,179,8,0.1)] p-2 rounded border border-yellow-400">
                          <span className="text-gray-400">Fett: </span>
                          <span className="font-semibold text-yellow-400">{mealMacro?.fat}g</span>
                        </div>
                        <div className="bg-[rgba(59,130,246,0.1)] p-2 rounded border border-blue-400">
                          <span className="text-gray-400">Kolh.: </span>
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
                          <span className="text-gray-400">Protein:</span>
                          <span className="font-semibold text-red-400">{totalCustomMacros.protein}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fett:</span>
                          <span className="font-semibold text-yellow-400">{totalCustomMacros.fat}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Kolhydrater:</span>
                          <span className="font-semibold text-blue-400">{totalCustomMacros.carbs}g</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {weight && targetWithSteps > 0 && (
          <div className="mt-6 p-6 bg-[rgba(99,102,241,0.1)] border-2 border-indigo-400 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-3">Sammanfattning</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-[rgba(255,255,255,0.05)] p-3 rounded-lg">
                <p className="text-gray-400 mb-1">Totalt kaloriintag</p>
                <p className="text-xl font-bold text-purple-400">{targetWithSteps.toFixed(0)} kcal</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.05)] p-3 rounded-lg">
                <p className="text-gray-400 mb-1">Antal måltider</p>
                <p className="text-xl font-bold text-green-400">{numMeals}</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.05)] p-3 rounded-lg">
                <p className="text-gray-400 mb-1">Makros (P/F/K)</p>
                <p className="text-lg font-bold text-white">{macros.protein}g / {macros.fat}g / {macros.carbs}g</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
