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
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(6, 'Lösenordet måste vara minst 6 tecken'),
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
          title: 'Inloggning misslyckades',
          description: 'Felaktig e-post eller lösenord',
          variant: 'destructive',
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login exception:', error)
      toast({
        title: 'Ett fel uppstod',
        description: 'Försök igen senare.',
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
        <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold-primary to-gold-secondary bg-clip-text text-transparent">
          Logga in
        </CardTitle>
        <CardDescription className="text-gray-600">
          Ange din e-post och lösenord för att logga in
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">E-post</Label>
            <Input
              id="email"
              type="email"
              placeholder="din@epost.se"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-gray-700">Lösenord</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-gold-primary hover:text-gold-secondary transition-colors"
              >
                Glömt lösenord?
              </Link>
            </div>
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
            {isLoading ? 'Loggar in...' : 'Logga in'}
          </Button>
        </CardFooter>
      </form>
    </Card>
    </div>
  )
}
