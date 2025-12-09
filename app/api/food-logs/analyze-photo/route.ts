import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// Base URL for internal API calls
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

interface SLVFood {
  slvNummer: number
  name: string
  type: string
  protein: number
  carbs: number
  fat: number
  kcal: number
}

// Search SLV database for a food item
async function searchSLV(foodName: string): Promise<SLVFood | null> {
  try {
    // Extract key search term (first word or most specific part)
    const searchTerms = foodName.toLowerCase()
      .replace(/kokt|stekt|grillad|rå|tillagad|ugns?bakad/gi, '')
      .trim()
      .split(/\s+/)
      .filter(t => t.length > 2)

    // Try searching with the most specific term first
    for (const term of searchTerms) {
      const url = `${getBaseUrl()}/api/slv-proxy?q=${encodeURIComponent(term)}&limit=5`
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })

      if (!response.ok) continue

      const data = await response.json()
      const foods: SLVFood[] = data.foods || []

      if (foods.length === 0) continue

      // Find best match by checking if the food name contains our search term
      const exactMatch = foods.find(f =>
        f.name.toLowerCase().includes(term)
      )

      if (exactMatch) return exactMatch

      // Return first result as fallback
      return foods[0]
    }

    return null
  } catch (error) {
    console.error('SLV search failed:', error)
    return null
  }
}

const ANALYSIS_PROMPT = `Du är en expert på matidentifiering. Analysera matbilden och identifiera varje livsmedel.

## STEG 1: Identifiera referensobjekt
Leta efter storleksreferenser: tallrik (standard 26cm), bestick, händer, glas, skål.

## STEG 2: Identifiera varje livsmedel
För varje synligt livsmedel, ange:
- Svenskt namn (var specifik och använd enkla råvarunamn: "kycklingfilé", "kokt ris", "broccoli")
- VIKTIGT: Använd namn som matchar Livsmedelsverkets databas (enkla, svenska råvarunamn)
- Kategori: protein/kolhydrat/fett/grönsak/mejeri/frukt/dryck/tillbehör
- Tillagningsmetod om synligt (stekt, kokt, rå, grillad)

## STEG 3: Uppskatta portioner
Använd dessa riktlinjer:
- En knytnäve ≈ 1 dl eller 100g grönsaker/frukt
- Handflata (utan fingrar) ≈ 100g kött/fisk
- Tumme ≈ 15g fett (smör, olja)
- Tennisboll ≈ 150g potatis/ris
- Standardtallrik full ≈ 400-500g total mat

Svara ENDAST med JSON:
{
  "items": [
    {
      "name": "Enkelt svenskt råvarunamn",
      "search_term": "Sökterm för Livsmedelsverket (t.ex. 'kyckling' för 'grillad kycklingfilé')",
      "category": "protein|carb|fat|vegetable|dairy|fruit|drink|other",
      "portion_g": <number>,
      "confidence": "high|medium|low"
    }
  ],
  "notes": "Kort kommentar om osäkerheter"
}

VIKTIGT: Ange INTE näringsvärden - dessa hämtas från Livsmedelsverkets databas.`

// Fallback nutrition values per 100g when SLV lookup fails
const FALLBACK_NUTRITION: Record<string, { kcal: number; protein: number; carbs: number; fat: number }> = {
  'kyckling': { kcal: 110, protein: 23, carbs: 0, fat: 1.5 },
  'kycklingfilé': { kcal: 110, protein: 23, carbs: 0, fat: 1.5 },
  'lax': { kcal: 180, protein: 20, carbs: 0, fat: 11 },
  'ris': { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'pasta': { kcal: 130, protein: 4.5, carbs: 26, fat: 0.6 },
  'potatis': { kcal: 80, protein: 2, carbs: 17, fat: 0.1 },
  'ägg': { kcal: 155, protein: 13, carbs: 1, fat: 11 },
  'kvarg': { kcal: 60, protein: 10, carbs: 4, fat: 0.2 },
  'broccoli': { kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  'sallad': { kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  'tomat': { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'gurka': { kcal: 12, protein: 0.6, carbs: 2.2, fat: 0.1 },
  'avokado': { kcal: 160, protein: 2, carbs: 9, fat: 15 },
  'bröd': { kcal: 250, protein: 8, carbs: 49, fat: 3 },
  'ost': { kcal: 350, protein: 25, carbs: 0, fat: 28 },
  'smör': { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  'olivolja': { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  'nötfärs': { kcal: 240, protein: 18, carbs: 0, fat: 18 },
  'fläsk': { kcal: 200, protein: 20, carbs: 0, fat: 13 },
  'default': { kcal: 100, protein: 5, carbs: 10, fat: 5 }
}

function getFallbackNutrition(name: string): { kcal: number; protein: number; carbs: number; fat: number } {
  const lowerName = name.toLowerCase()
  for (const [key, value] of Object.entries(FALLBACK_NUTRITION)) {
    if (lowerName.includes(key)) {
      return value
    }
  }
  return FALLBACK_NUTRITION['default']
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { image } = body // base64 image

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    // Remove data URI prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')

    // Detect media type
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
    if (image.startsWith('data:image/png')) {
      mediaType = 'image/png'
    } else if (image.startsWith('data:image/gif')) {
      mediaType = 'image/gif'
    } else if (image.startsWith('data:image/webp')) {
      mediaType = 'image/webp'
    }

    // Step 1: Get AI identification of foods
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data
              }
            },
            {
              type: 'text',
              text: ANALYSIS_PROMPT
            }
          ]
        }
      ]
    })

    // Extract text from response
    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No analysis received' }, { status: 500 })
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let analysisText = textContent.text.trim()
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const aiResult = JSON.parse(analysisText)

      // Validate structure
      if (!aiResult.items || !Array.isArray(aiResult.items)) {
        throw new Error('Invalid analysis structure')
      }

      // Step 2: Enrich each item with SLV nutrition data
      const enrichedItems = await Promise.all(
        aiResult.items.map(async (item: any) => {
          const searchTerm = item.search_term || item.name
          const slvFood = await searchSLV(searchTerm)

          if (slvFood) {
            // Calculate nutrition based on portion size
            const ratio = item.portion_g / 100
            return {
              name: item.name,
              category: item.category,
              portion_g: item.portion_g,
              confidence: item.confidence,
              kcal: Math.round(slvFood.kcal * ratio),
              protein: Math.round(slvFood.protein * ratio * 10) / 10,
              carbs: Math.round(slvFood.carbs * ratio * 10) / 10,
              fat: Math.round(slvFood.fat * ratio * 10) / 10,
              source: 'slv',
              slv_name: slvFood.name,
              slv_nummer: slvFood.slvNummer
            }
          } else {
            // Use fallback values
            const fallback = getFallbackNutrition(item.name)
            const ratio = item.portion_g / 100
            return {
              name: item.name,
              category: item.category,
              portion_g: item.portion_g,
              confidence: item.confidence,
              kcal: Math.round(fallback.kcal * ratio),
              protein: Math.round(fallback.protein * ratio * 10) / 10,
              carbs: Math.round(fallback.carbs * ratio * 10) / 10,
              fat: Math.round(fallback.fat * ratio * 10) / 10,
              source: 'estimate'
            }
          }
        })
      )

      // Calculate totals
      const total = enrichedItems.reduce(
        (acc: any, item: any) => ({
          kcal: acc.kcal + item.kcal,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      )

      // Round totals
      total.protein = Math.round(total.protein * 10) / 10
      total.carbs = Math.round(total.carbs * 10) / 10
      total.fat = Math.round(total.fat * 10) / 10

      // Count sources
      const slvCount = enrichedItems.filter((i: any) => i.source === 'slv').length
      const estimateCount = enrichedItems.filter((i: any) => i.source === 'estimate').length

      let notes = aiResult.notes || ''
      if (slvCount > 0 && estimateCount > 0) {
        notes = `${slvCount} livsmedel från Livsmedelsverket, ${estimateCount} uppskattade. ${notes}`
      } else if (slvCount === enrichedItems.length) {
        notes = `Alla näringsvärden från Livsmedelsverkets databas. ${notes}`
      }

      return NextResponse.json({
        analysis: {
          items: enrichedItems,
          total,
          notes: notes.trim()
        }
      })
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText)
      return NextResponse.json({
        error: 'Failed to parse analysis',
        raw: analysisText
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error analyzing photo:', error)

    // Return more specific error messages
    if (error?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 500 })
    }
    if (error?.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    if (error?.message) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Failed to analyze photo' }, { status: 500 })
  }
}
