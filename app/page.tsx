'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Lock, Menu, X, Key } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function HomePage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const navItems = [
    { name: 'Start', href: '#start' },
    { name: 'Intresseanmälan', href: '/apply' },
  ]

  const handleVerifyInviteCode = async () => {
    if (!inviteCode || inviteCode.trim().length < 10) {
      toast.error('Ange en giltig inbjudningskod')
      return
    }

    setIsVerifying(true)

    try {
      const response = await fetch('/api/verify-invite-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Inbjudningskod verifierad!', {
          description: 'Du omdirigeras till kontoskapande...'
        })
        setInviteDialogOpen(false)
        // Navigate to setup account with invitation token
        setTimeout(() => {
          router.push(`/setup-account?token=${data.invitationToken}`)
        }, 1500)
      } else {
        toast.error(data.error || 'Ogiltig inbjudningskod')
      }
    } catch (error) {
      console.error('Error verifying invite code:', error)
      toast.error('Ett fel uppstod. Försök igen.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-gold-primary/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-gold-primary/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000" />
      </div>

      {/* Header Navigation */}
      <header className="relative z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            {/* Logo */}
            <Link href="/" className="flex flex-row items-center group flex-shrink-0">
              <Image
                src="/images/compass-icon-black.svg"
                alt="Friskvårdskompassen"
                width={60}
                height={60}
                className="h-12 lg:h-16 w-auto object-contain transition-all group-hover:scale-110 group-hover:rotate-12"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-900 hover:text-gold-primary transition-colors text-sm font-medium tracking-[1px] uppercase"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-gray-900 hover:text-gold-primary transition-colors"
              >
                Logga in
              </Link>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-primary text-white rounded-lg hover:bg-gold-secondary transition-colors">
                    <Key className="w-4 h-4" />
                    Har du en kod?
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">
                      Ange din inbjudningskod
                    </DialogTitle>
                    <DialogDescription>
                      Om du har fått en inbjudningskod från din coach, ange den här för att skapa ditt konto.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Ange inbjudningskod"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyInviteCode()}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-primary focus:border-transparent outline-none"
                        disabled={isVerifying}
                      />
                    </div>
                    <button
                      onClick={handleVerifyInviteCode}
                      disabled={isVerifying}
                      className="w-full px-6 py-3 bg-gradient-to-br from-gold-primary to-gold-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? 'Verifierar...' : 'Verifiera kod'}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-900 hover:text-gold-primary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200 animate-fadeIn">
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-900 hover:text-gold-primary transition-colors text-sm font-medium tracking-[1px] uppercase px-4 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-gray-200 pt-4 px-4 flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="text-center px-4 py-2 text-sm font-semibold text-gray-900 hover:text-gold-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Logga in
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setInviteDialogOpen(true)
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-primary text-white rounded-lg hover:bg-gold-secondary transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Har du en kod?
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main id="start" className="relative z-10 flex items-center justify-center min-h-[calc(100vh-96px)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fadeIn">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-primary/10 border border-gold-primary/30 rounded-full mb-8">
              <Lock className="w-4 h-4 text-gold-primary" />
              <span className="text-sm text-gold-primary font-semibold tracking-wide">
                Exklusiv Platsansökan
              </span>
            </div>

            {/* Main heading */}
            <h1 className="font-['Orbitron',sans-serif] text-3xl md:text-5xl lg:text-7xl font-black tracking-tight leading-tight uppercase mb-6">
              <span className="bg-gradient-to-br from-gold-light via-gold-primary to-orange-500 bg-clip-text text-transparent animate-titleGlow">
                90 Dagar
              </span>
              <br />
              <span className="text-gray-300">
                Som Förändrar Allt
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Ett exklusivt transformationsprogram för dig som är redo att ta steget.
              <span className="text-gold-primary font-semibold"> Begränsat antal platser.</span>
            </p>

            {/* CTA Button */}
            <button
              onClick={() => router.push('/apply')}
              className="group relative px-8 md:px-12 py-4 md:py-6 text-base md:text-lg font-bold tracking-[2px] uppercase bg-gradient-to-br from-gold-primary to-gold-secondary text-black rounded-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-gold-primary/50 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-3">
                Ansök Om Plats
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Animated glow effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
            </button>

            {/* Additional mystique text */}
            <p className="text-gray-600 text-sm mt-8 italic">
              &ldquo;Inte för alla. Bara för dem som är redo.&rdquo;
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Friskvårdskompassen. Alla rättigheter förbehållna.
            </p>
          </div>
        </div>
      </footer>

      {/* Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes titleGlow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.6));
          }
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }

        .animate-titleGlow {
          animation: titleGlow 3s ease-in-out infinite;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}
