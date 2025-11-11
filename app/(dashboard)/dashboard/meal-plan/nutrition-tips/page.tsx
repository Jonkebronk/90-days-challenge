'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MDXPreview } from '@/components/mdx-preview'

const FALLBACK_CONTENT = `# Generella råd för kosten

Här hittar du viktiga tips och råd för att lyckas med ditt kostschema.

## Grundläggande principer

### Konsistens är nyckeln
- Följ ditt kostschema så gott du kan
- En dålig måltid förstör inte dina resultat
- Fokusera på veckoresultatet, inte enskilda dagar

### Förberedelse är allt
- Planera dina måltider i förväg
- Handla för hela veckan
- Meal prep 2-3 dagar i taget
- Ha alltid snacks tillgängliga

## Praktiska tips

### Vid hungerkänslor
- Drick ett stort glas vatten först
- Vänta 15-20 minuter
- Om du fortfarande är hungrig - ät extra grönsaker
- Hungerkänslor är normala under en diet

### Vid social eating
- Planera för restaurangbesök
- Välj proteinkälla + grönsaker + kolhydrater
- Skatta portioner så gott du kan
- Njut av måltiden utan dåligt samvete

### Vätskeintag
- Drick 2-3 liter vatten per dag
- Mer vid träning och varmt väder
- Kaffe och te räknas
- Begränsa sötade drycker`

export default function NutritionTipsPage() {
  const router = useRouter()
  const [guideData, setGuideData] = useState({
    title: 'Generella råd för kosten',
    content: FALLBACK_CONTENT
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuideContent()
  }, [])

  const fetchGuideContent = async () => {
    try {
      const response = await fetch('/api/guide-content?type=nutrition_tips')
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
            onClick={() => router.push('/dashboard/meal-plan')}
            className="text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[rgba(255,215,0,0.1)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till kostschema
          </Button>
        </div>

        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent mb-6 opacity-30" />
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lightbulb className="w-10 h-10 text-[#f59e0b]" />
            <h1 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase bg-gradient-to-br from-[#f59e0b] to-[#d97706] bg-clip-text text-transparent">
              {guideData.title}
            </h1>
          </div>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Tips och råd för att lyckas med din kost
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent mt-6 opacity-30" />
        </div>

        {/* Content */}
        <div className="bg-[rgba(10,10,10,0.6)] border-2 border-[rgba(245,158,11,0.3)] rounded-xl p-8 backdrop-blur-[10px]">
          <div className="prose prose-invert prose-lg max-w-none
            prose-headings:text-[#f59e0b]
            prose-headings:font-bold
            prose-h1:text-3xl
            prose-h2:text-2xl
            prose-h3:text-xl
            prose-p:text-[rgba(255,255,255,0.8)]
            prose-p:leading-relaxed
            prose-strong:text-[#f59e0b]
            prose-strong:font-semibold
            prose-li:text-[rgba(255,255,255,0.8)]
            prose-ul:space-y-2
            prose-a:text-[#f59e0b]
            prose-a:no-underline
            hover:prose-a:underline">
            <MDXPreview content={guideData.content} />
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center pt-6">
          <Button
            onClick={() => router.push('/dashboard/meal-plan')}
            className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till kostschema
          </Button>
        </div>
      </div>
    </div>
  )
}
