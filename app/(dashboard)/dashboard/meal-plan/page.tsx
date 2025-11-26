'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Utensils, Dumbbell, Sparkles, Lightbulb, Info, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [nutritionTipsContent, setNutritionTipsContent] = useState<string>('')
  const [mealPlanDescriptionContent, setMealPlanDescriptionContent] = useState<string>('')
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set())

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
                <Button className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gold-primary/10 hover:border-gold-primary transition-all">
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
              <Button className="bg-white border-2 border-gray-300 text-gray-900 hover:bg-gold-primary/10 hover:border-gold-primary transition-all">
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
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200 rounded-xl">
              <TabsTrigger
                value="meals"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] rounded-lg"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Kostschema
              </TabsTrigger>
              <TabsTrigger
                value="supplements"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] rounded-lg"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Träning
              </TabsTrigger>
            </TabsList>

            <TabsContent value="meals" className="space-y-6 mt-6">
              {/* Daily Macro Overview */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-semibold">Totalt:</span>
                    <span className="text-gray-900 font-bold text-lg">{totalDailyCalories.toFixed(0)} kcal</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Protein:</span>
                    <span className="text-gray-900 font-semibold">{totalDailyProtein.toFixed(0)}g</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Kolhydrater:</span>
                    <span className="text-gray-900 font-semibold">{totalDailyCarbs.toFixed(0)}g</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Fett:</span>
                    <span className="text-gray-900 font-semibold">{totalDailyFat.toFixed(0)}g</span>
                  </div>
                </div>
              </div>

              {/* Meals */}
              {mealPlan.meals.map((meal) => {
                const recipeCount = meal.options?.filter(o => o.recipe).length || 0
                const isExpanded = expandedMeals.has(meal.mealNumber)
                return (
                <div key={meal.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Meal Header with Macros - Clickable */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleMeal(meal.mealNumber)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-gold-primary" />
                          {meal.name || `Måltid ${meal.mealNumber}`}
                        </h3>
                        {recipeCount > 0 && (
                          <span className="text-sm text-gray-500">({recipeCount} recept)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="text-gray-900 font-semibold">{meal.totalCalories?.toFixed(0) || 0} kcal</span>
                          <span>P: {meal.totalProtein?.toFixed(0) || 0}g</span>
                          <span>K: {meal.totalCarbs?.toFixed(0) || 0}g</span>
                          <span>F: {meal.totalFat?.toFixed(0) || 0}g</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gold-primary" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gold-primary" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* Meal Description (if exists) */}
                      {meal.description && (
                        <div className="px-4 pt-4">
                          <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                Instruktioner
                              </h4>
                            </div>
                            <div className="p-4">
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{meal.description}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ingredient Sources with better ELLER formatting */}
                      {(meal.carbSource || meal.proteinSource || meal.fatSource) && (
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {meal.proteinSource && (
                              <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                                  <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Protein</p>
                                </div>
                                <ul className="text-sm text-gray-700 p-4 space-y-3">
                                  {meal.proteinSource.split(/ELLER|eller/).map((item, idx, arr) => (
                                    <li key={idx}>
                                      <div className="flex items-start gap-3">
                                        <span className="text-gray-900 font-bold mt-0.5">•</span>
                                        <span className="leading-tight">{item.trim()}</span>
                                      </div>
                                      {idx < arr.length - 1 && (
                                        <div className="my-3 ml-5 flex items-center gap-2">
                                          <div className="h-px flex-1 bg-gray-200" />
                                          <span className="text-sm text-gold-primary font-bold uppercase px-2">ELLER</span>
                                          <div className="h-px flex-1 bg-gray-200" />
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {meal.carbSource && (
                              <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                                  <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Kolhydrater</p>
                                </div>
                                <ul className="text-sm text-gray-700 p-4 space-y-3">
                                  {meal.carbSource.split(/ELLER|eller/).map((item, idx, arr) => (
                                    <li key={idx}>
                                      <div className="flex items-start gap-3">
                                        <span className="text-gray-900 font-bold mt-0.5">•</span>
                                        <span className="leading-tight">{item.trim()}</span>
                                      </div>
                                      {idx < arr.length - 1 && (
                                        <div className="my-3 ml-5 flex items-center gap-2">
                                          <div className="h-px flex-1 bg-gray-200" />
                                          <span className="text-sm text-gold-primary font-bold uppercase px-2">ELLER</span>
                                          <div className="h-px flex-1 bg-gray-200" />
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {meal.fatSource && (
                              <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                                  <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Fett</p>
                                </div>
                                <ul className="text-sm text-gray-700 p-4 space-y-3">
                                  {meal.fatSource.split(/ELLER|eller/).map((item, idx, arr) => (
                                    <li key={idx}>
                                      <div className="flex items-start gap-3">
                                        <span className="text-gray-900 font-bold mt-0.5">•</span>
                                        <span className="leading-tight">{item.trim()}</span>
                                      </div>
                                      {idx < arr.length - 1 && (
                                        <div className="my-3 ml-5 flex items-center gap-2">
                                          <div className="h-px flex-1 bg-gray-200" />
                                          <span className="text-sm text-gold-primary font-bold uppercase px-2">ELLER</span>
                                          <div className="h-px flex-1 bg-gray-200" />
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recipe Thumbnails - Horizontal Row (at the bottom) */}
                      {recipeCount > 0 && (
                        <div className="p-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Receptförslag
                          </h4>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {meal.options?.map((option) => option.recipe && (
                              <Link
                                key={option.id}
                                href={`/dashboard/recipes/${option.recipe.id}`}
                                className="flex-shrink-0 group"
                              >
                                <div className="w-[140px]">
                                  {option.recipe.coverImage ? (
                                    <img
                                      src={option.recipe.coverImage}
                                      alt={option.recipe.title}
                                      className="w-full h-[100px] object-cover rounded-lg border border-gray-200 group-hover:border-gold-primary group-hover:scale-105 transition-all"
                                    />
                                  ) : (
                                    <div className="w-full h-[100px] bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-gold-primary transition-all">
                                      <span className="text-3xl">🍽️</span>
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-600 mt-2 line-clamp-2 group-hover:text-gold-primary transition-colors">
                                    {option.recipe.title}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )
              })}
            </TabsContent>

            <TabsContent value="supplements" className="space-y-6 mt-6">
              {/* Pre Workout */}
              {preWorkoutItems.length > 0 && (
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-blue-500" />
                      Före styrketräning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {preWorkoutItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <span className="text-blue-500">💊</span>
                          </div>
                          <p className="text-gray-900 font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.supplementBadge && (
                            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none">
                              {item.supplementBadge}
                            </Badge>
                          )}
                          <span className="text-gray-900 font-semibold">
                            {item.amountG}{item.amountUnit || 'g'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Pre Workout Totals */}
                    {(mealPlan.preWorkoutProtein || mealPlan.preWorkoutCalories) && (
                      <div className="bg-blue-50 rounded-lg p-3 mt-4">
                        <p className="text-xs text-gray-500 mb-2">Totalt före träning</p>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 text-xs">Protein:</span>
                            <p className="font-bold text-gray-900">{mealPlan.preWorkoutProtein?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Fett:</span>
                            <p className="font-bold text-gray-900">{mealPlan.preWorkoutFat?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Kolhydrater:</span>
                            <p className="font-bold text-gray-900">{mealPlan.preWorkoutCarbs?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Kcal:</span>
                            <p className="font-bold text-gray-900">{mealPlan.preWorkoutCalories?.toFixed(0) || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Post Workout */}
              {postWorkoutItems.length > 0 && (
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-green-500" />
                      Efter styrketräning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {postWorkoutItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <span className="text-green-500">💊</span>
                          </div>
                          <p className="text-gray-900 font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.supplementBadge && (
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-none">
                              {item.supplementBadge}
                            </Badge>
                          )}
                          <span className="text-gray-900 font-semibold">
                            {item.amountG}{item.amountUnit || 'g'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Post Workout Totals */}
                    {(mealPlan.postWorkoutProtein || mealPlan.postWorkoutCalories) && (
                      <div className="bg-green-50 rounded-lg p-3 mt-4">
                        <p className="text-xs text-gray-500 mb-2">Totalt efter träning</p>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 text-xs">Protein:</span>
                            <p className="font-bold text-gray-900">{mealPlan.postWorkoutProtein?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Fett:</span>
                            <p className="font-bold text-gray-900">{mealPlan.postWorkoutFat?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Kolhydrater:</span>
                            <p className="font-bold text-gray-900">{mealPlan.postWorkoutCarbs?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Kcal:</span>
                            <p className="font-bold text-gray-900">{mealPlan.postWorkoutCalories?.toFixed(0) || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {preWorkoutItems.length === 0 && postWorkoutItems.length === 0 && (
                <Card className="bg-white border border-gray-200">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 mx-auto text-gold-primary mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Inga träningskosttillskott tilldelade
                      </h3>
                      <p className="text-gray-500">
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
