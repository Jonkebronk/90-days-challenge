'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  UtensilsCrossed,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Apple,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { MacroProgressBar } from '@/components/macro-progress-bar'
import { MacroBadge } from '@/components/macro-badge'

type TemplateMealOption = {
  id: string
  optionType: string
  recipeId: string | null
  servingMultiplier: number | null
  customName: string | null
  customDescription: string | null
  customFoodItems: any
  calculatedProtein: number
  calculatedFat: number
  calculatedCarbs: number
  calculatedCalories: number
  isDefault: boolean
  orderIndex: number
  notes: string | null
  recipe?: {
    id: string
    title: string
    coverImage: string | null
    caloriesPerServing: number | null
    proteinPerServing: number | null
    carbsPerServing: number | null
    fatPerServing: number | null
  }
}

type TemplateMeal = {
  id: string
  name: string
  mealType: string
  description: string | null
  carbSource: string | null
  proteinSource: string | null
  fatSource: string | null
  targetProtein: number | null
  targetFat: number | null
  targetCarbs: number | null
  targetCalories: number | null
  orderIndex: number
  options: TemplateMealOption[]
}

type MealPlanTemplate = {
  id: string
  name: string
  description: string | null
  generalAdvice: string | null
  targetProtein: number | null
  targetFat: number | null
  targetCarbs: number | null
  targetCalories: number | null
  published: boolean
  meals: TemplateMeal[]
  coach?: {
    id: string
    name: string | null
    image: string | null
  }
}

type Selection = {
  id: string
  userId: string
  templateMealId: string
  selectedOptionId: string
}

export default function MealPlanTemplateViewPage() {
  const { data: session } = useSession()
  const [templates, setTemplates] = useState<MealPlanTemplate[]>([])
  const [selections, setSelections] = useState<Selection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())
  const [savingMeal, setSavingMeal] = useState<string | null>(null)

  // Unregister service workers on mount to prevent caching issues
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
          console.log('Service worker unregistered')
        })
      })
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchAssignedTemplates()
    }
  }, [session])

  const fetchAssignedTemplates = async () => {
    try {
      setIsLoading(true)
      // Add cache busting timestamp
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/my-meal-plan-templates?_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', data) // Debug log
        setTemplates(data.assignments || [])
        setSelections(data.selections || [])
      } else {
        toast.error('Kunde inte hämta måltidsplaner')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMealExpanded = (mealId: string) => {
    setExpandedMeals((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(mealId)) {
        newSet.delete(mealId)
      } else {
        newSet.add(mealId)
      }
      return newSet
    })
  }

  const getSelectedOptionId = (templateMealId: string): string | null => {
    const selection = selections.find((s) => s.templateMealId === templateMealId)
    return selection ? selection.selectedOptionId : null
  }

  const handleOptionSelect = async (
    templateMealId: string,
    selectedOptionId: string
  ) => {
    try {
      setSavingMeal(templateMealId)
      const response = await fetch('/api/client-meal-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateMealId,
          selectedOptionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update local selections
        setSelections((prev) => {
          const filtered = prev.filter((s) => s.templateMealId !== templateMealId)
          return [
            ...filtered,
            {
              id: data.selection.id,
              userId: data.selection.userId,
              templateMealId: data.selection.templateMealId,
              selectedOptionId: data.selection.selectedOptionId,
            },
          ]
        })
        toast.success('Val sparat')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte spara val')
      }
    } catch (error) {
      console.error('Error saving selection:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setSavingMeal(null)
    }
  }

  const calculateFoodMacros = (template: MealPlanTemplate) => {
    let totalProtein = 0
    let totalFat = 0
    let totalCarbs = 0
    let totalCalories = 0

    // Only non-training meals (all meals that are not explicitly training-related)
    template.meals.forEach((meal) => {
      // Skip if meal type is explicitly for training (you can adjust this logic)
      if (meal.mealType?.toLowerCase() === 'training') return

      const selectedOptionId = getSelectedOptionId(meal.id)
      const option = selectedOptionId
        ? meal.options.find((o) => o.id === selectedOptionId)
        : meal.options.find((o) => o.isDefault) || meal.options[0]

      if (option) {
        totalProtein += option.calculatedProtein
        totalFat += option.calculatedFat
        totalCarbs += option.calculatedCarbs
        totalCalories += option.calculatedCalories
      }
    })

    return { totalProtein, totalFat, totalCarbs, totalCalories }
  }

  const calculateTrainingMacros = (template: MealPlanTemplate) => {
    // For now, return zeros - you can add training meal logic later
    return {
      totalProtein: 0,
      totalFat: 0,
      totalCarbs: 0,
      totalCalories: 0,
    }
  }

  const calculateTotalMacros = (template: MealPlanTemplate) => {
    let totalProtein = 0
    let totalFat = 0
    let totalCarbs = 0
    let totalCalories = 0

    template.meals.forEach((meal) => {
      const selectedOptionId = getSelectedOptionId(meal.id)
      const option = selectedOptionId
        ? meal.options.find((o) => o.id === selectedOptionId)
        : meal.options.find((o) => o.isDefault) || meal.options[0]

      if (option) {
        totalProtein += option.calculatedProtein
        totalFat += option.calculatedFat
        totalCarbs += option.calculatedCarbs
        totalCalories += option.calculatedCalories
      }
    })

    return { totalProtein, totalFat, totalCarbs, totalCalories }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-light border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-200">Laddar måltidsplan...</p>
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-12 backdrop-blur-[10px] text-center">
          <UtensilsCrossed className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ingen måltidsplan ännu</h2>
          <p className="text-gray-400">
            Din coach har inte tilldelat dig en måltidsplan än.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {templates.map((template) => {
        const foodMacros = calculateFoodMacros(template)
        const trainingMacros = calculateTrainingMacros(template)
        const totals = calculateTotalMacros(template)

        return (
          <div key={template.id} className="space-y-6">
            {/* Header with Coach Info */}
            <div className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px] rounded-xl p-6">
              <div className="flex items-start gap-6">
                {/* Coach Avatar */}
                <div className="flex-shrink-0">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gold-primary/30">
                    {template.coach?.image ? (
                      <Image
                        src={template.coach.image}
                        alt={template.coach.name || 'Coach'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[rgba(255,215,0,0.1)] flex items-center justify-center">
                        <span className="text-4xl text-gold-light">
                          {template.coach?.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-center mt-2 text-gray-400">
                    {template.coach?.name || 'Din coach'}
                  </p>
                </div>

                {/* Header Text */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Ditt skräddarsydda kostschema för din period{' '}
                    <span className="text-gold-light">{session?.user?.name || 'där'}</span>.
                  </h1>
                  {template.generalAdvice && (
                    <div className="mt-3 p-4 bg-[rgba(255,215,0,0.05)] border border-gold-primary/20 rounded-lg">
                      <h3 className="text-sm font-semibold text-gold-light mb-2">Generella råd:</h3>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">
                        {template.generalAdvice}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Macro Summary - Three Sections */}
            <div className="space-y-4">
              {/* Totalt för kost */}
              <div className="bg-white/5 border border-gold-primary/20 backdrop-blur-[10px] rounded-xl p-6">
                <h3 className="text-lg font-bold text-center text-white mb-4">
                  Totalt för kost
                </h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Protein:</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(foodMacros.totalProtein * 10) / 10}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Fett:</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(foodMacros.totalFat * 10) / 10}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Kolhydrater:
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(foodMacros.totalCarbs * 10) / 10}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Kcal:</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(foodMacros.totalCalories * 10) / 10}
                    </p>
                  </div>
                </div>
              </div>

              {/* Totalt för träning */}
              <div className="bg-white/5 border border-gold-primary/20 backdrop-blur-[10px] rounded-xl p-6">
                <h3 className="text-lg font-bold text-center text-white mb-4">
                  Totalt för träning
                </h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Protein:</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(trainingMacros.totalProtein * 10) / 10}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Fett:</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(trainingMacros.totalFat * 10) / 10}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Kolhydrater:
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(trainingMacros.totalCarbs * 10) / 10}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Kcal:</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(trainingMacros.totalCalories * 10) / 10}
                    </p>
                  </div>
                </div>
              </div>

              {/* Totalt dagsintag - Big Blue/Gold Box */}
              <div className="bg-gradient-to-br from-gold-light to-orange-500 rounded-xl p-6">
                <h3 className="text-lg font-bold text-center text-[#0a0a0a] mb-4">
                  Totalt dagsintag
                </h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-[#0a0a0a]">
                      {Math.round(totals.totalProtein * 10) / 10}
                    </p>
                    <p className="text-sm text-[rgba(10,10,10,0.7)] mt-1">Protein</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#0a0a0a]">
                      {Math.round(totals.totalFat * 10) / 10}
                    </p>
                    <p className="text-sm text-[rgba(10,10,10,0.7)] mt-1">Fett</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#0a0a0a]">
                      {Math.round(totals.totalCarbs * 10) / 10}
                    </p>
                    <p className="text-sm text-[rgba(10,10,10,0.7)] mt-1">Kolhydrater</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#0a0a0a]">
                      {Math.round(totals.totalCalories * 10) / 10}
                    </p>
                    <p className="text-sm text-[rgba(10,10,10,0.7)] mt-1">Kcal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Meals */}
            <div className="space-y-4">
              {template.meals
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((meal) => {
                  const isExpanded = expandedMeals.has(meal.id)
                  const selectedOptionId = getSelectedOptionId(meal.id)
                  const selectedOption = selectedOptionId
                    ? meal.options.find((o) => o.id === selectedOptionId)
                    : meal.options.find((o) => o.isDefault) || meal.options[0]

                  return (
                    <Card
                      key={meal.id}
                      className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]"
                    >
                      <div
                        className="p-6 cursor-pointer"
                        onClick={() =>
                          meal.options.length > 1 && toggleMealExpanded(meal.id)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              {meal.name}
                              {meal.options.length > 1 && (
                                <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)]">
                                  {meal.options.length} alternativ
                                </Badge>
                              )}
                            </h3>
                            {meal.description && (
                              <p className="text-sm text-gray-500 mt-1 italic">
                                {meal.description}
                              </p>
                            )}

                            {/* Ingredient Sources */}
                            {(meal.carbSource || meal.proteinSource || meal.fatSource) && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                {meal.carbSource && (
                                  <div className="bg-[rgba(255,215,0,0.05)] border border-gold-primary/20 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1 font-semibold">Kolhydratskälla</p>
                                    <p className="text-sm text-gray-300 whitespace-pre-line">{meal.carbSource}</p>
                                  </div>
                                )}
                                {meal.proteinSource && (
                                  <div className="bg-[rgba(255,215,0,0.05)] border border-gold-primary/20 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1 font-semibold">Proteinkälla</p>
                                    <p className="text-sm text-gray-300 whitespace-pre-line">{meal.proteinSource}</p>
                                  </div>
                                )}
                                {meal.fatSource && (
                                  <div className="bg-[rgba(255,215,0,0.05)] border border-gold-primary/20 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1 font-semibold">Fettkälla</p>
                                    <p className="text-sm text-gray-300 whitespace-pre-line">{meal.fatSource}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {selectedOption && (
                              <p className="text-sm text-gray-400 mt-2">
                                {selectedOption.optionType === 'recipe'
                                  ? selectedOption.recipe?.title
                                  : selectedOption.customName}{' '}
                                •{' '}
                                {Math.round(selectedOption.calculatedCalories)} kcal
                                • P: {Math.round(selectedOption.calculatedProtein)}g
                                • F: {Math.round(selectedOption.calculatedFat)}g • K:{' '}
                                {Math.round(selectedOption.calculatedCarbs)}g
                              </p>
                            )}
                          </div>
                          {meal.options.length > 1 && (
                            <div className="text-gray-400">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isExpanded && meal.options.length > 1 && (
                        <CardContent className="pt-0">
                          <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">
                            Receptförslag
                          </h4>
                          <RadioGroup
                            value={selectedOptionId || ''}
                            onValueChange={(value) =>
                              handleOptionSelect(meal.id, value)
                            }
                            disabled={savingMeal === meal.id}
                          >
                            <div className="space-y-3">
                              {meal.options
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                                .map((option) => (
                                  <div
                                    key={option.id}
                                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${
                                      selectedOptionId === option.id
                                        ? 'bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.4)]'
                                        : 'bg-[rgba(0,0,0,0.2)] border-gold-primary/10 hover:border-gold-primary/30'
                                    }`}
                                  >
                                    <RadioGroupItem
                                      value={option.id}
                                      id={option.id}
                                      className="border-[rgba(255,215,0,0.5)]"
                                    />
                                    <Label
                                      htmlFor={option.id}
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-1">
                                          {option.optionType === 'recipe' ? (
                                            option.recipe?.coverImage ? (
                                              <img
                                                src={option.recipe.coverImage}
                                                alt={option.recipe.title}
                                                className="w-12 h-12 object-cover rounded-lg"
                                              />
                                            ) : (
                                              <div className="w-12 h-12 bg-[rgba(255,215,0,0.1)] rounded-lg flex items-center justify-center">
                                                <ChefHat className="h-6 w-6 text-[rgba(255,215,0,0.5)]" />
                                              </div>
                                            )
                                          ) : option.optionType === 'ingredients' ? (
                                            <div className="w-12 h-12 bg-[rgba(255,215,0,0.1)] rounded-lg flex items-center justify-center">
                                              <Apple className="h-6 w-6 text-[rgba(255,215,0,0.5)]" />
                                            </div>
                                          ) : (
                                            <div className="w-12 h-12 bg-[rgba(255,215,0,0.1)] rounded-lg flex items-center justify-center">
                                              <UtensilsCrossed className="h-6 w-6 text-[rgba(255,215,0,0.5)]" />
                                            </div>
                                          )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium text-white">
                                              {option.optionType === 'recipe'
                                                ? option.recipe?.title
                                                : option.customName}
                                            </p>
                                            {option.isDefault && (
                                              <Badge className="bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)] text-xs">
                                                Rekommenderat
                                              </Badge>
                                            )}
                                          </div>
                                          {option.customDescription && (
                                            <p className="text-sm text-gray-500 mt-1">
                                              {option.customDescription}
                                            </p>
                                          )}
                                          <div className="flex gap-4 mt-2 text-sm text-gray-400">
                                            <span>
                                              {Math.round(option.calculatedCalories)} kcal
                                            </span>
                                            <span>
                                              P: {Math.round(option.calculatedProtein)}g
                                            </span>
                                            <span>
                                              F: {Math.round(option.calculatedFat)}g
                                            </span>
                                            <span>
                                              K: {Math.round(option.calculatedCarbs)}g
                                            </span>
                                          </div>

                                          {/* Show food items if this is an ingredients option */}
                                          {option.optionType === 'ingredients' && option.customFoodItems && (
                                            <div className="mt-3 border-t border-gold-primary/10 pt-2">
                                              <p className="text-xs text-gray-500 mb-2">Råvaror:</p>
                                              <div className="space-y-1">
                                                {(option.customFoodItems as any[]).map((item, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="flex items-center justify-between text-xs"
                                                  >
                                                    <span className="text-gray-300">
                                                      {item.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                      <span>{item.amountG}g</span>
                                                      <span className="hidden sm:inline">
                                                        P: {item.protein.toFixed(1)}g • F: {item.fat.toFixed(1)}g • K: {item.carbs.toFixed(1)}g
                                                      </span>
                                                      <span>{Math.round(item.calories)} kcal</span>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {option.notes && (
                                            <p className="text-sm text-[rgba(255,215,0,0.8)] mt-2 italic">
                                              {option.notes}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </Label>
                                  </div>
                                ))}
                              {savingMeal === meal.id && (
                                <p className="text-sm text-[rgba(255,215,0,0.8)] text-center">
                                  Sparar...
                                </p>
                              )}
                            </div>
                          </RadioGroup>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
