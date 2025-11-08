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
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import OnboardingFlow from './OnboardingFlow'

const setupSchema = z.object({
  password: z.string().min(8, 'Lösenord måste vara minst 8 tecken'),
  confirmPassword: z.string(),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'Du måste godkänna villkoren för att fortsätta',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Lösenorden matchar inte',
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
  const [step, setStep] = useState(1) // 1 = basic info, 2 = GDPR consent, 3 = onboarding
  const [coachName, setCoachName] = useState('John Sund')
  const [accountCreated, setAccountCreated] = useState(false)
  const [userId, setUserId] = useState('')

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      gdprConsent: false,
    },
  })

  const gdprConsent = watch('gdprConsent')

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
      // Validate password
      if (!data.password) {
        setError('Vänligen ange ett lösenord')
        return
      }
      if (data.password !== data.confirmPassword) {
        setError('Lösenorden matchar inte')
        return
      }
      setStep(2)
      setError('')
    } else if (step === 2) {
      // Validate GDPR consent and create account
      if (!data.gdprConsent) {
        setError('Du måste godkänna villkoren för att fortsätta')
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/setup-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            password: data.password,
            gdprConsent: data.gdprConsent,
          }),
        })

        const result = await response.json()

        if (response.ok) {
          // Save userId and show onboarding
          setUserId(result.userId)
          setAccountCreated(true)
          setStep(3)
        } else {
          setError(result.error || 'Misslyckades skapa konto')
        }
      } catch (err) {
        setError('Ett fel uppstod. Försök igen.')
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

  if (accountCreated && step === 3 && userId) {
    return <OnboardingFlow userId={userId} userName={`${clientInfo?.firstName || ''} ${clientInfo?.lastName || ''}`.trim()} />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-0 shadow-none">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold">
            Hallå där - låt oss komma igång!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Skapa ditt konto för {clientInfo?.firstName} {clientInfo?.lastName}
          </CardDescription>
          {clientInfo?.email && (
            <p className="text-sm text-muted-foreground mt-2">
              Användarnamn: <span className="font-medium">{clientInfo.email}</span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={onNextStep} className="space-y-6">
            {step === 1 ? (
              <>
                {/* Step 1: Password Only */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Skapa lösenord <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    disabled={isLoading}
                    placeholder="Minst 8 tecken"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Bekräfta lösenord <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                    placeholder="Skriv lösenordet igen"
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

                <Button
                  type="submit"
                  className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold h-12 text-base"
                  disabled={isLoading}
                >
                  Nästa
                </Button>
              </>
            ) : step === 2 ? (
              <>
                {/* Step 2: GDPR Consent */}
                <div className="space-y-6 py-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="gdprConsent"
                      checked={gdprConsent}
                      onCheckedChange={(checked) => setValue('gdprConsent', checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="gdprConsent" className="text-sm leading-relaxed cursor-pointer">
                      Jag samtycker härmed till att &quot;{coachName}&quot; som personuppgiftsansvarig, behandlar mina angivna hälsouppgifter, såsom information om allergier, information som indikerar fetma eller skador, eller annan relevant information som rör min fysiska eller psykiska hälsa som jag väljer att dela med mig av under online-coachningsprogrammet.
                    </Label>
                  </div>
                  {errors.gdprConsent && (
                    <p className="text-sm text-destructive">{errors.gdprConsent.message}</p>
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
                  disabled={!gdprConsent}
                >
                  Registrera dig
                </Button>

                <div className="text-center">
                  <Link href="/datapolicy" className="text-sm underline">
                    Datapolicy
                  </Link>
                </div>
              </>
            ) : null}
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
