'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Apple } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MDXPreview } from '@/components/mdx-preview'

// Fallback content if database is empty
const FALLBACK_CONTENT = `# Livsmedelsguide

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

**Nötfärs (5%)** - 135 kcal, 21g protein per 100g
- Välj mager variant
- Rik på järn och B-vitaminer
- Bra för köttfärssåser och hamburgare

### Fisk & Skaldjur
**Lax** - 200 kcal, 20g protein, 13g fett per 100g
- Rik på omega-3
- Bra för hjärta och hjärna
- 2-3 portioner fisk per vecka rekommenderas

**Torsk** - 82 kcal, 18g protein per 100g
- Mycket mager fisk
- Mild smak
- Perfekt för dig som vill hålla nere fett

**Räkor** - 99 kcal, 24g protein per 100g
- Mycket proteinrika
- Snabbt att tillaga
- Låg fetthalt

### Vegetariska Alternativ
**Ägg** - 155 kcal, 13g protein per 100g (2 st)
- Komplett proteinkälla
- Rik på vitaminer och mineraler
- Mångsidigt och billigt

**Kvarg** - 60 kcal, 11g protein per 100g
- Högt proteininnehåll
- Låg fetthalt
- Perfekt som snack eller i smoothies

**Tofu** - 76 kcal, 8g protein per 100g
- Vegetarisk proteinkälla
- Tar upp smaker bra
- Rik på kalcium (fast variant)

## Kolhydratkällor

### Långsamma Kolhydrater
**Fullkornsris (kokt)** - 111 kcal, 2.6g protein, 23g kolhydrater per 100g
- Långsam energifrisättning
- Rik på fiber
- Mättande

**Havregryn** - 389 kcal, 17g protein, 66g kolhydrater per 100g (torrvikt)
- Sänker kolesterol
- Långvarig mättnadskänsla
- Perfekt till frukost

**Sötpotatis** - 86 kcal, 1.6g protein, 20g kolhydrater per 100g
- Rik på betakaroten (vitamin A)
- Sötare smak än vanlig potatis
- Mättande och näringsrik

**Quinoa (kokt)** - 120 kcal, 4g protein, 21g kolhydrater per 100g
- Komplett proteinkälla
- Glutenfri
- Rik på mineraler

### Snabbare Kolhydrater (runt träning)
**Vit Ris (kokt)** - 130 kcal, 2.7g protein, 28g kolhydrater per 100g
- Snabb energi
- Lätt att smälta
- Bra före/efter träning

**Vitt Bröd** - 265 kcal, 9g protein, 49g kolhydrater per 100g
- Snabb energikälla
- Använd strategiskt (runt träning)
- Välj berikat bröd

**Pasta (kokt)** - 131 kcal, 5g protein, 25g kolhydrater per 100g
- Energirik
- Mättande
- Perfekt till köttfärssås

## Fettkällor

### Nyttiga Fetter
**Olivolja** - 884 kcal, 100g fett per 100ml
- Enomättade fetter (hälsosamma)
- Använd till stekning och dressingar
- Extra virgin = högsta kvalitet

**Avokado** - 160 kcal, 15g fett per 100g
- Rik på nyttiga fetter
- Mättande
- God källa till kalium

**Nötter (blandade)** - 600 kcal, 50g fett per 100g
- Nyttiga fetter och protein
- Mättande snack
- Portion: ca 30g (en handfull)

**Jordnötssmör** - 588 kcal, 50g fett, 25g protein per 100g
- Proteinrikt och mättande
- Perfekt i smoothies eller på macka
- Välj naturell utan tillsatt socker

### Omega-3 Källor
**Lax (se ovan)**
**Makrill** - Rik på omega-3
**Linfröolja** - Vegetarisk omega-3 källa
**Chiafröer** - Bra i yoghurt eller smoothies

## Grönsaker & Frukt

### Grönsaker (äta fritt)
**Broccoli** - 34 kcal per 100g
- Rik på C-vitamin och fiber
- Perfekt tillbehör
- Innehåller antioxidanter

**Spenat** - 23 kcal per 100g
- Mycket näringsrik
- Rik på järn och kalcium
- Bra i smoothies, woks och sallader

**Paprika** - 20 kcal per 100g
- Låg kalori, hög näring
- Rik på vitamin C
- Ger färg och smak

**Gurka** - 16 kcal per 100g
- Mycket vatten (hydratiserande)
- Knappt några kalorier
- Perfekt snack

### Frukt (måttligt)
**Banan** - 89 kcal, 23g kolhydrater per 100g
- Snabb energi
- Rik på kalium
- Perfekt före/efter träning

**Äpple** - 52 kcal, 14g kolhydrater per 100g
- Rik på fiber
- Mättande
- Bra mellanmål

**Bär (blandade)** - 57 kcal per 100g
- Lågt i socker jämfört med annan frukt
- Högt i antioxidanter
- Perfekt i yoghurt eller smoothies

## Livsmedel att begränsa

⚠️ **Undvik eller minimera:**
- Sötsaker och godis
- Läsk och sockrade drycker
- Snabbmat (burgare, pizza, pommes)
- Alkohol (blockerar fettförbränning)
- Processade livsmedel med mycket tillsatser
- Frityrstekt mat

## Matlagningssätt

### Hälsosamma alternativ:
✅ **Ångkoka** - Behåller näringsämnen
✅ **Grilla** - Ingen extra olja behövs
✅ **Ugnsrosta** - Enkelt och smakfullt
✅ **Woka** - Snabbt med minimal olja

### Mindre bra alternativ:
❌ **Frityr** - Mycket extra fett
❌ **Panera och stek** - Tillför många kalorier
❌ **Gräddsås** - Högt i fett och kalorier

## Tips för Matval

### På Mataffären:
1. **Handla runt kanterna** - Färskvaror finns där
2. **Läs ingredienslistor** - Färre ingredienser = bättre
3. **Jämför näringsvärden** - Per 100g, inte per portion
4. **Köp säsongsvaror** - Billigare och godare
5. **Planera veckan** - Undvik impulsköp

### På Restaurang:
1. **Välj grillat istället för stekt**
2. **Be om dressing/sås vid sidan**
3. **Fråga efter extra grönsaker**
4. **Välj vatten istället för läsk**
5. **Dela på desserter** (om du måste ha!)

## Meal Prep Tips

### Proteiner som håller bra:
- Kyckling (4-5 dagar)
- Köttfärssåser (3-4 dagar)
- Bönor och linser (5 dagar)
- Hårdkokta ägg (5-7 dagar)

### Kolhydrater som håller bra:
- Ris (4-5 dagar)
- Quinoa (5 dagar)
- Sötpotatis (4-5 dagar)
- Pasta (3-4 dagar)

### Grönsaker som håller bra:
- Broccoli (3-4 dagar)
- Morötter (5 dagar)
- Paprika (4-5 dagar)
- Gröna bönor (3-4 dagar)

## Vanliga Frågor

**Måste jag äta ekologiskt?**
Nej, det viktigaste är att äta rätt mängd och variation. Ekologiskt är ett personligt val.

**Kan jag äta mejeri?**
Ja, om du tål laktos. Kvarg, yoghurt och ost är bra proteinkällor. Välj lågfettsvarianter.

**Vad är "rent ätande"?**
Fokusera på oprocessade, helmat. Men ingen mat är "oren" - det handlar om balans!

**Hur mycket vatten ska jag dricka?**
Sträva efter 2-3 liter per dag. Mer om du tränar hårt eller svettas mycket.

**Kan jag äta snacks?**
Ja! Välj proteinrika snacks: kvarg, nötter, frukt med jordnötssmör, hårdkokta ägg.

---

**Fler frågor om mat och näring?** Kontakta din coach via [Meddelanden](/dashboard/messages)!
`

export default function FoodGuidePage() {
  const router = useRouter()
  const [guideData, setGuideData] = useState({
    title: 'Livsmedelsguide',
    content: FALLBACK_CONTENT
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuideContent()
  }, [])

  const fetchGuideContent = async () => {
    try {
      const response = await fetch('/api/guide-content?type=food_guide')
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
            <Apple className="w-8 h-8 text-[#FFD700]" />
            <h1 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              {guideData.title}
            </h1>
          </div>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Allt du behöver veta om livsmedel och näring
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
