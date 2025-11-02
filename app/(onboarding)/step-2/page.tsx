'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'

const goalsSchema = z.object({
  primary_goal: z.enum(['lose_weight', 'build_muscle', 'health'], {
    required_error: 'Välj ett mål',
  }),
  intensity_level: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Välj en nivå',
  }),
})

type GoalsForm = z.infer<typeof goalsSchema>

export default function Step2Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<GoalsForm>({
    resolver: zodResolver(goalsSchema),
  })

  const onSubmit = async (data: GoalsForm) => {
    setIsLoading(true)

    const existingData = localStorage.getItem('onboarding_data')
    const onboardingData = existingData ? JSON.parse(existingData) : {}

    localStorage.setItem('onboarding_data', JSON.stringify({
      ...onboardingData,
      ...data,
    }))

    router.push('/step-3')
  }

  const goBack = () => {
    router.back()
  }

  return (
    <>
      <Progress value={(2 / 8) * 100} className="mb-6" />

      <Card>
        <CardHeader>
          <CardTitle>Steg 2: Dina mål</CardTitle>
          <CardDescription>
            Vad vill du uppnå under de kommande 90 dagarna?
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Primärt mål</Label>
              <RadioGroup {...register('primary_goal')} disabled={isLoading}>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="lose_weight" id="lose_weight" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="lose_weight" className="font-semibold cursor-pointer">
                      Gå ner i vikt
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Fokus på fettförlust och kaloriunderskott
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="build_muscle" id="build_muscle" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="build_muscle" className="font-semibold cursor-pointer">
                      Bygga muskler
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Fokus på styrketräning och överskott
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="health" id="health" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="health" className="font-semibold cursor-pointer">
                      Allmän hälsa
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Balanserad kost och träning för välmående
                    </p>
                  </div>
                </div>
              </RadioGroup>
              {errors.primary_goal && (
                <p className="text-sm text-destructive">{errors.primary_goal.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Intensitetsnivå</Label>
              <RadioGroup {...register('intensity_level')} disabled={isLoading}>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="beginner" id="beginner" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="beginner" className="font-semibold cursor-pointer">
                      Nybörjare
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Mjukare start, försiktig progression
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="intermediate" id="intermediate" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="intermediate" className="font-semibold cursor-pointer">
                      Medel
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Har viss erfarenhet, vill se snabbare resultat
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="advanced" id="advanced" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="advanced" className="font-semibold cursor-pointer">
                      Avancerad
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Erfaren träning, vill maximera resultat
                    </p>
                  </div>
                </div>
              </RadioGroup>
              {errors.intensity_level && (
                <p className="text-sm text-destructive">{errors.intensity_level.message}</p>
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
