import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

interface Ingredient {
  name: string
  amount: number
  category: 'protein' | 'kolhydrat' | 'fett'
}

interface RecipeRequest {
  ingredients: Ingredient[]
  tillagg?: string[]
  mealType: string
}

interface Recipe {
  name: string
  description: string
  instructions: string[]
  tips: string
  suggestedSpices: string[]
  cookingTime: string
}

function buildPrompt(ingredients: Ingredient[], tillagg: string[], mealType: string): string {
  const ingredientsList = ingredients
    .map(i => `- ${i.amount}g ${i.name} (${i.category})`)
    .join('\n')

  const tillaggList = tillagg.length > 0 ? tillagg.join(', ') : 'Inga'

  const mealTypeSwedish: Record<string, string> = {
    'breakfast': 'Frukost',
    'lunch': 'Lunch',
    'dinner': 'Middag',
    'snack1': 'Mellanmål',
    'snack2': 'Mellanmål',
    'snack3': 'Mellanmål',
    'evening': 'Kvällsmål'
  }

  return `Du är en svensk kock som hjälper till med enkla, praktiska recept.

Ingredienser:
${ingredientsList}

Tillägg: ${tillaggList}

Måltidstyp: ${mealTypeSwedish[mealType] || mealType}

Uppgift:
1. Ge ett kreativt svenskt namn på rätten baserat på ingredienserna
2. Kort beskrivning (1 mening)
3. Tillagningssteg (max 5 steg, kortfattat och praktiskt)
4. Ett tips för extra smak
5. Förslag på kryddor som passar (3-5 st)
6. Ungefärlig tillagningstid

VIKTIGT:
- Fokusera på att kombinera de givna ingredienserna till en god rätt
- Tillägg (grönsaker, sallad) är redan valda - inkludera dem i receptet
- Håll instruktionerna enkla och praktiska
- Anpassa receptet efter måltidstypen

Svara ENDAST med JSON (ingen markdown, inga code blocks):
{
  "name": "Rättens namn",
  "description": "Kort beskrivning av rätten",
  "instructions": ["Steg 1", "Steg 2", "Steg 3"],
  "tips": "Tips för extra smak",
  "suggestedSpices": ["krydda1", "krydda2", "krydda3"],
  "cookingTime": "X min"
}`
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: RecipeRequest = await req.json()
    const { ingredients, tillagg = [], mealType } = body

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 })
    }

    if (!mealType) {
      return NextResponse.json({ error: 'Meal type is required' }, { status: 400 })
    }

    const prompt = buildPrompt(ingredients, tillagg, mealType)

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No recipe received' }, { status: 500 })
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let recipeText = textContent.text.trim()
    recipeText = recipeText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const recipe: Recipe = JSON.parse(recipeText)

      // Validate recipe structure
      if (!recipe.name || !recipe.instructions || !Array.isArray(recipe.instructions)) {
        throw new Error('Invalid recipe structure')
      }

      return NextResponse.json({ recipe })
    } catch (parseError) {
      console.error('Failed to parse recipe:', recipeText)
      return NextResponse.json({
        error: 'Failed to parse recipe',
        raw: recipeText
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error generating recipe:', error)

    if (error?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 500 })
    }
    if (error?.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    if (error?.message) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 })
  }
}
