'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Award, Heart, Target, Users, ArrowLeft, CheckCircle2, Trophy, Dumbbell } from 'lucide-react'

export default function AboutMePage() {
  const [imageError, setImageError] = useState(false)

  const certifications = [
    { icon: Award, title: 'Personlig Tränare', org: 'Svensk Fitness' },
    { icon: Dumbbell, title: 'Styrketräningsinstruktör', org: 'SATS Education' },
    { icon: Trophy, title: 'Kostrådgivare', org: 'Yrkeshögskola' },
    { icon: Target, title: 'Motivational Coaching', org: 'ICF Certified' },
  ]

  const philosophyPoints = [
    { icon: Heart, title: 'Hållbara Vanor', description: 'Fokus på långsiktiga förändringar som håller livet ut, inte snabba fixar.' },
    { icon: Target, title: 'Individuell Approach', description: 'Ingen är den andra lik. Din plan anpassas efter dina förutsättningar och mål.' },
    { icon: Users, title: 'Kontinuerligt Stöd', description: 'Jag finns med dig hela vägen. Varje vecka, varje steg, varje utmaning.' },
    { icon: CheckCircle2, title: 'Balans & Hälsa', description: 'Träning och kost ska berika ditt liv, inte ta över det.' },
  ]

  const testimonials = [
    {
      name: 'Anna S.',
      age: 34,
      result: '-12 kg på 90 dagar',
      quote: 'Johnny hjälpte mig inte bara gå ner i vikt, utan hitta en ny livsstil jag faktiskt älskar. Hans stöd och uppmuntran har varit ovärderligt.',
      image: '/placeholder-testimonial-1.jpg'
    },
    {
      name: 'Marcus L.',
      age: 41,
      result: '-15 kg på 90 dagar',
      quote: 'Efter år av yoyo-diet hittade jag äntligen en metod som fungerar. Johnnys kunskap om både träning och näring är imponerande.',
      image: '/placeholder-testimonial-2.jpg'
    },
    {
      name: 'Sofia M.',
      age: 28,
      result: '-8 kg på 90 dagar',
      quote: 'Vad jag uppskattar mest är att Johnny förstår att livet händer. Hans flexibla approach gjorde att jag kunde hålla mina mål även under stressiga perioder.',
      image: '/placeholder-testimonial-3.jpg'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />

      {/* Back button */}
      <div className="relative z-10 container mx-auto px-4 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-gold-light transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tillbaka</span>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-[rgba(255,215,0,0.15)] to-[rgba(255,215,0,0.05)] border border-gold-primary/30 rounded-lg">
                <p className="text-gold-light text-sm font-semibold tracking-[2px] uppercase">Din Coach</p>
              </div>

              <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-6xl font-black tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                Johnny Strand
              </h1>

              <p className="text-xl md:text-2xl text-gray-100 font-light leading-relaxed">
                Personlig Tränare & Nutritionscoach
              </p>

              <div className="h-[2px] bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-transparent w-32" />

              <p className="text-gray-300 text-lg leading-relaxed">
                Med över 10 års erfarenhet av att hjälpa människor nå sina hälsomål,
                brinner jag för att skapa hållbara förändringar som håller livet ut.
              </p>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden border-4 border-gold-primary/30 shadow-[0_0_60px_rgba(255,215,0,0.2)] relative">
                {!imageError ? (
                  <Image
                    src="/images/johnny-profile.jpg"
                    alt="Johnny Strand - Personlig Tränare"
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[rgba(255,215,0,0.1)] to-[rgba(255,215,0,0.05)] flex items-center justify-center">
                    <div className="text-center">
                      <Users className="w-32 h-32 text-gold-light mx-auto mb-4 opacity-50" />
                      <p className="text-gray-500 text-sm">Profilbild kommer snart</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Decorative glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold-light to-orange-500 opacity-20 blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Personal Story Section */}
      <div className="relative z-10 py-16 md:py-24 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6" />
              <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                Min Resa
              </h2>
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6" />
            </div>

            <div className="space-y-6 text-gray-200 text-lg leading-relaxed">
              <p>
                Min resa inom träning och hälsa började för över 15 år sedan. Som många andra kämpade jag
                själv med vikten och försökte alla möjliga &quot;mirakelmetoder&quot; utan långsiktig framgång. Det var
                frustrationen över dessa misslyckanden som väckte min passion för att verkligen förstå hur kroppen
                fungerar och vad som krävs för hållbar förändring.
              </p>

              <p>
                Efter att ha utbildat mig till personlig tränare och kostrådgivare insåg jag att det inte handlar
                om extrema dieter eller galna träningspass. Det handlar om att hitta en balans som fungerar för
                <em className="text-gold-light"> just dig</em>, i <em className="text-gold-light">ditt liv</em>,
                med <em className="text-gold-light">dina förutsättningar</em>.
              </p>

              <p>
                Idag, efter att ha hjälpt hundratals klienter nå sina mål, vet jag att det är möjligt för
                <strong className="text-gold-light"> alla</strong> att göra en varaktig förändring. Allt som krävs
                är rätt vägledning, ett smart system och någon som tror på dig när det blir tufft.
              </p>

              <div className="bg-gradient-to-r from-[rgba(255,215,0,0.1)] to-transparent border-l-4 border-gold-light p-6 rounded-r-lg mt-8">
                <p className="text-gold-light font-semibold italic">
                  &quot;Det är inte bara viktminskning – det är en livsförändring. Och jag är här för att guida dig
                  genom varje steg.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certifications Section */}
      <div className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6" />
              <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                Kvalifikationer & Meriter
              </h2>
              <p className="text-gray-400 mt-4 text-lg">
                Utbildning och erfarenhet för att ge dig bästa möjliga vägledning
              </p>
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.5)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all duration-300 group"
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <cert.icon className="w-8 h-8 text-[#0a0a0a]" />
                  </div>
                  <h3 className="font-bold text-gray-100 text-lg mb-2">
                    {cert.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {cert.org}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-white/5 border-2 border-gold-primary/20 rounded-xl p-8 backdrop-blur-[10px]">
              <h3 className="font-bold text-gold-light text-xl mb-4 text-center">
                Ytterligare Kompetenser
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-gray-300">
                <div className="text-center">
                  <p className="font-semibold text-white mb-2">10+ års erfarenhet</p>
                  <p className="text-sm">Personlig träning & coaching</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white mb-2">500+ klienter</p>
                  <p className="text-sm">Framgångsrikt guidade till sina mål</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white mb-2">Kontinuerlig utbildning</p>
                  <p className="text-sm">Senaste forskning inom träning & nutrition</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="relative z-10 py-16 md:py-24 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6" />
              <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                Min Träningsfilosofi
              </h2>
              <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
                Fyra grundpelare som styr mitt arbete och garanterar dina resultat
              </p>
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {philosophyPoints.map((point, index) => (
                <div
                  key={index}
                  className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-8 backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center flex-shrink-0">
                      <point.icon className="w-7 h-7 text-[#0a0a0a]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-100 text-xl mb-3">
                        {point.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {point.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="inline-block bg-gradient-to-r from-[rgba(255,215,0,0.1)] to-transparent border-l-4 border-gold-light p-8 rounded-r-xl text-left max-w-3xl">
                <p className="text-gray-200 text-lg leading-relaxed">
                  <strong className="text-gold-light">Mitt löfte till dig:</strong> Jag kommer inte lova dig snabba
                  fixar eller omöjliga resultat. Men jag lovar att ge dig kunskap, struktur och stöd för att
                  bygga vanor som förändrar ditt liv – för alltid. Din framgång är mitt mål.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6" />
              <h2 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
                Framgångshistorier
              </h2>
              <p className="text-gray-400 mt-4 text-lg">
                Några av de fantastiska människor jag haft förmånen att coacha
              </p>
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6" />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white/5 border-2 border-gold-primary/20 rounded-xl overflow-hidden backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all duration-300"
                >
                  {/* Result Badge */}
                  <div className="bg-gradient-to-r from-gold-light to-orange-500 p-4 text-center">
                    <p className="font-bold text-[#0a0a0a] text-lg">
                      {testimonial.result}
                    </p>
                  </div>

                  <div className="p-6">
                    {/* Quote */}
                    <div className="mb-6">
                      <div className="text-gold-light text-4xl mb-2">&quot;</div>
                      <p className="text-gray-200 leading-relaxed italic">
                        {testimonial.quote}
                      </p>
                      <div className="text-gold-light text-4xl text-right -mt-2">&quot;</div>
                    </div>

                    {/* Client Info */}
                    <div className="border-t border-gold-primary/20 pt-4">
                      <p className="font-bold text-white">
                        {testimonial.name}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {testimonial.age} år
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-300 text-lg mb-6">
                Redo att skriva din egen framgångshistoria?
              </p>
              <Link
                href="/apply"
                className="inline-block px-8 py-4 bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] rounded-lg font-bold tracking-[1px] uppercase transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,215,0,0.4)]"
              >
                Ansök till 90-Dagars Challenge
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 py-16 bg-gradient-to-r from-[rgba(255,215,0,0.05)] to-transparent border-t border-gold-primary/20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-['Orbitron',sans-serif] text-2xl md:text-3xl font-bold text-white mb-4">
            Har du frågor?
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Jag finns här för att hjälpa dig. Boka ett kostnadsfritt samtal eller skicka din ansökan så hör jag av mig.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="px-8 py-3 bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] rounded-lg font-bold tracking-[1px] uppercase transition-all duration-300 hover:scale-105"
            >
              Skicka Ansökan
            </Link>
            <Link
              href="/"
              className="px-8 py-3 bg-transparent border-2 border-[rgba(255,215,0,0.4)] text-gold-light rounded-lg font-bold tracking-[1px] uppercase transition-all duration-300 hover:border-[rgba(255,215,0,0.7)] hover:bg-gold-50"
            >
              Tillbaka till Start
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
