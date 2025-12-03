'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Namnet måste vara minst 2 tecken'),
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(6, 'Lösenordet måste vara minst 6 tecken'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Lösenorden matchar inte',
  path: ['confirmPassword'],
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)

    try {
      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.fullName,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Registreringen misslyckades',
          description: result.error || result.details || 'Något gick fel',
          variant: 'destructive',
        })
        return
      }

      // Auto-login after successful registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast({
          title: 'Konto skapat!',
          description: 'Vänligen logga in',
        })
        router.push('/login')
      } else {
        toast({
          title: 'Välkommen!',
          description: 'Ditt konto har skapats.',
        })
        router.push('/onboarding/step-1')
        router.refresh()
      }
    } catch (error) {
      toast({
        title: 'Ett fel uppstod',
        description: 'Försök igen senare.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[rgba(255,215,0,0.8)] hover:text-gold-light transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Tillbaka till startsidan</span>
      </Link>
      <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold-light to-orange-500 bg-clip-text text-transparent">Skapa konto</CardTitle>
        <CardDescription className="text-gray-400">
          Fyll i dina uppgifter för att börja din resa
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[rgba(255,215,0,0.8)]">Fullständigt namn</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Ditt namn"
              {...register('fullName')}
              disabled={isLoading}
              className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-gold-light"
            />
            {errors.fullName && (
              <p className="text-sm text-[#ff4444]">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[rgba(255,215,0,0.8)]">E-post</Label>
            <Input
              id="email"
              type="email"
              placeholder="din@epost.se"
              {...register('email')}
              disabled={isLoading}
              className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-gold-light"
            />
            {errors.email && (
              <p className="text-sm text-[#ff4444]">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[rgba(255,215,0,0.8)]">Lösenord</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
              className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-gold-light"
            />
            {errors.password && (
              <p className="text-sm text-[#ff4444]">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[rgba(255,215,0,0.8)]">Bekräfta lösenord</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={isLoading}
              className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-gold-light"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-[#ff4444]">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full bg-gradient-to-r from-gold-light to-orange-500 hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold" disabled={isLoading}>
            {isLoading ? 'Skapar konto...' : 'Skapa konto'}
          </Button>
          <p className="text-sm text-gray-400 text-center">
            Har du redan ett konto?{' '}
            <Link href="/login" className="text-gold-light hover:text-orange-500 hover:underline">
              Logga in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
    </div>
  )
}
