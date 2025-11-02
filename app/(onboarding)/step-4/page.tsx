'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { EducationPanel } from '@/components/onboarding/EducationPanel'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const DIETARY_OPTIONS = [
  { id: 'none', label: 'No Restrictions', description: 'Eat everything' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat or fish' },
  { id: 'vegan', label: 'Vegan', description: 'No animal products' },
  { id: 'pescatarian', label: 'Pescatarian', description: 'Fish but no meat' },
]

const COMMON_ALLERGIES = [
  'Gluten',
  'Lactose',
  'Nuts',
  'Eggs',
  'Shellfish',
  'Soy',
]

export default function Step4Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [mealsPerDay, setMealsPerDay] = useState(3)
  const [selectedDietary, setSelectedDietary] = useState<string[]>(['none'])
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [customAllergy, setCustomAllergy] = useState('')

  const toggleDietary = (id: string) => {
    if (id === 'none') {
      setSelectedDietary(['none'])
    } else {
      const newSelected = selectedDietary.filter(item => item !== 'none')
      if (newSelected.includes(id)) {
        const filtered = newSelected.filter(item => item !== id)
        setSelectedDietary(filtered.length === 0 ? ['none'] : filtered)
      } else {
        setSelectedDietary([...newSelected, id])
      }
    }
  }

  const toggleAllergy = (allergy: string) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter(a => a !== allergy))
    } else {
      setSelectedAllergies([...selectedAllergies, allergy])
    }
  }

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies([...selectedAllergies, customAllergy.trim()])
      setCustomAllergy('')
    }
  }

  const removeAllergy = (allergy: string) => {
    setSelectedAllergies(selectedAllergies.filter(a => a !== allergy))
  }

  const onNext = async () => {
    setIsLoading(true)

    const existingData = localStorage.getItem('onboarding_data')
    const onboardingData = existingData ? JSON.parse(existingData) : {}

    localStorage.setItem('onboarding_data', JSON.stringify({
      ...onboardingData,
      meals_per_day: mealsPerDay,
      dietary_preference: selectedDietary,
      allergies: selectedAllergies,
    }))

    router.push('/step-5')
  }

  const educationContent = (
    <EducationPanel
      title="Nutrition Preferences"
      keyPoints={[
        'Meal frequency affects hunger levels and energy throughout the day',
        '3-4 meals work for most people, 5-6 meals can help with appetite control',
        'Dietary preferences help us suggest foods that align with your values',
        'Knowing your allergies ensures safe, enjoyable meal planning',
      ]}
      tip="Don&apos;t worry about being perfect - your preferences can change over time. We&apos;ll help you find what works best for your body and lifestyle!"
    >
      <p>
        Nutrition isn&apos;t one-size-fits-all. Your meal timing, dietary choices, and food sensitivities all matter.
      </p>
      <p className="mt-3">
        <strong>Meal Frequency:</strong> Some people thrive on 3 square meals, others prefer 5-6 smaller meals. Both can work for any goal - it&apos;s about what helps you stick to your calorie target.
      </p>
      <p className="mt-3">
        <strong>Dietary Preferences:</strong> Whether you choose vegetarian, vegan, or no restrictions, hitting your protein and micronutrient needs is what matters most.
      </p>
      <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <h5 className="font-semibold text-sm mb-2">Protein Sources by Diet:</h5>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Omnivore:</strong> Chicken, fish, eggs, dairy, legumes</li>
          <li>• <strong>Vegetarian:</strong> Eggs, dairy, legumes, tofu, tempeh</li>
          <li>• <strong>Vegan:</strong> Legumes, tofu, tempeh, seitan, nuts, seeds</li>
        </ul>
      </div>
    </EducationPanel>
  )

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={8}
      title="Nutrition Preferences"
      description="Tell us about your eating habits and any dietary restrictions"
      educationContent={educationContent}
      onNext={onNext}
      backHref="/step-3"
      nextLabel="Continue"
      isNextDisabled={isLoading}
    >
      <div className="space-y-8">
        {/* Meals per day */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Meals per Day</Label>
            <span className="text-2xl font-bold text-primary">{mealsPerDay}</span>
          </div>
          <Slider
            value={[mealsPerDay]}
            onValueChange={(value) => setMealsPerDay(value[0])}
            min={3}
            max={6}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3 meals</span>
            <span>6 meals</span>
          </div>
          <p className="text-sm text-muted-foreground">
            More frequent, smaller meals can help with energy and satiety throughout the day
          </p>
        </div>

        <Separator />

        {/* Dietary preferences */}
        <div className="space-y-4">
          <Label>Dietary Preferences</Label>
          <div className="grid gap-3">
            {DIETARY_OPTIONS.map((option) => (
              <div
                key={option.id}
                onClick={() => toggleDietary(option.id)}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-all
                  ${selectedDietary.includes(option.id)
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:bg-accent'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                    ${selectedDietary.includes(option.id)
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                    }
                  `}>
                    {selectedDietary.includes(option.id) && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Allergies */}
        <div className="space-y-4">
          <Label>Allergies & Intolerances</Label>

          {/* Common allergies */}
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((allergy) => (
              <button
                key={allergy}
                type="button"
                onClick={() => toggleAllergy(allergy)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${selectedAllergies.includes(allergy)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }
                `}
              >
                {allergy}
              </button>
            ))}
          </div>

          {/* Custom allergy input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add another allergy..."
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomAllergy()
                }
              }}
            />
            <Button type="button" onClick={addCustomAllergy} variant="outline">
              Add
            </Button>
          </div>

          {/* Selected allergies */}
          {selectedAllergies.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected allergies:</p>
              <div className="flex flex-wrap gap-2">
                {selectedAllergies.map((allergy) => (
                  <div
                    key={allergy}
                    className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm flex items-center gap-2"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </OnboardingLayout>
  )
}
