import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import type { AIAnalysisResult, MealType, SocialContext, ConfidenceLevel } from '@/lib/social-meal/types';
import { QUICK_TRACK_CATEGORIES, getFoodItemById } from '@/lib/social-meal/quick-track-categories';

const anthropic = new Anthropic();

// Generate list of known foods for matching
function getKnownFoodsPrompt(): string {
  const foods: string[] = [];
  for (const [category, data] of Object.entries(QUICK_TRACK_CATEGORIES)) {
    for (const item of data.commonItems) {
      foods.push(`${item.name} (${category}: ${item.id})`);
    }
  }
  return foods.join(', ');
}

const MEAL_ANALYSIS_PROMPT = `Du är en svensk näringsexpert som analyserar måltider.
Din uppgift är att identifiera matvaror och uppskatta näringsinnehåll.

## VIKTIG PRIORITERINGSORDNING:
1. **TEXT ÄR SANNING** - Om användaren beskriver vad de åt i text, använd EXAKT dessa ingredienser
2. **BILD FÖR PORTION** - Använd bilden endast för att uppskatta mängder/portioner, INTE för att identifiera maten
3. **INKLUDERA ALLT** - Missa ALDRIG drycker, tillbehör eller såser som nämns i texten

## OM KONFLIKT MELLAN TEXT OCH BILD:
- Om text säger "korv" men bilden ser ut som "skinka" → Använd "korv" från texten
- Om text säger "makaroner" men bilden visar fusilli → Använd "makaroner" från texten
- Bilden hjälper endast att uppskatta MÄNGD, inte att identifiera VAD maten är

## VANLIGA SVENSKA RÄTTER OCH HUR DE SKA TOLKAS:
- "Korv och makaroner" = Falukorv/varmkorv + kokta makaroner (INTE fusilli, INTE skinka)
- "Köttbullar och potatismos" = Svenska köttbullar + potatismos + lingonsylt
- "Pyttipanna" = Stekt potatis, lök, kött, stekt ägg
- "Pannkakor" = Svenska pannkakor + sylt/grädde
- "Husmanskost" = Klassisk svensk mat, normal portion
- "Tacos" = Köttfärs, tortilla, grönsaker, sås, ost
- "Pizza" = Hel pizza om ej annat anges (ca 800-1200 kcal)

## DRYCKER - LETA ALLTID EFTER DESSA I TEXTEN:
- "Mjölk" / "ett glas mjölk" = 2 dl mjölk (90 kcal, 7g protein)
- "Läsk" / "Coca-Cola" / "Fanta" = 33 cl (140 kcal)
- "Juice" / "apelsinjuice" = 2 dl (90 kcal)
- "Öl" = 33 cl (130 kcal)
- "Vin" = 15 cl (120 kcal)
- "Kaffe med mjölk" = 50 kcal
- "Vatten" = 0 kcal (nämn ej i output)

VIKTIGT - SVENSKA PORTIONSSTORLEKAR:
- Normal portion protein (kött/fisk): 120-150g tillagat
- Normal portion kolhydrat (potatis/ris/pasta): 150-200g tillagat
- Normal portion grönsaker: 100-150g
- Sås: 50-100ml
- Smör på bröd: 5-10g
- Olja i matlagning: 10-15ml

KÄNDA MATRÄTTER (försök matcha mot dessa om möjligt):
${getKnownFoodsPrompt()}

UPPSKATTNINGSREGLER:
1. Var försiktig med att överskatta - bättre att vara konservativ
2. Räkna med dolda kalorier: matlagningsfett, såser, dressingar
3. Restaurangportioner är ofta 20-30% större än hemlagat
4. Buffé/social måltid: folk tar ofta mer än vanligt
5. Om osäker, ange ett intervall (kcalMin/kcalMax)

Svara ENDAST med valid JSON (inget annat):
{
  "items": [
    {
      "name": "Namn på maträtt/komponent",
      "estimatedGrams": <number>,
      "confidence": "low" | "medium" | "high",
      "nutrition": {
        "kcal": <number>,
        "protein": <number>,
        "carbs": <number>,
        "fat": <number>
      },
      "matchedCategory": "protein" | "carb" | "fat" | "vegetable" | "sauce" | null,
      "matchedItemId": "<id från listan ovan>" | null
    }
  ],
  "totalNutrition": {
    "kcal": <number>,
    "kcalMin": <number>,
    "kcalMax": <number>,
    "protein": <number>,
    "carbs": <number>,
    "fat": <number>
  },
  "confidence": "low" | "medium" | "high",
  "reasoning": "Kort förklaring av uppskattningen",
  "suggestions": ["Eventuella förslag eller osäkerheter"]
}`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { text, imageBase64, mealType, socialContext } = body as {
      text?: string;
      imageBase64?: string;
      mealType?: MealType;
      socialContext?: SocialContext;
    };

    if (!text && !imageBase64) {
      return NextResponse.json(
        { error: 'Either text description or image is required' },
        { status: 400 }
      );
    }

    // Get user calibration if exists
    const calibration = await prisma.userCalibration.findUnique({
      where: { userId: session.user.id },
    });

    // Build context for the AI
    let contextInfo = '';
    if (mealType) {
      const mealTypeNames: Record<MealType, string> = {
        breakfast: 'frukost',
        lunch: 'lunch',
        dinner: 'middag',
        snack: 'mellanmål',
      };
      contextInfo += `Måltidstyp: ${mealTypeNames[mealType]}. `;
    }
    if (socialContext) {
      const contextNames: Record<string, string> = {
        family: 'familjesamling',
        friends: 'med vänner',
        restaurant: 'restaurang',
        work: 'jobb/lunch',
        takeaway: 'take-away',
        party: 'fest/kalas',
        date: 'dejt',
        solo: 'ensam',
      };
      contextInfo += `Kontext: ${contextNames[socialContext] || socialContext}. `;
    }
    if (calibration && calibration.feedbackCount > 5) {
      contextInfo += `OBS: Denna användare tenderar att ha ${
        Number(calibration.kcalMultiplier) > 1.1 ? 'större' :
        Number(calibration.kcalMultiplier) < 0.9 ? 'mindre' : 'normala'
      } portioner baserat på tidigare feedback. `;
    }

    // Build messages for Claude
    const messages: Anthropic.MessageParam[] = [];
    const content: Anthropic.ContentBlockParam[] = [];

    // Add image if provided
    if (imageBase64) {
      // Remove data URI prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      // Detect media type
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
      if (imageBase64.startsWith('data:image/png')) {
        mediaType = 'image/png';
      } else if (imageBase64.startsWith('data:image/gif')) {
        mediaType = 'image/gif';
      } else if (imageBase64.startsWith('data:image/webp')) {
        mediaType = 'image/webp';
      }

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data,
        },
      });
    }

    // Add text prompt
    let userPrompt = MEAL_ANALYSIS_PROMPT + '\n\n';
    if (contextInfo) {
      userPrompt += `KONTEXT: ${contextInfo}\n\n`;
    }
    if (text) {
      userPrompt += `ANVÄNDARENS BESKRIVNING (PRIMÄRKÄLLA - LITA PÅ DENNA):\n"${text}"\n\n`;
      userPrompt += `VIKTIGT: Användaren har explicit skrivit vad de åt. Använd EXAKT dessa ingredienser.\n`;
      userPrompt += `Glöm inte eventuella drycker som nämnts (mjölk, läsk, juice etc.).\n\n`;
    }
    if (imageBase64) {
      if (text) {
        userPrompt += 'BILDEN hjälper dig uppskatta PORTIONSSTORLEK, men TEXTEN avgör vilka ingredienser.\n';
      } else {
        userPrompt += 'ANALYSERA BILDEN OVAN och identifiera maten samt uppskatta näringsinnehållet.\n';
      }
    }

    content.push({
      type: 'text',
      text: userPrompt,
    });

    messages.push({
      role: 'user',
      content,
    });

    // Use Sonnet for better analysis
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages,
    });

    // Extract text from response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No analysis received' }, { status: 500 });
    }

    // Parse JSON from response
    let analysisText = textContent.text.trim();
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const result = JSON.parse(analysisText) as AIAnalysisResult;

      // Apply user calibration if exists
      if (calibration && calibration.feedbackCount >= 3) {
        const kcalMult = Number(calibration.kcalMultiplier);
        const proteinMult = Number(calibration.proteinMultiplier);
        const carbsMult = Number(calibration.carbsMultiplier);
        const fatMult = Number(calibration.fatMultiplier);

        result.totalNutrition.kcal = Math.round(result.totalNutrition.kcal * kcalMult);
        result.totalNutrition.protein = Math.round(result.totalNutrition.protein * proteinMult * 10) / 10;
        result.totalNutrition.carbs = Math.round(result.totalNutrition.carbs * carbsMult * 10) / 10;
        result.totalNutrition.fat = Math.round(result.totalNutrition.fat * fatMult * 10) / 10;

        if (result.totalNutrition.kcalMin) {
          result.totalNutrition.kcalMin = Math.round(result.totalNutrition.kcalMin * kcalMult);
        }
        if (result.totalNutrition.kcalMax) {
          result.totalNutrition.kcalMax = Math.round(result.totalNutrition.kcalMax * kcalMult);
        }

        // Also apply to individual items
        for (const item of result.items) {
          item.nutrition.kcal = Math.round(item.nutrition.kcal * kcalMult);
          item.nutrition.protein = Math.round(item.nutrition.protein * proteinMult * 10) / 10;
          item.nutrition.carbs = Math.round(item.nutrition.carbs * carbsMult * 10) / 10;
          item.nutrition.fat = Math.round(item.nutrition.fat * fatMult * 10) / 10;
        }

        result.suggestions = result.suggestions || [];
        result.suggestions.push(`Värdena har justerats baserat på dina ${calibration.feedbackCount} tidigare feedbacks.`);
      }

      // Determine data source
      const hasImage = !!imageBase64;
      const hasText = !!text;
      result.dataSource = hasImage && hasText ? 'hybrid' : hasImage ? 'ai_only' : hasText ? 'ai_only' : 'quick_track';
      result.success = true;

      return NextResponse.json(result);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse meal analysis',
          raw: analysisText,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error analyzing meal:', error);

    const err = error as { status?: number; message?: string };
    if (err?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 500 });
    }
    if (err?.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    if (err?.message) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to analyze meal' }, { status: 500 });
  }
}
