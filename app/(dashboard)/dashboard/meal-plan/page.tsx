'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Utensils, Sparkles, ChevronDown, ChevronUp, UtensilsCrossed, Wand2 } from 'lucide-react'
import { Pyramid } from '@/components/pyramid'
import { nutritionPyramidLevels, nutritionFoundation } from '@/lib/data/pyramid-content'
import { MacroSummary, MealMacros } from '@/components/meal-plan/macro-summary'
import { WeekMacroDisplay } from '@/components/meal-plan/WeekMacroDisplay'
import { AdjustMacrosWizard, MealMacros as WizardMealMacros } from '@/components/meal-plan/AdjustMacrosWizard'
import { MealPlanGenerator } from '@/components/meal-plan-generator'
import { GuidePanel } from '@/components/meal-plan/GuidePanel'

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
  const [nutritionPlanId, setNutritionPlanId] = useState<string | null>(null)
  const [flexibleMealPlanId, setFlexibleMealPlanId] = useState<string | null>(null)
  const [flexibleTargetMacros, setFlexibleTargetMacros] = useState<{ protein: number; carbs: number; fat: number; kcal: number } | null>(null)
  const [showAdjustWizard, setShowAdjustWizard] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // For forcing FlexibleMealPlan reload

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
    fetchNutritionPlan()
  }, [])

  const fetchNutritionPlan = async () => {
    try {
      // Fetch the client's nutrition plan to get macros for flexible meal planning
      const response = await fetch('/api/nutrition-plans/my-plan')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setNutritionPlanId(data.id)
          setFlexibleTargetMacros({
            protein: data.proteinGrams || 0,
            carbs: data.carbGrams || 0,
            fat: data.fatGrams || 0,
            kcal: data.dailyCalorieTarget || 0,
          })
          // Check if there's already a flexible meal plan
          const mealPlanRes = await fetch(`/api/meal-plan/by-nutrition-plan/${data.id}`)
          if (mealPlanRes.ok) {
            const mealPlanData = await mealPlanRes.json()
            if (mealPlanData?.id) {
              setFlexibleMealPlanId(mealPlanData.id)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching nutrition plan:', error)
    }
  }

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

  const handleSaveAdjustments = async (settings: {
    weight: number
    activityLevel: string
    goal: string
    proteinPerKg: number
    fatPerKg: number
    mealsPerDay: number
    targetCalories: number
    proteinGrams: number
    fatGrams: number
    carbGrams: number
    nutritionPlanId?: string | null
    mealDistribution: WizardMealMacros[]
    mealNames: string[]
  }) => {
    const response = await fetch('/api/meal-plan/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      throw new Error('Failed to save adjustments')
    }

    // Refresh the data
    await Promise.all([
      fetchMealPlan(),
      fetchDailyTargets(),
      fetchNutritionPlan(),
    ])

    // Trigger refresh of FlexibleMealPlan component
    setRefreshKey(k => k + 1)

    // Update target macros for display
    setFlexibleTargetMacros({
      protein: settings.proteinGrams,
      carbs: settings.carbGrams,
      fat: settings.fatGrams,
      kcal: settings.targetCalories,
    })
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
          {mealPlan.name}
        </h1>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Nutrition Pyramid */}
      <Pyramid
        title="Nutritionspyramiden"
        levels={nutritionPyramidLevels}
        foundation={nutritionFoundation}
        colorScheme="red"
      />

      {/* Week Calendar + Macro Display */}
      <WeekMacroDisplay
        dailyTargets={dailyTargets}
        selectedDay={selectedDay}
        onDaySelect={setSelectedDay}
        defaultCalories={totalDailyCalories}
        calories={currentTarget.calories}
        protein={currentTarget.protein}
        fat={currentTarget.fat}
        carbs={currentTarget.carbs}
        onAdjustClick={() => setShowAdjustWizard(true)}
      />

      {/* Adjust Macros Wizard */}
      <AdjustMacrosWizard
        open={showAdjustWizard}
        onOpenChange={setShowAdjustWizard}
        nutritionPlanId={nutritionPlanId}
        currentSettings={{
          calories: currentTarget.calories,
          protein: currentTarget.protein,
          fat: currentTarget.fat,
          carbs: currentTarget.carbs,
        }}
        onSave={handleSaveAdjustments}
      />

      {/* Guide Panel - Sidebar Layout */}
      <GuidePanel
        mealPlanDescriptionContent={mealPlanDescriptionContent}
        nutritionTipsContent={nutritionTipsContent}
      />

      {/* Main Content */}
      <div>
          <Tabs defaultValue="flexible" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200 rounded-xl p-1">
              <TabsTrigger
                value="flexible"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-gray-600 rounded-lg transition-all"
              >
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Flexibel
              </TabsTrigger>
              <TabsTrigger
                value="meals"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-gray-600 rounded-lg transition-all"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Kostschema
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
                    className="px-4 py-3 flex items-start justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleMeal(meal.mealNumber)}
                  >
                    <div className="flex items-start gap-2">
                      <Utensils className="w-5 h-5 text-gold-primary mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {meal.name || `Måltid ${meal.mealNumber}`}
                          </h3>
                          {recipeCount > 0 && (
                            <span className="text-sm text-gray-500">({recipeCount} recept)</span>
                          )}
                        </div>
                        {/* Macro text under meal name */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span><span className="font-medium text-gray-500">KCAL</span> <span className="font-bold text-amber-600">{Math.round(Number(meal.totalCalories || 0))}</span></span>
                          <span className="text-gray-300">·</span>
                          <span><span className="font-medium text-gray-500">PROT</span> <span className="font-bold text-rose-600">{Math.round(Number(meal.totalProtein || 0))}g</span></span>
                          <span className="text-gray-300">·</span>
                          <span><span className="font-medium text-gray-500">KOLH</span> <span className="font-bold text-amber-500">{Math.round(Number(meal.totalCarbs || 0))}g</span></span>
                          <span className="text-gray-300">·</span>
                          <span><span className="font-medium text-gray-500">FETT</span> <span className="font-bold text-sky-500">{Math.round(Number(meal.totalFat || 0))}g</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
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

            <TabsContent value="flexible" className="space-y-4 mt-6">
              {/* Flexibel kosthållning - MealPlanGenerator */}
              {nutritionPlanId && flexibleTargetMacros ? (
                <MealPlanGenerator
                  key={refreshKey} // Force remount when wizard saves
                  nutritionPlanId={nutritionPlanId}
                  targetMacros={flexibleTargetMacros}
                  onSave={() => {
                    // Refresh when saved
                    fetchNutritionPlan()
                  }}
                  onMealPlanIdChange={(newId: string) => {
                    setFlexibleMealPlanId(newId)
                  }}
                />
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm">
                  <div className="text-center">
                    <Wand2 className="w-12 h-12 mx-auto text-purple-500 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Ingen kostplan tilldelad
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Din coach behöver först skapa en kostplan med makromål för att du ska kunna använda flexibel kosthållning
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
