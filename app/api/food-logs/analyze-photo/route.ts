import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const ANALYSIS_PROMPT = `Du är en expert på näringsanalys och portionsstorlekar. Analysera matbilden noggrant.

## STEG 1: Identifiera referensobjekt
Leta efter storleksreferenser: tallrik (standard 26cm), bestick, händer, glas, skål.
Använd dessa för att uppskatta portionsstorlekar mer exakt.

## STEG 2: Identifiera varje livsmedel
För varje synligt livsmedel, ange:
- Svenskt namn (var specifik: "kycklingfilé" inte bara "kyckling")
- Kategori: protein/kolhydrat/fett/grönsak/mejeri/frukt/dryck/tillbehör
- Tillagningsmetod om synligt (stekt, kokt, rå, grillad)

## STEG 3: Uppskatta portioner
Använd dessa riktlinjer:
- En knytnäve ≈ 1 dl eller 100g grönsaker/frukt
- Handflata (utan fingrar) ≈ 100g kött/fisk
- Tumme ≈ 15g fett (smör, olja)
- Tennisboll ≈ 150g potatis/ris
- Standardtallrik full ≈ 400-500g total mat

## STEG 4: Beräkna näringsvärden
Använd svenska genomsnittsvärden per 100g:
- Kycklingfilé: 110 kcal, 23g protein, 0g kolhydrater, 1.5g fett
- Lax: 180 kcal, 20g protein, 0g kolhydrater, 11g fett
- Kokt ris: 130 kcal, 2.7g protein, 28g kolhydrater, 0.3g fett
- Kokt pasta: 130 kcal, 4.5g protein, 26g kolhydrater, 0.6g fett
- Kokt potatis: 80 kcal, 2g protein, 17g kolhydrater, 0.1g fett
- Havregrynsgröt: 70 kcal, 2.5g protein, 12g kolhydrater, 1.5g fett
- Kvarg naturell: 60 kcal, 10g protein, 4g kolhydrater, 0.2g fett
- Ägg (1 st): 80 kcal, 7g protein, 0.5g kolhydrater, 6g fett

Svara ENDAST med JSON:
{
  "items": [
    {
      "name": "Specifikt namn på svenska",
      "category": "protein|carb|fat|vegetable|dairy|fruit|drink|other",
      "portion_g": <number>,
      "confidence": "high|medium|low",
      "kcal": <number>,
      "protein": <number>,
      "carbs": <number>,
      "fat": <number>
    }
  ],
  "total": {
    "kcal": <number>,
    "protein": <number>,
    "carbs": <number>,
    "fat": <number>
  },
  "notes": "Kort kommentar om osäkerheter, t.ex. 'Svårt att bedöma mängd sås'"
}

VIKTIGT: Var realistisk med portioner. En normal lunch är 400-700 kcal, middag 500-900 kcal.`

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
      const analysis = JSON.parse(analysisText)

      // Validate structure
      if (!analysis.items || !Array.isArray(analysis.items)) {
        throw new Error('Invalid analysis structure')
      }

      // Calculate totals if not provided
      if (!analysis.total) {
        analysis.total = analysis.items.reduce(
          (acc: any, item: any) => ({
            kcal: acc.kcal + (item.kcal || 0),
            protein: acc.protein + (item.protein || 0),
            carbs: acc.carbs + (item.carbs || 0),
            fat: acc.fat + (item.fat || 0)
          }),
          { kcal: 0, protein: 0, carbs: 0, fat: 0 }
        )
      }

      return NextResponse.json({ analysis })
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
