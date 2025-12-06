'use client'

/**
 * Smart Meal Planner Component
 *
 * Allows users to:
 * - Set macro targets (kcal + P/F/C)
 * - See matching recipes from database
 * - Generate day plan or week plan
 * - Adjust servings and swap recipes
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
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
            className="text-gray-200"
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
          <span className="text-sm font-bold">{Math.round(value)}g</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
      <span className="text-xs text-gray-400">av {total}g</span>
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
  const scoreColor = match.score >= 0.8 ? 'text-green-600' :
                     match.score >= 0.6 ? 'text-yellow-600' : 'text-red-600'

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
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
            <h4 className="font-semibold">{match.recipe.title}</h4>
            {match.recipe.description && (
              <p className="text-sm text-gray-500 line-clamp-1">{match.recipe.description}</p>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={scoreColor}>
                {Math.round(match.score * 100)}% match
              </Badge>
              {match.scaleFactor !== 1 && (
                <Badge variant="secondary">
                  {match.scaledServings} portioner
                </Badge>
              )}
            </div>

            <div className="flex gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {match.scaledMacros.calories} kcal
              </span>
              <span className="flex items-center gap-1">
                <Beef className="w-3 h-3" />
                {match.scaledMacros.protein}g
              </span>
              <span className="flex items-center gap-1">
                <Wheat className="w-3 h-3" />
                {match.scaledMacros.carbs}g
              </span>
              <span className="flex items-center gap-1">
                <Droplet className="w-3 h-3" />
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
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Dagens totaler</h4>
            <Badge
              variant={plan.score >= 0.8 ? 'default' : 'secondary'}
              className={plan.score >= 0.8 ? 'bg-green-600' : ''}
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
            <span className="text-2xl font-bold">{plan.totals.calories}</span>
            <span className="text-gray-500 ml-1">/ {target.calories} kcal</span>
          </div>

          {/* Deviations */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
            {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => (
              <div key={key} className="text-center">
                <span className={`font-medium ${
                  isWithinTolerance(plan.deviation[key]) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {plan.deviation[key] > 0 ? '+' : ''}{plan.deviation[key].toFixed(1)}%
                </span>
                <br />
                <span className="text-gray-400 capitalize">{key === 'calories' ? 'Kcal' : key}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      <div className="space-y-3">
        {plan.meals.map((meal, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2">{meal.slot}</Badge>
                  <h4 className="font-semibold">{meal.recipe.title}</h4>
                  <div className="flex gap-2 mt-1 text-xs text-gray-500">
                    <span>{meal.recipe.macros.calories} kcal</span>
                    <span>P: {meal.recipe.macros.protein}g</span>
                    <span>K: {meal.recipe.macros.carbs}g</span>
                    <span>F: {meal.recipe.macros.fat}g</span>
                  </div>
                  {meal.recipe.scaleFactor !== 1 && (
                    <p className="text-xs text-blue-600 mt-1">
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
        <Button onClick={onRegenerate} variant="outline" className="w-full">
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

      if (!response.ok) {
        throw new Error('Kunde inte hämta recept')
      }

      const data = await response.json()
      setMatches(data.matches)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }, [calories, ratios, vegetarian])

  const generateDayPlan = useCallback(async () => {
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

      if (!response.ok) {
        throw new Error('Kunde inte generera dagsplan')
      }

      const data = await response.json()
      setDayPlan(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }, [calories, ratios, vegetarian])

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Smart Måltidsplanerare</h1>
        <p className="text-gray-500">Hitta recept som passar dina makromål</p>
      </div>

      {/* Goal settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dina mål</CardTitle>
          <CardDescription>Ställ in kalorier och makrofördelning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calories */}
          <div>
            <Label htmlFor="calories">Dagligt kaloriintag</Label>
            <div className="flex items-center gap-4 mt-2">
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-gray-500">kcal</span>
              <Slider
                value={[calories]}
                onValueChange={([v]) => setCalories(v)}
                min={1200}
                max={4000}
                step={50}
                className="flex-1"
              />
            </div>
          </div>

          {/* Macro distribution */}
          <div className="space-y-4">
            <Label>Makrofördelning</Label>

            {/* Protein */}
            <div className="flex items-center gap-4">
              <div className="w-24 flex items-center gap-2">
                <Beef className="w-4 h-4 text-red-500" />
                <span className="text-sm">Protein</span>
              </div>
              <Slider
                value={[ratios.protein]}
                onValueChange={([v]) => handleRatioChange('protein', v)}
                min={10}
                max={60}
                step={5}
                className="flex-1"
              />
              <span className="w-20 text-right text-sm">
                {ratios.protein}% ({targets.protein}g)
              </span>
            </div>

            {/* Carbs */}
            <div className="flex items-center gap-4">
              <div className="w-24 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Carbs</span>
              </div>
              <Slider
                value={[ratios.carbs]}
                onValueChange={([v]) => handleRatioChange('carbs', v)}
                min={10}
                max={70}
                step={5}
                className="flex-1"
              />
              <span className="w-20 text-right text-sm">
                {ratios.carbs}% ({targets.carbs}g)
              </span>
            </div>

            {/* Fat */}
            <div className="flex items-center gap-4">
              <div className="w-24 flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Fett</span>
              </div>
              <Slider
                value={[ratios.fat]}
                onValueChange={([v]) => handleRatioChange('fat', v)}
                min={10}
                max={60}
                step={5}
                className="flex-1"
              />
              <span className="w-20 text-right text-sm">
                {ratios.fat}% ({targets.fat}g)
              </span>
            </div>
          </div>

          {/* Vegetarian */}
          <div className="flex items-center justify-between">
            <Label htmlFor="vegetarian">Endast vegetariska recept</Label>
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
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="match">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="match" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Hitta recept
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Dagsplan
          </TabsTrigger>
        </TabsList>

        {/* Find recipes */}
        <TabsContent value="match" className="space-y-4">
          <Button
            onClick={findRecipes}
            disabled={isLoading}
            className="w-full"
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
              <p className="text-sm text-gray-500">
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
            className="w-full"
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
