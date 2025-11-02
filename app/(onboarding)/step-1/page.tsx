'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'

const profileSchema = z.object({
  age: z.coerce.number().min(15, 'Ålder måste vara minst 15').max(100, 'Ålder får max vara 100'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Välj ett alternativ',
  }),
  height_cm: z.coerce.number().min(120, 'Längd måste vara minst 120 cm').max(250, 'Längd får max vara 250 cm'),
  current_weight_kg: z.coerce.number().min(30, 'Vikt måste vara minst 30 kg').max(300, 'Vikt får max vara 300 kg'),
  target_weight_kg: z.coerce.number().min(30, 'Målvikt måste vara minst 30 kg').max(300, 'Målvikt får max vara 300 kg').optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function Step1Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true)

    // Save to localStorage for now (will save to Supabase in step 8)
    const existingData = localStorage.getItem('onboarding_data')
    const onboardingData = existingData ? JSON.parse(existingData) : {}

    localStorage.setItem('onboarding_data', JSON.stringify({
      ...onboardingData,
      ...data,
    }))

    router.push('/step-2')
  }

  return (
    <>
      <Progress value={(1 / 8) * 100} className="mb-6" />

      <Card>
        <CardHeader>
          <CardTitle>Steg 1: Din profil</CardTitle>
          <CardDescription>
            Berätta om dig själv så vi kan skräddarsy din plan
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Ålder</Label>
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
                <Label htmlFor="height_cm">Längd (cm)</Label>
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

            <div className="space-y-2">
              <Label>Kön</Label>
              <RadioGroup {...register('gender')} disabled={isLoading}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="font-normal cursor-pointer">Man</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="font-normal cursor-pointer">Kvinna</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer">Annat</Label>
                </div>
              </RadioGroup>
              {errors.gender && (
                <p className="text-sm text-destructive">{errors.gender.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_weight_kg">Nuvarande vikt (kg)</Label>
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
                <Label htmlFor="target_weight_kg">Målvikt (kg, valfritt)</Label>
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
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              Nästa steg
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  )
}
