'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Sparkles, Lock } from 'lucide-react'

export default function GoldenTicketPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [showAnimation, setShowAnimation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsValidating(true)

    try {
      const response = await fetch('/api/verify-invite-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        // Show golden ticket animation
        setShowAnimation(true)

        // Wait for animation then redirect
        setTimeout(() => {
          router.push(`/setup-account?token=${data.invitationToken}`)
        }, 2000)
      } else {
        setError(data.error || 'Invalid code. Please check and try again.')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  if (showAnimation) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
        <div className="relative">
          {/* Golden ticket reveal animation */}
          <div className="animate-pulse">
            <div className="w-64 h-96 bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#9B7E28] rounded-lg shadow-2xl transform rotate-3 animate-bounce">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
              <div className="flex items-center justify-center h-full">
                <Sparkles className="w-24 h-24 text-[#0a0a0a] animate-spin" />
              </div>
            </div>
          </div>
          <p className="text-center mt-8 text-[#FFD700] text-2xl font-bold animate-pulse">
            ACCESS GRANTED
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFD700]/5 rounded-full blur-3xl"></div>
      </div>

      {/* Coach portal link - subtle in corner */}
      <div className="absolute top-8 right-8 z-20">
        <Link href="/login">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#B0B0B0] hover:text-[#FFD700] transition-colors group"
          >
            <Lock className="w-4 h-4 mr-2 group-hover:text-[#FFD700]" />
            Coach Portal
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700] to-[#D4AF37] mb-4">
              <Sparkles className="w-10 h-10 text-[#0a0a0a]" />
            </div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent animate-pulse">
              90-DAGARS CHALLENGE
            </h1>

            <p className="text-xl text-[#B0B0B0] italic">
              En exklusiv träningsresa för utvalda individer
            </p>
          </div>

          {/* Invite code form */}
          <form onSubmit={handleSubmit} className="space-y-6 mt-12">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm text-[#D4AF37] uppercase tracking-wider font-semibold">
                Ange Din Guldkod
              </label>

              <div className="relative group">
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="GOLD-XXXX-XXXX"
                  className="text-center text-2xl tracking-wider uppercase bg-[#1a1a1a] border-[#D4AF37]/30 focus:border-[#FFD700] text-white placeholder:text-[#B0B0B0]/50 h-16 transition-all duration-300 group-hover:border-[#FFD700]/50"
                  disabled={isValidating}
                  required
                />
                <div className="absolute inset-0 bg-[#FFD700]/5 rounded-md -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              {error && (
                <p className="text-[#EF4444] text-sm mt-2 animate-shake">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isValidating || !code}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#FFD700] to-[#D4AF37] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isValidating ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin"></div>
                  Validerar...
                </span>
              ) : (
                'UNLOCK ACCESS'
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Subtle particle effect (CSS only) */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
