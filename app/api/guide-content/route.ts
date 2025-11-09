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
          : DEFAULT_WORKOUT_CONTENT
        const defaultTitle = type === 'meal_plan'
          ? 'Kostschema Guide'
          : 'Träningsprogram Guide'

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
            type: 'meal_plan',
            title: 'Kostschema Guide',
            content: DEFAULT_MEAL_PLAN_CONTENT
          },
          {
            type: 'workout',
            title: 'Träningsprogram Guide',
            content: DEFAULT_WORKOUT_CONTENT
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
        title: title || undefined,
        content: content || undefined
      },
      create: {
        type,
        title: title || (type === 'meal_plan' ? 'Kostschema Guide' : 'Träningsprogram Guide'),
        content: content || ''
      }
    })

    return NextResponse.json({ guide })
  } catch (error) {
    console.error('Error updating guide content:', error)
    return NextResponse.json({ error: 'Failed to update guide content' }, { status: 500 })
  }
}
