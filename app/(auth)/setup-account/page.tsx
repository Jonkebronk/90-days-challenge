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
import { signIn } from 'next-auth/react'

// Simplified schema - GDPR validation handled manually
const setupSchema = z.object({
  password: z.string().min(8, 'Lösenord måste vara minst 8 tecken'),
  confirmPassword: z.string(),
  gdprConsent: z.boolean().optional(),
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
  const [step, setStep] = useState(1) // 1 = password, 2 = GDPR consent
  const [coachName, setCoachName] = useState('John Sund')

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    mode: 'onChange',
    defaultValues: {
      gdprConsent: false,
      password: '',
      confirmPassword: '',
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

  const onNextStep = handleSubmit(
    async (data) => {
      console.log('Form submitted with data:', data)
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
          // Account created successfully, now sign in
          const signInResult = await signIn('credentials', {
            email: clientInfo?.email,
            password: data.password,
            redirect: false,
          })

          if (signInResult?.ok) {
            // Successfully signed in, redirect to dashboard
            router.push('/dashboard')
          } else {
            setError('Konto skapat men inloggning misslyckades. Försök logga in manuellt.')
          }
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
  },
  (errors) => {
    console.log('Form validation errors:', errors)
    setError('Vänligen fyll i alla obligatoriska fält korrekt')
  })

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold-light mb-4" />
            <p className="text-gray-400">Verifierar inbjudan...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !clientInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              Ogiltig inbjudan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-red-500">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              className="w-full mt-4 bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] font-semibold hover:opacity-90"
              onClick={() => router.push('/')}
            >
              Gå till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
        <CardHeader className="text-center pb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <CardTitle className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
            Hallå där - låt oss komma igång!
          </CardTitle>
          <CardDescription className="text-base mt-3 text-gray-300">
            Skapa ditt konto för {clientInfo?.firstName} {clientInfo?.lastName}
          </CardDescription>
          {clientInfo?.email && (
            <p className="text-sm text-gray-400 mt-2">
              Användarnamn: <span className="font-medium text-gold-light">{clientInfo.email}</span>
            </p>
          )}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </CardHeader>
        <CardContent>
          <form onSubmit={onNextStep} className="space-y-6">
            {step === 1 ? (
              <>
                {/* Step 1: Password Only */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200">
                    Skapa lösenord <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    disabled={isLoading}
                    placeholder="Minst 8 tecken"
                    className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-200">
                    Bekräfta lösenord <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                    placeholder="Skriv lösenordet igen"
                    className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-red-500">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] font-bold h-12 text-base hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  Nästa
                </Button>
              </>
            ) : step === 2 ? (
              <>
                {/* Step 2: GDPR Consent */}
                <div className="space-y-6 py-4">
                  <div className="flex items-start space-x-3 bg-[rgba(255,215,0,0.05)] border border-gold-primary/20 rounded-lg p-4">
                    <Checkbox
                      id="gdprConsent"
                      checked={gdprConsent}
                      onCheckedChange={(checked) => setValue('gdprConsent', checked as boolean)}
                      className="mt-1 border-[rgba(255,215,0,0.5)] data-[state=checked]:bg-[#FFD700] data-[state=checked]:text-[#0a0a0a]"
                    />
                    <Label htmlFor="gdprConsent" className="text-sm leading-relaxed cursor-pointer text-gray-200">
                      Jag samtycker härmed till att &quot;{coachName}&quot; som personuppgiftsansvarig, behandlar mina angivna hälsouppgifter, såsom information om allergier, information som indikerar fetma eller skador, eller annan relevant information som rör min fysiska eller psykiska hälsa som jag väljer att dela med mig av under online-coachningsprogrammet.
                    </Label>
                  </div>
                  {errors.gdprConsent && (
                    <p className="text-sm text-red-500">{errors.gdprConsent.message}</p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-red-500">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] font-bold h-12 text-base hover:opacity-90 transition-opacity"
                  disabled={!gdprConsent || isLoading}
                >
                  {isLoading ? 'Skapar konto...' : 'Registrera dig'}
                </Button>

                <div className="text-center">
                  <Link href="/datapolicy" className="text-sm underline text-[rgba(255,215,0,0.8)] hover:text-gold-light">
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-light" />
      </div>
    }>
      <SetupAccountContent />
    </Suspense>
  )
}
