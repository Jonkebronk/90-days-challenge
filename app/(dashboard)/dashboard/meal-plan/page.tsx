'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Utensils, Dumbbell, Sparkles, Lightbulb, ChevronUp, ChevronDown, Info } from 'lucide-react'
import { MDXPreview } from '@/components/mdx-preview'

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
  description: string | null
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
  const [nutritionTipsContent, setNutritionTipsContent] = useState<string>('')
  const [mealPlanDescriptionContent, setMealPlanDescriptionContent] = useState<string>('')

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
    fetchNutritionTips()
    fetchMealPlanDescription()
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

  const fetchNutritionTips = async () => {
    try {
      const response = await fetch('/api/guide-content?type=nutrition_tips')
      if (response.ok) {
        const data = await response.json()
        // Convert bullet characters to markdown list syntax and remove duplicate title
        let content = data.guide.content
          .replace(/^#\s*Generella råd för kosten\s*$/mi, '') // Remove duplicate H1 title
          .replace(/^Här hittar du viktiga tips.*$/mi, '') // Remove intro line
          .replace(/^Generella råd för kosten\s*$/mi, '') // Remove plain text title
          .replace(/^\s*•\s*\n/gm, '- ') // Convert bullet on its own line followed by text
          .replace(/^•\s*/gm, '- ') // Convert bullets at start of line to markdown
          .replace(/^\s*\n\s*\n/gm, '\n\n') // Clean up multiple blank lines
          .trim()
        setNutritionTipsContent(content)
      }
    } catch (error) {
      console.error('Error fetching nutrition tips:', error)
    }
  }

  const fetchMealPlanDescription = async () => {
    try {
      const response = await fetch('/api/guide-content?type=meal_plan')
      if (response.ok) {
        const data = await response.json()
        setMealPlanDescriptionContent(data.guide.content)
      }
    } catch (error) {
      console.error('Error fetching meal plan description:', error)
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
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
            Kostschema
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
            Ditt skräddarsydda kostschema
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
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
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          {mealPlan.name}
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Ditt skräddarsydda kostschema
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />

        {/* Introduction Buttons */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {mealPlanDescriptionContent && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Introduktion Kost
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border border-gold-primary/30 max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-gray-200 flex items-center gap-2">
                    <Info className="w-6 h-6 text-blue-500" />
                    Om kostschemat
                  </DialogTitle>
                </DialogHeader>
                <MDXPreview content={mealPlanDescriptionContent} theme="dark" />
              </DialogContent>
            </Dialog>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-white border-2 border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-all"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Generella råd för kosten
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-gold-primary/30 max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-gray-200 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                  Generella råd för kosten
                </DialogTitle>
              </DialogHeader>
              {nutritionTipsContent ? (
                <MDXPreview content={nutritionTipsContent} theme="dark" />
              ) : (
                <p className="text-gray-400">Laddar råd...</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div>
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {meal.carbSource && (
                          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <span className="text-lg">🌾</span>
                              </div>
                              <p className="text-sm font-bold text-amber-400 uppercase tracking-wide">Kolhydrater</p>
                            </div>
                            <ul className="text-sm text-gray-200 space-y-2">
                              {meal.carbSource.split(/ELLER|eller/).map((item, idx, arr) => (
                                <li key={idx}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span className="leading-tight">{item.trim()}</span>
                                  </div>
                                  {idx < arr.length - 1 && (
                                    <p className="text-xs text-amber-400/70 font-medium my-2 ml-4 uppercase">eller</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {meal.proteinSource && (
                          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <span className="text-lg">🥩</span>
                              </div>
                              <p className="text-sm font-bold text-red-400 uppercase tracking-wide">Protein</p>
                            </div>
                            <ul className="text-sm text-gray-200 space-y-2">
                              {meal.proteinSource.split(/ELLER|eller/).map((item, idx, arr) => (
                                <li key={idx}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span className="leading-tight">{item.trim()}</span>
                                  </div>
                                  {idx < arr.length - 1 && (
                                    <p className="text-xs text-red-400/70 font-medium my-2 ml-4 uppercase">eller</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {meal.fatSource && (
                          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <span className="text-lg">🥑</span>
                              </div>
                              <p className="text-sm font-bold text-green-400 uppercase tracking-wide">Fett</p>
                            </div>
                            <ul className="text-sm text-gray-200 space-y-2">
                              {meal.fatSource.split(/ELLER|eller/).map((item, idx, arr) => (
                                <li key={idx}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-green-400 mt-0.5">•</span>
                                    <span className="leading-tight">{item.trim()}</span>
                                  </div>
                                  {idx < arr.length - 1 && (
                                    <p className="text-xs text-green-400/70 font-medium my-2 ml-4 uppercase">eller</p>
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
                    <div className="bg-gradient-to-r from-gold-primary/10 to-transparent border border-gold-primary/20 rounded-xl p-4 mt-6">
                      <p className="text-sm font-semibold text-gold-light mb-3">Näringsvärden för måltid {meal.mealNumber}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-black/20 rounded-lg">
                          <span className="text-red-400 text-xs font-medium block mb-1">Protein</span>
                          <p className="text-xl font-bold text-white">{meal.totalProtein?.toFixed(0) || 0}<span className="text-sm text-gray-400 ml-0.5">g</span></p>
                        </div>
                        <div className="text-center p-3 bg-black/20 rounded-lg">
                          <span className="text-green-400 text-xs font-medium block mb-1">Fett</span>
                          <p className="text-xl font-bold text-white">{meal.totalFat?.toFixed(0) || 0}<span className="text-sm text-gray-400 ml-0.5">g</span></p>
                        </div>
                        <div className="text-center p-3 bg-black/20 rounded-lg">
                          <span className="text-amber-400 text-xs font-medium block mb-1">Kolhydrater</span>
                          <p className="text-xl font-bold text-white">{meal.totalCarbs?.toFixed(0) || 0}<span className="text-sm text-gray-400 ml-0.5">g</span></p>
                        </div>
                        <div className="text-center p-3 bg-black/20 rounded-lg">
                          <span className="text-gold-light text-xs font-medium block mb-1">Kalorier</span>
                          <p className="text-xl font-bold text-white">{meal.totalCalories?.toFixed(0) || 0}<span className="text-sm text-gray-400 ml-0.5">kcal</span></p>
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
  )
}
