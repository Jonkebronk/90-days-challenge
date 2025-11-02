'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { EducationPanel } from '@/components/onboarding/EducationPanel'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const lifestyleSchema = z.object({
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'extra_active'], {
    required_error: 'Please select an activity level',
  }),
  training_location: z.enum(['home', 'gym', 'outdoor'], {
    required_error: 'Please select a training location',
  }),
  training_frequency: z.coerce.number().min(1).max(7),
  time_per_session: z.coerce.number().min(15).max(180),
})

type LifestyleForm = z.infer<typeof lifestyleSchema>

export default function Step3Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, control, formState: { errors, isValid } } = useForm<LifestyleForm>({
    resolver: zodResolver(lifestyleSchema),
    mode: 'onChange',
    defaultValues: {
      training_frequency: 3,
      time_per_session: 45,
    },
  })

  const onNext = handleSubmit(async (data) => {
    setIsLoading(true)

    const existingData = localStorage.getItem('onboarding_data')
    const onboardingData = existingData ? JSON.parse(existingData) : {}

    localStorage.setItem('onboarding_data', JSON.stringify({
      ...onboardingData,
      ...data,
    }))

    router.push('/step-4')
  })

  const educationContent = (
    <EducationPanel
      title="Activity Levels & TDEE"
      keyPoints={[
        'Your BMR × Activity Factor = TDEE (Total Daily Energy Expenditure)',
        'Sedentary: BMR × 1.2 (desk job, minimal exercise)',
        'Light: BMR × 1.375 (exercise 1-3 days/week)',
        'Moderate: BMR × 1.55 (exercise 3-5 days/week)',
        'Very Active: BMR × 1.725 (hard exercise 6-7 days/week)',
      ]}
      tip="Most people overestimate their activity level. When in doubt, choose the lower option - you can always adjust later!"
    >
      <p>
        Remember your BMR from Step 1? Now we multiply it by an <strong>activity factor</strong> to get your total calorie burn.
      </p>
      <p className="mt-3">
        <strong>TDEE (Total Daily Energy Expenditure)</strong> is BMR plus all the calories you burn through movement - from walking to the bathroom to intense workouts.
      </p>
      <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <h5 className="font-semibold text-sm mb-2">Example Calculation:</h5>
        <ul className="space-y-1 text-sm">
          <li>• BMR: 1,500 calories</li>
          <li>• Activity: Moderate (×1.55)</li>
          <li>• TDEE: 1,500 × 1.55 = 2,325 calories</li>
        </ul>
      </div>
      <p className="mt-3 text-sm">
        Your training location and frequency help us design workouts that fit your lifestyle and available equipment.
      </p>
    </EducationPanel>
  )

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={8}
      title="Your Lifestyle"
      description="Tell us about your daily activity and training preferences"
      educationContent={educationContent}
      onNext={onNext}
      backHref="/step-2"
      nextLabel="Continue"
      isNextDisabled={!isValid || isLoading}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Daily Activity Level</Label>
          <RadioGroup {...register('activity_level')} disabled={isLoading}>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="sedentary" id="sedentary" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="sedentary" className="font-semibold cursor-pointer text-sm">
                  Sedentary
                </Label>
                <p className="text-xs text-muted-foreground">
                  Desk job, little to no exercise
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="light" id="light" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="light" className="font-semibold cursor-pointer text-sm">
                  Light Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Light exercise 1-3 days/week
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="moderate" id="moderate" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="moderate" className="font-semibold cursor-pointer text-sm">
                  Moderately Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Exercise 3-5 days/week
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="very_active" id="very_active" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="very_active" className="font-semibold cursor-pointer text-sm">
                  Very Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Hard exercise 6-7 days/week
                </p>
              </div>
            </div>
          </RadioGroup>
          {errors.activity_level && (
            <p className="text-sm text-destructive">{errors.activity_level.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Training Location</Label>
          <RadioGroup {...register('training_location')} disabled={isLoading}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="home" id="home" />
              <Label htmlFor="home" className="font-normal cursor-pointer">Home</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gym" id="gym" />
              <Label htmlFor="gym" className="font-normal cursor-pointer">Gym</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outdoor" id="outdoor" />
              <Label htmlFor="outdoor" className="font-normal cursor-pointer">Outdoor</Label>
            </div>
          </RadioGroup>
          {errors.training_location && (
            <p className="text-sm text-destructive">{errors.training_location.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="training_frequency">Training Sessions per Week</Label>
            <Controller
              name="training_frequency"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                  disabled={isLoading}
                >
                  <SelectTrigger id="training_frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'session' : 'sessions'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.training_frequency && (
              <p className="text-sm text-destructive">{errors.training_frequency.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time_per_session">Minutes per Session</Label>
            <Controller
              name="time_per_session"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                  disabled={isLoading}
                >
                  <SelectTrigger id="time_per_session">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 75, 90, 120].map((minutes) => (
                      <SelectItem key={minutes} value={minutes.toString()}>
                        {minutes} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.time_per_session && (
              <p className="text-sm text-destructive">{errors.time_per_session.message}</p>
            )}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}
