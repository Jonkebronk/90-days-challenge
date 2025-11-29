'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Lock, Menu, X, Key, CheckCircle2, XCircle, Dumbbell, MessageSquare, UtensilsCrossed, LayoutDashboard, BookOpen, ChefHat, ShieldCheck, Sparkles, Target } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
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
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Redirect logged-in users to dashboard (for PWA experience)
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard')
    }
  }, [status, session, router])


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

  // Show loading while checking session (prevents flash of landing page)
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
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

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login?role=client"
                className="px-4 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg hover:border-gold-primary hover:text-gold-primary transition-all"
              >
                Klient Login
              </Link>
              <Link
                href="/login?role=coach"
                className="px-4 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg hover:border-gold-primary hover:text-gold-primary transition-all"
              >
                Coach Login
              </Link>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    className="flex items-center justify-center p-2.5 bg-gold-primary text-black rounded-lg hover:bg-gold-secondary transition-colors shadow-md"
                    aria-label="Har du en kod?"
                  >
                    <Key className="w-5 h-5" />
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
              <div className="flex flex-col gap-3 px-4">
                <Link
                  href="/login?role=client"
                  className="text-center px-4 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg hover:border-gold-primary hover:text-gold-primary transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Klient Login
                </Link>
                <Link
                  href="/login?role=coach"
                  className="text-center px-4 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg hover:border-gold-primary hover:text-gold-primary transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Coach Login
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setInviteDialogOpen(true)
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-primary text-black rounded-lg hover:bg-gold-secondary transition-colors shadow-md"
                  aria-label="Har du en kod?"
                >
                  <Key className="w-4 h-4" />
                  Har du en kod?
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main id="start" className="relative z-10 flex items-center justify-center min-h-[calc(100vh-96px)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fadeIn">
            {/* Main heading */}
            <h1 className="font-['Orbitron',sans-serif] text-3xl md:text-5xl lg:text-7xl font-black tracking-tight leading-tight uppercase mb-6">
              <span className="bg-gradient-to-br from-gold-light via-gold-primary to-orange-500 bg-clip-text text-transparent animate-titleGlow">
                90 Dagars
              </span>
              <br />
              <span className="text-gray-300">
                Utmaningen
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
              För dig som vill bygga en kropp med mer ork, mer energi, mer självförtroende, mer styrka och mindre fett.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => router.push('/apply')}
              className="group relative px-8 md:px-12 py-4 md:py-6 text-base md:text-lg font-bold tracking-[2px] uppercase bg-gradient-to-br from-gold-primary to-gold-secondary text-black rounded-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-gold-primary/50 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-3">
                Intresseanmälan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Animated glow effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
            </button>
          </div>
        </div>
      </main>

      {/* Programs Section */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl md:text-4xl font-bold text-white mb-4">
            Välj ditt program
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Två vägar till samma mål – välj den som passar dig bäst
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Nybörjare */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 md:p-8 hover:border-gold-primary/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white">90 dagars Nybörjare</h3>
              </div>
              <p className="text-gray-400 mb-6">
                För dig som vill ha en strukturerad och systematisk approach. Perfekt om du har tränat förut men vill komma igång på rätt sätt med tydlig vägledning.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  3 träningspass/vecka
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Strukturerat upplägg
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Bygg hållbara vanor
                </li>
              </ul>
            </div>

            {/* Utmaningen */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gold-primary/30 rounded-2xl p-6 md:p-8 hover:border-gold-primary transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gold-primary text-black text-xs font-bold px-3 py-1 rounded-full">
                POPULÄR
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gold-primary/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-gold-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white">90 dagars Utmaningen</h3>
              </div>
              <p className="text-gray-400 mb-6">
                För dig som vill utmana dig själv och nå nästa nivå. 4 träningspass i veckan för dig som är redo att satsa – funkar även för nybörjare.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-gold-primary flex-shrink-0" />
                  4 träningspass/vecka
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-gold-primary flex-shrink-0" />
                  Intensivt upplägg
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-gold-primary flex-shrink-0" />
                  Maximala resultat
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Vad du får */}
      <section className="relative z-10 py-16 md:py-24 bg-gray-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl md:text-4xl font-bold text-white mb-4">
            Vad du får
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Allt du behöver för att lyckas – samlat på ett ställe
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-gold-primary/30 transition-all">
              <div className="w-12 h-12 bg-gold-primary/10 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-gold-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Personlig coach</h3>
              <p className="text-gray-400 text-sm">Direkt kontakt med din coach via meddelanden. Få svar på frågor och stöd när du behöver det.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-gold-primary/30 transition-all">
              <div className="w-12 h-12 bg-gold-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Dumbbell className="w-6 h-6 text-gold-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Träningsprogram</h3>
              <p className="text-gray-400 text-sm">Anpassat träningsprogram för gym. Tydliga övningar med sets, reps och vila.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-gold-primary/30 transition-all">
              <div className="w-12 h-12 bg-gold-primary/10 rounded-xl flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-6 h-6 text-gold-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Kostschema</h3>
              <p className="text-gray-400 text-sm">Personligt kostschema med makron. Anpassat efter dina mål och preferenser.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-gold-primary/30 transition-all">
              <div className="w-12 h-12 bg-gold-primary/10 rounded-xl flex items-center justify-center mb-4">
                <LayoutDashboard className="w-6 h-6 text-gold-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">App med spårning</h3>
              <p className="text-gray-400 text-sm">Dashboard med check-ins, framstegsspårning och daglig uppföljning av dina resultat.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-gold-primary/30 transition-all">
              <div className="w-12 h-12 bg-gold-primary/10 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-gold-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Kunskapsbank</h3>
              <p className="text-gray-400 text-sm">Artiklar och guider om träning, kost och livsstil. Lär dig varför – inte bara vad.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-gold-primary/30 transition-all">
              <div className="w-12 h-12 bg-gold-primary/10 rounded-xl flex items-center justify-center mb-4">
                <ChefHat className="w-6 h-6 text-gold-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Receptbank</h3>
              <p className="text-gray-400 text-sm">Hundratals recept med näringsberäkning. God mat som passar dina makron.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Expectations Section - För dig / Inte för dig */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl md:text-4xl font-bold text-white mb-12">
            Är det här rätt för dig?
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* För dig */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 md:p-8">
              <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                Det här förväntar vi oss av dig
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Du kan träna 4 gånger i veckan på gym</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Du är redo att investera i din hälsa och ditt välmående</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Du är över 30 och ärligt trött på att leva med ursäkter</span>
                </li>
              </ul>
            </div>

            {/* Inte för dig */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 md:p-8">
              <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
                <XCircle className="w-6 h-6" />
                Det här coachar vi inte
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-300">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Hemmaträning</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Veganer</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>De som &quot;vet bäst själv&quot;</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>De som hoppar på trender som fasta, keto eller annat extremt</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-gray-400 mt-8 max-w-2xl mx-auto">
            Hos oss handlar det om hälsa, hållbarhet och verkliga resultat.
          </p>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="relative z-10 py-16 md:py-24 bg-gradient-to-br from-gold-primary/10 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-gold-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-gold-primary" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
              Resultatgaranti
            </h2>
            <p className="text-xl text-gray-300 mb-4">
              Äter du protein, kolhydrater och fett enligt våra metoder – <span className="text-gold-primary font-bold">GARANTERAR</span> vi resultat.
            </p>
            <p className="text-lg text-gray-400 mb-8">
              Och om du mot förmodan inte lyckas? <span className="text-white font-semibold">Då får du pengarna tillbaka.</span>
            </p>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 inline-block">
              <p className="text-gray-300 italic">
                &quot;Så det enda du riskerar är att förbättra ditt liv. Det vi riskerar är att behöva jobba gratis.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
              Redo att ta första steget?
            </h2>
            <p className="text-gray-400 mb-8">
              Vill du se samma förändring – och göra slutet av 2025 till den tidpunkt då du äntligen tog kontroll?
            </p>
            <button
              onClick={() => router.push('/apply')}
              className="group relative px-8 md:px-12 py-4 md:py-6 text-base md:text-lg font-bold tracking-[2px] uppercase bg-gradient-to-br from-gold-primary to-gold-secondary text-black rounded-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-gold-primary/50 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-3">
                Intresseanmälan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
            </button>
          </div>
        </div>
      </section>

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
