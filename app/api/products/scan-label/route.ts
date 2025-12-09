import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const LABEL_OCR_PROMPT = `Du är expert på att läsa svenska näringsetiketter.
Analysera bilden och extrahera näringsvärden per 100g.

VIKTIGT:
- Extrahera ENDAST värden per 100g (inte per portion)
- Om etiketten visar "per portion" OCH "per 100g", använd 100g-kolumnen
- Extrahera produktnamn och märke om synligt på etiketten
- Om värden saknas, sätt null (inte 0)
- Energi kan anges som "kcal" eller "kJ" - konvertera kJ till kcal (dela med 4.184)

Svara ENDAST med JSON (inget annat):
{
  "name": "Produktnamn (om synligt, annars null)",
  "brand": "Märke (om synligt, annars null)",
  "nutrition_per_100g": {
    "kcal": <number>,
    "protein": <number>,
    "carbs": <number>,
    "fat": <number>,
    "fiber": <number | null>,
    "sugar": <number | null>,
    "salt": <number | null>
  },
  "confidence": "high" | "medium" | "low",
  "notes": "Eventuella osäkerheter eller problem med avläsningen"
}`

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { labelImage, productImage } = body

    if (!labelImage) {
      return NextResponse.json({ error: 'Label image is required' }, { status: 400 })
    }

    // Remove data URI prefix if present
    const base64Data = labelImage.replace(/^data:image\/\w+;base64,/, '')

    // Detect media type
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
    if (labelImage.startsWith('data:image/png')) {
      mediaType = 'image/png'
    } else if (labelImage.startsWith('data:image/gif')) {
      mediaType = 'image/gif'
    } else if (labelImage.startsWith('data:image/webp')) {
      mediaType = 'image/webp'
    }

    // Call Claude Vision to analyze the label
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
              text: LABEL_OCR_PROMPT
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
      const result = JSON.parse(analysisText)

      // Validate required fields
      if (!result.nutrition_per_100g) {
        throw new Error('Missing nutrition data')
      }

      const nutrition = result.nutrition_per_100g

      // Build product object
      const product = {
        name: result.name || null,
        brand: result.brand || null,
        kcal: Math.round(nutrition.kcal || 0),
        protein: Math.round((nutrition.protein || 0) * 10) / 10,
        carbs: Math.round((nutrition.carbs || 0) * 10) / 10,
        fat: Math.round((nutrition.fat || 0) * 10) / 10,
        fiber: nutrition.fiber !== null ? Math.round((nutrition.fiber || 0) * 10) / 10 : null,
        sugar: nutrition.sugar !== null ? Math.round((nutrition.sugar || 0) * 10) / 10 : null,
        salt: nutrition.salt !== null ? Math.round((nutrition.salt || 0) * 100) / 100 : null,
        image: productImage || null
      }

      return NextResponse.json({
        product,
        confidence: result.confidence || 'medium',
        notes: result.notes || ''
      })
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText)
      return NextResponse.json({
        error: 'Failed to parse nutrition label',
        raw: analysisText
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error scanning label:', error)

    if (error?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 500 })
    }
    if (error?.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    if (error?.message) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Failed to scan label' }, { status: 500 })
  }
}
