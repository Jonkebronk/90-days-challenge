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
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  RefreshCw,
  Beef,
  Wheat,
  Droplet,
  AlertCircle,
  Loader2,
  Scale,
  Activity,
  TrendingDown,
  Search,
  X,
  Check,
  ChevronUp,
  Flame
} from 'lucide-react'

// Types
interface MacroTargets {
  calories: number
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

interface RecipeCategory {
  id: string
  name: string
  slug: string
  color: string
}

interface SelectedRecipe {
  id: string
  title: string
  imageUrl?: string
  scaleFactor: number
  scaledServings: number
  macros: MacroTargets
}

// Mapping meal names to category slugs
const MEAL_CATEGORY_MAP: Record<string, string> = {
  'Frukost': 'frukost',
  'Mellanmål 1': 'mellanmal',
  'Mellanmål 2': 'mellanmal',
  'Lunch': 'lunch',
  'Middag': 'middag',
  'Kvällsmål': 'kvallsmal',
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
// Main Component
export function SmartMealPlanner() {
  // Input mode toggle
  const [useWeightBased, setUseWeightBased] = useState(true)

  // Weight-based calculation state (Kostschema-verktyget)
  const [weight, setWeight] = useState(80)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(30)
  const [weightLossTempo, setWeightLossTempo] = useState<WeightLossTempo>(550)
  const [proteinFactor, setProteinFactor] = useState(2.5)

  // Manual input state (gram values)
  const [manualMacros, setManualMacros] = useState<{ protein: number; carbs: number; fat: number }>({
    protein: 150,
    carbs: 200,
    fat: 67
  })

  // Meal distribution state
  const [mealFrequency, setMealFrequency] = useState<MealFrequency>(5)
  const [mealDistribution, setMealDistribution] = useState<MealDistribution[]>([])

  // Other state
  const [vegetarian, setVegetarian] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Category and recipe state
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [selectedRecipes, setSelectedRecipes] = useState<Record<number, SelectedRecipe | null>>({})
  const [mealMatches, setMealMatches] = useState<Record<number, RecipeMatch[]>>({})
  const [searchingMeal, setSearchingMeal] = useState<number | null>(null)
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null)

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
    // Calculate calories from manual macros
    const calculatedCalories = manualMacros.protein * 4 + manualMacros.carbs * 4 + manualMacros.fat * 9
    return {
      calories: calculatedCalories,
      protein: manualMacros.protein,
      carbs: manualMacros.carbs,
      fat: manualMacros.fat
    }
  }, [useWeightBased, weightBasedMacros, manualMacros])

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/recipe-categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [])

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
    // Reset selected recipes when meal frequency changes
    setSelectedRecipes({})
    setMealMatches({})
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

  // Search recipes for a specific meal slot
  const searchMealRecipes = useCallback(async (mealIndex: number) => {
    const meal = mealDistribution[mealIndex]
    if (!meal) return

    setSearchingMeal(mealIndex)
    setExpandedMeal(mealIndex)
    setError(null)

    try {
      // Find the category for this meal
      const categorySlug = MEAL_CATEGORY_MAP[meal.name]
      const category = categories.find(c => c.slug === categorySlug)

      // Calculate meal's calorie target
      const mealCalories = meal.protein * 4 + meal.carbs * 4 + meal.fat * 9

      const response = await fetch('/api/meal-planner/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calories: mealCalories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          categoryId: category?.id,
          vegetarian,
          limit: 10,
          allowScaling: true,
          minScore: 0.3
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte hämta recept')
      }

      setMealMatches(prev => ({ ...prev, [mealIndex]: data.matches || [] }))

      if (data.matches?.length === 0) {
        setError(`Inga ${meal.name.toLowerCase()}-recept hittades. Prova att justera makros.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setSearchingMeal(null)
    }
  }, [mealDistribution, categories, vegetarian])

  // Select a recipe for a meal slot
  const selectRecipe = useCallback((mealIndex: number, match: RecipeMatch) => {
    setSelectedRecipes(prev => ({
      ...prev,
      [mealIndex]: {
        id: match.recipe.id,
        title: match.recipe.title,
        imageUrl: match.recipe.imageUrl,
        scaleFactor: match.scaleFactor,
        scaledServings: match.scaledServings,
        macros: match.scaledMacros
      }
    }))
    setExpandedMeal(null)
  }, [])

  // Remove selected recipe from meal slot
  const removeRecipe = useCallback((mealIndex: number) => {
    setSelectedRecipes(prev => {
      const updated = { ...prev }
      delete updated[mealIndex]
      return updated
    })
  }, [])

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
                    <button
                      key={level}
                      onClick={() => setActivityLevel(level)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        activityLevel === level
                          ? 'bg-gold-primary hover:bg-gold-secondary text-white'
                          : 'border border-gray-600 text-white hover:bg-gray-700 bg-transparent'
                      }`}
                    >
                      {ACTIVITY_LABELS[level]}
                    </button>
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
                    <button
                      key={tempo}
                      onClick={() => setWeightLossTempo(tempo)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        weightLossTempo === tempo
                          ? 'bg-gold-primary hover:bg-gold-secondary text-white'
                          : 'border border-gray-600 text-white hover:bg-gray-700 bg-transparent'
                      }`}
                    >
                      {TEMPO_LABELS[tempo]}
                    </button>
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
              {/* Macro inputs in grams */}
              <div className="space-y-4">
                <Label className="text-white">Makrofördelning (gram)</Label>

                {/* Protein */}
                <div className="flex items-center gap-4">
                  <div className="w-24 flex items-center gap-2">
                    <Beef className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-white">Protein</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={manualMacros.protein || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setManualMacros(prev => ({ ...prev, protein: val ? parseInt(val, 10) : 0 }))
                      }}
                      className="w-20 bg-gray-700 border-gray-600 text-white text-center"
                    />
                    <span className="text-gray-400">g</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({manualMacros.protein * 4} kcal)
                  </span>
                </div>

                {/* Carbs */}
                <div className="flex items-center gap-4">
                  <div className="w-24 flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-white">Kolhydrat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={manualMacros.carbs || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setManualMacros(prev => ({ ...prev, carbs: val ? parseInt(val, 10) : 0 }))
                      }}
                      className="w-20 bg-gray-700 border-gray-600 text-white text-center"
                    />
                    <span className="text-gray-400">g</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({manualMacros.carbs * 4} kcal)
                  </span>
                </div>

                {/* Fat */}
                <div className="flex items-center gap-4">
                  <div className="w-24 flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white">Fett</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={manualMacros.fat || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setManualMacros(prev => ({ ...prev, fat: val ? parseInt(val, 10) : 0 }))
                      }}
                      className="w-20 bg-gray-700 border-gray-600 text-white text-center"
                    />
                    <span className="text-gray-400">g</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({manualMacros.fat * 9} kcal)
                  </span>
                </div>

                {/* Total calories */}
                <div className="bg-gray-900 rounded-lg p-3 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Totalt kaloriintag:</span>
                    <span className="text-lg font-bold text-gold-primary">
                      {manualMacros.protein * 4 + manualMacros.carbs * 4 + manualMacros.fat * 9} kcal
                    </span>
                  </div>
                </div>
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

      {/* Meal Plan */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Måltidsplan</CardTitle>
          <CardDescription className="text-gray-400">
            Välj antal måltider och sök recept för varje måltid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meal frequency tabs */}
          <div className="flex gap-2">
            {([4, 5, 6] as MealFrequency[]).map((freq) => (
              <button
                key={freq}
                onClick={() => setMealFrequency(freq)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  mealFrequency === freq
                    ? 'bg-gold-primary hover:bg-gold-secondary text-white'
                    : 'border border-gray-600 text-white hover:bg-gray-700 bg-transparent'
                }`}
              >
                {freq} måltider
              </button>
            ))}
          </div>

          {/* Meal cards */}
          <div className="space-y-3">
            {mealDistribution.map((meal, index) => {
              const selected = selectedRecipes[index]
              const matches = mealMatches[index] || []
              const isExpanded = expandedMeal === index
              const isSearching = searchingMeal === index
              const categorySlug = MEAL_CATEGORY_MAP[meal.name]
              const category = categories.find(c => c.slug === categorySlug)

              return (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
                >
                  {/* Meal header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="text-white font-semibold text-lg">{meal.name}</h4>
                        {category && (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {category.name}
                          </Badge>
                        )}
                      </div>
                      <span className="text-gold-primary font-semibold">{getMealKcal(meal)} kcal</span>
                    </div>

                    {/* Macro targets for this meal */}
                    <div className="flex gap-4 text-sm mb-4">
                      <span className="flex items-center gap-1 text-red-400">
                        <Beef className="w-3 h-3" /> {meal.protein}g
                      </span>
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Wheat className="w-3 h-3" /> {meal.carbs}g
                      </span>
                      <span className="flex items-center gap-1 text-blue-400">
                        <Droplet className="w-3 h-3" /> {meal.fat}g
                      </span>
                    </div>

                    {/* Selected recipe or search button */}
                    {selected ? (
                      <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selected.imageUrl && (
                            <img
                              src={selected.imageUrl}
                              alt={selected.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="text-white font-medium">{selected.title}</p>
                            <div className="flex gap-2 text-xs text-gray-400">
                              <span>{selected.macros.calories} kcal</span>
                              <span>P: {selected.macros.protein}g</span>
                              <span>K: {selected.macros.carbs}g</span>
                              <span>F: {selected.macros.fat}g</span>
                            </div>
                            {selected.scaleFactor !== 1 && (
                              <span className="text-xs text-gold-primary">
                                {selected.scaledServings} portioner
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExpandedMeal(isExpanded ? null : index)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeRecipe(index)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => searchMealRecipes(index)}
                        disabled={isSearching}
                        variant="outline"
                        className="w-full border-gray-600 text-white hover:bg-gray-700"
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 mr-2" />
                        )}
                        Sök {meal.name.toLowerCase()}-recept
                      </Button>
                    )}
                  </div>

                  {/* Expanded recipe results */}
                  {isExpanded && matches.length > 0 && (
                    <div className="border-t border-gray-700 p-4 bg-gray-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-400">
                          {matches.length} matchande recept
                        </p>
                        <button
                          onClick={() => setExpandedMeal(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {matches.map((match) => (
                          <div
                            key={match.recipe.id}
                            onClick={() => selectRecipe(index, match)}
                            className="bg-gray-900 rounded-lg p-3 cursor-pointer hover:bg-gray-800 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              {match.recipe.imageUrl && (
                                <img
                                  src={match.recipe.imageUrl}
                                  alt={match.recipe.title}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="text-white text-sm font-medium">{match.recipe.title}</p>
                                <div className="flex gap-2 text-xs text-gray-500">
                                  <span>{match.scaledMacros.calories} kcal</span>
                                  <span>P: {match.scaledMacros.protein}g</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  match.score >= 0.8 ? 'border-green-500 text-green-400' :
                                  match.score >= 0.6 ? 'border-yellow-500 text-yellow-400' :
                                  'border-gray-500 text-gray-400'
                                }`}
                              >
                                {Math.round(match.score * 100)}%
                              </Badge>
                              <Check className="w-4 h-4 text-gray-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Day totals summary */}
          <div className="bg-gray-900 rounded-lg p-4 border-2 border-gold-primary/30">
            <h4 className="text-white font-medium mb-3">Dagssumma</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <span className={`text-xl font-bold ${
                  mealTotals.protein === targets.protein ? 'text-green-400' : 'text-red-400'
                }`}>
                  {mealTotals.protein}g
                </span>
                <p className="text-xs text-gray-500">Protein ({targets.protein}g)</p>
              </div>
              <div>
                <span className={`text-xl font-bold ${
                  mealTotals.carbs === targets.carbs ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {mealTotals.carbs}g
                </span>
                <p className="text-xs text-gray-500">Kolhydrat ({targets.carbs}g)</p>
              </div>
              <div>
                <span className={`text-xl font-bold ${
                  mealTotals.fat === targets.fat ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {mealTotals.fat}g
                </span>
                <p className="text-xs text-gray-500">Fett ({targets.fat}g)</p>
              </div>
              <div>
                <span className={`text-xl font-bold ${
                  Math.abs(mealTotals.calories - targets.calories) < 50 ? 'text-green-400' : 'text-gold-primary'
                }`}>
                  {mealTotals.calories}
                </span>
                <p className="text-xs text-gray-500">Kcal ({targets.calories})</p>
              </div>
            </div>
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

    </div>
  )
}

export default SmartMealPlanner
