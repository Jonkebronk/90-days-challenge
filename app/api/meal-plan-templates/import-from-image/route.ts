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

interface ParsedItem {
  name: string
  alternatives?: string[]
  amount: number
  unit: string
  protein: number
  fat: number
  carbs: number
  kcal: number
  search_term?: string
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
    // Clean up the search term
    const searchTerm = foodName.toLowerCase()
      .replace(/\d+g?\s*/g, '') // Remove amounts like "415g"
      .replace(/\s*(eller|och)\s*/gi, ' ') // Remove "eller" and "och"
      .replace(/[%.,]/g, '') // Remove special chars
      .trim()
      .split(/\s+/)
      .filter(t => t.length > 2)
      .slice(0, 2) // Take first 2 words
      .join(' ')

    if (!searchTerm) return null

    const url = `${getBaseUrl()}/api/slv-proxy?q=${encodeURIComponent(searchTerm)}&limit=5`
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) return null

    const data = await response.json()
    const foods: SLVFood[] = data.foods || []

    if (foods.length === 0) return null

    // Find best match
    const lowerName = foodName.toLowerCase()
    const exactMatch = foods.find(f =>
      lowerName.includes(f.name.toLowerCase().split(' ')[0])
    )

    return exactMatch || foods[0]
  } catch (error) {
    console.error('SLV search failed:', error)
    return null
  }
}

const MEAL_PLAN_PROMPT = `Du är expert på att läsa och extrahera data från kostscheman.

Analysera bilden och extrahera ALLA måltider och ingredienser.

VIKTIGT:
- Extrahera EXAKT de värden som står i schemat (mängd, protein, fett, kolhydrater, kcal)
- Om en ingrediens har alternativ (t.ex. "Havregryn eller 415g Naturell yoghurt"), sätt huvudingrediensen som "name" och alternativet i "alternatives"
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
          "search_term": "havregryn"
        }
      ]
    }
  ]
}

search_term ska vara ett enkelt svenskt ord för sökning i Livsmedelsverkets databas:
- "Kvarg/ keso max 1.5% fett" → search_term: "kvarg"
- "Kyckling/ magert nötkött/ Kalkon" → search_term: "kyckling"
- "Ris (okokt)" → search_term: "ris"
- "Blandade grönsaker" → search_term: "grönsaker"
- "Ägg (medelstort ca 65g)" → search_term: "ägg"`

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

    // Enrich each ingredient with SLV match
    const enrichedMeals = await Promise.all(
      parsedPlan.meals.map(async (meal) => {
        const enrichedItems = await Promise.all(
          meal.items.map(async (item) => {
            const searchTerm = item.search_term || item.name
            const slvMatch = await searchSLV(searchTerm)

            return {
              ...item,
              slv_match: slvMatch ? {
                slvNummer: slvMatch.slvNummer,
                name: slvMatch.name,
                // SLV values per 100g for reference
                slv_protein: slvMatch.protein,
                slv_fat: slvMatch.fat,
                slv_carbs: slvMatch.carbs,
                slv_kcal: slvMatch.kcal
              } : null
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
