'use client'

/**
 * Smart Meal Planner Component
 * Styled to match the 90 Days Challenge platform design
 * Includes Kostschema-verktyget functionality
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Utensils,
  Calendar,
  RefreshCw,
  Flame,
  Beef,
  Wheat,
  Droplet,
  AlertCircle,
  Loader2,
  Scale,
  Activity,
  TrendingDown
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

interface MealDistribution {
  name: string
  protein: number
  fat: number
  carbs: number
}

// Kostschema types
type ActivityLevel = 25 | 30 | 35
type WeightLossTempo = 550 | 770 | 1100
type MealFrequency = 4 | 5 | 6

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  25: 'Stillasittande',
  30: 'Måttligt aktiv',
  35: 'Mycket aktiv',
}

const TEMPO_LABELS: Record<WeightLossTempo, string> = {
  550: '500g/vecka',
  770: '700g/vecka',
  1100: '1000g/vecka',
}

// Meal distribution templates with percentages (from Kostschema-verktyget)
const MEAL_TEMPLATES: Record<MealFrequency, { name: string; p: number; f: number; k: number }[]> = {
  4: [
    { name: 'Frukost', p: 0.22, k: 0.25, f: 0.40 },
    { name: 'Lunch', p: 0.28, k: 0.40, f: 0.05 },
    { name: 'Middag', p: 0.28, k: 0.35, f: 0.05 },
    { name: 'Kvällsmål', p: 0.22, k: 0.00, f: 0.50 },
  ],
  5: [
    { name: 'Frukost', p: 0.19, k: 0.20, f: 0.35 },
    { name: 'Mellanmål 1', p: 0.12, k: 0.05, f: 0.30 },
    { name: 'Lunch', p: 0.25, k: 0.35, f: 0.05 },
    { name: 'Middag', p: 0.25, k: 0.35, f: 0.05 },
    { name: 'Kvällsmål', p: 0.19, k: 0.05, f: 0.25 },
  ],
  6: [
    { name: 'Frukost', p: 0.19, k: 0.20, f: 0.30 },
    { name: 'Mellanmål 1', p: 0.09, k: 0.03, f: 0.24 },
    { name: 'Lunch', p: 0.25, k: 0.34, f: 0.05 },
    { name: 'Mellanmål 2', p: 0.09, k: 0.03, f: 0.24 },
    { name: 'Middag', p: 0.25, k: 0.34, f: 0.05 },
    { name: 'Kvällsmål', p: 0.13, k: 0.06, f: 0.12 },
  ],
}

const FAT_FACTOR = 0.7

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
  // Input mode toggle
  const [useWeightBased, setUseWeightBased] = useState(true)

  // Weight-based calculation state (Kostschema-verktyget)
  const [weight, setWeight] = useState(80)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(30)
  const [weightLossTempo, setWeightLossTempo] = useState<WeightLossTempo>(550)
  const [proteinFactor, setProteinFactor] = useState(2.5)

  // Manual input state
  const [manualCalories, setManualCalories] = useState(2000)
  const [ratios, setRatios] = useState<MacroRatios>({ protein: 30, carbs: 40, fat: 30 })

  // Meal distribution state
  const [mealFrequency, setMealFrequency] = useState<MealFrequency>(5)
  const [mealDistribution, setMealDistribution] = useState<MealDistribution[]>([])

  // Other state
  const [vegetarian, setVegetarian] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<RecipeMatch[]>([])
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null)

  // Weight-based calculation (Kostschema-verktyget formulas)
  const weightBasedMacros = useMemo((): MacroTargets => {
    const metabolism = weight * activityLevel
    const calorieIntake = metabolism - weightLossTempo
    const protein = Math.round(weight * proteinFactor)
    const fat = Math.round(weight * FAT_FACTOR)
    const proteinKcal = protein * 4
    const fatKcal = fat * 9
    const carbsKcal = Math.max(0, calorieIntake - proteinKcal - fatKcal)
    const carbs = Math.round(carbsKcal / 4)
    return { calories: calorieIntake, protein, fat, carbs }
  }, [weight, activityLevel, weightLossTempo, proteinFactor])

  // Computed targets based on input mode
  const targets = useMemo((): MacroTargets => {
    if (useWeightBased) {
      return weightBasedMacros
    }
    return ratiosToGrams(manualCalories, ratios)
  }, [useWeightBased, weightBasedMacros, manualCalories, ratios])

  // Calculate meal distribution when targets or frequency change
  useEffect(() => {
    const templates = MEAL_TEMPLATES[mealFrequency]
    const distribution = templates.map(t => ({
      name: t.name,
      protein: Math.round(targets.protein * t.p),
      carbs: Math.round(targets.carbs * t.k),
      fat: Math.round(targets.fat * t.f),
    }))
    setMealDistribution(distribution)
  }, [targets, mealFrequency])

  // Helper to update a single meal's macro
  const updateMealMacro = (index: number, field: 'protein' | 'carbs' | 'fat', value: number) => {
    setMealDistribution(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Calculate meal kcal
  const getMealKcal = (meal: MealDistribution) => {
    return meal.protein * 4 + meal.carbs * 4 + meal.fat * 9
  }

  // Calculate totals from meal distribution
  const mealTotals = useMemo(() => {
    return mealDistribution.reduce(
      (acc, meal) => ({
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
        calories: acc.calories + getMealKcal(meal),
      }),
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    )
  }, [mealDistribution])

  // For API calls, use actual calories
  const calories = targets.calories

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-white">Dina mål</CardTitle>
              <CardDescription className="text-gray-400">
                {useWeightBased ? 'Beräkna makros från kroppsvikt' : 'Ange makros manuellt'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Viktbaserad</span>
              <Switch
                checked={useWeightBased}
                onCheckedChange={setUseWeightBased}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {useWeightBased ? (
            <>
              {/* Weight input */}
              <div>
                <Label className="text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-gold-primary" />
                  Kroppsvikt
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={weight || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      setWeight(val ? parseInt(val, 10) : 0)
                    }}
                    placeholder="80"
                    className="w-24 bg-gray-700 border-gray-600 text-white"
                  />
                  <span className="text-gray-400">kg</span>
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <Label className="text-white flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-green-400" />
                  Aktivitetsnivå
                </Label>
                <div className="flex flex-wrap gap-2">
                  {([25, 30, 35] as ActivityLevel[]).map((level) => (
                    <Button
                      key={level}
                      variant={activityLevel === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActivityLevel(level)}
                      className={activityLevel === level
                        ? 'bg-gold-primary hover:bg-gold-secondary text-white'
                        : 'border-gray-600 text-white hover:bg-gray-700'}
                    >
                      {ACTIVITY_LABELS[level]}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ämnesomsättning: {weight * activityLevel} kcal
                </p>
              </div>

              {/* Weight Loss Tempo */}
              <div>
                <Label className="text-white flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-blue-400" />
                  Viktnedgångstempo
                </Label>
                <div className="flex flex-wrap gap-2">
                  {([550, 770, 1100] as WeightLossTempo[]).map((tempo) => (
                    <Button
                      key={tempo}
                      variant={weightLossTempo === tempo ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setWeightLossTempo(tempo)}
                      className={weightLossTempo === tempo
                        ? 'bg-gold-primary hover:bg-gold-secondary text-white'
                        : 'border-gray-600 text-white hover:bg-gray-700'}
                    >
                      {TEMPO_LABELS[tempo]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Protein Factor Slider */}
              <div>
                <Label className="text-white flex items-center gap-2 mb-3">
                  <Beef className="w-4 h-4 text-red-400" />
                  Proteinfaktor: {proteinFactor.toFixed(1)} g/kg
                </Label>
                <div className="px-2">
                  <Slider
                    value={[proteinFactor]}
                    onValueChange={(vals) => setProteinFactor(vals[0])}
                    min={1.5}
                    max={3.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1.5</span>
                  <span>Protein: {weightBasedMacros.protein}g</span>
                  <span>3.5</span>
                </div>
              </div>

              {/* Calculated Macros Display */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3">Beräknade makros</h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Flame className="w-4 h-4 text-gold-primary" />
                    </div>
                    <span className="text-lg font-bold text-white">{weightBasedMacros.calories}</span>
                    <p className="text-xs text-gray-400">kcal</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Beef className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-lg font-bold text-white">{weightBasedMacros.protein}g</span>
                    <p className="text-xs text-gray-400">Protein</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Wheat className="w-4 h-4 text-yellow-400" />
                    </div>
                    <span className="text-lg font-bold text-white">{weightBasedMacros.carbs}g</span>
                    <p className="text-xs text-gray-400">Kolhydrat</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Droplet className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-lg font-bold text-white">{weightBasedMacros.fat}g</span>
                    <p className="text-xs text-gray-400">Fett</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Manual Calories */}
              <div>
                <Label htmlFor="calories" className="text-white">Dagligt kaloriintag</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="calories"
                    type="text"
                    inputMode="numeric"
                    value={manualCalories || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      setManualCalories(val ? parseInt(val, 10) : 0)
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
            </>
          )}

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

      {/* Meal Distribution */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Måltidsfördelning</CardTitle>
          <CardDescription className="text-gray-400">
            Klicka på måltidstab för att välja antal måltider per dag
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meal frequency tabs */}
          <div className="flex gap-2">
            {([4, 5, 6] as MealFrequency[]).map((freq) => (
              <Button
                key={freq}
                variant={mealFrequency === freq ? 'default' : 'outline'}
                onClick={() => setMealFrequency(freq)}
                className={mealFrequency === freq
                  ? 'bg-gold-primary hover:bg-gold-secondary text-white flex-1'
                  : 'border-gray-600 text-white hover:bg-gray-700 flex-1'}
              >
                {freq} måltider
              </Button>
            ))}
          </div>

          {/* Meal distribution table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-1 text-gray-400 font-medium">Måltid</th>
                  <th className="text-center py-2 px-1 text-green-400 font-medium">Protein</th>
                  <th className="text-center py-2 px-1 text-red-400 font-medium">Fett</th>
                  <th className="text-center py-2 px-1 text-yellow-400 font-medium">Kolhydrat</th>
                  <th className="text-center py-2 px-1 text-gray-400 font-medium">Kcal</th>
                </tr>
              </thead>
              <tbody>
                {mealDistribution.map((meal, index) => (
                  <tr key={index} className="border-b border-gray-700/50">
                    <td className="py-2 px-1 text-white">{meal.name}</td>
                    <td className="py-2 px-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={meal.protein || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '')
                          updateMealMacro(index, 'protein', val ? parseInt(val, 10) : 0)
                        }}
                        className="w-16 mx-auto bg-gray-700 border-gray-600 text-green-400 text-center h-8"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={meal.fat || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '')
                          updateMealMacro(index, 'fat', val ? parseInt(val, 10) : 0)
                        }}
                        className="w-16 mx-auto bg-gray-700 border-gray-600 text-red-400 text-center h-8"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={meal.carbs || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '')
                          updateMealMacro(index, 'carbs', val ? parseInt(val, 10) : 0)
                        }}
                        className="w-16 mx-auto bg-gray-700 border-gray-600 text-yellow-400 text-center h-8"
                      />
                    </td>
                    <td className="py-2 px-1 text-center text-gray-300">{getMealKcal(meal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-600">
                  <td className="py-2 px-1 text-white font-medium">Summa</td>
                  <td className={`py-2 px-1 text-center font-medium ${
                    mealTotals.protein === targets.protein ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {mealTotals.protein}g
                  </td>
                  <td className={`py-2 px-1 text-center font-medium ${
                    mealTotals.fat === targets.fat ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {mealTotals.fat}g
                  </td>
                  <td className={`py-2 px-1 text-center font-medium ${
                    mealTotals.carbs === targets.carbs ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {mealTotals.carbs}g
                  </td>
                  <td className={`py-2 px-1 text-center font-medium ${
                    Math.abs(mealTotals.calories - targets.calories) < 50 ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {mealTotals.calories}
                  </td>
                </tr>
                <tr className="text-gray-500">
                  <td className="py-1 px-1 text-xs">Mål</td>
                  <td className="py-1 px-1 text-center text-xs">{targets.protein}g</td>
                  <td className="py-1 px-1 text-center text-xs">{targets.fat}g</td>
                  <td className="py-1 px-1 text-center text-xs">{targets.carbs}g</td>
                  <td className="py-1 px-1 text-center text-xs">{targets.calories}</td>
                </tr>
              </tfoot>
            </table>
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
