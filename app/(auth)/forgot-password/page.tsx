'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/5 border-2 border-green-500/30 rounded-2xl p-8 backdrop-blur-[10px] text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>

            <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold tracking-[2px] uppercase text-gold-light mb-4">
              Kolla din inkorg
            </h1>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Om e-postadressen <span className="text-gold-light">{email}</span> finns i vårt system har vi skickat instruktioner för att återställa ditt lösenord.
            </p>

            <p className="text-sm text-gray-500 mb-8">
              Kom ihåg att kolla din skräppost om du inte ser mejlet inom några minuter.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                }}
                variant="outline"
                className="w-full border-gold-primary/30 text-gold-light hover:bg-gold-primary/10"
              >
                Skicka igen
              </Button>

              <Link href="/login" className="block">
                <Button className="w-full bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold">
                  Tillbaka till inloggning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Back button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[rgba(255,215,0,0.7)] hover:text-gold-light transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm tracking-[1px]">Tillbaka till inloggning</span>
        </Link>

        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-8 backdrop-blur-[10px]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gold-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-gold-light" />
            </div>

            <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold tracking-[2px] uppercase text-gold-light mb-2">
              Glömt lösenord?
            </h1>

            <p className="text-gray-400 text-sm">
              Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-gray-200">E-postadress</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/30 border-gold-primary/30 text-white"
                placeholder="din@email.se"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold tracking-[1px] uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {isLoading ? 'Skickar...' : 'Skicka återställningslänk'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Kom du ihåg lösenordet?{' '}
            <Link href="/login" className="text-gold-light hover:underline">
              Logga in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
