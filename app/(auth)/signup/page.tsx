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
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
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
          title: 'Registration failed',
          description: result.error || result.details || 'Something went wrong',
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
          title: 'Account created!',
          description: 'Please sign in',
        })
        router.push('/login')
      } else {
        toast({
          title: 'Welcome!',
          description: 'Your account has been created.',
        })
        router.push('/onboarding/step-1')
        router.refresh()
      }
    } catch (error) {
      toast({
        title: 'An error occurred',
        description: 'Please try again later.',
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
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gold-light to-orange-500 bg-clip-text text-transparent">Create Account</CardTitle>
        <CardDescription className="text-gray-400">
          Fill in the details below to start your 90-day journey
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[rgba(255,215,0,0.8)]">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Your name"
              {...register('fullName')}
              disabled={isLoading}
              className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-gold-light"
            />
            {errors.fullName && (
              <p className="text-sm text-[#ff4444]">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[rgba(255,215,0,0.8)]">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              disabled={isLoading}
              className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-gold-light"
            />
            {errors.email && (
              <p className="text-sm text-[#ff4444]">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[rgba(255,215,0,0.8)]">Password</Label>
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
            <Label htmlFor="confirmPassword" className="text-[rgba(255,215,0,0.8)]">Confirm Password</Label>
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
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
          <p className="text-sm text-gray-400 text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-gold-light hover:text-orange-500 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
    </div>
  )
}
