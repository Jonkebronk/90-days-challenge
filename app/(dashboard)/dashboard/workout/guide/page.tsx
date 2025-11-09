'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MDXPreview } from '@/components/mdx-preview'

// Default guide content - this can later be made editable by coach via CMS
const GUIDE_CONTENT = `# Välkommen till ditt Träningsprogram

Ditt personliga träningsprogram är utformat för att maximera dina resultat baserat på dina mål och erfarenhetsnivå.

## Min träningsfilosofi

**Smartare, inte hårdare.** Träning handlar inte om att vara på gymmet längst tid - det handlar om att träna rätt, återhämta sig och vara konsekvent.

### 💪 Fokus på progression
- Öka vikterna gradvis över tid
- Följ programmet exakt som det står
- Dokumentera varje pass för att se din utveckling

### 🎯 Form framför ego
**Teknik är ALLT.** En övning utförd med perfekt form och lägre vikt ger bättre resultat än tung vikt med dålig form.

- Se instruktionsvideon för varje övning
- Filma dig själv ibland för att kontrollera formen
- Fråga om hjälp om du är osäker

## Hur du följer programmet

### 📅 Struktur
Ditt program är uppdelat i:
- **Träningsdagar**: Specifika övningar med sets, reps och vikter
- **Vilodag ar**: Lika viktiga som träningsdagarna!
- **Progression**: Programmet ändras över tid för kontinuerlig utveckling

### ⏱️ Under passet

1. **Uppvärmning (5-10 min)**
   - Lätt cardio eller dynamisk stretching
   - Aktivera musklerna du ska träna

2. **Huvudträning**
   - Följ övningsordningen i programmet
   - Vila den angivna tiden mellan set
   - Anteckna vikter och reps efter varje set

3. **Nedvarvning (5 min)**
   - Stretching av tränade muskler
   - Hjälper återhämtningen

### 📊 Logga dina pass
**Detta är KRITISKT för framgång!**
- Anteckna vikt och reps för varje övning
- Se din progression över tid
- Hjälper mig som coach att justera programmet

## Vanliga frågor

**Vad gör jag om jag missar ett pass?**
Fortsätt där programmet är nästa träningsdag. Försök inte "ta igen" genom att träna två pass samma dag.

**Kan jag byta en övning?**
Undvik att byta om möjligt - varje övning är vald av en anledning. Kontakta mig om du har skador eller begränsningar.

**Ska jag träna om jag är öm?**
Ja, lätt muskelömhet är okej att träna igenom. Om du är MYCKET öm eller har skarp smärta - vila extra en dag.

**Hur vet jag vilken vikt jag ska använda?**
Start a med en vikt där du kan göra alla reps med god form, men de sista 2-3 reps ska kännas utmanande. Justera nästa gång.

**Vad är RPE?**
Rate of Perceived Exertion - hur hårt det känns på en skala 1-10. RPE 8 = du kunde gjort 2 reps till max.

## Tips för bästa resultat

### 🔥 Konsistens över intensitet
Bättre att träna 3-4 gånger/vecka hela året än 6 gånger/vecka i 2 månader och sen sluta.

### 💤 Återhämtning är träning
- Sov 7-9 timmar per natt
- Ät tillräckligt (följ ditt kostschema!)
- Ta vilodagar på allvar
- Hantera stress

### 📈 Progression är nyckeln
**Progressiv överbelastning** är det enda sättet att bygga muskler och styrka:
- Öka vikt när du kan göra fler reps än angivet
- Försök slå dina egna rekord varje vecka
- Små steg framåt = stora resultat över tid

### 🎵 Ha kul!
Träning ska vara roligt! Sätt på bra musik, känn dig stark, njut av känslan när du lyfter vikter.

---

**Frågor om träningen?** Kontakta mig via [Meddelanden](/dashboard/messages)!

**Nu kör vi! 💪**
`

export default function WorkoutGuidePage() {
  const router = useRouter()

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
              Träningsprogram Guide
            </h1>
          </div>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Allt du behöver veta om ditt träningsprogram
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Content Card */}
        <div className="bg-[rgba(10,10,10,0.6)] border-2 border-[rgba(255,215,0,0.3)] rounded-xl p-8 backdrop-blur-[10px]">
          <div className="prose prose-invert prose-lg max-w-none prose-headings:text-[#FFD700] prose-headings:font-bold prose-p:text-[rgba(255,255,255,0.8)] prose-strong:text-[#FFD700] prose-li:text-[rgba(255,255,255,0.8)] prose-a:text-[#3b82f6] prose-a:no-underline hover:prose-a:underline">
            <MDXPreview content={GUIDE_CONTENT} />
          </div>
        </div>

        {/* Bottom Action */}
        <div className="text-center pt-6">
          <Button
            onClick={() => router.push('/dashboard/workout')}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold px-8 py-6 text-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all"
          >
            Till Mitt Träningsprogram
          </Button>
        </div>
      </div>
    </div>
  )
}
