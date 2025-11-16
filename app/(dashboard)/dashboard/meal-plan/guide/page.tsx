'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MDXPreview } from '@/components/mdx-preview'

// Fallback content if database is empty
const FALLBACK_CONTENT = `# Välkommen till ditt Kostschema

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

**Har du fler frågor?** Kontakta din coach via [Meddelanden](/dashboard/messages)!
`

export default function MealPlanGuidePage() {
  const router = useRouter()
  const [guideData, setGuideData] = useState({
    title: 'Kostschema Guide',
    content: FALLBACK_CONTENT
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuideContent()
  }, [])

  const fetchGuideContent = async () => {
    try {
      const response = await fetch('/api/guide-content?type=meal_plan')
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
    <div className="min-h-screen bg-gray-900">
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
            Allt du behöver veta om ditt kostschema
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
            onClick={() => router.push('/dashboard/meal-plan')}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold px-8 py-6 text-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all"
          >
            Till Mitt Kostschema
          </Button>
        </div>
      </div>
    </div>
  )
}
