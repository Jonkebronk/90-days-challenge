'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CountdownTimer } from '@/components/countdown-timer'
import { Menu, X, Sparkles, ArrowRight, Key } from 'lucide-react'
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
    { name: 'Om mig', href: '/om-mig' },
    { name: 'Ansök', href: '/apply' },
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
            <Link href="/" className="flex flex-row items-center gap-2 lg:gap-4 group flex-shrink-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center">
                <Image
                  src="/images/compass-gold.png"
                  alt="Compass"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain transition-all group-hover:opacity-90 group-hover:scale-110"
                  priority
                />
              </div>
              <div className="hidden xl:flex items-center border-l-2 border-[rgba(255,215,0,0.3)] pl-4">
                <span className="font-['Orbitron',sans-serif] text-sm font-semibold tracking-[2px] uppercase bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent whitespace-nowrap">
                  DIN VÄGVISARE TILL BÄTTRE HÄLSA
                </span>
              </div>
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
                <DialogContent className="bg-white border border-gray-200 shadow-xl">
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
                className="px-4 py-2.5 text-xs font-semibold tracking-[1px] uppercase bg-gradient-to-r from-gold-primary to-gold-secondary border-2 border-gold-primary text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold-primary/30"
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
      <div className="relative z-10 text-center px-10 py-20 max-w-[600px] mx-auto animate-fadeIn">
        {/* Title */}
        <div id="start" className="mb-[50px] scroll-mt-24">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-5 animate-shimmer" />
          <h1 className="font-['Orbitron',sans-serif] text-5xl font-black tracking-[6px] leading-[1.2] uppercase animate-titleGlow bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            90 DAGARS
            <br />
            UTMANINGEN
          </h1>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-5 animate-shimmer" />
        </div>

        {/* Hur det fungerar Section */}
        <div id="hur-det-fungerar" className="mt-32 mb-32 animate-fadeIn scroll-mt-24">
          {/* Section Title */}
          <div className="mb-12">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 animate-shimmer" />
            <h2 className="font-['Orbitron',sans-serif] text-3xl font-black tracking-[4px] leading-[1.2] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Hur det fungerar
            </h2>
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 animate-shimmer" />
          </div>

          {/* Vertical stack layout */}
          <div className="flex flex-col gap-6 max-w-[700px] mx-auto">
            {/* Step 1 */}
            <div className="relative bg-white border border-gray-200 rounded-xl p-10 shadow-md transition-all duration-300 hover:border-gold-primary hover:shadow-lg hover:-translate-y-1 overflow-hidden">
              {/* Large background number */}
              <div className="absolute top-0 left-0 font-['Orbitron',sans-serif] text-[140px] font-black text-gray-100 leading-none select-none pointer-events-none">
                01
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="text-xl font-bold text-gray-900 mb-3 tracking-[2px] font-['Orbitron',sans-serif]">
                  Steg 1.
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-4 tracking-[1px] font-['Orbitron',sans-serif]">
                  Ansök och berätta om dina mål
                </h3>
                <p className="text-gray-700 text-base leading-relaxed">
                  Fyll i ett kort formulär där du delar dina ambitioner, var du är idag och vart du vill komma. Det tar 5 minuter och är första steget mot förändring.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white border border-gray-200 rounded-xl p-10 shadow-md transition-all duration-300 hover:border-gold-primary hover:shadow-lg hover:-translate-y-1 overflow-hidden">
              {/* Large background number */}
              <div className="absolute top-0 left-0 font-['Orbitron',sans-serif] text-[140px] font-black text-gray-100 leading-none select-none pointer-events-none">
                02
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="text-xl font-bold text-gray-900 mb-3 tracking-[2px] font-['Orbitron',sans-serif]">
                  Steg 2.
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-4 tracking-[1px] font-['Orbitron',sans-serif]">
                  Vi går igenom din plan tillsammans
                </h3>
                <p className="text-gray-700 text-base leading-relaxed">
                  Jag går igenom din ansökan och visar exakt hur vi ska nå dina mål. Du får full insyn i upplägget innan du bestämmer dig.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white border border-gray-200 rounded-xl p-10 shadow-md transition-all duration-300 hover:border-gold-primary hover:shadow-lg hover:-translate-y-1 overflow-hidden">
              {/* Large background number */}
              <div className="absolute top-0 left-0 font-['Orbitron',sans-serif] text-[140px] font-black text-gray-100 leading-none select-none pointer-events-none">
                03
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="text-xl font-bold text-gray-900 mb-3 tracking-[2px] font-['Orbitron',sans-serif]">
                  Steg 3.
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-4 tracking-[1px] font-['Orbitron',sans-serif]">
                  Säg ja till utmaningen
                </h3>
                <p className="text-gray-700 text-base leading-relaxed">
                  Om det känns rätt tar du steget och vi sätter igång. Ingen press, bara en möjlighet att äntligen få ordning på träning och kost.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vem passar programmet för? Section */}
        <div id="program" className="mt-12 animate-fadeIn scroll-mt-24">
          {/* Section Title */}
          <div className="mb-8">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 animate-shimmer" />
            <h2 className="font-['Orbitron',sans-serif] text-3xl font-black tracking-[4px] leading-[1.2] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Är du redo för<br />90 dagar som<br />förändrar allt?
            </h2>
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 animate-shimmer" />
          </div>

          {/* Two-column grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Left column - Passar för dig */}
            <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-md transition-all duration-300 hover:border-green-400 hover:shadow-lg hover:-translate-y-1">
              <h3 className="text-xl font-bold text-green-600 mb-4 tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                Passar för dig
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                  <span>Du som vill gå ner i vikt under 90 dagar med beprövade metoder</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                  <span>Du som är redo att följa en strukturerad plan och lyssna på professionell coachning</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                  <span>Du som vill ha personlig coaching och stöd genom hela resan med en dedikerad coach</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                  <span>Du kan träna 4 gånger i veckan på gym</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                  <span>Du som vill lära dig hållbara vanor för livet</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                  <span>Du som är motiverad att checka in varje vecka och följa upp din progress systematiskt</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                  <span>Du som vill ha tillgång till träningsprogram, kostschemat, verktyg och kunskap i en och samma plattform</span>
                </li>
              </ul>
            </div>

            {/* Right column - Passar INTE */}
            <div className="bg-white border-2 border-red-200 rounded-xl p-6 shadow-md transition-all duration-300 hover:border-red-400 hover:shadow-lg hover:-translate-y-1">
              <h3 className="text-xl font-bold text-red-600 mb-4 tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                Passar INTE
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-red-600 text-xl flex-shrink-0">✗</span>
                  <span>Du som inte är redo att göra livsstilsförändringar och följa ett strukturerat upplägg</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-red-600 text-xl flex-shrink-0">✗</span>
                  <span>Du som inte är villig att investera tid, energi och pengar i din hälsotransformation</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-red-600 text-xl flex-shrink-0">✗</span>
                  <span>Du som söker extrema dieter eller andra ohållbara metoder för snabba resultat</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-red-600 text-xl flex-shrink-0">✗</span>
                  <span>De som &ldquo;vet bäst själv&rdquo;</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <p className="text-gray-900 text-lg md:text-xl tracking-[2px] uppercase font-['Orbitron',sans-serif] font-semibold">
                Ansökningarna stänger om:
              </p>
            </div>
            <CountdownTimer />
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/apply')}
              className="w-full py-5 px-10 text-lg tracking-[3px] uppercase font-bold bg-gradient-to-br from-gold-primary to-gold-secondary text-white border-none rounded-lg cursor-pointer transition-all duration-300 font-['Orbitron',sans-serif] relative overflow-hidden hover:scale-105 hover:shadow-xl hover:shadow-gold-primary/40 active:scale-[0.98] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.3)] before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]"
            >
              Ansök Nu
            </button>

            {/* Limited spots message */}
            <p className="text-base md:text-lg text-gold-primary tracking-[2px] uppercase font-semibold animate-pulse">
              ⚠️ Begränsat antal platser
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 animate-fadeIn">
          {/* Section Title */}
          <div className="mb-8">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 animate-shimmer" />
            <h2 className="font-['Orbitron',sans-serif] text-3xl font-black tracking-[4px] leading-[1.2] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Vanliga Frågor
            </h2>
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 animate-shimmer" />
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

        {/* Footer */}
        <div className="mt-10 pt-[30px] border-t border-gray-200">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent my-[15px] opacity-30" />
          <p className="text-xs text-gray-500 tracking-[1px]">
            Vi behandlar dina uppgifter konfidentiellt
          </p>
        </div>
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

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-twinkle {
          animation: twinkle 2s infinite ease-in-out;
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
            font-size: 36px;
            letter-spacing: 4px;
          }
        }
      `}</style>
    </div>
  )
}
