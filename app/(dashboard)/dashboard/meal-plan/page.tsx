'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Utensils, Dumbbell, Sparkles, Lightbulb, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { MDXPreview } from '@/components/mdx-preview'
import { WeekCalendar } from '@/components/meal-plan/week-calendar'
import { MacroSummary, MealMacros } from '@/components/meal-plan/macro-summary'

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

interface DailyTarget {
  id: string
  dayOfWeek: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

export default function MealPlanPage() {
  const router = useRouter()
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [nutritionTipsContent, setNutritionTipsContent] = useState<string>('')
  const [mealPlanDescriptionContent, setMealPlanDescriptionContent] = useState<string>('')
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set())
  const [dailyTargets, setDailyTargets] = useState<DailyTarget[]>([])
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    // Default to current day of week (0 = Monday)
    const jsDay = new Date().getDay()
    return jsDay === 0 ? 6 : jsDay - 1
  })

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
    fetchDailyTargets()
  }, [])

  const fetchDailyTargets = async () => {
    try {
      const response = await fetch('/api/meal-plan/daily-targets')
      if (response.ok) {
        const data = await response.json()
        setDailyTargets(data.dailyTargets || [])
      }
    } catch (error) {
      console.error('Error fetching daily targets:', error)
    }
  }

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
          <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
            Kostschema
          </h1>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
        </div>

        {/* Empty State */}
        <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto text-gold-primary mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Inget kostschema ännu
            </h3>
            <p className="text-gray-500 text-sm">
              Din coach kommer snart att tilldela ett personligt kostschema till dig
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate total daily intake including supplements
  const totalDailyProtein = Number(mealPlan.totalProtein || 0) + Number(mealPlan.preWorkoutProtein || 0) + Number(mealPlan.postWorkoutProtein || 0)
  const totalDailyFat = Number(mealPlan.totalFat || 0) + Number(mealPlan.preWorkoutFat || 0) + Number(mealPlan.postWorkoutFat || 0)
  const totalDailyCarbs = Number(mealPlan.totalCarbs || 0) + Number(mealPlan.preWorkoutCarbs || 0) + Number(mealPlan.postWorkoutCarbs || 0)
  const totalDailyCalories = Number(mealPlan.totalCalories || 0) + Number(mealPlan.preWorkoutCalories || 0) + Number(mealPlan.postWorkoutCalories || 0)

  // Get target for selected day (fallback to plan totals if no specific target)
  const selectedDayTarget = dailyTargets.find(t => t.dayOfWeek === selectedDay)
  const currentTarget = {
    calories: selectedDayTarget ? Number(selectedDayTarget.calories) : totalDailyCalories,
    protein: selectedDayTarget ? Number(selectedDayTarget.protein) : totalDailyProtein,
    fat: selectedDayTarget ? Number(selectedDayTarget.fat) : totalDailyFat,
    carbs: selectedDayTarget ? Number(selectedDayTarget.carbs) : totalDailyCarbs
  }

  // Current intake from meal plan (what's planned)
  const currentIntake = {
    calories: totalDailyCalories,
    protein: totalDailyProtein,
    fat: totalDailyFat,
    carbs: totalDailyCarbs
  }

  return (
    <div className="space-y-6 px-4 lg:px-0">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
          {mealPlan.name}
        </h1>
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

      {/* Week Calendar */}
      <WeekCalendar
        dailyTargets={dailyTargets}
        selectedDay={selectedDay}
        onDaySelect={setSelectedDay}
        defaultCalories={totalDailyCalories}
      />

      {/* Macro Summary */}
      <MacroSummary target={currentTarget} />

      {/* Main Content */}
      <div>
          <Tabs defaultValue="meals" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200 rounded-xl p-1">
              <TabsTrigger
                value="meals"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-gray-600 rounded-lg transition-all"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Kostschema
              </TabsTrigger>
              <TabsTrigger
                value="supplements"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-gray-600 rounded-lg transition-all"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Träning
              </TabsTrigger>
            </TabsList>

            <TabsContent value="meals" className="space-y-4 mt-6">
              {/* Meals */}
              {mealPlan.meals.map((meal) => {
                const recipeCount = meal.options?.filter(o => o.recipe).length || 0
                const isExpanded = expandedMeals.has(meal.mealNumber)

                // Parse ingredient sources
                const carbItems = meal.carbSource ? meal.carbSource.split(/ELLER|eller/).map(s => s.trim()).filter(Boolean) : []
                const proteinItems = meal.proteinSource ? meal.proteinSource.split(/ELLER|eller/).map(s => s.trim()).filter(Boolean) : []
                const fatItems = meal.fatSource ? meal.fatSource.split(/ELLER|eller/).map(s => s.trim()).filter(Boolean) : []

                return (
                <div key={meal.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  {/* Meal Header */}
                  <div
                    className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleMeal(meal.mealNumber)}
                  >
                    <div className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-gold-primary" />
                      <h3 className="text-base font-semibold text-gray-900">
                        {meal.name || `Måltid ${meal.mealNumber}`}
                      </h3>
                      {recipeCount > 0 && (
                        <span className="text-sm text-gray-500">({recipeCount} recept)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Circular Macro Badges */}
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">K</span>
                      </div>
                      <span className="text-sm text-gray-600">{Math.round(Number(meal.totalCarbs || 0))}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">P</span>
                      </div>
                      <span className="text-sm text-gray-600">{Math.round(Number(meal.totalProtein || 0))}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">F</span>
                      </div>
                      <span className="text-sm text-gray-600">{Math.round(Number(meal.totalFat || 0))}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">C</span>
                      </div>
                      <span className="text-sm text-gray-600">{Math.round(Number(meal.totalCalories || 0))}</span>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {/* INSTRUKTIONER Card */}
                      {meal.description && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 border-b border-gray-200">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                              Instruktioner
                            </h4>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-gray-700 leading-relaxed">{meal.description}</p>
                          </div>
                        </div>
                      )}

                      {/* PROTEIN Card */}
                      {proteinItems.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 border-b border-gray-200">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Protein</h4>
                          </div>
                          <div className="p-4">
                            <ul className="space-y-1">
                              {proteinItems.map((item, idx) => (
                                <li key={idx}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span className="text-sm text-gray-700">{item}</span>
                                  </div>
                                  {idx < proteinItems.length - 1 && (
                                    <div className="my-3 flex items-center justify-center">
                                      <span className="text-sm font-semibold text-amber-500 uppercase">ELLER</span>
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* KOLHYDRATER Card */}
                      {carbItems.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 border-b border-gray-200">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Kolhydrater</h4>
                          </div>
                          <div className="p-4">
                            <ul className="space-y-1">
                              {carbItems.map((item, idx) => (
                                <li key={idx}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span className="text-sm text-gray-700">{item}</span>
                                  </div>
                                  {idx < carbItems.length - 1 && (
                                    <div className="my-3 flex items-center justify-center">
                                      <span className="text-sm font-semibold text-amber-500 uppercase">ELLER</span>
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* FETT Card */}
                      {fatItems.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 border-b border-gray-200">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Fett</h4>
                          </div>
                          <div className="p-4">
                            <ul className="space-y-1">
                              {fatItems.map((item, idx) => (
                                <li key={idx}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span className="text-sm text-gray-700">{item}</span>
                                  </div>
                                  {idx < fatItems.length - 1 && (
                                    <div className="my-3 flex items-center justify-center">
                                      <span className="text-sm font-semibold text-amber-500 uppercase">ELLER</span>
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Recipe Thumbnails */}
                      {recipeCount > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                            Receptförslag
                          </h4>
                          <div className="flex gap-3 overflow-x-auto pb-1">
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
                                      className="w-full h-[100px] object-cover rounded-lg border border-gray-200 group-hover:border-gold-primary transition-all"
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

            <TabsContent value="supplements" className="space-y-4 mt-6">
              {/* Pre Workout */}
              {preWorkoutItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-blue-500" />
                    <h3 className="text-base font-semibold text-gray-900">Före styrketräning</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {preWorkoutItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <span className="text-sm">💊</span>
                          </div>
                          <p className="text-gray-700 font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.supplementBadge && (
                            <Badge className="bg-blue-50 text-blue-600 border border-blue-200">
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
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                        <p className="text-xs text-gray-500 mb-2">Totalt före träning</p>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 text-xs">Protein:</span>
                            <p className="font-bold text-red-500">{mealPlan.preWorkoutProtein?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Fett:</span>
                            <p className="font-bold text-blue-500">{mealPlan.preWorkoutFat?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Kolhydrater:</span>
                            <p className="font-bold text-green-500">{mealPlan.preWorkoutCarbs?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Kcal:</span>
                            <p className="font-bold text-amber-500">{mealPlan.preWorkoutCalories?.toFixed(0) || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Post Workout */}
              {postWorkoutItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-green-500" />
                    <h3 className="text-base font-semibold text-gray-900">Efter styrketräning</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {postWorkoutItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <span className="text-sm">💊</span>
                          </div>
                          <p className="text-gray-700 font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.supplementBadge && (
                            <Badge className="bg-green-50 text-green-600 border border-green-200">
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
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                        <p className="text-xs text-gray-500 mb-2">Totalt efter träning</p>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 text-xs">Protein:</span>
                            <p className="font-bold text-red-500">{mealPlan.postWorkoutProtein?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Fett:</span>
                            <p className="font-bold text-blue-500">{mealPlan.postWorkoutFat?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Kolhydrater:</span>
                            <p className="font-bold text-green-500">{mealPlan.postWorkoutCarbs?.toFixed(1) || 0}g</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Kcal:</span>
                            <p className="font-bold text-amber-500">{mealPlan.postWorkoutCalories?.toFixed(0) || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {preWorkoutItems.length === 0 && postWorkoutItems.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto text-gold-primary mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Inga träningskosttillskott tilldelade
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Din coach kan lägga till pre- och post-workout kosttillskott om det behövs
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
      </div>
    </div>
  )
}
