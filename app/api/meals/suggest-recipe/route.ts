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
  isPreWorkout?: boolean
  isPostWorkout?: boolean
}

interface RecipeSuggestion {
  id: string
  name: string
  description: string
  estimatedMacros: {
    kcal: number
    protein: number
    carbs: number
    fat: number
  }
  cookingTime: string
  difficulty: 'enkel' | 'medel' | 'avancerad'
  instructions: string[]
  tips: string
  seasonings: string[]
}

function buildPrompt(
  ingredients: Ingredient[],
  tillagg: string[],
  mealType: string,
  isPreWorkout: boolean,
  isPostWorkout: boolean
): string {
  const ingredientsList = ingredients
    .map(i => `- ${i.amount}g ${i.name} (${i.category})`)
    .join('\n')

  // Calculate total macros from ingredients (rough estimate)
  const totalProtein = ingredients
    .filter(i => i.category === 'protein')
    .reduce((sum, i) => sum + i.amount * 0.2, 0) // ~20% protein content
  const totalCarbs = ingredients
    .filter(i => i.category === 'kolhydrat')
    .reduce((sum, i) => sum + i.amount * 0.25, 0) // ~25% carb content
  const totalFat = ingredients
    .filter(i => i.category === 'fett')
    .reduce((sum, i) => sum + i.amount * 0.8, 0) // ~80% fat content

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

  const mealContext = isPreWorkout
    ? 'PRE-WORKOUT måltid (fokus på lättsmälta kolhydrater för energi, undvik tunga fetter)'
    : isPostWorkout
      ? 'POST-WORKOUT måltid (fokus på protein för muskelåterhämtning + kolhydrater för glykogenpåfyllning)'
      : mealTypeSwedish[mealType] || mealType

  return `Du är en certifierad sports nutritionist och kostrådgivare specialiserad på träningskost för svenska atleter.

INGREDIENSER (per portion):
${ingredientsList}

TILLÄGG: ${tillaggList}

MÅLTIDSTYP: ${mealContext}

UPPGIFT:
Skapa 3 OLIKA receptvarianter som använder dessa exakta ingredienser på smarta sätt.
Varje recept ska vara praktiskt, hälsosamt och optimerat för träning/återhämtning.

KRITISKA REGLER:
1. ANVÄND ENDAST ingredienserna ovan - lägg INTE till nya huvudingredienser
2. Kryddor och smaksättning som passar: salt, peppar, vitlök, citron, örter, kryddor - INTE udda kombinationer
3. Recepten ska vara REALISTISKA och GODA - tänk som en erfaren hemkock
4. Anpassa tillagningen efter ingredienserna:
   - Havregryn/gröt: vanilj, kanel, honung, bär, nötter - ALDRIG paprika/dill
   - Kyckling/kött: örter, vitlök, paprika, citron, soja
   - Fisk: citron, dill, vitpeppar, kapris
   - Ägg: salt, peppar, gräslök, tomat
5. Beräkna makros baserat på ingrediensmängderna
6. Tillagningstiden ska vara realistisk

${isPreWorkout ? `
PRE-WORKOUT FOKUS:
- Lättsmält, inte för fettrik
- Kolhydrater för energi
- Ät 1-2 timmar före träning
` : ''}

${isPostWorkout ? `
POST-WORKOUT FOKUS:
- Protein för muskelåterhämtning (20-30g)
- Kolhydrater för glykogenpåfyllning
- 4:1 ratio kolhydrater:protein är optimalt
- Ät inom 30-60 min efter träning
` : ''}

Svara ENDAST med JSON (ingen markdown, inga code blocks):
{
  "recipes": [
    {
      "id": "1",
      "name": "Kreativt svenskt namn på rätten",
      "description": "En mening som beskriver rätten aptitligt",
      "estimatedMacros": {
        "kcal": <number>,
        "protein": <number>,
        "carbs": <number>,
        "fat": <number>
      },
      "cookingTime": "X min",
      "difficulty": "enkel",
      "instructions": ["Steg 1", "Steg 2", "Steg 3"],
      "tips": "Ett tips för extra smak eller näring",
      "seasonings": ["krydda1", "krydda2"]
    },
    {
      "id": "2",
      "name": "...",
      ...
    },
    {
      "id": "3",
      "name": "...",
      ...
    }
  ]
}`
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: RecipeRequest = await req.json()
    const { ingredients, tillagg = [], mealType, isPreWorkout = false, isPostWorkout = false } = body

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 })
    }

    if (!mealType) {
      return NextResponse.json({ error: 'Meal type is required' }, { status: 400 })
    }

    const prompt = buildPrompt(ingredients, tillagg, mealType, isPreWorkout, isPostWorkout)

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No recipes received' }, { status: 500 })
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let recipesText = textContent.text.trim()
    recipesText = recipesText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const data = JSON.parse(recipesText)
      const recipes: RecipeSuggestion[] = data.recipes

      // Validate recipes structure
      if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
        throw new Error('Invalid recipes structure')
      }

      // Ensure all recipes have required fields
      const validatedRecipes = recipes.map((recipe, index) => ({
        id: recipe.id || String(index + 1),
        name: recipe.name || `Recept ${index + 1}`,
        description: recipe.description || '',
        estimatedMacros: {
          kcal: recipe.estimatedMacros?.kcal || 0,
          protein: recipe.estimatedMacros?.protein || 0,
          carbs: recipe.estimatedMacros?.carbs || 0,
          fat: recipe.estimatedMacros?.fat || 0
        },
        cookingTime: recipe.cookingTime || '15 min',
        difficulty: recipe.difficulty || 'enkel',
        instructions: recipe.instructions || [],
        tips: recipe.tips || '',
        seasonings: recipe.seasonings || []
      }))

      return NextResponse.json({ recipes: validatedRecipes })
    } catch (parseError) {
      console.error('Failed to parse recipes:', recipesText)
      return NextResponse.json({
        error: 'Failed to parse recipes',
        raw: recipesText
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error generating recipes:', error)

    if (error?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 500 })
    }
    if (error?.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    if (error?.message) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Failed to generate recipes' }, { status: 500 })
  }
}
