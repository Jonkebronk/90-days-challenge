import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Default content for initial setup
const DEFAULT_MEAL_PLAN_CONTENT = `# Välkommen till ditt Kostschema

Din personliga måltidsplan är designad för att hjälpa dig nå dina mål på ett hållbart och effektivt sätt.

## Hur du använder ditt kostschema

### 📋 Översikt
Ditt kostschema visar exakt vad du ska äta varje dag, uppdelat i måltider med exakta mängder och makron (protein, kolhydrater, fett).

### 🔄 Anpassning
- **Byt måltider**: Om du inte gillar en maträtt kan du ofta byta mot ett alternativ med liknande makros
- **Justera portioner**: Följ de angivna grammängderna för bästa resultat
- **Timing**: Försök äta måltiderna vid ungefär samma tider varje dag

### 💡 Tips för framgång

**Planera i förväg**
- Handla för hela veckan på söndag
- Meal prep 2-3 dagar framåt
- Ha alltid snacks tillgängliga

**Följ planen**
- Väg din mat första veckorna tills du lär dig portionsstorlekar
- Logga allt du äter
- Var konsekvent - resultaten kommer!

**Lyssna på din kropp**
- Det är okej att känna dig lite hungrig mellan måltider
- Drick mycket vatten (2-3 liter per dag)
- Justera om något känns helt fel - kontakta din coach

## Vanliga frågor

**Vad händer om jag missar en måltid?**
Inget stress! Försök äta nästa måltid som planerat. Hoppa inte över fler måltider för att "kompensera".

**Kan jag byta ut ingredienser?**
Ja, men håll dig till liknande livsmedel (t.ex. kyckling → kalkonfläskfilé, ris → potatis). Kontakta din coach vid osäkerhet.

**Måste jag äta exakt dessa mängder?**
För bästa resultat, ja. Men ±10-20g gör sällan stor skillnad. Sträva efter precision utan att bli besatt.

**Vad gör jag på restaurang?**
Välj proteinkälla + grönsaker + kolhydratkälla. Skatta portioner så gott du kan. En måltid ute förstör inte dina resultat!

---

**Har du fler frågor?** Kontakta din coach via [Meddelanden](/dashboard/messages)!`

const DEFAULT_WORKOUT_CONTENT = `# Välkommen till ditt Träningsprogram

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
- **Vilodagar**: Lika viktiga som träningsdagarna!
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
Starta med en vikt där du kan göra alla reps med god form, men de sista 2-3 reps ska kännas utmanande. Justera nästa gång.

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

**Nu kör vi! 💪**`

const DEFAULT_FOOD_GUIDE_CONTENT = `# Livsmedelsguide

En omfattande guide för att hjälpa dig göra smarta matval och förstå näringsvärden.

## Proteinkällor

### Magert Kött & Fågel
**Kyckling (bröst)** - 165 kcal, 31g protein per 100g
- Låg fetthalt, högt proteininnehåll
- Perfekt för meal prep
- Versatil - passar de flesta rätter

**Kalkonfläskfilé** - 135 kcal, 30g protein per 100g
- Mager och proteinrik
- God järnkälla
- Bra alternativ till kyckling

## Kolhydratkällor

**Fullkornsris** - 111 kcal, 2.6g protein, 23g kolhydrater per 100g
- Långsam energifrisättning
- Rik på fiber
- Mättande

**Havregryn** - 389 kcal, 17g protein, 66g kolhydrater per 100g
- Sänker kolesterol
- Långvarig mättnadskänsla
- Perfekt till frukost`

const DEFAULT_ONBOARDING_CONTENT = `# Välkommen till 90-Dagars Challenge!

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

**Frågor?** Kontakta din coach via [Meddelanden](/dashboard/messages)!`

// GET /api/guide-content - Get all guide content or specific type
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type) {
      // Get specific guide content
      let guide = await prisma.guideContent.findUnique({
        where: { type }
      })

      // Create default if doesn't exist
      if (!guide) {
        const defaultContent = type === 'meal_plan'
          ? DEFAULT_MEAL_PLAN_CONTENT
          : type === 'workout'
          ? DEFAULT_WORKOUT_CONTENT
          : type === 'food_guide'
          ? DEFAULT_FOOD_GUIDE_CONTENT
          : DEFAULT_ONBOARDING_CONTENT
        const defaultTitle = type === 'meal_plan'
          ? 'Kostschema Guide'
          : type === 'workout'
          ? 'Träningsprogram Guide'
          : type === 'food_guide'
          ? 'Livsmedelsguide'
          : 'Kom Igång Guide'

        guide = await prisma.guideContent.create({
          data: {
            type,
            title: defaultTitle,
            content: defaultContent
          }
        })
      }

      return NextResponse.json({ guide })
    }

    // Get all guide content
    const guides = await prisma.guideContent.findMany({
      orderBy: { type: 'asc' }
    })

    // Create defaults if they don't exist
    if (guides.length === 0) {
      await prisma.guideContent.createMany({
        data: [
          {
            type: 'onboarding',
            title: 'Kom Igång Guide',
            content: DEFAULT_ONBOARDING_CONTENT
          },
          {
            type: 'meal_plan',
            title: 'Kostschema Guide',
            content: DEFAULT_MEAL_PLAN_CONTENT
          },
          {
            type: 'workout',
            title: 'Träningsprogram Guide',
            content: DEFAULT_WORKOUT_CONTENT
          },
          {
            type: 'food_guide',
            title: 'Livsmedelsguide',
            content: DEFAULT_FOOD_GUIDE_CONTENT
          }
        ]
      })

      const newGuides = await prisma.guideContent.findMany({
        orderBy: { type: 'asc' }
      })
      return NextResponse.json({ guides: newGuides })
    }

    return NextResponse.json({ guides })
  } catch (error) {
    console.error('Error fetching guide content:', error)
    return NextResponse.json({ error: 'Failed to fetch guide content' }, { status: 500 })
  }
}

// PATCH /api/guide-content - Update guide content
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, content } = body

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    // Update or create
    const guide = await prisma.guideContent.upsert({
      where: { type },
      update: {
        title: title,
        content: content
      },
      create: {
        type,
        title: title || (type === 'meal_plan' ? 'Kostschema Guide' : type === 'workout' ? 'Träningsprogram Guide' : type === 'food_guide' ? 'Livsmedelsguide' : 'Kom Igång Guide'),
        content: content || ''
      }
    })

    return NextResponse.json({ guide })
  } catch (error) {
    console.error('Error updating guide content:', error)
    return NextResponse.json({ error: 'Failed to update guide content' }, { status: 500 })
  }
}
