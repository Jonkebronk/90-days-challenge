'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Utensils, Dumbbell, Sparkles } from 'lucide-react'

interface MealPlanItem {
  id: string
  customName: string | null
  amountG: number
  protein: number | null
  fat: number | null
  carbs: number | null
  calories: number | null
  isSupplement: boolean
  supplementBadge: string | null
  notes: string | null
  foodItem: {
    name: string
  } | null
}

interface Meal {
  id: string
  mealNumber: number
  name: string | null
  totalProtein: number | null
  totalFat: number | null
  totalCarbs: number | null
  totalCalories: number | null
  items: MealPlanItem[]
}

interface SupplementItem {
  id: string
  timing: string
  name: string
  amountG: number | null
  amountUnit: string | null
  protein: number | null
  fat: number | null
  carbs: number | null
  calories: number | null
  supplementBadge: string | null
}

interface MealPlan {
  id: string
  name: string
  totalProtein: number | null
  totalFat: number | null
  totalCarbs: number | null
  totalCalories: number | null
  preWorkoutProtein: number | null
  preWorkoutFat: number | null
  preWorkoutCarbs: number | null
  preWorkoutCalories: number | null
  postWorkoutProtein: number | null
  postWorkoutFat: number | null
  postWorkoutCarbs: number | null
  postWorkoutCalories: number | null
  meals: Meal[]
  supplementItems: SupplementItem[]
}

export default function MealPlanPage() {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMealPlan()
  }, [])

  const fetchMealPlan = async () => {
    try {
      const response = await fetch('/api/meal-plan')
      const data = await response.json()
      setMealPlan(data.mealPlan)
    } catch (error) {
      console.error('Error fetching meal plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const preWorkoutItems = mealPlan?.supplementItems.filter(item => item.timing === 'pre_workout') || []
  const postWorkoutItems = mealPlan?.supplementItems.filter(item => item.timing === 'post_workout') || []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgba(255,255,255,0.8)]">Laddar kostschema...</p>
        </div>
      </div>
    )
  }

  if (!mealPlan) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
            Kostschema
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Ditt skräddarsydda kosttillskott
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Empty State */}
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="py-16">
            <div className="text-center">
              <Sparkles className="w-16 h-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <h3 className="text-xl font-bold text-[rgba(255,255,255,0.9)] mb-2">
                Inget kostschema ännu
              </h3>
              <p className="text-[rgba(255,255,255,0.6)]">
                Din coach kommer snart att tilldela ett personligt kostschema till dig
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate total daily intake including supplements
  const totalDailyProtein = Number(mealPlan.totalProtein || 0) + Number(mealPlan.preWorkoutProtein || 0) + Number(mealPlan.postWorkoutProtein || 0)
  const totalDailyFat = Number(mealPlan.totalFat || 0) + Number(mealPlan.preWorkoutFat || 0) + Number(mealPlan.postWorkoutFat || 0)
  const totalDailyCarbs = Number(mealPlan.totalCarbs || 0) + Number(mealPlan.preWorkoutCarbs || 0) + Number(mealPlan.postWorkoutCarbs || 0)
  const totalDailyCalories = Number(mealPlan.totalCalories || 0) + Number(mealPlan.preWorkoutCalories || 0) + Number(mealPlan.postWorkoutCalories || 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
          {mealPlan.name}
        </h1>
        <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
          Ditt skräddarsydda kostschema
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Totals */}
        <div className="lg:col-span-1 space-y-4">
          {/* Daily Totals */}
          <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-lg text-[rgba(255,255,255,0.9)]">Totalt för kost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.7)]">Protein:</span>
                <span className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.totalProtein?.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.7)]">Fett:</span>
                <span className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.totalFat?.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.7)]">Kolhydrater:</span>
                <span className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.totalCarbs?.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.7)]">Kcal:</span>
                <span className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.totalCalories?.toFixed(0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Daily Intake */}
          <div className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-xl p-6">
            <h3 className="text-[#0a0a0a] font-bold text-lg mb-4">Totalt dagsintag</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[rgba(10,10,10,0.8)] font-medium">Protein</span>
                <span className="font-bold text-[#0a0a0a]">{totalDailyProtein.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(10,10,10,0.8)] font-medium">Fett</span>
                <span className="font-bold text-[#0a0a0a]">{totalDailyFat.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(10,10,10,0.8)] font-medium">Kolhydrater</span>
                <span className="font-bold text-[#0a0a0a]">{totalDailyCarbs.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(10,10,10,0.8)] font-medium">Kcal</span>
                <span className="font-bold text-[#0a0a0a]">{totalDailyCalories.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="meals" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)]">
              <TabsTrigger
                value="meals"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a]"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Kostschema
              </TabsTrigger>
              <TabsTrigger
                value="supplements"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a]"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Träning
              </TabsTrigger>
            </TabsList>

            <TabsContent value="meals" className="space-y-6 mt-6">
              {mealPlan.meals.map((meal) => (
                <Card key={meal.id} className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-[rgba(255,255,255,0.9)] flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-[#FFD700]" />
                        Måltid {meal.mealNumber}
                        {meal.name && <span className="text-[rgba(255,255,255,0.6)] font-normal">- {meal.name}</span>}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {meal.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-[rgba(255,215,0,0.1)] last:border-0">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-[rgba(255,215,0,0.1)] flex items-center justify-center">
                            {item.isSupplement ? (
                              <span className="text-[#FFD700]">💊</span>
                            ) : (
                              <span className="text-[#FFA500]">🍽️</span>
                            )}
                          </div>
                          <div>
                            <p className="text-[rgba(255,255,255,0.9)] font-medium">
                              {item.customName || item.foodItem?.name}
                              {item.notes && <span className="text-[rgba(255,255,255,0.5)] text-sm ml-2">{item.notes}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.supplementBadge && (
                            <Badge className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white border-none">
                              {item.supplementBadge}
                            </Badge>
                          )}
                          <span className="text-[rgba(255,255,255,0.9)] font-semibold min-w-[60px] text-right">
                            {item.amountG}g
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Meal Totals */}
                    <div className="bg-[rgba(255,215,0,0.05)] rounded-lg p-3 mt-4">
                      <p className="text-xs text-[rgba(255,255,255,0.6)] mb-2">Totalt för måltid {meal.mealNumber}</p>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-[rgba(255,255,255,0.6)] text-xs">Protein:</span>
                          <p className="font-bold text-[rgba(255,255,255,0.9)]">{meal.totalProtein?.toFixed(1)}g</p>
                        </div>
                        <div>
                          <span className="text-[rgba(255,255,255,0.6)] text-xs">Fett:</span>
                          <p className="font-bold text-[rgba(255,255,255,0.9)]">{meal.totalFat?.toFixed(1)}g</p>
                        </div>
                        <div>
                          <span className="text-[rgba(255,255,255,0.6)] text-xs">Kolhydrater:</span>
                          <p className="font-bold text-[rgba(255,255,255,0.9)]">{meal.totalCarbs?.toFixed(1)}g</p>
                        </div>
                        <div>
                          <span className="text-[rgba(255,255,255,0.6)] text-xs">Kcal:</span>
                          <p className="font-bold text-[rgba(255,255,255,0.9)]">{meal.totalCalories?.toFixed(0)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="supplements" className="space-y-6 mt-6">
              {/* Pre Workout */}
              {preWorkoutItems.length > 0 && (
                <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
                  <CardHeader>
                    <CardTitle className="text-xl text-[rgba(255,255,255,0.9)] flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-[#3b82f6]" />
                      Före styrketräning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {preWorkoutItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-[rgba(255,215,0,0.1)] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
                            <span className="text-[#3b82f6]">💊</span>
                          </div>
                          <p className="text-[rgba(255,255,255,0.9)] font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.supplementBadge && (
                            <Badge className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white border-none">
                              {item.supplementBadge}
                            </Badge>
                          )}
                          <span className="text-[rgba(255,255,255,0.9)] font-semibold">
                            {item.amountG}{item.amountUnit || 'g'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Pre Workout Totals */}
                    {(mealPlan.preWorkoutProtein || mealPlan.preWorkoutCalories) && (
                      <div className="bg-[rgba(59,130,246,0.05)] rounded-lg p-3 mt-4">
                        <p className="text-xs text-[rgba(255,255,255,0.6)] mb-2">Totalt före träning</p>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-[rgba(255,255,255,0.6)] text-xs">Protein:</span>
                            <p className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.preWorkoutProtein?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-[rgba(255,255,255,0.6)] text-xs">Fett:</span>
                            <p className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.preWorkoutFat?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-[rgba(255,255,255,0.6)] text-xs">Kolhydrater:</span>
                            <p className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.preWorkoutCarbs?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-[rgba(255,255,255,0.6)] text-xs">Kcal:</span>
                            <p className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.preWorkoutCalories?.toFixed(0) || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Post Workout */}
              {postWorkoutItems.length > 0 && (
                <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
                  <CardHeader>
                    <CardTitle className="text-xl text-[rgba(255,255,255,0.9)] flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-[#22c55e]" />
                      Efter styrketräning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {postWorkoutItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-[rgba(255,215,0,0.1)] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[rgba(34,197,94,0.1)] flex items-center justify-center">
                            <span className="text-[#22c55e]">💊</span>
                          </div>
                          <p className="text-[rgba(255,255,255,0.9)] font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.supplementBadge && (
                            <Badge className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white border-none">
                              {item.supplementBadge}
                            </Badge>
                          )}
                          <span className="text-[rgba(255,255,255,0.9)] font-semibold">
                            {item.amountG}{item.amountUnit || 'g'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Post Workout Totals */}
                    {(mealPlan.postWorkoutProtein || mealPlan.postWorkoutCalories) && (
                      <div className="bg-[rgba(34,197,94,0.05)] rounded-lg p-3 mt-4">
                        <p className="text-xs text-[rgba(255,255,255,0.6)] mb-2">Totalt efter träning</p>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-[rgba(255,255,255,0.6)] text-xs">Protein:</span>
                            <p className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.postWorkoutProtein?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-[rgba(255,255,255,0.6)] text-xs">Fett:</span>
                            <p className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.postWorkoutFat?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-[rgba(255,255,255,0.6)] text-xs">Kolhydrater:</span>
                            <p className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.postWorkoutCarbs?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-[rgba(255,255,255,0.6)] text-xs">Kcal:</span>
                            <p className="font-bold text-[rgba(255,255,255,0.9)]">{mealPlan.postWorkoutCalories?.toFixed(0) || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {preWorkoutItems.length === 0 && postWorkoutItems.length === 0 && (
                <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
                      <h3 className="text-xl font-bold text-[rgba(255,255,255,0.9)] mb-2">
                        Inga träningskosttillskott tilldelade
                      </h3>
                      <p className="text-[rgba(255,255,255,0.6)]">
                        Din coach kan lägga till pre- och post-workout kosttillskott om det behövs
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
