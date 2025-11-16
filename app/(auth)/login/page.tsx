'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    console.log('Form submitted with:', { email: data.email, password: '***' })
    setIsLoading(true)

    try {
      console.log('Calling signIn...')
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        callbackUrl: '/dashboard',
        redirect: true,
      })

      console.log('SignIn result:', result)

      // This code won't run if redirect is true, but keep it as fallback
      if (result?.error) {
        console.log('Login error:', result.error)
        toast({
          title: 'Login failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login exception:', error)
      toast({
        title: 'An error occurred',
        description: 'Please try again later.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-secondary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Tillbaka till startsidan</span>
      </Link>
      <Card className="bg-white border border-gray-200 shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gold-primary to-gold-secondary bg-clip-text text-transparent">
          Sign In
        </CardTitle>
        <CardDescription className="text-gray-600">
          Enter your email and password to sign in
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </CardFooter>
      </form>
    </Card>
    </div>
  )
}
