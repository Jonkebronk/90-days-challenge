'use client'

/**
 * Smart Meal Planner Component
 * Styled to match the 90 Days Challenge platform design
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Utensils,
  Calendar,
  RefreshCw,
  Flame,
  Beef,
  Wheat,
  Droplet,
  AlertCircle,
  Loader2
} from 'lucide-react'

// Types
interface MacroTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MacroRatios {
  protein: number
  carbs: number
  fat: number
}

interface RecipeMatch {
  recipe: {
    id: string
    title: string
    description?: string
    imageUrl?: string
    originalServings: number
    originalMacros: MacroTargets
  }
  scaleFactor: number
  scaledServings: number
  scaledMacros: MacroTargets
  score: number
  deviation: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

interface MealSlot {
  slot: string
  recipe: {
    id: string
    title: string
    imageUrl?: string
    scaleFactor: number
    scaledServings: number
    macros: MacroTargets
  }
}

interface DayPlan {
  meals: MealSlot[]
  totals: MacroTargets
  deviation: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  score: number
}

// Utility: Convert ratios to grams
function ratiosToGrams(calories: number, ratios: MacroRatios): MacroTargets {
  return {
    calories,
    protein: Math.round((ratios.protein / 100) * calories / 4),
    carbs: Math.round((ratios.carbs / 100) * calories / 4),
    fat: Math.round((ratios.fat / 100) * calories / 9)
  }
}

// Sub-components
function MacroCircle({
  label,
  value,
  total,
  color,
  icon: Icon
}: {
  label: string
  value: number
  total: number
  color: string
  icon: React.ElementType
}) {
  const percentage = Math.min(100, (value / total) * 100)
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-700"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-5 h-5 mb-1" style={{ color }} />
          <span className="text-sm font-bold text-white">{Math.round(value)}g</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
      <span className="text-xs text-gray-500">av {total}g</span>
    </div>
  )
}

function RecipeCard({
  match,
  onSelect
}: {
  match: RecipeMatch
  onSelect?: () => void
}) {
  const scoreColor = match.score >= 0.8 ? 'text-green-400' :
                     match.score >= 0.6 ? 'text-yellow-400' : 'text-red-400'

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-gold-primary/50 transition-all cursor-pointer" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {match.recipe.imageUrl && (
            <img
              src={match.recipe.imageUrl}
              alt={match.recipe.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-white">{match.recipe.title}</h4>
            {match.recipe.description && (
              <p className="text-sm text-gray-400 line-clamp-1">{match.recipe.description}</p>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={`${scoreColor} border-current`}>
                {Math.round(match.score * 100)}% match
              </Badge>
              {match.scaleFactor !== 1 && (
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  {match.scaledServings} portioner
                </Badge>
              )}
            </div>

            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-gold-primary" />
                {match.scaledMacros.calories} kcal
              </span>
              <span className="flex items-center gap-1">
                <Beef className="w-3 h-3 text-red-400" />
                {match.scaledMacros.protein}g
              </span>
              <span className="flex items-center gap-1">
                <Wheat className="w-3 h-3 text-yellow-400" />
                {match.scaledMacros.carbs}g
              </span>
              <span className="flex items-center gap-1">
                <Droplet className="w-3 h-3 text-blue-400" />
                {match.scaledMacros.fat}g
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DayPlanView({
  plan,
  target,
  onRegenerate
}: {
  plan: DayPlan
  target: MacroTargets
  onRegenerate?: () => void
}) {
  const isWithinTolerance = (dev: number) => Math.abs(dev) <= 10

  return (
    <div className="space-y-4">
      {/* Totals */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-white">Dagens totaler</h4>
            <Badge
              className={plan.score >= 0.8 ? 'bg-green-600' : 'bg-gray-600'}
            >
              {Math.round(plan.score * 100)}% match
            </Badge>
          </div>

          <div className="flex justify-around">
            <MacroCircle
              label="Protein"
              value={plan.totals.protein}
              total={target.protein}
              color="#ef4444"
              icon={Beef}
            />
            <MacroCircle
              label="Kolhydrater"
              value={plan.totals.carbs}
              total={target.carbs}
              color="#eab308"
              icon={Wheat}
            />
            <MacroCircle
              label="Fett"
              value={plan.totals.fat}
              total={target.fat}
              color="#3b82f6"
              icon={Droplet}
            />
          </div>

          <div className="mt-4 text-center">
            <span className="text-2xl font-bold text-white">{plan.totals.calories}</span>
            <span className="text-gray-400 ml-1">/ {target.calories} kcal</span>
          </div>

          {/* Deviations */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
            {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => (
              <div key={key} className="text-center">
                <span className={`font-medium ${
                  isWithinTolerance(plan.deviation[key]) ? 'text-green-400' : 'text-red-400'
                }`}>
                  {plan.deviation[key] > 0 ? '+' : ''}{plan.deviation[key].toFixed(1)}%
                </span>
                <br />
                <span className="text-gray-500 capitalize">{key === 'calories' ? 'Kcal' : key}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      <div className="space-y-3">
        {plan.meals.map((meal, index) => (
          <Card key={index} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 border-gold-primary text-gold-primary">{meal.slot}</Badge>
                  <h4 className="font-semibold text-white">{meal.recipe.title}</h4>
                  <div className="flex gap-2 mt-1 text-xs text-gray-400">
                    <span>{meal.recipe.macros.calories} kcal</span>
                    <span>P: {meal.recipe.macros.protein}g</span>
                    <span>K: {meal.recipe.macros.carbs}g</span>
                    <span>F: {meal.recipe.macros.fat}g</span>
                  </div>
                  {meal.recipe.scaleFactor !== 1 && (
                    <p className="text-xs text-gold-primary mt-1">
                      Skalat till {meal.recipe.scaledServings} portioner
                    </p>
                  )}
                </div>
                {meal.recipe.imageUrl && (
                  <img
                    src={meal.recipe.imageUrl}
                    alt={meal.recipe.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {onRegenerate && (
        <Button onClick={onRegenerate} variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Generera ny plan
        </Button>
      )}
    </div>
  )
}

// Main Component
export function SmartMealPlanner() {
  // State
  const [calories, setCalories] = useState(2000)
  const [ratios, setRatios] = useState<MacroRatios>({ protein: 30, carbs: 40, fat: 30 })
  const [vegetarian, setVegetarian] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [matches, setMatches] = useState<RecipeMatch[]>([])
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null)

  // Computed
  const targets = ratiosToGrams(calories, ratios)

  // Handlers
  const handleRatioChange = (key: keyof MacroRatios, value: number) => {
    const newRatios = { ...ratios, [key]: value }

    // Auto-adjust other values to sum to 100
    const remaining = 100 - value
    const otherKeys = Object.keys(ratios).filter(k => k !== key) as (keyof MacroRatios)[]
    const currentOtherSum = otherKeys.reduce((sum, k) => sum + ratios[k], 0)

    if (currentOtherSum > 0) {
      otherKeys.forEach(k => {
        newRatios[k] = Math.round((ratios[k] / currentOtherSum) * remaining)
      })
    } else {
      // Distribute evenly
      otherKeys.forEach(k => {
        newRatios[k] = Math.round(remaining / otherKeys.length)
      })
    }

    setRatios(newRatios)
  }

  const findRecipes = useCallback(async () => {
    if (calories < 500) {
      setError('Ange minst 500 kcal')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/meal-planner/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calories,
          proteinRatio: ratios.protein,
          carbsRatio: ratios.carbs,
          fatRatio: ratios.fat,
          vegetarian,
          limit: 10,
          allowScaling: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte hämta recept')
      }

      setMatches(data.matches || [])
      if (data.matches?.length === 0) {
        setError('Inga matchande recept hittades. Prova att justera dina mål.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }, [calories, ratios, vegetarian])

  const generateDayPlan = useCallback(async () => {
    if (calories < 500) {
      setError('Ange minst 500 kcal')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/meal-planner/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calories,
          proteinRatio: ratios.protein,
          carbsRatio: ratios.carbs,
          fatRatio: ratios.fat,
          vegetarian
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte generera dagsplan')
      }

      setDayPlan(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }, [calories, ratios, vegetarian])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-primary to-gold-secondary bg-clip-text text-transparent">
          Smart Måltidsplanerare
        </h1>
        <p className="text-gray-400 mt-2">Hitta recept som passar dina makromål</p>
      </div>

      {/* Goal settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Dina mål</CardTitle>
          <CardDescription className="text-gray-400">Ställ in kalorier och makrofördelning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calories */}
          <div>
            <Label htmlFor="calories" className="text-white">Dagligt kaloriintag</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="calories"
                type="text"
                inputMode="numeric"
                value={calories || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  setCalories(val ? parseInt(val, 10) : 0)
                }}
                placeholder="2000"
                className="w-32 bg-gray-700 border-gray-600 text-white"
              />
              <span className="text-gray-400">kcal</span>
            </div>
          </div>

          {/* Macro distribution */}
          <div className="space-y-4">
            <Label className="text-white">Makrofördelning</Label>

            {/* Protein */}
            <div className="flex items-center gap-4">
              <div className="w-20 flex items-center gap-2">
                <Beef className="w-4 h-4 text-red-400" />
                <span className="text-sm text-white">Protein</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={ratios.protein || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    const num = val ? Math.min(100, parseInt(val, 10)) : 0
                    setRatios(prev => ({ ...prev, protein: num }))
                  }}
                  className="w-16 bg-gray-700 border-gray-600 text-white text-center"
                />
                <span className="text-gray-400">%</span>
              </div>
              <span className="text-sm text-gray-400">
                ({targets.protein}g)
              </span>
            </div>

            {/* Carbs */}
            <div className="flex items-center gap-4">
              <div className="w-20 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white">Carbs</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={ratios.carbs || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    const num = val ? Math.min(100, parseInt(val, 10)) : 0
                    setRatios(prev => ({ ...prev, carbs: num }))
                  }}
                  className="w-16 bg-gray-700 border-gray-600 text-white text-center"
                />
                <span className="text-gray-400">%</span>
              </div>
              <span className="text-sm text-gray-400">
                ({targets.carbs}g)
              </span>
            </div>

            {/* Fat */}
            <div className="flex items-center gap-4">
              <div className="w-20 flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white">Fett</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={ratios.fat || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    const num = val ? Math.min(100, parseInt(val, 10)) : 0
                    setRatios(prev => ({ ...prev, fat: num }))
                  }}
                  className="w-16 bg-gray-700 border-gray-600 text-white text-center"
                />
                <span className="text-gray-400">%</span>
              </div>
              <span className="text-sm text-gray-400">
                ({targets.fat}g)
              </span>
            </div>

            {/* Total indicator */}
            {(ratios.protein + ratios.carbs + ratios.fat) !== 100 && (
              <p className="text-sm text-yellow-400">
                Totalt: {ratios.protein + ratios.carbs + ratios.fat}% (bör vara 100%)
              </p>
            )}
          </div>

          {/* Vegetarian */}
          <div className="flex items-center justify-between">
            <Label htmlFor="vegetarian" className="text-white">Endast vegetariska recept</Label>
            <Switch
              id="vegetarian"
              checked={vegetarian}
              onCheckedChange={setVegetarian}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="match">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="match" className="flex items-center gap-2 data-[state=active]:bg-gold-primary data-[state=active]:text-white">
            <Utensils className="w-4 h-4" />
            Hitta recept
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2 data-[state=active]:bg-gold-primary data-[state=active]:text-white">
            <Calendar className="w-4 h-4" />
            Dagsplan
          </TabsTrigger>
        </TabsList>

        {/* Find recipes */}
        <TabsContent value="match" className="space-y-4">
          <Button
            onClick={findRecipes}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Utensils className="w-4 h-4 mr-2" />
            )}
            Sök matchande recept
          </Button>

          {matches.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Hittade {matches.length} recept som matchar dina mål
              </p>
              {matches.map((match) => (
                <RecipeCard key={match.recipe.id} match={match} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Day plan */}
        <TabsContent value="plan" className="space-y-4">
          <Button
            onClick={generateDayPlan}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            Generera dagsplan
          </Button>

          {dayPlan && (
            <DayPlanView
              plan={dayPlan}
              target={targets}
              onRegenerate={generateDayPlan}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SmartMealPlanner
