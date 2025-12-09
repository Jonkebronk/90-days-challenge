import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const ANALYSIS_PROMPT = `Du är en näringsanalytiker. Analysera matbilden och uppskatta näringsinnehållet.

Identifiera alla synliga livsmedel och uppskatta:
1. Namn på varje livsmedel (på svenska)
2. Uppskattad portionsstorlek i gram
3. Uppskattade makronäringsämnen (kcal, protein, kolhydrater, fett)

Svara ENDAST med JSON i detta exakta format:
{
  "items": [
    {
      "name": "Livsmedlets namn på svenska",
      "portion_g": <number>,
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
  }
}

Var konservativ med uppskattningarna. Om osäker, ange lägre portionsstorlekar.
Inga kommentarer eller förklaringar - ENDAST JSON.`

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
