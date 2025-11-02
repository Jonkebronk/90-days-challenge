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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

const lifestyleSchema = z.object({
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'extra_active'], {
    required_error: 'Välj en aktivitetsnivå',
  }),
  training_location: z.enum(['home', 'gym', 'outdoor'], {
    required_error: 'Välj träningsplats',
  }),
  training_frequency: z.coerce.number().min(1).max(7),
  time_per_session: z.coerce.number().min(15).max(180),
})

type LifestyleForm = z.infer<typeof lifestyleSchema>

export default function Step3Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LifestyleForm>({
    resolver: zodResolver(lifestyleSchema),
    defaultValues: {
      training_frequency: 3,
      time_per_session: 45,
    },
  })

  const onSubmit = async (data: LifestyleForm) => {
    setIsLoading(true)

    const existingData = localStorage.getItem('onboarding_data')
    const onboardingData = existingData ? JSON.parse(existingData) : {}

    localStorage.setItem('onboarding_data', JSON.stringify({
      ...onboardingData,
      ...data,
    }))

    router.push('/step-4')
  }

  const goBack = () => {
    router.back()
  }

  return (
    <>
      <Progress value={(3 / 8) * 100} className="mb-6" />

      <Card>
        <CardHeader>
          <CardTitle>Steg 3: Din livsstil</CardTitle>
          <CardDescription>
            Hur ser din vardag och träning ut?
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Aktivitetsnivå i vardagen</Label>
              <RadioGroup {...register('activity_level')} disabled={isLoading}>
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="sedentary" id="sedentary" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="sedentary" className="font-semibold cursor-pointer text-sm">
                      Stillasittande
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Kontorsjobb, lite eller ingen motion
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="light" id="light" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="light" className="font-semibold cursor-pointer text-sm">
                      Lätt aktiv
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Lätt träning 1-3 dagar/vecka
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="moderate" id="moderate" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="moderate" className="font-semibold cursor-pointer text-sm">
                      Måttligt aktiv
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Träning 3-5 dagar/vecka
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="very_active" id="very_active" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="very_active" className="font-semibold cursor-pointer text-sm">
                      Mycket aktiv
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Hård träning 6-7 dagar/vecka
                    </p>
                  </div>
                </div>
              </RadioGroup>
              {errors.activity_level && (
                <p className="text-sm text-destructive">{errors.activity_level.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Var ska du träna?</Label>
              <RadioGroup {...register('training_location')} disabled={isLoading}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="home" id="home" />
                  <Label htmlFor="home" className="font-normal cursor-pointer">Hemma</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gym" id="gym" />
                  <Label htmlFor="gym" className="font-normal cursor-pointer">Gym</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outdoor" id="outdoor" />
                  <Label htmlFor="outdoor" className="font-normal cursor-pointer">Utomhus</Label>
                </div>
              </RadioGroup>
              {errors.training_location && (
                <p className="text-sm text-destructive">{errors.training_location.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="training_frequency">Träningspass per vecka</Label>
                <Select
                  onValueChange={(value) => setValue('training_frequency', parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="training_frequency">
                    <SelectValue placeholder="Välj antal" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'pass' : 'pass'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.training_frequency && (
                  <p className="text-sm text-destructive">{errors.training_frequency.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_per_session">Minuter per pass</Label>
                <Select
                  onValueChange={(value) => setValue('time_per_session', parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="time_per_session">
                    <SelectValue placeholder="Välj tid" />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 75, 90, 120].map((minutes) => (
                      <SelectItem key={minutes} value={minutes.toString()}>
                        {minutes} minuter
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.time_per_session && (
                  <p className="text-sm text-destructive">{errors.time_per_session.message}</p>
                )}
              </div>
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
