'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CountdownTimer } from '@/components/countdown-timer'
import { Menu, X, Sparkles, ArrowRight, Key, CheckCircle, Star, Users, Dumbbell, UtensilsCrossed, LineChart } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
    { name: 'Om Programmet', href: '#program' },
    { name: 'Om mig', href: '#om-mig' },
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
    <div className="min-h-screen relative overflow-hidden bg-gray-900">
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

            {/* Login Buttons + Invite Code */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <button className="p-2.5 text-xs font-semibold bg-white border-2 border-gold-primary text-gold-primary rounded-lg transition-all duration-300 hover:scale-105 hover:bg-gold-primary hover:text-white hover:shadow-md">
                    <Key className="w-4 h-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white border border-gray-200 shadow-xl max-w-[90vw] sm:max-w-md md:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-['Orbitron',sans-serif] text-xl font-bold tracking-[2px] uppercase bg-gradient-to-r from-gold-primary to-gold-secondary bg-clip-text text-transparent text-center">
                      Har du en inbjudningskod?
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 text-sm text-center">
                      Om du har fått en inbjudningskod av din coach, ange den här för att komma igång direkt
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyInviteCode()}
                      placeholder="GOLD-XXXX-XXXX-XXXX"
                      disabled={isVerifying}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gold-primary placeholder:text-gray-400 text-center font-mono text-sm tracking-[2px] uppercase focus:outline-none focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20 transition-all disabled:opacity-50"
                      maxLength={19}
                    />
                    <button
                      onClick={handleVerifyInviteCode}
                      disabled={isVerifying || !inviteCode}
                      className="w-full px-6 py-3 bg-gradient-to-r from-gold-primary to-gold-secondary text-white rounded-lg font-bold tracking-[1px] uppercase text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verifierar...</span>
                        </>
                      ) : (
                        <>
                          <span>Aktivera</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
              <Link
                href="/login"
                className="px-4 py-2.5 text-xs font-semibold tracking-[1px] uppercase bg-white border-2 border-gray-300 text-gray-900 rounded-lg transition-all duration-300 hover:scale-105 hover:border-gold-primary hover:text-gold-primary hover:shadow-md"
              >
                Klient Login
              </Link>
              <Link
                href="/login"
                className="px-4 py-2.5 text-xs font-semibold tracking-[1px] uppercase bg-white border-2 border-gray-300 text-gray-900 rounded-lg transition-all duration-300 hover:scale-105 hover:border-gold-primary hover:text-gold-primary hover:shadow-md"
              >
                Coach Login
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-900 hover:text-gold-primary transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <nav className="container mx-auto px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-gray-900 hover:text-gold-primary hover:bg-gray-50 rounded-lg transition-all text-sm font-medium tracking-[1px] uppercase"
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={() => {
                  setInviteDialogOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold tracking-[1px] uppercase bg-white border-2 border-gold-primary text-gold-primary rounded-lg hover:bg-gold-primary hover:text-white transition-colors"
              >
                <Key className="w-4 h-4" />
                <span>Inbjudningskod</span>
              </button>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-center text-xs font-semibold tracking-[1px] uppercase bg-white border-2 border-gray-300 text-gray-900 rounded-lg hover:border-gold-primary hover:text-gold-primary transition-colors"
                >
                  Klient Login
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-center text-xs font-semibold tracking-[1px] uppercase bg-gradient-to-r from-gold-primary to-gold-secondary border-2 border-gold-primary text-white rounded-lg hover:shadow-md transition-all"
                >
                  Coach Login
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main container */}
      <div className="relative z-10">
        {/* HERO SECTION - Improved with image */}
        <section id="start" className="relative py-20 lg:py-32 scroll-mt-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
              {/* Left column - Text content */}
              <div className="text-center lg:text-left animate-fadeIn">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-8 animate-shimmer lg:bg-gradient-to-r lg:from-[#FFD700]" />
                <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl lg:text-6xl font-black tracking-[4px] md:tracking-[6px] leading-[1.2] uppercase animate-titleGlow bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-6">
                  Transform din kropp på 90 dagar
                </h1>
                <p className="text-gray-300 text-lg md:text-xl mb-4 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Personlig coaching, träningsprogram och kostschema – allt du behöver för att nå dina hälsomål
                </p>
                <p className="text-gray-400 text-base mb-8 max-w-2xl mx-auto lg:mx-0">
                  Med Friskvårdskompassen får du en dedikerad coach som guidar dig genom hela resan. Inga genvägar, inga modeflungor – bara beprövade metoder som fungerar.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => router.push('/apply')}
                    className="px-8 py-4 text-base md:text-lg tracking-[2px] uppercase font-bold bg-gradient-to-br from-gold-primary to-gold-secondary text-white rounded-lg transition-all duration-300 font-['Orbitron',sans-serif] hover:scale-105 hover:shadow-xl hover:shadow-gold-primary/40 active:scale-[0.98]"
                  >
                    Kom igång nu
                  </button>
                  <a
                    href="#program"
                    className="px-8 py-4 text-base md:text-lg tracking-[2px] uppercase font-bold bg-white/10 border-2 border-gold-primary/50 text-white rounded-lg transition-all duration-300 hover:bg-white/20 hover:border-gold-primary text-center"
                  >
                    Läs mer
                  </a>
                </div>
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-8 animate-shimmer lg:bg-gradient-to-r lg:from-[#FFD700]" />
              </div>

              {/* Right column - Hero image */}
              <div className="relative animate-fadeIn hidden lg:block">
                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gold-primary/30 shadow-2xl shadow-gold-primary/20">
                  <Image
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop"
                    alt="Fitness transformation"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/40 to-transparent" />
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-gold-primary to-gold-secondary rounded-2xl opacity-20 blur-2xl" />
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-gold-primary to-gold-secondary rounded-2xl opacity-20 blur-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS/FEATURES SECTION - NEW */}
        <section className="py-20 lg:py-32 bg-gray-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Section header */}
            <div className="text-center mb-16 animate-fadeIn">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 animate-shimmer" />
              <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[4px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-4">
                Allt du behöver på ett ställe
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                En komplett lösning för din hälsoresa – från träning till kost och progress-tracking
              </p>
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 animate-shimmer" />
            </div>

            {/* Benefit 1 - Image Left */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20 lg:mb-32 animate-fadeIn">
              <div className="relative order-2 lg:order-1">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gold-primary/20 shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=700&h=525&fit=crop"
                    alt="Personlig coaching"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 to-transparent" />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-['Orbitron',sans-serif] text-2xl md:text-3xl font-bold tracking-[2px] bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">
                    Personlig Coaching
                  </h3>
                </div>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                  Din dedikerade coach finns med dig hela vägen. Varje vecka går ni igenom din progress, justerar planen och ser till att du håller dig på rätt spår mot dina mål.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Veckovisa check-ins med personlig feedback</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Kontinuerliga justeringar av träning och kost</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Stöd och motivation när du behöver det</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Direkt tillgång till din coach via plattformen</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Benefit 2 - Text Left, Image Right */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20 lg:mb-32 animate-fadeIn">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-['Orbitron',sans-serif] text-2xl md:text-3xl font-bold tracking-[2px] bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">
                    Träningsprogram
                  </h3>
                </div>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                  Få tillgång till professionellt utformade träningsprogram som progressivt ökar i intensitet. Oavsett om du tränar hemma eller på gym har vi program som passar dig.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>3 faser med progressiv överbelastning</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Video-instruktioner för alla övningar</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Anpassat efter dina mål och erfarenhetsnivå</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Flexibelt schema som passar din vardag</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gold-primary/20 shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700&h=525&fit=crop"
                    alt="Träningsprogram"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 to-transparent" />
                </div>
              </div>
            </div>

            {/* Benefit 3 - Image Left */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20 lg:mb-32 animate-fadeIn">
              <div className="relative order-2 lg:order-1">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gold-primary/20 shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&h=525&fit=crop"
                    alt="Kostschema och recept"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 to-transparent" />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-['Orbitron',sans-serif] text-2xl md:text-3xl font-bold tracking-[2px] bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">
                    Kostschema & Recept
                  </h3>
                </div>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                  Slipp gissa hur du ska äta. Få ett individuellt kostschema baserat på dina mål plus tillgång till över 300 näringsberäknade recept som faktiskt smakar gott.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>314 recept med fullständig näringsberäkning</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Personligt anpassade makroberäkningar</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Flexibla måltidsplaner som passar din livsstil</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Enkla, goda recept för alla måltider</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Benefit 4 - Text Left, Image Right */}
            <div className="grid lg:grid-cols-2 gap-12 items-center animate-fadeIn">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center">
                    <LineChart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-['Orbitron',sans-serif] text-2xl md:text-3xl font-bold tracking-[2px] bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">
                    Verktyg & Tracking
                  </h3>
                </div>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                  Följ din progress med smarta verktyg och få visuell feedback på din utveckling. Se hur långt du kommit och håll motivationen uppe hela vägen.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Vikttracking med trendanalys och grafer</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Progress-foton för att se din transformation</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Veckovisa check-ins med energi, sömn och måendemätning</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-1" />
                    <span>Kaloriräknare och andra nutritionsverktyg</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gold-primary/20 shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&h=525&fit=crop"
                    alt="Progress tracking"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COACH PRESENTATION SECTION - NEW "Om Mig" */}
        <section id="om-mig" className="py-20 lg:py-32 bg-gray-900 scroll-mt-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="bg-white/5 border-2 border-gold-primary/30 rounded-2xl p-8 md:p-12 lg:p-16 backdrop-blur-sm animate-fadeIn">
              <div className="grid lg:grid-cols-[300px,1fr] gap-12 items-center">
                {/* Coach image */}
                <div className="relative mx-auto lg:mx-0">
                  <div className="relative w-64 h-64 lg:w-72 lg:h-72 rounded-full overflow-hidden border-4 border-gold-primary/50 shadow-2xl shadow-gold-primary/30">
                    <Image
                      src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop"
                      alt="Din coach"
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Decorative ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-gold-primary/20 scale-110 animate-pulse" />
                </div>

                {/* Coach info */}
                <div className="text-center lg:text-left">
                  <div className="mb-6">
                    <p className="text-gold-primary text-sm uppercase tracking-[2px] font-semibold mb-2">
                      Din personliga coach
                    </p>
                    <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3">
                      [Ditt Namn]
                    </h2>
                    <p className="text-gray-400 text-lg">
                      Certifierad PT & Nutritionscoach
                    </p>
                  </div>

                  <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6">
                    Med över [X] års erfarenhet inom personlig träning och kost har jag hjälpt hundratals klienter att nå sina hälsomål. Min filosofi är enkel: ingen quick-fix, bara hållbara resultat genom beprövade metoder och personlig coaching.
                  </p>

                  <div className="bg-white/5 border border-gold-primary/20 rounded-xl p-6 mb-6">
                    <h3 className="text-gold-primary font-bold mb-4 text-lg">
                      Kvalifikationer & Erfarenhet:
                    </h3>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-0.5" />
                        <span>[Certifiering 1, tex "Certifierad Personal Trainer"]</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-0.5" />
                        <span>[Certifiering 2, tex "Nutritionsrådgivare"]</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-0.5" />
                        <span>[Erfarenhet, tex "5+ års erfarenhet av online coaching"]</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-gold-primary flex-shrink-0 mt-0.5" />
                        <span>[Specialisering, tex "Specialist på viktminskning"]</span>
                      </li>
                    </ul>
                  </div>

                  <blockquote className="border-l-4 border-gold-primary pl-6 italic text-gray-300 text-lg mb-6">
                    &ldquo;Min mission är att hjälpa dig bygga en hälsosam livsstil som varar längre än 90 dagar – det här är början på din resa, inte slutet.&rdquo;
                  </blockquote>

                  <Link
                    href="/om-mig"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-primary to-gold-secondary text-white rounded-lg font-bold tracking-[1px] uppercase text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    Läs mer om mig
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROGRAM SECTION - Keep existing */}
        <section id="program" className="py-20 lg:py-32 bg-gray-900/50 scroll-mt-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto animate-fadeIn">
              <div className="mb-12">
                <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[4px] leading-[1.2] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3">
                  Programmet
                </h2>
                <p className="text-gray-400 text-lg">
                  Transform din kropp och hälsa på 90 dagar
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                {/* 90 Dagars Utmaningen */}
                <div className="relative bg-white border-2 border-gold-primary/30 rounded-xl p-8 md:p-10 shadow-lg transition-all duration-300 hover:border-gold-primary hover:shadow-xl hover:-translate-y-2 overflow-hidden group">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center mb-6 mx-auto">
                      <span className="text-4xl">🎯</span>
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-4 tracking-[1px] font-['Orbitron',sans-serif]">
                      90 Dagars Utmaningen
                    </h3>
                    <p className="text-gray-700 text-lg leading-relaxed mb-6">
                      Ett intensivt 90-dagarsprogram för dig som vill se snabba, hållbara resultat med total transformation.
                    </p>
                    <ul className="space-y-3 mb-8 text-left max-w-md mx-auto">
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="text-gold-primary flex-shrink-0 text-xl">✓</span>
                        <span>Komplett 90-dagars plan</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="text-gold-primary flex-shrink-0 text-xl">✓</span>
                        <span>Veckovisa check-ins & justeringar</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="text-gold-primary flex-shrink-0 text-xl">✓</span>
                        <span>Träningsprogram + kostschema</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="text-gold-primary flex-shrink-0 text-xl">✓</span>
                        <span>Garanterad transformation</span>
                      </li>
                    </ul>
                    <Link
                      href="/apply"
                      className="inline-block w-full max-w-md px-6 py-4 bg-gradient-to-r from-gold-primary to-gold-secondary text-white rounded-lg font-bold tracking-[1px] uppercase text-base transition-all duration-300 hover:scale-105 hover:shadow-lg text-center"
                    >
                      Intresseanmälan
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HUR DET FUNGERAR - Keep existing */}
        <section className="py-20 lg:py-32 bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto animate-fadeIn">
              {/* Section Title */}
              <div className="text-center mb-16">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 animate-shimmer" />
                <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[4px] leading-[1.2] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                  Hur det fungerar
                </h2>
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 animate-shimmer" />
              </div>

              {/* Vertical stack layout */}
              <div className="flex flex-col gap-8">
                {/* Step 1 */}
                <div className="relative bg-white border border-gray-200 rounded-xl p-8 md:p-10 shadow-md transition-all duration-300 hover:border-gold-primary hover:shadow-lg hover:-translate-y-1 overflow-hidden">
                  {/* Large background number */}
                  <div className="absolute top-0 left-0 font-['Orbitron',sans-serif] text-[120px] md:text-[140px] font-black text-gray-100 leading-none select-none pointer-events-none">
                    01
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-lg md:text-xl font-bold text-gray-900 mb-3 tracking-[2px] font-['Orbitron',sans-serif]">
                      Steg 1.
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-4 tracking-[1px] font-['Orbitron',sans-serif]">
                      Intresseanmälan
                    </h3>
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                      Fyll i ett kort formulär där du delar dina ambitioner, var du är idag och vart du vill komma. Det tar 5 minuter och är första steget mot förändring.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative bg-white border border-gray-200 rounded-xl p-8 md:p-10 shadow-md transition-all duration-300 hover:border-gold-primary hover:shadow-lg hover:-translate-y-1 overflow-hidden">
                  {/* Large background number */}
                  <div className="absolute top-0 left-0 font-['Orbitron',sans-serif] text-[120px] md:text-[140px] font-black text-gray-100 leading-none select-none pointer-events-none">
                    02
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-lg md:text-xl font-bold text-gray-900 mb-3 tracking-[2px] font-['Orbitron',sans-serif]">
                      Steg 2.
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-4 tracking-[1px] font-['Orbitron',sans-serif]">
                      Jag tar kontakt med dig
                    </h3>
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                      Jag går igenom din ansökan och visar exakt hur vi ska nå dina mål. Du får full insyn i upplägget innan du bestämmer dig.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative bg-white border border-gray-200 rounded-xl p-8 md:p-10 shadow-md transition-all duration-300 hover:border-gold-primary hover:shadow-lg hover:-translate-y-1 overflow-hidden">
                  {/* Large background number */}
                  <div className="absolute top-0 left-0 font-['Orbitron',sans-serif] text-[120px] md:text-[140px] font-black text-gray-100 leading-none select-none pointer-events-none">
                    03
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-lg md:text-xl font-bold text-gray-900 mb-3 tracking-[2px] font-['Orbitron',sans-serif]">
                      Steg 3.
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-4 tracking-[1px] font-['Orbitron',sans-serif]">
                      Ta makten över din hälsa
                    </h3>
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                      Om det känns rätt tar du steget och vi sätter igång. Ingen press, bara en möjlighet att äntligen få ordning på träning och kost.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION - NEW (Empty structure) */}
        <section className="py-20 lg:py-32 bg-gray-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto animate-fadeIn">
              {/* Section header */}
              <div className="text-center mb-16">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 animate-shimmer" />
                <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[4px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-4">
                  Vad säger våra klienter?
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Riktiga resultat från riktiga personer
                </p>
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 animate-shimmer" />
              </div>

              {/* Testimonials grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Testimonial 1 */}
                <div className="bg-white border-2 border-gold-primary/20 rounded-xl p-8 shadow-lg transition-all duration-300 hover:border-gold-primary hover:shadow-xl hover:-translate-y-2">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white font-bold text-xl">
                      K1
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Klient 1</h4>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-gold-primary text-gold-primary" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic mb-4 leading-relaxed">
                    &ldquo;[Testimonial kommer här - beskriv din upplevelse med programmet och vilka resultat du fick]&rdquo;
                  </p>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-gold-primary font-semibold">
                      Resultat: [X kg på Y veckor]
                    </p>
                  </div>
                </div>

                {/* Testimonial 2 */}
                <div className="bg-white border-2 border-gold-primary/20 rounded-xl p-8 shadow-lg transition-all duration-300 hover:border-gold-primary hover:shadow-xl hover:-translate-y-2">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white font-bold text-xl">
                      K2
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Klient 2</h4>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-gold-primary text-gold-primary" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic mb-4 leading-relaxed">
                    &ldquo;[Testimonial kommer här - beskriv din upplevelse med programmet och vilka resultat du fick]&rdquo;
                  </p>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-gold-primary font-semibold">
                      Resultat: [X kg på Y veckor]
                    </p>
                  </div>
                </div>

                {/* Testimonial 3 */}
                <div className="bg-white border-2 border-gold-primary/20 rounded-xl p-8 shadow-lg transition-all duration-300 hover:border-gold-primary hover:shadow-xl hover:-translate-y-2 md:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white font-bold text-xl">
                      K3
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Klient 3</h4>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-gold-primary text-gold-primary" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic mb-4 leading-relaxed">
                    &ldquo;[Testimonial kommer här - beskriv din upplevelse med programmet och vilka resultat du fick]&rdquo;
                  </p>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-gold-primary font-semibold">
                      Resultat: [X kg på Y veckor]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PASSAR FÖR DIG / PASSAR INTE - Keep existing */}
        <section className="py-20 lg:py-32 bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto animate-fadeIn">
              {/* Section Title */}
              <div className="text-center mb-12">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 animate-shimmer" />
                <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[4px] leading-[1.3] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                  Är du redo för<br />90 dagar som<br />förändrar allt?
                </h2>
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 animate-shimmer" />
              </div>

              {/* Two-column grid */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Left column - Passar för dig */}
                <div className="bg-white border-2 border-green-200 rounded-xl p-8 shadow-md transition-all duration-300 hover:border-green-400 hover:shadow-lg hover:-translate-y-1">
                  <h3 className="text-2xl font-bold text-green-600 mb-6 tracking-[2px] uppercase font-['Orbitron',sans-serif] text-center md:text-left">
                    Passar för dig
                  </h3>
                  <ul className="space-y-4 text-left">
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                      <span>Du som vill gå ner i vikt under 90 dagar med beprövade metoder</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                      <span>Du som är redo att följa en strukturerad plan och lyssna på professionell coachning</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                      <span>Du som vill ha personlig coaching och stöd genom hela resan med en dedikerad coach</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                      <span>Du kan träna 4 gånger i veckan på gym</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                      <span>Du som vill lära dig hållbara vanor för livet</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                      <span>Du som är motiverad att checka in varje vecka och följa upp din progress systematiskt</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                      <span>Du som vill ha tillgång till träningsprogram, kostschemat, verktyg och kunskap i en och samma plattform</span>
                    </li>
                  </ul>
                </div>

                {/* Right column - Passar INTE */}
                <div className="bg-white border-2 border-red-200 rounded-xl p-8 shadow-md transition-all duration-300 hover:border-red-400 hover:shadow-lg hover:-translate-y-1">
                  <h3 className="text-2xl font-bold text-red-600 mb-6 tracking-[2px] uppercase font-['Orbitron',sans-serif] text-center md:text-left">
                    Passar INTE
                  </h3>
                  <ul className="space-y-4 text-left">
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-red-600 text-xl flex-shrink-0">✗</span>
                      <span>Du som inte är redo att göra livsstilsförändringar och följa ett strukturerat upplägg</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-red-600 text-xl flex-shrink-0">✗</span>
                      <span>Du som inte är villig att investera tid, energi och pengar i din hälsotransformation</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-red-600 text-xl flex-shrink-0">✗</span>
                      <span>Du som söker extrema dieter eller andra ohållbara metoder för snabba resultat</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-red-600 text-xl flex-shrink-0">✗</span>
                      <span>De som &ldquo;vet bäst själv&rdquo;</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="mb-12">
                <div className="text-center mb-8">
                  <p className="text-white text-xl md:text-2xl tracking-[2px] uppercase font-['Orbitron',sans-serif] font-semibold">
                    Ansökningarna stänger om:
                  </p>
                </div>
                <CountdownTimer />
              </div>

              {/* CTA Button */}
              <div className="space-y-6 text-center">
                <button
                  onClick={() => router.push('/apply')}
                  className="w-full max-w-md mx-auto block py-5 px-10 text-lg md:text-xl tracking-[3px] uppercase font-bold bg-gradient-to-br from-gold-primary to-gold-secondary text-white border-none rounded-lg cursor-pointer transition-all duration-300 font-['Orbitron',sans-serif] relative overflow-hidden hover:scale-105 hover:shadow-xl hover:shadow-gold-primary/40 active:scale-[0.98] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.3)] before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]"
                >
                  Ansök Nu
                </button>

                {/* Limited spots message */}
                <p className="text-lg md:text-xl text-gold-primary tracking-[2px] uppercase font-semibold animate-pulse">
                  ⚠️ Begränsat antal platser
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION - Keep existing */}
        <section className="py-20 lg:py-32 bg-gray-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto animate-fadeIn">
              {/* Section Title */}
              <div className="text-center mb-12">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 animate-shimmer" />
                <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[4px] leading-[1.2] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                  Vanliga Frågor
                </h2>
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 animate-shimmer" />
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem
                  value="item-1"
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-bold text-gold-primary tracking-[1px] font-['Orbitron',sans-serif]">
                      Vad är 90-Dagars Challenge?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-700 leading-relaxed">
                    90-Dagars Challenge är ett strukturerat coaching-program där du får personlig vägledning för att gå ner 5-15 kg på 90 dagar. Du får tillgång till träningsprogram, kostplaner, recept och veckovisa check-ins med din coach.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-2"
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-bold text-gold-primary tracking-[1px] font-['Orbitron',sans-serif]">
                      Vad ingår i programmet?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-700 leading-relaxed">
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Personlig coach som följer din progress</li>
                      <li>Skräddarsydda träningsprogram</li>
                      <li>Individuella kostplaner och makroberäkningar</li>
                      <li>Recept och måltidsförslag</li>
                      <li>Veckovisa check-ins och uppföljning</li>
                      <li>90-dagars roadmap med artiklar och guider</li>
                      <li>Tillgång till digitala verktyg och kalkylatorer</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-3"
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-bold text-gold-primary tracking-[1px] font-['Orbitron',sans-serif]">
                      Behöver jag tillgång till ett gym?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-700 leading-relaxed">
                    Nej, träningsprogrammen kan anpassas efter dina förutsättningar. Vi kan skapa program för hemmaträning, utomhusträning eller gymträning - beroende på vad som passar dig bäst.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-4"
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-bold text-gold-primary tracking-[1px] font-['Orbitron',sans-serif]">
                      Hur mycket vikt kan jag förvänta mig att gå ner?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-700 leading-relaxed">
                    De flesta deltagare går ner mellan 5-15 kg under programmet, beroende på utgångsläge och hur väl man följer planen. Målet är en hållbar viktminskning på cirka 0,5-1 kg per vecka, vilket är vetenskapligt beprövat och säkert.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-5"
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-bold text-gold-primary tracking-[1px] font-['Orbitron',sans-serif]">
                      Vad händer om jag inte kan följa planen exakt?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-700 leading-relaxed">
                    Din coach finns där för att hjälpa dig anpassa planen efter din livssituation. Livet händer, och det viktiga är att du kommunicerar med din coach så kan ni tillsammans hitta lösningar som fungerar för dig.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-6"
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-bold text-gold-primary tracking-[1px] font-['Orbitron',sans-serif]">
                      Hur mycket kostar programmet?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-700 leading-relaxed">
                    Prissättningen diskuteras individuellt när din ansökan är godkänd. Vi vill först säkerställa att programmet passar dig och dina mål innan vi går in på detaljer om investering.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-7"
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-bold text-gold-primary tracking-[1px] font-['Orbitron',sans-serif]">
                      Vad skiljer detta från andra program?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-700 leading-relaxed">
                    Till skillnad från generiska online-program får du personlig coaching och individuell anpassning. Din coach följer din progress varje vecka och justerar planen efter dina resultat. Du är inte ensam - du har en dedikerad coach som håller dig ansvarig och motiverad hela vägen.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 border-t border-gray-800 bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mb-6 opacity-30" />
              <p className="text-sm text-gray-500 tracking-[1px]">
                Vi behandlar dina uppgifter konfidentiellt
              </p>
              <p className="text-xs text-gray-600 mt-4">
                © {new Date().getFullYear()} Friskvårdskompassen. Alla rättigheter förbehållna.
              </p>
            </div>
          </div>
        </footer>
      </div>

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

        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }

        @keyframes shimmer {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.3;
          }
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        @keyframes titleGlow {
          0%,
          100% {
            filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
          }
        }

        .animate-titleGlow {
          animation: titleGlow 2s ease-in-out infinite;
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 32px;
            letter-spacing: 3px;
          }
        }
      `}</style>
    </div>
  )
}
