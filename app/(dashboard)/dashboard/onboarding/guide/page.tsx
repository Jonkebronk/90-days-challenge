'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MDXPreview } from '@/components/mdx-preview'

// Fallback content if database is empty
const FALLBACK_CONTENT = `# Välkommen till 90-Dagars Challenge!

Grattis till att du har tagit steget mot en hälsosammare livsstil! Detta är början på din transformation.

## Vad du behöver göra innan uppstart

### 1. Fyll i din profil
Gå till **Min Profil** och fyll i all information:
- Personuppgifter (ålder, längd, vikt)
- Träningsmål och erfarenhet
- Kostpreferenser och allergier
- Livsstilsfaktorer (stress, sömn, aktivitetsnivå)

Denna information hjälper mig som coach att skräddarsy ditt program perfekt för dig.

### 2. Ta dina startbilder
Under **Check-in** ska du ladda upp formbilder:
- **Framsida**: Stå rakt framifrån
- **Baksida**: Vänd ryggen mot kameran
- **Sida**: Stå i profil

**Tips för bra bilder:**
- Bra belysning (dagsljus är bäst)
- Neutral bakgrund
- Samma kläder vid varje tillfälle
- Samma tid på dagen (helst på morgonen)

Dessa bilder är för dig och din coach - de kommer visa din fantastiska utveckling!

### 3. Bekanta dig med ditt program
- **Kostschema**: Gå igenom din måltidsplan och planera din första vecka
- **Träningsprogram**: Läs igenom ditt träningsprogram och förstå upplägget
- **Kunskapsbanken**: Börja läsa artiklar om träning och nutrition

### 4. Planera din första vecka
**Mat:**
- Handla ingredienser för veckan
- Förbered måltider i förväg om möjligt
- Ha snacks tillgängliga

**Träning:**
- Boka in dina träningspass i kalendern
- Packa din gymväska kvällen innan
- Planera rutter för återhämtningspromenader

## Under programmet

### Veckocheckar
Varje vecka gör du en check-in där du:
- Väger dig dagligen måndag-söndag
- Tar nya formbilder
- Svarar på frågor om din vecka
- Kommunicerar med din coach

Detta hjälper oss att justera programmet efter dina behov.

### Kommunikation
- **Meddelanden**: Kontakta din coach när som helst
- **Snabb respons**: Jag svarar oftast inom 24 timmar
- **Ställ frågor**: Inga dumma frågor - jag är här för dig!

### Konsistens är nyckeln
- Följ programmet så gott du kan
- En dålig dag förstör inte resultaten
- Kommunicera om något känns fel
- Ha tålamod - förändringar tar tid!

## Tips för framgång

**🎯 Sätt realistiska mål**
- Fokusera på processen, inte bara resultatet
- Fira små framsteg längs vägen
- Jämför dig med dig själv, inte andra

**📱 Använd plattformen dagligen**
- Kolla ditt kostschema
- Logga dina träningspass
- Läs artiklar för att lära dig mer
- Håll kontakten med din coach

**💪 Ta hand om dig**
- Sov 7-9 timmar per natt
- Hantera stress (meditation, promenader)
- Drick tillräckligt med vatten (2-3 liter/dag)
- Lyssna på din kropp

**🤝 Var ärlig**
- Om något inte fungerar - säg till!
- Om du behöver stöd - hör av dig!
- Om du har en dålig vecka - vi löser det tillsammans!

## Vanliga frågor

**Vad händer om jag missar ett träningspass?**
Inget stress! Livet händer. Fortsätt med nästa planerade pass. En missad träning här och där påverkar inte dina resultat på lång sikt.

**Vad gör jag om jag blir sjuk?**
Vila och återhämta dig. Kontakta din coach så justerar vi programmet. Din hälsa kommer alltid först!

**Kan jag äta ute?**
Absolut! Använd ditt omdöme - välj proteinrika rätter med grönsaker. En social måltid per vecka påverkar inte dina resultat.

**Hur snabbt kommer jag se resultat?**
De flesta ser förändringar inom 2-4 veckor. Men kom ihåg: detta är en 90-dagars resa. Tålamod ger resultat!

---

**Är du redo?** Då kör vi! Din transformation börjar nu. 🚀

**Frågor?** Kontakta din coach via [Meddelanden](/dashboard/messages)!
`

export default function OnboardingGuidePage() {
  const router = useRouter()
  const [guideData, setGuideData] = useState({
    title: 'Kom Igång Guide',
    content: FALLBACK_CONTENT
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuideContent()
  }, [])

  const fetchGuideContent = async () => {
    try {
      const response = await fetch('/api/guide-content?type=onboarding')
      if (response.ok) {
        const data = await response.json()
        setGuideData({
          title: data.guide.title,
          content: data.guide.content
        })
      }
    } catch (error) {
      console.error('Error fetching guide content:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgba(255,255,255,0.8)]">Laddar guide...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-[rgba(255,255,255,0.8)] hover:text-[#FFD700]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <div className="flex items-center justify-center gap-3 mb-4">
            <Info className="w-8 h-8 text-[#FFD700]" />
            <h1 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              {guideData.title}
            </h1>
          </div>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Allt du behöver veta för att komma igång
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Content Card */}
        <div className="bg-[rgba(10,10,10,0.6)] border-2 border-[rgba(255,215,0,0.3)] rounded-xl p-8 backdrop-blur-[10px]">
          <div className="prose prose-invert prose-lg max-w-none prose-headings:text-[#FFD700] prose-headings:font-bold prose-p:text-[rgba(255,255,255,0.8)] prose-strong:text-[#FFD700] prose-li:text-[rgba(255,255,255,0.8)] prose-a:text-[#3b82f6] prose-a:no-underline hover:prose-a:underline">
            <MDXPreview content={guideData.content} />
          </div>
        </div>

        {/* Bottom Action */}
        <div className="text-center pt-6">
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold px-8 py-6 text-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all"
          >
            Till Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
