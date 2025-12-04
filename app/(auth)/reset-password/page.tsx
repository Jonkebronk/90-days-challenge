'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Ogiltig länk')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Fyll i alla fält')
      return
    }

    if (password.length < 8) {
      toast.error('Lösenordet måste vara minst 8 tecken')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Lösenorden matchar inte')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        toast.success('Lösenordet har återställts!')
      } else {
        toast.error(data.error || 'Något gick fel')
      }
    } catch (error) {
      toast.error('Ett fel uppstod. Försök igen.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tillbaka till inloggning</span>
        </Link>
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-red-600">
              Ogiltig länk
            </CardTitle>
            <CardDescription className="text-gray-600">
              Återställningslänken är ogiltig eller har utgått.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold">
                Begär ny återställningslänk
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tillbaka till inloggning</span>
        </Link>
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gold-primary to-gold-secondary bg-clip-text text-transparent">
              Lösenord återställt!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Ditt lösenord har uppdaterats. Du kan nu logga in med ditt nya lösenord.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold">
                Gå till inloggning
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-secondary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Tillbaka till inloggning</span>
      </Link>
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold-primary to-gold-secondary bg-clip-text text-transparent">
            Välj nytt lösenord
          </CardTitle>
          <CardDescription className="text-gray-600">
            Ange ditt nya lösenord nedan.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Nytt lösenord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                disabled={isLoading}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">Bekräfta lösenord</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Upprepa lösenordet"
                disabled={isLoading}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Sparar...' : 'Spara nytt lösenord'}
            </Button>
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-gold-primary hover:text-gold-secondary transition-colors">
                Tillbaka till inloggning
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
