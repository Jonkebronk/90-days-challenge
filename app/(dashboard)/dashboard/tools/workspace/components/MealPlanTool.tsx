'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, Search, Save } from 'lucide-react'
import { useClientPlan } from '../context/ClientPlanContext'
import { toast } from 'sonner'

interface FoodItem {
  id?: string
  name: string
  amountG: number
  protein: number
  fat: number
  carbs: number
  calories: number
}

interface Meal {
  id?: string
  mealNumber: number
  name: string
  items: FoodItem[]
}

const MEAL_NAMES = [
  'Frukost',
  'Mellanmål 1',
  'Lunch',
  'Mellanmål 2',
  'Middag',
  'Kvällsmål'
]

// Common Swedish foods with nutrition per 100g
const COMMON_FOODS = [
  { name: 'Havregryn', protein: 13.2, fat: 7, carbs: 60, calories: 370 },
  { name: 'Bröd, fullkorn', protein: 8, fat: 2, carbs: 45, calories: 230 },
  { name: 'Kyckling, stekt', protein: 31, fat: 3.6, carbs: 0, calories: 165 },
  { name: 'Lax', protein: 20, fat: 13, carbs: 0, calories: 208 },
  { name: 'Ris, kokt', protein: 2.7, fat: 0.3, carbs: 28, calories: 130 },
  { name: 'Potatis, kokt', protein: 2, fat: 0.1, carbs: 20, calories: 87 },
  { name: 'Pasta, kokt', protein: 5, fat: 0.9, carbs: 31, calories: 158 },
  { name: 'Broccoli', protein: 2.8, fat: 0.4, carbs: 7, calories: 34 },
  { name: 'Banan', protein: 1.1, fat: 0.3, carbs: 23, calories: 89 },
  { name: 'Ägg', protein: 13, fat: 11, carbs: 1.1, calories: 155 },
  { name: 'Yoghurt naturell', protein: 3.5, fat: 3, carbs: 4.7, calories: 61 },
  { name: 'Mjölk', protein: 3.4, fat: 3.6, carbs: 4.8, calories: 64 },
  { name: 'Ost', protein: 25, fat: 28, carbs: 1.3, calories: 353 },
  { name: 'Jordnötssmör', protein: 25, fat: 50, carbs: 20, calories: 588 },
  { name: 'Mandlar', protein: 21, fat: 49, carbs: 22, calories: 579 },
  { name: 'Whey protein', protein: 80, fat: 5, carbs: 5, calories: 380 },
  { name: 'Olivolja', protein: 0, fat: 100, carbs: 0, calories: 884 },
  { name: 'Bönor, kokta', protein: 9, fat: 0.5, carbs: 22, calories: 127 },
]

export default function MealPlanTool() {
  const { selectedClient } = useClientPlan()
  const [mealPlanName, setMealPlanName] = useState('')
  const [meals, setMeals] = useState<Meal[]>([
    { mealNumber: 1, name: 'Frukost', items: [] }
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const addMeal = () => {
    const nextMealNumber = meals.length + 1
    setMeals([...meals, {
      mealNumber: nextMealNumber,
      name: MEAL_NAMES[nextMealNumber - 1] || `Måltid ${nextMealNumber}`,
      items: []
    }])
  }

  const removeMeal = (mealNumber: number) => {
    setMeals(meals.filter(m => m.mealNumber !== mealNumber))
  }

  const addFoodItem = (mealNumber: number, food: typeof COMMON_FOODS[0]) => {
    setMeals(meals.map(meal => {
      if (meal.mealNumber === mealNumber) {
        return {
          ...meal,
          items: [...meal.items, {
            name: food.name,
            amountG: 100,
            protein: food.protein,
            fat: food.fat,
            carbs: food.carbs,
            calories: food.calories
          }]
        }
      }
      return meal
    }))
  }

  const updateFoodAmount = (mealNumber: number, itemIndex: number, newAmount: number) => {
    setMeals(meals.map(meal => {
      if (meal.mealNumber === mealNumber) {
        const updatedItems = [...meal.items]
        const item = updatedItems[itemIndex]
        const ratio = newAmount / 100

        updatedItems[itemIndex] = {
          ...item,
          amountG: newAmount,
          protein: parseFloat((item.protein * ratio).toFixed(1)),
          fat: parseFloat((item.fat * ratio).toFixed(1)),
          carbs: parseFloat((item.carbs * ratio).toFixed(1)),
          calories: parseFloat((item.calories * ratio).toFixed(0))
        }
        return { ...meal, items: updatedItems }
      }
      return meal
    }))
  }

  const removeFoodItem = (mealNumber: number, itemIndex: number) => {
    setMeals(meals.map(meal => {
      if (meal.mealNumber === mealNumber) {
        return {
          ...meal,
          items: meal.items.filter((_, i) => i !== itemIndex)
        }
      }
      return meal
    }))
  }

  const calculateMealTotals = (meal: Meal) => {
    return meal.items.reduce((acc, item) => ({
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      carbs: acc.carbs + item.carbs,
      calories: acc.calories + item.calories
    }), { protein: 0, fat: 0, carbs: 0, calories: 0 })
  }

  const calculateDayTotals = () => {
    return meals.reduce((acc, meal) => {
      const mealTotals = calculateMealTotals(meal)
      return {
        protein: acc.protein + mealTotals.protein,
        fat: acc.fat + mealTotals.fat,
        carbs: acc.carbs + mealTotals.carbs,
        calories: acc.calories + mealTotals.calories
      }
    }, { protein: 0, fat: 0, carbs: 0, calories: 0 })
  }

  const saveMealPlan = async () => {
    if (!selectedClient) {
      toast.error('Välj en klient först')
      return
    }

    if (!mealPlanName.trim()) {
      toast.error('Ange ett namn för kostschemat')
      return
    }

    setSaving(true)
    try {
      const dayTotals = calculateDayTotals()

      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedClient,
          name: mealPlanName,
          totalProtein: dayTotals.protein,
          totalFat: dayTotals.fat,
          totalCarbs: dayTotals.carbs,
          totalCalories: dayTotals.calories,
          meals: meals.map((meal, idx) => {
            const mealTotals = calculateMealTotals(meal)
            return {
              mealNumber: idx + 1,
              name: meal.name,
              totalProtein: mealTotals.protein,
              totalFat: mealTotals.fat,
              totalCarbs: mealTotals.carbs,
              totalCalories: mealTotals.calories,
              items: meal.items.map((item, itemIdx) => ({
                customName: item.name,
                amountG: item.amountG,
                protein: item.protein,
                fat: item.fat,
                carbs: item.carbs,
                calories: item.calories,
                orderIndex: itemIdx,
                isSupplement: false
              }))
            }
          })
        })
      })

      if (response.ok) {
        toast.success('Kostschema sparat!')
      } else {
        toast.error('Kunde inte spara kostschema')
      }
    } catch (error) {
      console.error('Error saving meal plan:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  const filteredFoods = COMMON_FOODS.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const dayTotals = calculateDayTotals()

  if (!selectedClient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Välj en klient för att skapa kostschema</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Skapa Kostschema</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-[rgba(255,215,0,0.8)]">Namn på kostschema</Label>
            <Input
              value={mealPlanName}
              onChange={(e) => setMealPlanName(e.target.value)}
              placeholder="T.ex. Viktnedgång 2000 kcal"
              className="bg-black/30 border-gold-primary/30 text-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Meals */}
        <div className="lg:col-span-2 space-y-4">
          {meals.map((meal) => {
            const mealTotals = calculateMealTotals(meal)

            return (
              <Card key={meal.mealNumber} className="bg-white/5 border-2 border-gold-primary/20 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-100">{meal.name}</h3>
                  {meals.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMeal(meal.mealNumber)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Food Items */}
                <div className="space-y-2 mb-4">
                  {meal.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[rgba(0,0,0,0.2)] p-2 rounded">
                      <div className="flex-1">
                        <p className="text-sm text-gray-100">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          P: {item.protein.toFixed(1)}g | F: {item.fat.toFixed(1)}g | K: {item.carbs.toFixed(1)}g
                        </p>
                      </div>
                      <Input
                        type="number"
                        value={item.amountG}
                        onChange={(e) => updateFoodAmount(meal.mealNumber, idx, parseFloat(e.target.value) || 0)}
                        className="w-20 bg-black/30 border-gold-primary/30 text-white text-sm"
                      />
                      <span className="text-xs text-gray-400">g</span>
                      <span className="text-sm font-semibold text-gray-100 w-16 text-right">
                        {item.calories.toFixed(0)} kcal
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFoodItem(meal.mealNumber, idx)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Meal Totals */}
                <div className="bg-[rgba(255,215,0,0.05)] rounded p-3 text-sm">
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <p className="text-xs text-gray-400">Protein</p>
                      <p className="font-bold text-gray-100">{mealTotals.protein.toFixed(1)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Fett</p>
                      <p className="font-bold text-gray-100">{mealTotals.fat.toFixed(1)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Kolhydrater</p>
                      <p className="font-bold text-gray-100">{mealTotals.carbs.toFixed(1)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Kalorier</p>
                      <p className="font-bold text-gray-100">{mealTotals.calories.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}

          <Button
            onClick={addMeal}
            variant="outline"
            className="w-full border-gold-primary/30 text-gray-100 hover:bg-gold-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lägg till måltid
          </Button>
        </div>

        {/* Right - Food Search & Totals */}
        <div className="space-y-4">
          {/* Day Totals */}
          <div className="bg-gradient-to-br from-gold-light to-orange-500 rounded-xl p-6">
            <h3 className="text-[#0a0a0a] font-bold text-lg mb-4">Totalt per dag</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[rgba(10,10,10,0.8)] font-medium">Protein</span>
                <span className="font-bold text-[#0a0a0a]">{dayTotals.protein.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(10,10,10,0.8)] font-medium">Fett</span>
                <span className="font-bold text-[#0a0a0a]">{dayTotals.fat.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(10,10,10,0.8)] font-medium">Kolhydrater</span>
                <span className="font-bold text-[#0a0a0a]">{dayTotals.carbs.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-[rgba(10,10,10,0.8)] font-bold">Kalorier</span>
                <span className="font-bold text-[#0a0a0a]">{dayTotals.calories.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Food Search */}
          <Card className="bg-white/5 border-2 border-gold-primary/20 p-4">
            <h3 className="text-lg font-bold text-gray-100 mb-4">Livsmedel</h3>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sök livsmedel..."
                className="pl-10 bg-black/30 border-gold-primary/30 text-white"
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {filteredFoods.map((food, idx) => (
                <div
                  key={idx}
                  className="text-sm text-gray-200 hover:bg-gold-50 p-2 rounded cursor-pointer"
                >
                  <div className="font-medium mb-1">{food.name}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    Per 100g: {food.calories} kcal | P: {food.protein}g | F: {food.fat}g | K: {food.carbs}g
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {meals.map(meal => (
                      <Button
                        key={meal.mealNumber}
                        size="sm"
                        variant="ghost"
                        onClick={() => addFoodItem(meal.mealNumber, food)}
                        className="h-6 text-xs bg-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.2)] text-gray-100"
                      >
                        + {meal.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Save Button */}
          <Button
            onClick={saveMealPlan}
            disabled={saving || !mealPlanName.trim()}
            className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#22c55e] hover:to-[#22c55e] text-white font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Sparar...' : 'Spara kostschema'}
          </Button>
        </div>
      </div>
    </div>
  )
}
