'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const nutritionSchema = z.object({
  meals_per_day: z.number().min(3).max(6),
  dietary_preference: z.array(z.string()),
  allergies: z.array(z.string()),
})

type NutritionForm = z.infer<typeof nutritionSchema>

const DIETARY_OPTIONS = [
  { id: 'none', label: 'Inga restriktioner', description: 'Äter allt' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'Inget kött eller fisk' },
  { id: 'vegan', label: 'Vegan', description: 'Inga animaliska produkter' },
  { id: 'pescatarian', label: 'Pescetarian', description: 'Fisk men inget kött' },
]

const COMMON_ALLERGIES = [
  'Gluten',
  'Laktos',
  'Nötter',
  'Ägg',
  'Skaldjur',
  'Soja',
]

export default function Step4Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [mealsPerDay, setMealsPerDay] = useState(3)
  const [selectedDietary, setSelectedDietary] = useState<string[]>(['none'])
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [customAllergy, setCustomAllergy] = useState('')

  const { handleSubmit } = useForm<NutritionForm>({
    resolver: zodResolver(nutritionSchema),
  })

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

  const onSubmit = async () => {
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

  const goBack = () => {
    router.back()
  }

  return (
    <>
      <Progress value={(4 / 8) * 100} className="mb-6" />

      <Card>
        <CardHeader>
          <CardTitle>Steg 4: Matpreferenser</CardTitle>
          <CardDescription>
            Berätta om dina kostvanor och eventuella restriktioner
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {/* Meals per day */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Antal måltider per dag</Label>
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
                <span>3 måltider</span>
                <span>6 måltider</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Fler, mindre måltider kan hjälpa med energi och mättnad under dagen
              </p>
            </div>

            <Separator />

            {/* Dietary preferences */}
            <div className="space-y-4">
              <Label>Kostpreferenser</Label>
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
              <Label>Allergier & Intoleranser</Label>

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
                  placeholder="Lägg till annan allergi..."
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
                  Lägg till
                </Button>
              </div>

              {/* Selected allergies */}
              {selectedAllergies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Valda allergier:</p>
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
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={goBack} className="flex-1">
              Tillbaka
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              Nästa steg
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  )
}
