'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

const checkInSchema = z.object({
  weight_kg: z.coerce.number().min(30).max(300),
  energy_level: z.number().min(1).max(5),
  sleep_hours: z.coerce.number().min(0).max(24),
  notes: z.string().optional(),
})

type CheckInForm = z.infer<typeof checkInSchema>

const ENERGY_LABELS = [
  { value: 1, label: 'Mycket låg', emoji: '😴', color: 'text-red-500' },
  { value: 2, label: 'Låg', emoji: '😕', color: 'text-orange-500' },
  { value: 3, label: 'Okej', emoji: '😐', color: 'text-yellow-500' },
  { value: 4, label: 'Bra', emoji: '😊', color: 'text-lime-500' },
  { value: 5, label: 'Utmärkt', emoji: '🤩', color: 'text-green-500' },
]

export default function CheckInPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [energyLevel, setEnergyLevel] = useState(3)

  const { register, handleSubmit, formState: { errors } } = useForm<CheckInForm>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      energy_level: 3,
    },
  })

  const onSubmit = async (data: CheckInForm) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          energy_level: energyLevel,
          log_date: new Date().toISOString().split('T')[0],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save check-in')
      }

      toast({
        title: 'Check-in sparad! ✅',
        description: 'Din dagliga logg har sparats.',
      })

      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte spara din check-in. Försök igen.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentEnergy = ENERGY_LABELS.find(e => e.value === energyLevel) || ENERGY_LABELS[2]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Dagens Check-in</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('sv-SE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hur mår du idag?</CardTitle>
          <CardDescription>
            Fyll i dina dagliga mätningar för att följa din progress
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {/* Weight */}
            <div className="space-y-3">
              <Label htmlFor="weight_kg" className="text-base font-semibold">
                Vikt (kg)
              </Label>
              <div className="relative">
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  placeholder="75.5"
                  {...register('weight_kg')}
                  className="text-2xl h-14 pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  kg
                </span>
              </div>
              {errors.weight_kg && (
                <p className="text-sm text-destructive">{errors.weight_kg.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                💡 Väg dig på morgonen, helst efter toalettbesök och innan frukost
              </p>
            </div>

            {/* Energy Level */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Energinivå</Label>

              <div className="text-center py-6">
                <div className={`text-6xl mb-2 ${currentEnergy.color}`}>
                  {currentEnergy.emoji}
                </div>
                <div className="text-2xl font-bold mb-1">
                  {currentEnergy.label}
                </div>
                <div className="text-muted-foreground">
                  {energyLevel} / 5
                </div>
              </div>

              <Slider
                value={[energyLevel]}
                onValueChange={(value) => setEnergyLevel(value[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground px-1">
                {ENERGY_LABELS.map((label) => (
                  <span key={label.value}>{label.value}</span>
                ))}
              </div>
            </div>

            {/* Sleep */}
            <div className="space-y-3">
              <Label htmlFor="sleep_hours" className="text-base font-semibold">
                Sömn (timmar)
              </Label>
              <div className="relative">
                <Input
                  id="sleep_hours"
                  type="number"
                  step="0.5"
                  placeholder="7.5"
                  {...register('sleep_hours')}
                  className="text-2xl h-14 pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  h
                </span>
              </div>
              {errors.sleep_hours && (
                <p className="text-sm text-destructive">{errors.sleep_hours.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                💡 Rekommenderat: 7-9 timmar per natt
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-base font-semibold">
                Anteckningar (valfritt)
              </Label>
              <Textarea
                id="notes"
                placeholder="Hur känner du dig idag? Något speciellt som hänt?"
                {...register('notes')}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                💡 Notera hur du mår, vad du åt, eller andra viktiga observationer
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>Sparar...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Spara Check-in
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Tips Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            💡 Tips för bästa resultat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>• Gör check-in varje dag vid samma tid för bäst jämförelse</p>
          <p>• Vikt kan variera ±1-2 kg dagligen - fokusera på trenden över veckor</p>
          <p>• Energinivå hjälper dig se samband mellan sömn, mat och träning</p>
          <p>• Anteckningar är guld värt när du reflekterar över din resa senare</p>
        </CardContent>
      </Card>
    </div>
  )
}
