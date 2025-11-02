'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

const setupSchema = z.object({
  firstName: z.string().min(1, 'Förnamn krävs'),
  lastName: z.string().min(1, 'Efternamn krävs'),
  birthdate: z.string().min(1, 'Födelsedatum krävs'),
  gender: z.string().min(1, 'Könsidentitet krävs'),
  password: z.string().min(8, 'Lösenord måste vara minst 8 tecken'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ['confirmPassword'],
})

type SetupForm = z.infer<typeof setupSchema>

function SetupAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientInfo, setClientInfo] = useState<{ firstName: string; lastName: string; email: string } | null>(null)
  const [verifying, setVerifying] = useState(true)
  const [step, setStep] = useState(1) // 1 = basic info, 2 = password

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
  })

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setVerifying(false)
      return
    }

    // Verify token
    fetch(`/api/verify-invitation?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setClientInfo(data.client)
          // Pre-fill name fields
          setValue('firstName', data.client.firstName || '')
          setValue('lastName', data.client.lastName || '')
        } else {
          setError(data.error || 'Invalid or expired invitation')
        }
      })
      .catch(() => {
        setError('Failed to verify invitation')
      })
      .finally(() => {
        setVerifying(false)
      })
  }, [token, setValue])

  const onNextStep = handleSubmit(async (data) => {
    if (step === 1) {
      // Validate first step fields
      if (!data.firstName || !data.lastName || !data.birthdate || !data.gender) {
        setError('Vänligen fyll i alla fält')
        return
      }
      setStep(2)
      setError('')
    } else {
      // Submit final step
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/setup-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            firstName: data.firstName,
            lastName: data.lastName,
            birthdate: data.birthdate,
            gender: data.gender,
            password: data.password,
          }),
        })

        const result = await response.json()

        if (response.ok) {
          // Redirect to onboarding
          router.push('/step-1')
        } else {
          setError(result.error || 'Failed to create account')
        }
      } catch (err) {
        setError('An error occurred. Please try again.')
        console.error('Setup error:', err)
      } finally {
        setIsLoading(false)
      }
    }
  })

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !clientInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-0 shadow-none">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold">
            {step === 1 ? 'Hallå där - låt oss komma igång!' : 'Skapa ditt lösenord'}
          </CardTitle>
          {step === 1 && (
            <CardDescription className="text-base mt-2">
              Låt oss skapa ditt konto med {clientInfo?.firstName} {clientInfo?.lastName}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={onNextStep} className="space-y-6">
            {step === 1 ? (
              <>
                {/* Step 1: Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      Förnamn <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      disabled={isLoading}
                      className="bg-muted"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Efternamn <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      disabled={isLoading}
                      className="bg-muted"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthdate">Vilket är ditt födelsedatum?</Label>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Födelsedag</Label>
                    <Input
                      id="birthdate"
                      type="date"
                      {...register('birthdate')}
                      disabled={isLoading}
                      placeholder="MM/DD/YYYY"
                    />
                  </div>
                  {errors.birthdate && (
                    <p className="text-sm text-destructive">{errors.birthdate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Vilken könsidentitet har du?</Label>
                  <Select
                    onValueChange={(value) => setValue('gender', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Kön" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Man</SelectItem>
                      <SelectItem value="female">Kvinna</SelectItem>
                      <SelectItem value="other">Annat</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-destructive">{errors.gender.message}</p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold h-12 text-base"
                  disabled={isLoading}
                >
                  Nästa
                </Button>
              </>
            ) : (
              <>
                {/* Step 2: Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Lösenord</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minst 8 tecken"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ange lösenordet igen"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Tillbaka
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-lime-400 hover:bg-lime-500 text-black font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Skapar...
                      </>
                    ) : (
                      'Skapa konto'
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SetupAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SetupAccountContent />
    </Suspense>
  )
}
