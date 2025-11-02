'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { EducationPanel } from '@/components/onboarding/EducationPanel'
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

  const onNext = () => {
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

  const getGoalText = (goal?: string) => {
    switch (goal) {
      case 'lose_weight': return 'Lose Weight'
      case 'build_muscle': return 'Build Muscle'
      case 'health': return 'General Health'
      default: return '-'
    }
  }

  const getActivityText = (level?: string) => {
    switch (level) {
      case 'sedentary': return 'Sedentary'
      case 'light': return 'Light Active'
      case 'moderate': return 'Moderately Active'
      case 'very_active': return 'Very Active'
      case 'extra_active': return 'Extra Active'
      default: return '-'
    }
  }

  const educationContent = (
    <EducationPanel
      title="Understanding Your Numbers"
      keyPoints={[
        'BMR is your baseline - the calories you need just to exist',
        'TDEE = BMR × Activity Factor (your total daily burn)',
        'Target Calories = TDEE ± deficit/surplus based on your goal',
        'Macros distribute your calories for optimal results',
      ]}
      tip="These numbers are your starting point, not set in stone. We&apos;ll adjust based on your real-world progress in the coming weeks!"
    >
      <p>
        Let&apos;s put all the pieces together. You&apos;ve told us about yourself, your goals, and your lifestyle - now we&apos;ve calculated your personalized nutrition plan.
      </p>
      <p className="mt-3">
        <strong>Why These Numbers Matter:</strong>
      </p>
      <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
        <li><strong>Protein</strong> preserves muscle and keeps you full</li>
        <li><strong>Carbs</strong> fuel your workouts and daily energy</li>
        <li><strong>Fats</strong> support hormones and nutrient absorption</li>
      </ul>
      <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <h5 className="font-semibold text-sm mb-2">Calorie Math:</h5>
        <ul className="space-y-1 text-sm">
          <li>• 1g Protein = 4 calories</li>
          <li>• 1g Carbs = 4 calories</li>
          <li>• 1g Fat = 9 calories</li>
        </ul>
      </div>
      <p className="mt-3 text-sm">
        These calculations use the <strong>Mifflin-St Jeor equation</strong> (most accurate for BMR) and evidence-based macro ratios for your specific goal.
      </p>
    </EducationPanel>
  )

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={8}
      title="Your Nutrition Plan"
      description="Based on your profile, we&apos;ve calculated your personalized calorie and macro targets"
      educationContent={educationContent}
      onNext={onNext}
      backHref="/step-4"
      nextLabel="Continue"
      isNextDisabled={isLoading}
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Age</p>
            <p className="text-lg font-semibold">{data.age} years</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Weight</p>
            <p className="text-lg font-semibold">{data.current_weight_kg} kg</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Height</p>
            <p className="text-lg font-semibold">{data.height_cm} cm</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Goal</p>
            <p className="text-lg font-semibold">{getGoalText(data.primary_goal)}</p>
          </div>
        </div>

        <Separator />

        {/* BMR & TDEE */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Energy Needs</h3>

          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">BMR (Basal Metabolic Rate)</h4>
                  <p className="text-sm text-muted-foreground">
                    Calories you burn at rest
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{calculations.bmr}</p>
                  <p className="text-xs text-muted-foreground">kcal/day</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-accent/50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">TDEE (Total Daily Energy Expenditure)</h4>
                  <p className="text-sm text-muted-foreground">
                    Total calories with {getActivityText(data.activity_level)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{calculations.tdee}</p>
                  <p className="text-xs text-muted-foreground">kcal/day</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Target Calories */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Goal</h3>

          <div className="p-6 border-2 border-primary rounded-lg bg-primary/5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold">Daily Calorie Target</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  To {getGoalText(data.primary_goal)?.toLowerCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-primary">{calculations.targetCalories}</p>
                <p className="text-sm text-muted-foreground">kcal/day</p>
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
                  ? `${calculations.tdee - calculations.targetCalories} kcal deficit`
                  : calculations.targetCalories > calculations.tdee
                  ? `+${calculations.targetCalories - calculations.tdee} kcal surplus`
                  : 'Maintenance'
                }
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Macros */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Macro Distribution</h3>

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
                  <h4 className="font-semibold text-lg">Carbohydrates</h4>
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
                  <h4 className="font-semibold text-lg">Fat</h4>
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
      </div>
    </OnboardingLayout>
  )
}
