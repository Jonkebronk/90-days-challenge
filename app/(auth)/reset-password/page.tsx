'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/5 border-2 border-red-500/30 rounded-2xl p-8 backdrop-blur-[10px] text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>

            <h1 className="font-['Orbitron',sans-serif] text-xl font-bold tracking-[2px] uppercase text-gold-light mb-4">
              Ogiltig länk
            </h1>

            <p className="text-gray-300 mb-6">
              Återställningslänken är ogiltig eller har utgått.
            </p>

            <Link href="/forgot-password">
              <Button className="w-full bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold">
                Begär ny återställningslänk
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/5 border-2 border-green-500/30 rounded-2xl p-8 backdrop-blur-[10px] text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>

            <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold tracking-[2px] uppercase text-gold-light mb-4">
              Lösenord återställt!
            </h1>

            <p className="text-gray-300 mb-8">
              Ditt lösenord har uppdaterats. Du kan nu logga in med ditt nya lösenord.
            </p>

            <Link href="/login">
              <Button className="w-full bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold">
                Gå till inloggning
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-2xl p-8 backdrop-blur-[10px]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gold-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-gold-light" />
            </div>

            <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold tracking-[2px] uppercase text-gold-light mb-2">
              Välj nytt lösenord
            </h1>

            <p className="text-gray-400 text-sm">
              Ange ditt nya lösenord nedan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-gray-200">Nytt lösenord</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/30 border-gold-primary/30 text-white"
                placeholder="Minst 8 tecken"
                required
                minLength={8}
              />
            </div>

            <div>
              <Label className="text-gray-200">Bekräfta lösenord</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black/30 border-gold-primary/30 text-white"
                placeholder="Upprepa lösenordet"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold tracking-[1px] uppercase hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {isLoading ? 'Sparar...' : 'Spara nytt lösenord'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-gold-light hover:underline">
              Tillbaka till inloggning
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
