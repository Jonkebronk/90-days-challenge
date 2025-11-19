'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Utensils, Dumbbell, Sparkles, Info, Apple, Lightbulb, ChevronUp, ChevronDown } from 'lucide-react'

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
  description?: string | null
  totalProtein: number | null
  totalFat: number | null
  totalCarbs: number | null
  totalCalories: number | null
  carbSource?: string | null
  proteinSource?: string | null
  fatSource?: string | null
  options?: Array<{
    id: string
    recipe?: {
      id: string
      title: string
      coverImage: string | null
    } | null
  }>
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
  const router = useRouter()
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set()) // All meals closed by default

  const toggleMeal = (mealNumber: number) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(mealNumber)) {
        newSet.delete(mealNumber)
      } else {
        newSet.add(mealNumber)
      }
      return newSet
    })
  }

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
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laddar kostschema...</p>
        </div>
      </div>
    )
  }

  if (!mealPlan) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border border-gray-200 rounded-xl">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
            KOSTSCHEMA
          </h1>
          <p className="text-gray-600 mt-2">
            Ditt skräddarsydda kosttillskott
          </p>
        </div>

        {/* Empty State */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="py-16">
            <div className="text-center">
              <Sparkles className="w-16 h-16 mx-auto text-gold-primary mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Inget kostschema ännu
              </h3>
              <p className="text-gray-600">
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
      <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border border-gray-200 rounded-xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
          {mealPlan.name.toUpperCase()}
        </h1>
        <p className="text-gray-600 mt-2">
          Ditt skräddarsydda kostschema
        </p>

        {/* Introduction Buttons */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button
            onClick={() => router.push('/dashboard/meal-plan/guide')}
            variant="outline"
            className="bg-white border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all"
          >
            <Info className="w-4 h-4 mr-2" />
            Introduktion till kostschema
          </Button>
          <Button
            onClick={() => router.push('/dashboard/meal-plan/food-guide')}
            variant="outline"
            className="bg-white border-2 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 transition-all"
          >
            <Apple className="w-4 h-4 mr-2" />
            Livsmedelsguide
          </Button>
          <Button
            onClick={() => router.push('/dashboard/meal-plan/nutrition-tips')}
            variant="outline"
            className="bg-white border-2 border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-all"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Generella råd för kosten
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Totals */}
        <div className="lg:col-span-1 space-y-4">
          {/* Daily Totals */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Totalt för kost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Protein:</span>
                <span className="font-bold text-gray-900">{mealPlan.totalProtein?.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Fett:</span>
                <span className="font-bold text-gray-900">{mealPlan.totalFat?.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Kolhydrater:</span>
                <span className="font-bold text-gray-900">{mealPlan.totalCarbs?.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Kcal:</span>
                <span className="font-bold text-gray-900">{mealPlan.totalCalories?.toFixed(0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Daily Intake */}
          <div className="bg-gradient-to-br from-gold-primary to-gold-secondary rounded-xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">Totalt dagsintag</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/90 font-medium">Protein</span>
                <span className="font-bold text-white">{totalDailyProtein.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/90 font-medium">Fett</span>
                <span className="font-bold text-white">{totalDailyFat.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/90 font-medium">Kolhydrater</span>
                <span className="font-bold text-white">{totalDailyCarbs.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/90 font-medium">Kcal</span>
                <span className="font-bold text-white">{totalDailyCalories.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="meals" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border-2 border-gold-primary/20">
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
              {mealPlan.meals.map((meal) => {
                const isExpanded = expandedMeals.has(meal.mealNumber)
                return (
                <Card key={meal.id} className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
                  <CardHeader
                    className="cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleMeal(meal.mealNumber)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-gray-100 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-gold-light" />
                        Måltid {meal.mealNumber}
                        {meal.name && <span className="text-gray-400 font-normal">- {meal.name}</span>}
                      </CardTitle>
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-gold-light" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gold-light" />
                      )}
                    </div>
                  </CardHeader>
                  {isExpanded && (
                  <CardContent className="space-y-3">
                    {/* Meal Instructions/Description */}
                    {meal.description && (
                      <div className="bg-[rgba(59,130,246,0.1)] border border-blue-500/30 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 text-lg">💡</span>
                          <div>
                            <p className="text-sm font-semibold text-blue-300 mb-1">Så här gör du måltiden:</p>
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{meal.description}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ingredient Sources */}
                    {(meal.carbSource || meal.proteinSource || meal.fatSource) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        {meal.carbSource && (
                          <div className="bg-[rgba(255,215,0,0.05)] border border-gold-primary/20 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">🌾 Kolhydratskälla</p>
                            <ul className="text-sm text-gray-300 space-y-1">
                              {meal.carbSource.split(/ELLER|eller/).map((item, idx, arr) => (
                                <li key={idx}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-gold-light mt-0.5">•</span>
                                    <span>{item.trim()}</span>
                                  </div>
                                  {idx < arr.length - 1 && (
                                    <p className="text-xs text-gold-light font-semibold my-1 ml-6">ELLER</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {meal.proteinSource && (
                          <div className="bg-[rgba(59,130,246,0.05)] border border-blue-500/20 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">🥩 Proteinkälla</p>
                            <ul className="text-sm text-gray-300 space-y-1">
                              {meal.proteinSource.split(/ELLER|eller/).map((item, idx, arr) => (
                                <li key={idx}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-blue-400 mt-0.5">•</span>
                                    <span>{item.trim()}</span>
                                  </div>
                                  {idx < arr.length - 1 && (
                                    <p className="text-xs text-blue-400 font-semibold my-1 ml-6">ELLER</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {meal.fatSource && (
                          <div className="bg-[rgba(34,197,94,0.05)] border border-green-500/20 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">🥑 Fettkälla</p>
                            <ul className="text-sm text-gray-300 space-y-1">
                              {meal.fatSource.split(/ELLER|eller/).map((item, idx, arr) => (
                                <li key={idx}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-green-400 mt-0.5">•</span>
                                    <span>{item.trim()}</span>
                                  </div>
                                  {idx < arr.length - 1 && (
                                    <p className="text-xs text-green-400 font-semibold my-1 ml-6">ELLER</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recipe Options with Images */}
                    {meal.options && meal.options.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">
                          📖 Receptförslag
                        </h4>
                        <div className="space-y-2">
                          {meal.options.map((option) => option.recipe && (
                            <Link
                              key={option.id}
                              href={`/dashboard/recipes/${option.recipe.id}`}
                              className="flex items-center gap-3 p-3 bg-[rgba(0,0,0,0.2)] border border-gold-primary/10 rounded-lg hover:border-gold-primary/30 hover:bg-[rgba(0,0,0,0.3)] transition-all cursor-pointer group"
                            >
                              {option.recipe.coverImage ? (
                                <img
                                  src={option.recipe.coverImage}
                                  alt={option.recipe.title}
                                  className="w-16 h-16 object-cover rounded-lg border border-gold-primary/20 group-hover:border-gold-primary/40 transition-all"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-[rgba(255,215,0,0.1)] rounded-lg flex items-center justify-center">
                                  <span className="text-2xl">🍽️</span>
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-white font-medium group-hover:text-gold-light transition-colors">{option.recipe.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Klicka för att se receptet</p>
                              </div>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-gold-light group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Only show items with actual amounts (not template recipe items with 0g) */}
                    {meal.items.filter(item => item.amountG > 0).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gold-primary/10 last:border-0">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-[rgba(255,215,0,0.1)] flex items-center justify-center">
                            {item.isSupplement ? (
                              <span className="text-gold-light">💊</span>
                            ) : (
                              <span className="text-orange-500">🍽️</span>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-100 font-medium">
                              {item.customName || item.foodItem?.name}
                              {item.notes && <span className="text-gray-500 text-sm ml-2">{item.notes}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.supplementBadge && (
                            <Badge className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white border-none">
                              {item.supplementBadge}
                            </Badge>
                          )}
                          <span className="text-gray-100 font-semibold min-w-[60px] text-right">
                            {item.amountG}g
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Meal Totals */}
                    <div className="bg-[rgba(255,215,0,0.05)] rounded-lg p-3 mt-4">
                      <p className="text-xs text-gray-400 mb-2">Totalt för måltid {meal.mealNumber}</p>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400 text-xs">Protein:</span>
                          <p className="font-bold text-gray-100">{meal.totalProtein?.toFixed(1)}g</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Fett:</span>
                          <p className="font-bold text-gray-100">{meal.totalFat?.toFixed(1)}g</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Kolhydrater:</span>
                          <p className="font-bold text-gray-100">{meal.totalCarbs?.toFixed(1)}g</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Kcal:</span>
                          <p className="font-bold text-gray-100">{meal.totalCalories?.toFixed(0)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  )}
                </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="supplements" className="space-y-6 mt-6">
              {/* Pre Workout */}
              {preWorkoutItems.length > 0 && (
                <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-100 flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-[#3b82f6]" />
                      Före styrketräning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {preWorkoutItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gold-primary/10 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
                            <span className="text-[#3b82f6]">💊</span>
                          </div>
                          <p className="text-gray-100 font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.supplementBadge && (
                            <Badge className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white border-none">
                              {item.supplementBadge}
                            </Badge>
                          )}
                          <span className="text-gray-100 font-semibold">
                            {item.amountG}{item.amountUnit || 'g'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Pre Workout Totals */}
                    {(mealPlan.preWorkoutProtein || mealPlan.preWorkoutCalories) && (
                      <div className="bg-[rgba(59,130,246,0.05)] rounded-lg p-3 mt-4">
                        <p className="text-xs text-gray-400 mb-2">Totalt före träning</p>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400 text-xs">Protein:</span>
                            <p className="font-bold text-gray-100">{mealPlan.preWorkoutProtein?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">Fett:</span>
                            <p className="font-bold text-gray-100">{mealPlan.preWorkoutFat?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">Kolhydrater:</span>
                            <p className="font-bold text-gray-100">{mealPlan.preWorkoutCarbs?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">Kcal:</span>
                            <p className="font-bold text-gray-100">{mealPlan.preWorkoutCalories?.toFixed(0) || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Post Workout */}
              {postWorkoutItems.length > 0 && (
                <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-100 flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-green-500" />
                      Efter styrketräning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {postWorkoutItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gold-primary/10 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[rgba(34,197,94,0.1)] flex items-center justify-center">
                            <span className="text-green-500">💊</span>
                          </div>
                          <p className="text-gray-100 font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.supplementBadge && (
                            <Badge className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white border-none">
                              {item.supplementBadge}
                            </Badge>
                          )}
                          <span className="text-gray-100 font-semibold">
                            {item.amountG}{item.amountUnit || 'g'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Post Workout Totals */}
                    {(mealPlan.postWorkoutProtein || mealPlan.postWorkoutCalories) && (
                      <div className="bg-[rgba(34,197,94,0.05)] rounded-lg p-3 mt-4">
                        <p className="text-xs text-gray-400 mb-2">Totalt efter träning</p>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400 text-xs">Protein:</span>
                            <p className="font-bold text-gray-100">{mealPlan.postWorkoutProtein?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">Fett:</span>
                            <p className="font-bold text-gray-100">{mealPlan.postWorkoutFat?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">Kolhydrater:</span>
                            <p className="font-bold text-gray-100">{mealPlan.postWorkoutCarbs?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">Kcal:</span>
                            <p className="font-bold text-gray-100">{mealPlan.postWorkoutCalories?.toFixed(0) || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {preWorkoutItems.length === 0 && postWorkoutItems.length === 0 && (
                <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
                      <h3 className="text-xl font-bold text-gray-100 mb-2">
                        Inga träningskosttillskott tilldelade
                      </h3>
                      <p className="text-gray-400">
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
