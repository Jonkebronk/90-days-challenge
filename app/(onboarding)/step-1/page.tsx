'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { EducationPanel } from '@/components/onboarding/EducationPanel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const profileSchema = z.object({
  age: z.coerce.number().min(15, 'Age must be at least 15').max(100, 'Age can be maximum 100'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Please select an option',
  }),
  height_cm: z.coerce.number().min(120, 'Height must be at least 120 cm').max(250, 'Height can be maximum 250 cm'),
  current_weight_kg: z.coerce.number().min(30, 'Weight must be at least 30 kg').max(300, 'Weight can be maximum 300 kg'),
  target_weight_kg: z.coerce.number().min(30, 'Target weight must be at least 30 kg').max(300, 'Target weight can be maximum 300 kg').optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function Step1Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  })

  const onNext = handleSubmit(async (data) => {
    setIsLoading(true)

    // Save to localStorage for now (will save to database in step 8)
    const existingData = localStorage.getItem('onboarding_data')
    const onboardingData = existingData ? JSON.parse(existingData) : {}

    localStorage.setItem('onboarding_data', JSON.stringify({
      ...onboardingData,
      ...data,
    }))

    router.push('/step-2')
  })

  const educationContent = (
    <EducationPanel
      title="Why Your Profile Matters"
      keyPoints={[
        'Your age, height, and weight determine your Basal Metabolic Rate (BMR)',
        'BMR is the calories your body burns at rest just to stay alive',
        'Gender affects BMR due to differences in muscle mass and hormones',
        'This data helps us calculate your personalized calorie needs',
      ]}
      tip="Be honest with your current weight - it's your starting point, not a judgment. Accurate data = accurate plan!"
    >
      <p>
        Your body is like a car engine - it needs fuel (calories) to run. The amount of fuel depends on the size and type of engine.
      </p>
      <p className="mt-3">
        <strong>Basal Metabolic Rate (BMR)</strong> is the energy your body needs just to keep you alive - breathing, pumping blood, growing cells.
      </p>
      <p className="mt-3">
        We use the <strong>Mifflin-St Jeor equation</strong> - the most accurate formula for calculating BMR:
      </p>
      <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
        <li>Men: (10 × weight) + (6.25 × height) - (5 × age) + 5</li>
        <li>Women: (10 × weight) + (6.25 × height) - (5 × age) - 161</li>
      </ul>
      <p className="mt-3">
        This is just the beginning - we&apos;ll add your activity level next to get your Total Daily Energy Expenditure (TDEE).
      </p>
    </EducationPanel>
  )

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={8}
      title="Your Profile"
      description="Tell us about yourself so we can personalize your plan"
      educationContent={educationContent}
      onNext={onNext}
      nextLabel="Continue"
      isNextDisabled={!isValid || isLoading}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="25"
              {...register('age')}
              disabled={isLoading}
            />
            {errors.age && (
              <p className="text-sm text-destructive">{errors.age.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="height_cm">Height (cm)</Label>
            <Input
              id="height_cm"
              type="number"
              placeholder="175"
              {...register('height_cm')}
              disabled={isLoading}
            />
            {errors.height_cm && (
              <p className="text-sm text-destructive">{errors.height_cm.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Gender</Label>
          <RadioGroup {...register('gender')} disabled={isLoading}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
            </div>
          </RadioGroup>
          {errors.gender && (
            <p className="text-sm text-destructive">{errors.gender.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current_weight_kg">Current Weight (kg)</Label>
            <Input
              id="current_weight_kg"
              type="number"
              step="0.1"
              placeholder="75"
              {...register('current_weight_kg')}
              disabled={isLoading}
            />
            {errors.current_weight_kg && (
              <p className="text-sm text-destructive">{errors.current_weight_kg.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_weight_kg">Target Weight (kg, optional)</Label>
            <Input
              id="target_weight_kg"
              type="number"
              step="0.1"
              placeholder="70"
              {...register('target_weight_kg')}
              disabled={isLoading}
            />
            {errors.target_weight_kg && (
              <p className="text-sm text-destructive">{errors.target_weight_kg.message}</p>
            )}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}
