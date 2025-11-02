'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { calculateBMR, calculateTDEE, calculateTargetCalories } from '@/lib/calculations/tdee'
import { calculateMacros } from '@/lib/calculations/macros'

interface OnboardingData {
  age?: number
  gender?: 'male' | 'female' | 'other'
  height_cm?: number
  current_weight_kg?: number
  target_weight_kg?: number
  activity_level?: string
  primary_goal?: string
  intensity_level?: string
  meals_per_day?: number
  dietary_preference?: string[]
  allergies?: string[]
}

export default function Step5Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({})
  const [calculations, setCalculations] = useState({
    bmr: 0,
    tdee: 0,
    targetCalories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })

  useEffect(() => {
    // Load onboarding data
    const savedData = localStorage.getItem('onboarding_data')
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setData(parsed)

      // Calculate everything
      if (parsed.age && parsed.gender && parsed.height_cm && parsed.current_weight_kg && parsed.activity_level && parsed.primary_goal && parsed.intensity_level) {
        const bmr = calculateBMR(
          parsed.current_weight_kg,
          parsed.height_cm,
          parsed.age,
          parsed.gender
        )

        const tdee = calculateTDEE(bmr, parsed.activity_level)

        const targetCalories = calculateTargetCalories(
          tdee,
          parsed.primary_goal,
          parsed.intensity_level
        )

        const macros = calculateMacros(
          targetCalories,
          parsed.current_weight_kg,
          parsed.primary_goal
        )

        setCalculations({
          bmr: Math.round(bmr),
          tdee,
          targetCalories,
          protein: macros.protein_g,
          carbs: macros.carbs_g,
          fat: macros.fat_g,
        })
      }
    }
  }, [])

  const onContinue = () => {
    setIsLoading(true)

    // Save calculations to localStorage
    const existingData = localStorage.getItem('onboarding_data')
    const onboardingData = existingData ? JSON.parse(existingData) : {}

    localStorage.setItem('onboarding_data', JSON.stringify({
      ...onboardingData,
      tdee: calculations.tdee,
      target_calories: calculations.targetCalories,
      protein_g: calculations.protein,
      carbs_g: calculations.carbs,
      fat_g: calculations.fat,
    }))

    router.push('/step-6')
  }

  const goBack = () => {
    router.back()
  }

  const getGoalText = (goal?: string) => {
    switch (goal) {
      case 'lose_weight': return 'Gå ner i vikt'
      case 'build_muscle': return 'Bygga muskler'
      case 'health': return 'Allmän hälsa'
      default: return '-'
    }
  }

  const getActivityText = (level?: string) => {
    switch (level) {
      case 'sedentary': return 'Stillasittande'
      case 'light': return 'Lätt aktiv'
      case 'moderate': return 'Måttligt aktiv'
      case 'very_active': return 'Mycket aktiv'
      case 'extra_active': return 'Extra aktiv'
      default: return '-'
    }
  }

  return (
    <>
      <Progress value={(5 / 8) * 100} className="mb-6" />

      <Card>
        <CardHeader>
          <CardTitle>Steg 5: Dina Beräkningar</CardTitle>
          <CardDescription>
            Baserat på dina uppgifter har vi beräknat ditt kaloribehov och makros
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Ålder</p>
              <p className="text-lg font-semibold">{data.age} år</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vikt</p>
              <p className="text-lg font-semibold">{data.current_weight_kg} kg</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Längd</p>
              <p className="text-lg font-semibold">{data.height_cm} cm</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mål</p>
              <p className="text-lg font-semibold">{getGoalText(data.primary_goal)}</p>
            </div>
          </div>

          <Separator />

          {/* BMR & TDEE */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Energibehov</h3>

            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">BMR (Basal Metabolic Rate)</h4>
                    <p className="text-sm text-muted-foreground">
                      Kalorier du bränner i vila
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{calculations.bmr}</p>
                    <p className="text-xs text-muted-foreground">kcal/dag</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-accent/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">TDEE (Total Daily Energy Expenditure)</h4>
                    <p className="text-sm text-muted-foreground">
                      Totalt kaloribehov med {getActivityText(data.activity_level)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{calculations.tdee}</p>
                    <p className="text-xs text-muted-foreground">kcal/dag</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Target Calories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ditt Mål</h3>

            <div className="p-6 border-2 border-primary rounded-lg bg-primary/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold">Dagligt Kaloriintag</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    För att {getGoalText(data.primary_goal)?.toLowerCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary">{calculations.targetCalories}</p>
                  <p className="text-sm text-muted-foreground">kcal/dag</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className={`
                  px-3 py-1 rounded-full
                  ${calculations.targetCalories < calculations.tdee
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : calculations.targetCalories > calculations.tdee
                    ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                    : 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
                  }
                `}>
                  {calculations.targetCalories < calculations.tdee
                    ? `${calculations.tdee - calculations.targetCalories} kcal underskott`
                    : calculations.targetCalories > calculations.tdee
                    ? `+${calculations.targetCalories - calculations.tdee} kcal överskott`
                    : 'Kaloribalans'
                  }
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Macros */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Makrofördelning</h3>

            <div className="grid gap-4">
              {/* Protein */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">Protein</h4>
                    <p className="text-sm text-muted-foreground">
                      {calculations.protein}g × 4 kcal = {calculations.protein * 4} kcal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-red-600">{calculations.protein}g</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((calculations.protein * 4 / calculations.targetCalories) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{ width: `${(calculations.protein * 4 / calculations.targetCalories) * 100}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">Kolhydrater</h4>
                    <p className="text-sm text-muted-foreground">
                      {calculations.carbs}g × 4 kcal = {calculations.carbs * 4} kcal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{calculations.carbs}g</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((calculations.carbs * 4 / calculations.targetCalories) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${(calculations.carbs * 4 / calculations.targetCalories) * 100}%` }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">Fett</h4>
                    <p className="text-sm text-muted-foreground">
                      {calculations.fat}g × 9 kcal = {calculations.fat * 9} kcal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-yellow-600">{calculations.fat}g</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((calculations.fat * 9 / calculations.targetCalories) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-600 transition-all"
                    style={{ width: `${(calculations.fat * 9 / calculations.targetCalories) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 Vad betyder detta?</h4>
            <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
              <li>• <strong>BMR:</strong> Kalorier din kropp behöver för grundfunktioner (andning, hjärtslag, etc.)</li>
              <li>• <strong>TDEE:</strong> BMR + kalorier från daglig aktivitet och träning</li>
              <li>• <strong>Målintag:</strong> Justerat för att {getGoalText(data.primary_goal)?.toLowerCase()}</li>
              <li>• <strong>Makros:</strong> Fördelning av protein, kolhydrater och fett för bästa resultat</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={goBack} className="flex-1">
            Tillbaka
          </Button>
          <Button onClick={onContinue} className="flex-1" disabled={isLoading}>
            Fortsätt
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
