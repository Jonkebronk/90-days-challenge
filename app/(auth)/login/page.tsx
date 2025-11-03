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
    <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
          Sign In
        </CardTitle>
        <CardDescription className="text-[rgba(255,255,255,0.6)]">
          Enter your email and password to sign in
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[rgba(255,215,0,0.8)]">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              disabled={isLoading}
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
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
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700]"
            />
            {errors.password && (
              <p className="text-sm text-[#ff4444]">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
          <p className="text-sm text-[rgba(255,255,255,0.5)] text-center">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#FFD700] hover:underline hover:text-[#FFA500]">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
