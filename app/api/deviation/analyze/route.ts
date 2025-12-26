import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const MEAL_ANALYSIS_PROMPT = `Du är en svensk näringsexpert som analyserar måltider för kostavvikelser.
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
- "Korv och makaroner" = Falukorv/varmkorv + kokta makaroner
- "Köttbullar och potatismos" = Svenska köttbullar + potatismos + lingonsylt
- "Pyttipanna" = Stekt potatis, lök, kött, stekt ägg
- "Pannkakor" = Svenska pannkakor + sylt/grädde
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

UPPSKATTNINGSREGLER:
1. Var försiktig med att överskatta - bättre att vara konservativ
2. Räkna med dolda kalorier: matlagningsfett, såser, dressingar
3. Restaurangportioner är ofta 20-30% större än hemlagat
4. Buffé/social måltid: folk tar ofta mer än vanligt
5. Om osäker, ange ett intervall (kcalMin/kcalMax)

KATEGORIER för varje item:
- "protein" = kött, fisk, ägg, bönor, tofu
- "carb" = pasta, ris, potatis, bröd
- "fat" = olja, smör, nötter, ost
- "vegetable" = grönsaker, sallad
- "sauce" = sås, dressing, grädde

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
      "category": "protein" | "carb" | "fat" | "vegetable" | "sauce"
    }
  ],
  "totalNutrition": {
    "kcal": <number>,
    "protein": <number>,
    "carbs": <number>,
    "fat": <number>
  },
  "confidence": "low" | "medium" | "high",
  "reasoning": "Kort förklaring av uppskattningen"
}`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { text, imageBase64 } = body as {
      text?: string;
      imageBase64?: string;
    };

    if (!text && !imageBase64) {
      return NextResponse.json(
        { error: 'Either text description or image is required' },
        { status: 400 }
      );
    }

    // Build the message content
    const content: Anthropic.MessageParam['content'] = [];
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: [{ type: 'text', text: MEAL_ANALYSIS_PROMPT }],
      },
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'Jag förstår. Jag kommer analysera måltiden och svara med JSON enligt formatet.' }],
      },
    ];

    // Build user prompt
    let userPrompt = '';

    if (text) {
      userPrompt += `ANVÄNDAREN BESKRIVER MATEN SÅ HÄR:\n"${text}"\n\n`;
      userPrompt += 'ANALYSERA TEXTEN och identifiera alla nämnda matvaror och drycker.\n';
    }

    // Add image if provided
    if (imageBase64) {
      // Determine media type
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
      if (imageBase64.startsWith('data:image/png')) {
        mediaType = 'image/png';
      } else if (imageBase64.startsWith('data:image/gif')) {
        mediaType = 'image/gif';
      } else if (imageBase64.startsWith('data:image/webp')) {
        mediaType = 'image/webp';
      }

      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data,
        },
      });

      if (text) {
        userPrompt += '\nBILDEN VISAR MÅLTIDEN - använd den för att uppskatta PORTIONSSTORLEKAR.\n';
        userPrompt += 'VIKTIGT: Lita på texten för VAD maten är, bilden för HUR MYCKET.\n';
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

    // Use Sonnet for analysis
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
      const result = JSON.parse(analysisText);
      result.success = true;

      return NextResponse.json(result);
    } catch {
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
