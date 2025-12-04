'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Ange din e-postadress')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
      } else {
        toast.error(data.error || 'Något gick fel')
      }
    } catch (error) {
      toast.error('Ett fel uppstod. Försök igen.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
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
              Kolla din inkorg
            </CardTitle>
            <CardDescription className="text-gray-600">
              Om e-postadressen <span className="font-medium text-gray-800">{email}</span> finns i vårt system har vi skickat instruktioner för att återställa ditt lösenord.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500">
              Kom ihåg att kolla din skräppost om du inte ser mejlet inom några minuter.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              onClick={() => {
                setSubmitted(false)
                setEmail('')
              }}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Skicka igen
            </Button>
            <Link href="/login" className="w-full">
              <Button className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold">
                Tillbaka till inloggning
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
            Glömt lösenord?
          </CardTitle>
          <CardDescription className="text-gray-600">
            Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">E-postadress</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.se"
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
              {isLoading ? 'Skickar...' : 'Skicka återställningslänk'}
            </Button>
            <p className="text-center text-sm text-gray-500">
              Kom du ihåg lösenordet?{' '}
              <Link href="/login" className="text-gold-primary hover:text-gold-secondary transition-colors">
                Logga in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
