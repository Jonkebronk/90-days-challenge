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
  protein: number
  carbs: number
  fat: number
  kcal: number
}

interface AlternativeItem {
  name: string
  slv_match?: {
    slvNummer: number
    name: string
    slv_protein: number
    slv_fat: number
    slv_carbs: number
    slv_kcal: number
  } | null
}

interface ParsedItem {
  name: string
  alternatives?: string[]
  alternatives_search_terms?: string[]
  alternatives_enriched?: AlternativeItem[]
  amount: number
  unit: string
  protein: number
  fat: number
  carbs: number
  kcal: number
  search_term?: string
  category?: 'protein' | 'kolhydrat' | 'fett'
}

interface ParsedMeal {
  mealNumber: number
  name: string
  items: ParsedItem[]
}

interface ParsedPlan {
  name: string
  meals: ParsedMeal[]
}

// Search SLV database for a food item
async function searchSLV(foodName: string): Promise<SLVFood | null> {
  try {
    // Clean up the search term - extract just the main ingredient
    const cleanedName = foodName.toLowerCase()
      .replace(/\d+g?\s*/g, '') // Remove amounts like "415g"
      .replace(/\s*(eller|och)\s*/gi, ' ') // Remove "eller" and "och"
      .replace(/[%.,()]/g, '') // Remove special chars
      .replace(/\s*(max|min|ca|cirka)\s+\d+[\d.,]*%?\s*/gi, '') // Remove "max 1.5%" etc
      .trim()

    // Get first meaningful word for search
    const words = cleanedName.split(/\s+/).filter(t => t.length > 2)
    const searchTerm = words[0] || cleanedName

    if (!searchTerm || searchTerm.length < 2) return null

    const url = `${getBaseUrl()}/api/slv-proxy?q=${encodeURIComponent(searchTerm)}&limit=15`
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) return null

    const data = await response.json()
    const foods: SLVFood[] = data.foods || []

    if (foods.length === 0) return null

    // Score each result for best match
    const scoredFoods = foods.map(food => {
      const foodNameLower = food.name.toLowerCase()
      const searchLower = searchTerm.toLowerCase()
      let score = 0

      // Exact match on first word - highest priority
      const foodFirstWord = foodNameLower.split(/[,\s]+/)[0]
      if (foodFirstWord === searchLower) {
        score += 100
      }
      // Food name starts with search term
      else if (foodNameLower.startsWith(searchLower)) {
        score += 80
      }
      // First word starts with search term
      else if (foodFirstWord.startsWith(searchLower)) {
        score += 60
      }
      // Search term is a standalone word in food name
      else if (foodNameLower.split(/[,\s]+/).includes(searchLower)) {
        score += 40
      }
      // Partial match
      else if (foodNameLower.includes(searchLower)) {
        score += 20
      }

      // Prefer shorter names (more specific)
      score -= foodNameLower.length * 0.1

      // Prefer items without "med", "u.", "i" etc (more basic ingredients)
      if (/\s(med|u\.|i|på|till)\s/.test(foodNameLower)) {
        score -= 15
      }

      // Prefer raw/basic forms
      if (/\b(rå|färsk|okokt)\b/.test(foodNameLower)) {
        score += 5
      }

      return { food, score }
    })

    // Sort by score descending
    scoredFoods.sort((a, b) => b.score - a.score)

    // Only return if we have a reasonable match
    if (scoredFoods[0].score >= 20) {
      return scoredFoods[0].food
    }

    return null
  } catch (error) {
    console.error('SLV search failed:', error)
    return null
  }
}

const MEAL_PLAN_PROMPT = `Du är expert på att läsa och extrahera data från kostscheman.

Analysera bilden och extrahera ALLA måltider och ingredienser.

KRITISKT VIKTIGT FÖR ALTERNATIV:
När en ingrediens har "/" eller "eller" betyder det alternativ som kan bytas ut mot varandra:
- "Kvarg/keso max 1.5% fett" → name: "Kvarg/keso max 1.5% fett", alternatives: ["Keso max 1.5% fett"]
- "Kyckling/magert nötkött/Kalkon" → name: "Kyckling/magert nötkött/Kalkon", alternatives: ["Magert nötkött", "Kalkon"]
- "Ris (okokt)/mathavre/matvete/bönpasta" → alternatives: ["Mathavre", "Matvete", "Bönpasta"]
- "Havregryn eller 415g Naturell yoghurt" → alternatives: ["Naturell yoghurt 0.5% fett"]

KATEGORI - VIKTIGT:
Varje ingrediens ska kategoriseras baserat på dess PRIMÄRA makronäring:
- "protein": Kyckling, nötkött, fisk, ägg, kvarg, keso, proteinpulver, bönor etc.
- "kolhydrat": Ris, pasta, havregryn, bröd, frukt, potatis, grönsaker etc.
- "fett": Olja, smör, nötter, avokado, ost, grädde etc.

Använd makrovärdena som hjälp - om protein är högst → "protein", om kolhydrater är högst → "kolhydrat", om fett är högst → "fett".

ÖVRIGA REGLER:
- Extrahera EXAKT de värden som står i schemat (mängd, protein, fett, kolhydrater, kcal)
- Mängd är oftast i gram, men kan vara "styck" för ägg, vitaminer etc.
- Leta efter måltidsrubriker som "Måltid 1", "Måltid 2", "Frukost", "Lunch" etc.
- Ignorera tomma rader eller rubriker utan ingredienser

Returnera ENDAST JSON i detta format:
{
  "name": "Schemanamn om det syns i bilden, annars 'Importerat kostschema'",
  "meals": [
    {
      "mealNumber": 1,
      "name": "Måltid 1",
      "items": [
        {
          "name": "Havregryn",
          "alternatives": ["Naturell yoghurt 0.5% fett"],
          "amount": 50,
          "unit": "g",
          "protein": 6.6,
          "fat": 3.4,
          "carbs": 26,
          "kcal": 176.5,
          "search_term": "havregryn",
          "category": "kolhydrat"
        }
      ]
    }
  ]
}

search_term ska vara ett enkelt svenskt grundord för sökning i Livsmedelsverkets databas:
- "Kvarg/keso max 1.5% fett" → search_term: "kvarg"
- "Kyckling/magert nötkött/Kalkon" → search_term: "kyckling"
- "Ris (okokt)" → search_term: "ris"
- "Blandade grönsaker" → search_term: "grönsaker"
- "Ägg (medelstort ca 65g)" → search_term: "ägg"
- "Naturella nötter utan salt" → search_term: "nötter"
- "Avokado" → search_term: "avokado"

alternatives_search_terms ska vara en lista med söktermer för varje alternativ:
- alternatives: ["Naturell yoghurt 0.5% fett"] → alternatives_search_terms: ["yoghurt"]
- alternatives: ["Magert nötkött", "Kalkon"] → alternatives_search_terms: ["nötkött", "kalkon"]`

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { image } = body

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

    // Call Claude Vision to parse the meal plan
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
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
              text: MEAL_PLAN_PROMPT
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

    // Parse JSON from response
    let analysisText = textContent.text.trim()
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsedPlan: ParsedPlan
    try {
      parsedPlan = JSON.parse(analysisText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText)
      return NextResponse.json({
        error: 'Failed to parse meal plan',
        raw: analysisText
      }, { status: 500 })
    }

    // Validate structure
    if (!parsedPlan.meals || !Array.isArray(parsedPlan.meals)) {
      return NextResponse.json({ error: 'Invalid meal plan structure' }, { status: 500 })
    }

    // Enrich each ingredient with SLV match (including alternatives)
    const enrichedMeals = await Promise.all(
      parsedPlan.meals.map(async (meal) => {
        const enrichedItems = await Promise.all(
          meal.items.map(async (item) => {
            const searchTerm = item.search_term || item.name
            const slvMatch = await searchSLV(searchTerm)

            // Also search SLV for each alternative
            let alternativesEnriched: AlternativeItem[] = []
            if (item.alternatives && item.alternatives.length > 0) {
              const altSearchTerms = item.alternatives_search_terms || item.alternatives
              alternativesEnriched = await Promise.all(
                item.alternatives.map(async (alt, index) => {
                  const altSearchTerm = altSearchTerms[index] || alt
                  const altSlvMatch = await searchSLV(altSearchTerm)
                  return {
                    name: alt,
                    slv_match: altSlvMatch ? {
                      slvNummer: altSlvMatch.slvNummer,
                      name: altSlvMatch.name,
                      slv_protein: altSlvMatch.protein,
                      slv_fat: altSlvMatch.fat,
                      slv_carbs: altSlvMatch.carbs,
                      slv_kcal: altSlvMatch.kcal
                    } : null
                  }
                })
              )
            }

            // Determine category based on macros if not set
            let category = item.category
            if (!category) {
              const maxMacro = Math.max(item.protein, item.carbs, item.fat)
              if (maxMacro === item.protein) category = 'protein'
              else if (maxMacro === item.carbs) category = 'kolhydrat'
              else category = 'fett'
            }

            return {
              ...item,
              category,
              slv_match: slvMatch ? {
                slvNummer: slvMatch.slvNummer,
                name: slvMatch.name,
                // SLV values per 100g for reference
                slv_protein: slvMatch.protein,
                slv_fat: slvMatch.fat,
                slv_carbs: slvMatch.carbs,
                slv_kcal: slvMatch.kcal
              } : null,
              alternatives_enriched: alternativesEnriched.length > 0 ? alternativesEnriched : undefined
            }
          })
        )

        return {
          ...meal,
          items: enrichedItems
        }
      })
    )

    // Calculate totals
    const totals = enrichedMeals.reduce((acc, meal) => {
      meal.items.forEach(item => {
        acc.protein += item.protein || 0
        acc.fat += item.fat || 0
        acc.carbs += item.carbs || 0
        acc.kcal += item.kcal || 0
      })
      return acc
    }, { protein: 0, fat: 0, carbs: 0, kcal: 0 })

    return NextResponse.json({
      parsedPlan: {
        name: parsedPlan.name || 'Importerat kostschema',
        meals: enrichedMeals,
        totals: {
          protein: Math.round(totals.protein * 10) / 10,
          fat: Math.round(totals.fat * 10) / 10,
          carbs: Math.round(totals.carbs * 10) / 10,
          kcal: Math.round(totals.kcal)
        }
      }
    })
  } catch (error: any) {
    console.error('Error importing meal plan:', error)

    if (error?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 500 })
    }
    if (error?.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    return NextResponse.json({ error: 'Failed to import meal plan' }, { status: 500 })
  }
}
