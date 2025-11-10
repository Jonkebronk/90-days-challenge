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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a]" />

      {/* Animated particles */}
      <div className="particles absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="particle absolute w-[2px] h-[2px] bg-[rgba(255,215,0,0.3)] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      {/* Header Navigation */}
      <header className="relative z-50 bg-[rgba(10,10,10,0.8)] backdrop-blur-lg border-b border-[rgba(255,215,0,0.2)]">
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
                  className="text-[rgba(255,255,255,0.7)] hover:text-[#FFD700] transition-colors text-sm font-medium tracking-[1px] uppercase"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Login Buttons + Invite Code */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <button className="p-2.5 text-xs font-semibold bg-gradient-to-r from-[rgba(255,215,0,0.15)] to-[rgba(255,215,0,0.05)] border-2 border-[rgba(255,215,0,0.4)] text-[#FFD700] rounded-lg backdrop-blur-[10px] transition-all duration-300 hover:scale-105 hover:border-[rgba(255,215,0,0.7)] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                    <Key className="w-4 h-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
                  <DialogHeader>
                    <DialogTitle className="font-['Orbitron',sans-serif] text-xl font-bold tracking-[2px] uppercase bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent text-center">
                      Har du en inbjudningskod?
                    </DialogTitle>
                    <DialogDescription className="text-[rgba(255,255,255,0.7)] text-sm text-center">
                      Om du har fått en exklusiv GOLD-kod av din coach, ange den här för att komma igång direkt
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
                      className="w-full px-4 py-3 bg-[rgba(0,0,0,0.5)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg text-[#FFD700] placeholder:text-[rgba(255,215,0,0.3)] text-center font-mono text-sm tracking-[2px] uppercase focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all disabled:opacity-50"
                      maxLength={19}
                    />
                    <button
                      onClick={handleVerifyInviteCode}
                      disabled={isVerifying || !inviteCode}
                      className="w-full px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] rounded-lg font-bold tracking-[1px] uppercase text-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                          <span>Verifierar...</span>
                        </>
                      ) : (
                        <>
                          <span>Aktivera</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <p className="text-[rgba(255,215,0,0.6)] text-xs text-center tracking-[1px]">
                      💎 Exklusivt för godkända klienter
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              <Link
                href="/login"
                className="px-4 py-2.5 text-xs font-semibold tracking-[1px] uppercase bg-gradient-to-r from-[rgba(255,215,0,0.15)] to-[rgba(255,215,0,0.05)] border-2 border-[rgba(255,215,0,0.4)] text-[#FFD700] rounded-lg backdrop-blur-[10px] transition-all duration-300 hover:scale-105 hover:border-[rgba(255,215,0,0.7)] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
              >
                Klient Login
              </Link>
              <Link
                href="/login"
                className="px-4 py-2.5 text-xs font-semibold tracking-[1px] uppercase bg-gradient-to-r from-[rgba(255,215,0,0.15)] to-[rgba(255,215,0,0.05)] border-2 border-[rgba(255,215,0,0.4)] text-[#FFD700] rounded-lg backdrop-blur-[10px] transition-all duration-300 hover:scale-105 hover:border-[rgba(255,215,0,0.7)] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
              >
                Coach Login
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#FFD700] hover:text-[#FFA500] transition-colors"
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
          <div className="md:hidden border-t border-[rgba(255,215,0,0.2)] bg-[rgba(10,10,10,0.95)] backdrop-blur-lg">
            <nav className="container mx-auto px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-[rgba(255,255,255,0.7)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)] rounded-lg transition-all text-sm font-medium tracking-[1px] uppercase"
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={() => {
                  setInviteDialogOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold tracking-[1px] uppercase bg-gradient-to-r from-[rgba(255,215,0,0.15)] to-[rgba(255,215,0,0.05)] border-2 border-[rgba(255,215,0,0.4)] text-[#FFD700] rounded-lg"
              >
                <Key className="w-4 h-4" />
                <span>Inbjudningskod</span>
              </button>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-center text-xs font-semibold tracking-[1px] uppercase bg-gradient-to-r from-[rgba(255,215,0,0.15)] to-[rgba(255,215,0,0.05)] border-2 border-[rgba(255,215,0,0.4)] text-[#FFD700] rounded-lg"
                >
                  Klient Login
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-center text-xs font-semibold tracking-[1px] uppercase bg-gradient-to-r from-[rgba(255,215,0,0.15)] to-[rgba(255,215,0,0.05)] border-2 border-[rgba(255,215,0,0.4)] text-[#FFD700] rounded-lg"
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
            90-DAGARS
            <br />
            CHALLENGE
          </h1>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-5 animate-shimmer" />
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
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(34,197,94,0.3)] rounded-xl p-6 backdrop-blur-[10px] transition-all duration-300 hover:border-[rgba(34,197,94,0.6)] hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:-translate-y-1">
              <h3 className="text-xl font-bold text-[#22c55e] mb-4 tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                Passar för dig
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som vill gå ner 5-15 kg på 90 dagar med beprövade metoder</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som är redo att följa en strukturerad plan och lyssna på coaching</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som vill ha personlig coaching och stöd genom hela resan</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som är villig att investera i din hälsa och transformation</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som vill lära dig hållbara vanor för livet, inte bara en quick fix</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som är motiverad att checka in varje vecka och följa upp din progress</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som vill ha tillgång till träningsprogram, recept och kostplaner</span>
                </li>
              </ul>
            </div>

            {/* Right column - Passar INTE */}
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(239,68,68,0.3)] rounded-xl p-6 backdrop-blur-[10px] transition-all duration-300 hover:border-[rgba(239,68,68,0.6)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:-translate-y-1">
              <h3 className="text-xl font-bold text-[#ef4444] mb-4 tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                Passar INTE
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som letar efter en &ldquo;magisk piller&rdquo; utan att lägga in arbetet</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som inte är redo att göra förändringar i din livsstil</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som inte kan följa en plan och vill &ldquo;göra på ditt sätt&rdquo;</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som inte är villig att investera tid och pengar i din hälsa</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som söker extrema crash-dieter eller ohållbara metoder</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som har allvarliga medicinska tillstånd utan läkarkonsultation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <p className="text-[rgba(255,255,255,0.8)] text-lg md:text-xl tracking-[2px] uppercase font-['Orbitron',sans-serif] font-semibold">
                Ansökningarna stänger om:
              </p>
            </div>
            <CountdownTimer />
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/apply')}
              className="w-full py-5 px-10 text-lg tracking-[3px] uppercase font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] border-none rounded-lg cursor-pointer transition-all duration-300 font-['Orbitron',sans-serif] relative overflow-hidden hover:scale-105 hover:shadow-[0_10px_40px_rgba(255,215,0,0.4)] active:scale-[0.98] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.3)] before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]"
            >
              Ansök Nu
            </button>

            {/* Limited spots message */}
            <p className="text-base md:text-lg text-[#FFD700] tracking-[2px] uppercase font-semibold animate-pulse">
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
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                <span className="text-lg font-bold text-[#FFD700] tracking-[1px] font-['Orbitron',sans-serif]">
                  Vad är 90-Dagars Challenge?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-[rgba(255,255,255,0.8)] leading-relaxed">
                90-Dagars Challenge är ett strukturerat coaching-program där du får personlig vägledning för att gå ner 5-15 kg på 90 dagar. Du får tillgång till träningsprogram, kostplaner, recept och veckovisa check-ins med din coach.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-2"
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                <span className="text-lg font-bold text-[#FFD700] tracking-[1px] font-['Orbitron',sans-serif]">
                  Vad ingår i programmet?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-[rgba(255,255,255,0.8)] leading-relaxed">
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
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                <span className="text-lg font-bold text-[#FFD700] tracking-[1px] font-['Orbitron',sans-serif]">
                  Behöver jag tillgång till ett gym?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-[rgba(255,255,255,0.8)] leading-relaxed">
                Nej, träningsprogrammen kan anpassas efter dina förutsättningar. Vi kan skapa program för hemmaträning, utomhusträning eller gymträning - beroende på vad som passar dig bäst.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-4"
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                <span className="text-lg font-bold text-[#FFD700] tracking-[1px] font-['Orbitron',sans-serif]">
                  Hur mycket vikt kan jag förvänta mig att gå ner?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-[rgba(255,255,255,0.8)] leading-relaxed">
                De flesta deltagare går ner mellan 5-15 kg under programmet, beroende på utgångsläge och hur väl man följer planen. Målet är en hållbar viktminskning på cirka 0,5-1 kg per vecka, vilket är vetenskapligt beprövat och säkert.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-5"
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                <span className="text-lg font-bold text-[#FFD700] tracking-[1px] font-['Orbitron',sans-serif]">
                  Vad händer om jag inte kan följa planen exakt?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-[rgba(255,255,255,0.8)] leading-relaxed">
                Din coach finns där för att hjälpa dig anpassa planen efter din livssituation. Livet händer, och det viktiga är att du kommunicerar med din coach så kan ni tillsammans hitta lösningar som fungerar för dig.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-6"
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                <span className="text-lg font-bold text-[#FFD700] tracking-[1px] font-['Orbitron',sans-serif]">
                  Hur mycket kostar programmet?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-[rgba(255,255,255,0.8)] leading-relaxed">
                Prissättningen diskuteras individuellt när din ansökan är godkänd. Vi vill först säkerställa att programmet passar dig och dina mål innan vi går in på detaljer om investering.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-7"
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                <span className="text-lg font-bold text-[#FFD700] tracking-[1px] font-['Orbitron',sans-serif]">
                  Vad skiljer detta från andra program?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-[rgba(255,255,255,0.8)] leading-relaxed">
                Till skillnad från generiska online-program får du personlig coaching och individuell anpassning. Din coach följer din progress varje vecka och justerar planen efter dina resultat. Du är inte ensam - du har en dedikerad coach som håller dig ansvarig och motiverad hela vägen.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-[30px] border-t border-[rgba(255,215,0,0.2)]">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent my-[15px] opacity-30" />
          <p className="text-xs text-[rgba(255,215,0,0.6)] tracking-[1px]">
            Vi behandlar dina uppgifter konfidentiellt
          </p>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0;
          }
        }

        .particle {
          animation: float 15s infinite ease-in-out;
        }

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
