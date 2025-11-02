'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { EducationPanel } from '@/components/onboarding/EducationPanel'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const goalsSchema = z.object({
  primary_goal: z.enum(['lose_weight', 'build_muscle', 'health'], {
    required_error: 'Please select a goal',
  }),
  intensity_level: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Please select an intensity level',
  }),
})

type GoalsForm = z.infer<typeof goalsSchema>

export default function Step2Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<GoalsForm>({
    resolver: zodResolver(goalsSchema),
    mode: 'onChange',
  })

  const onNext = handleSubmit(async (data) => {
    setIsLoading(true)

    const existingData = localStorage.getItem('onboarding_data')
    const onboardingData = existingData ? JSON.parse(existingData) : {}

    localStorage.setItem('onboarding_data', JSON.stringify({
      ...onboardingData,
      ...data,
    }))

    router.push('/step-3')
  })

  const educationContent = (
    <EducationPanel
      title="Setting Realistic Goals"
      keyPoints={[
        'Your goal determines your calorie target: deficit for weight loss, surplus for muscle gain',
        'Healthy weight loss is 0.5-1kg per week (deficit of 500-1000 calories/day)',
        'Muscle building takes time - expect 0.5-1kg gain per month',
        'Intensity level affects how aggressive your plan is and recovery needs',
      ]}
      tip="It&apos;s better to start with a beginner or intermediate intensity and progress up than to burn out in week 2. Consistency beats intensity!"
    >
      <p>
        Think of your goal as your destination, and intensity as how fast you&apos;ll drive to get there.
      </p>
      <p className="mt-3">
        <strong>Weight Loss</strong> requires a calorie deficit - burning more than you consume. The magic number is about 7,700 calories to lose 1kg of fat.
      </p>
      <p className="mt-3">
        <strong>Building Muscle</strong> requires a calorie surplus and progressive resistance training. You need extra fuel to build new tissue.
      </p>
      <p className="mt-3">
        <strong>General Health</strong> focuses on balance - maintaining weight while improving fitness, energy, and wellbeing.
      </p>
      <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <h5 className="font-semibold text-sm mb-2">90-Day Realistic Targets:</h5>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Weight Loss:</strong> 6-12kg safely</li>
          <li>• <strong>Muscle Gain:</strong> 1.5-3kg of lean mass</li>
          <li>• <strong>Health:</strong> Improved energy, sleep, and fitness markers</li>
        </ul>
      </div>
    </EducationPanel>
  )

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={8}
      title="Your Goals"
      description="What do you want to achieve in the next 90 days?"
      educationContent={educationContent}
      onNext={onNext}
      backHref="/step-1"
      nextLabel="Continue"
      isNextDisabled={!isValid || isLoading}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Primary Goal</Label>
          <RadioGroup {...register('primary_goal')} disabled={isLoading}>
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="lose_weight" id="lose_weight" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="lose_weight" className="font-semibold cursor-pointer">
                  Lose Weight
                </Label>
                <p className="text-sm text-muted-foreground">
                  Focus on fat loss and calorie deficit
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="build_muscle" id="build_muscle" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="build_muscle" className="font-semibold cursor-pointer">
                  Build Muscle
                </Label>
                <p className="text-sm text-muted-foreground">
                  Focus on strength training and calorie surplus
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="health" id="health" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="health" className="font-semibold cursor-pointer">
                  General Health
                </Label>
                <p className="text-sm text-muted-foreground">
                  Balanced nutrition and exercise for wellbeing
                </p>
              </div>
            </div>
          </RadioGroup>
          {errors.primary_goal && (
            <p className="text-sm text-destructive">{errors.primary_goal.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Intensity Level</Label>
          <RadioGroup {...register('intensity_level')} disabled={isLoading}>
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="beginner" id="beginner" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="beginner" className="font-semibold cursor-pointer">
                  Beginner
                </Label>
                <p className="text-sm text-muted-foreground">
                  Gentle start, cautious progression
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="intermediate" id="intermediate" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="intermediate" className="font-semibold cursor-pointer">
                  Intermediate
                </Label>
                <p className="text-sm text-muted-foreground">
                  Have some experience, want faster results
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="advanced" id="advanced" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="advanced" className="font-semibold cursor-pointer">
                  Advanced
                </Label>
                <p className="text-sm text-muted-foreground">
                  Experienced training, want maximum results
                </p>
              </div>
            </div>
          </RadioGroup>
          {errors.intensity_level && (
            <p className="text-sm text-destructive">{errors.intensity_level.message}</p>
          )}
        </div>
      </div>
    </OnboardingLayout>
  )
}
