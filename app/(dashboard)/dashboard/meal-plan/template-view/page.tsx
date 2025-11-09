'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  UtensilsCrossed,
  ChefHat,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

type TemplateMealOption = {
  id: string
  optionType: string
  recipeId: string | null
  servingMultiplier: number | null
  customName: string | null
  customDescription: string | null
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
  targetProtein: number | null
  targetFat: number | null
  targetCarbs: number | null
  targetCalories: number | null
  published: boolean
  meals: TemplateMeal[]
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

  useEffect(() => {
    if (session?.user) {
      fetchAssignedTemplates()
    }
  }, [session])

  const fetchAssignedTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/my-meal-plan-templates')
      if (response.ok) {
        const data = await response.json()
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
      const next = new Set(prev)
      if (next.has(mealId)) {
        next.delete(mealId)
      } else {
        next.add(mealId)
      }
      return next
    })
  }

  const getSelectedOptionId = (mealId: string): string | null => {
    const selection = selections.find((s) => s.templateMealId === mealId)
    return selection?.selectedOptionId || null
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
          <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgba(255,255,255,0.8)]">Laddar måltidsplan...</p>
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-12 backdrop-blur-[10px] text-center">
          <UtensilsCrossed className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ingen måltidsplan ännu</h2>
          <p className="text-[rgba(255,255,255,0.6)]">
            Din coach har inte tilldelat dig en måltidsplan än.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {templates.map((template) => {
        const totals = calculateTotalMacros(template)

        return (
          <div key={template.id} className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
                {template.name}
              </h1>
              {template.description && (
                <p className="text-[rgba(255,255,255,0.6)] mt-2">
                  {template.description}
                </p>
              )}
            </div>

            {/* Macro Summary */}
            <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#FFD700]">
                  Dina makron
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,215,0,0.2)]">
                    <p className="text-sm text-[rgba(255,255,255,0.6)] mb-1">
                      Kalorier
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(totals.totalCalories)}
                    </p>
                    {template.targetCalories && (
                      <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                        Mål: {template.targetCalories}
                      </p>
                    )}
                  </div>
                  <div className="text-center p-4 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,215,0,0.2)]">
                    <p className="text-sm text-[rgba(255,255,255,0.6)] mb-1">
                      Protein (g)
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(totals.totalProtein)}
                    </p>
                    {template.targetProtein && (
                      <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                        Mål: {template.targetProtein}g
                      </p>
                    )}
                  </div>
                  <div className="text-center p-4 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,215,0,0.2)]">
                    <p className="text-sm text-[rgba(255,255,255,0.6)] mb-1">Fett (g)</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(totals.totalFat)}
                    </p>
                    {template.targetFat && (
                      <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                        Mål: {template.targetFat}g
                      </p>
                    )}
                  </div>
                  <div className="text-center p-4 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,215,0,0.2)]">
                    <p className="text-sm text-[rgba(255,255,255,0.6)] mb-1">
                      Kolhydrater (g)
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(totals.totalCarbs)}
                    </p>
                    {template.targetCarbs && (
                      <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                        Mål: {template.targetCarbs}g
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]"
                    >
                      <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleMealExpanded(meal.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                              {meal.name}
                              {meal.options.length > 1 && (
                                <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)]">
                                  {meal.options.length} alternativ
                                </Badge>
                              )}
                            </CardTitle>
                            {selectedOption && (
                              <p className="text-sm text-[rgba(255,255,255,0.6)] mt-2">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-[rgba(255,255,255,0.6)]"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </CardHeader>

                      {isExpanded && meal.options.length > 1 && (
                        <CardContent>
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
                                        : 'bg-[rgba(0,0,0,0.2)] border-[rgba(255,215,0,0.1)] hover:border-[rgba(255,215,0,0.3)]'
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
                                        {option.optionType === 'recipe' ? (
                                          <>
                                            {option.recipe?.coverImage ? (
                                              <img
                                                src={option.recipe.coverImage}
                                                alt={option.recipe.title}
                                                className="w-16 h-16 object-cover rounded-lg"
                                              />
                                            ) : (
                                              <div className="w-16 h-16 bg-[rgba(255,215,0,0.1)] rounded-lg flex items-center justify-center">
                                                <ChefHat className="h-8 w-8 text-[rgba(255,215,0,0.5)]" />
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="w-16 h-16 bg-[rgba(255,215,0,0.1)] rounded-lg flex items-center justify-center">
                                            <UtensilsCrossed className="h-8 w-8 text-[rgba(255,215,0,0.5)]" />
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <p className="text-white font-medium">
                                            {option.optionType === 'recipe'
                                              ? option.recipe?.title
                                              : option.customName}
                                            {option.isDefault && (
                                              <Badge className="ml-2 bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)] text-xs">
                                                Rekommenderat
                                              </Badge>
                                            )}
                                          </p>
                                          <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">
                                            {Math.round(option.calculatedCalories)} kcal
                                            • P: {Math.round(option.calculatedProtein)}g
                                            • F: {Math.round(option.calculatedFat)}g • K:{' '}
                                            {Math.round(option.calculatedCarbs)}g
                                          </p>
                                          {option.notes && (
                                            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                                              {option.notes}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </Label>
                                    {selectedOptionId === option.id && (
                                      <Check className="h-5 w-5 text-[#FFD700]" />
                                    )}
                                  </div>
                                ))}
                            </div>
                          </RadioGroup>
                          {savingMeal === meal.id && (
                            <p className="text-sm text-[rgba(255,255,255,0.6)] text-center mt-3">
                              Sparar...
                            </p>
                          )}
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
