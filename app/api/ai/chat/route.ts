/**
 * AI Chat API Endpoint
 *
 * POST /api/ai/chat
 *
 * Hanterar konversationer med AI Kostplaneringsagenten.
 * Använder ENDAST Livsmedelsverkets (SLV) databas med 2575 livsmedel.
 * Inkluderar:
 * - Livsmedelsverket SLV (2575 livsmedel + mikronutrienter)
 * - Klientminne
 * - Konversationshistorik
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { buildSystemPrompt, getDefaultSettings } from '@/lib/ai/prompt-builder';
import {
  AIChatRequest,
  AIChatResponse,
  SlvFoodForPrompt,
  ClientDataForPrompt,
  NutritionPlanForPrompt,
  ClientMemory,
  CoachAISettingsInput,
  AIMessage,
} from '@/lib/ai/types';
import type { ImageBlockParam, TextBlockParam } from '@anthropic-ai/sdk/resources/messages';
import * as fs from 'fs';
import * as path from 'path';

// Initialisera Anthropic-klient
const anthropic = new Anthropic();

// Ladda SLV-data från JSON-fil
function loadSlvData(): SlvFoodForPrompt[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'slv-foods.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Platta ut alla kategorier till en array
    const allFoods: SlvFoodForPrompt[] = [];
    for (const category of Object.values(data.categories)) {
      allFoods.push(...(category as SlvFoodForPrompt[]));
    }
    return allFoods;
  } catch (error) {
    console.error('Kunde inte ladda SLV-data:', error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body: AIChatRequest = await request.json();
    const { nutritionPlanId, message, images = [], includeHistory = true } = body;

    console.log('AI Chat API received:', {
      nutritionPlanId,
      messageLength: message?.length,
      imagesCount: images?.length || 0,
      imageTypes: images?.map(i => i.mediaType) || [],
    });

    if (!nutritionPlanId || (!message && images.length === 0)) {
      return NextResponse.json(
        { error: 'nutritionPlanId och message eller bilder krävs' },
        { status: 400 }
      );
    }

    // Hämta kostplanen med klient
    const plan = await prisma.clientNutritionPlan.findUnique({
      where: { id: nutritionPlanId },
      include: {
        client: true,
        aiConversation: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Kostplan hittades inte' },
        { status: 404 }
      );
    }

    // Hämta coach-inställningar och klientminne
    const [coachSettings, clientMemory] = await Promise.all([
      // Coach AI-inställningar (inkl. mallbild)
      prisma.coachAISettings.findUnique({
        where: { coachId: plan.coachId },
        select: {
          proteinMinPerKg: true,
          proteinMaxPerKg: true,
          fettMinPerKg: true,
          kolhydratPreWorkout: true,
          kolhydratPostWorkout: true,
          kolhydratKvallsmal: true,
          fettPreWorkout: true,
          fettPostWorkout: true,
          fettKvallsmal: true,
          favoritProteinkallor: true,
          favoritKolhydratkallor: true,
          favoritFettkallor: true,
          undviknaLivsmedel: true,
          ton: true,
          detaljniva: true,
          extraInstruktioner: true,
          templateImage: true,
          templateImageType: true,
        },
      }),
      // Klientminne
      prisma.clientAIMemory.findUnique({
        where: { clientId: plan.clientId },
      }),
    ]);

    // Ladda SLV-data (Livsmedelsverkets officiella databas)
    const slvFoods = loadSlvData();

    // Formatera klientdata
    const clientData: ClientDataForPrompt = {
      name: plan.client.name || 'Klient',
      weight: Number(plan.weight),
      height: plan.height,
      age: plan.age,
      gender: plan.gender as 'male' | 'female',
      allergies: plan.client.allergies || undefined,
      dislikedFood: plan.client.dislikedFood || undefined,
    };

    // Formatera plandata
    const planData: NutritionPlanForPrompt = {
      id: plan.id,
      weight: Number(plan.weight),
      calorieGoal: plan.calorieGoal,
      dailyCalorieTarget: Number(plan.dailyCalorieTarget),
      proteinGrams: Number(plan.proteinGrams),
      carbGrams: Number(plan.carbGrams),
      fatGrams: Number(plan.fatGrams),
      mealsPerDay: plan.mealsPerDay,
      workoutTime: plan.workoutTime,
      nutritionSystem: plan.nutritionSystem,
    };

    // Formatera coach-inställningar
    const settings: CoachAISettingsInput = coachSettings
      ? {
          proteinMinPerKg: Number(coachSettings.proteinMinPerKg),
          proteinMaxPerKg: Number(coachSettings.proteinMaxPerKg),
          fettMinPerKg: Number(coachSettings.fettMinPerKg),
          kolhydratPreWorkout: Number(coachSettings.kolhydratPreWorkout),
          kolhydratPostWorkout: Number(coachSettings.kolhydratPostWorkout),
          kolhydratKvallsmal: Number(coachSettings.kolhydratKvallsmal),
          fettPreWorkout: Number(coachSettings.fettPreWorkout),
          fettPostWorkout: Number(coachSettings.fettPostWorkout),
          fettKvallsmal: Number(coachSettings.fettKvallsmal),
          favoritProteinkallor: coachSettings.favoritProteinkallor,
          favoritKolhydratkallor: coachSettings.favoritKolhydratkallor,
          favoritFettkallor: coachSettings.favoritFettkallor,
          undviknaLivsmedel: coachSettings.undviknaLivsmedel,
          ton: coachSettings.ton as 'avslappnad' | 'professionell' | 'motiverande',
          detaljniva: coachSettings.detaljniva as 'kortfattad' | 'detaljerad' | 'utforlig',
          extraInstruktioner: coachSettings.extraInstruktioner || undefined,
        }
      : getDefaultSettings();

    // Formatera klientminne
    const memory: ClientMemory | null = clientMemory
      ? {
          preferenser: clientMemory.preferenser,
          framgangsrika: clientMemory.framgangsrika,
          undvikMonster: clientMemory.undvikMonster,
        }
      : null;

    // Bygg systemprompt (endast med SLV-livsmedel)
    const systemPrompt = buildSystemPrompt({
      client: clientData,
      plan: planData,
      products: [], // Ej längre använt - endast SLV
      recipes: [], // Ej längre använt - endast SLV
      slvFoods,
      settings,
      memory,
    });

    // Hämta konversationshistorik
    const previousMessages: AIMessage[] = includeHistory && plan.aiConversation
      ? (plan.aiConversation.messages as unknown as AIMessage[]) || []
      : [];

    // Bygg meddelandelista för Claude (med bildstöd)
    // Filtrera och formatera tidigare meddelanden korrekt
    const claudeMessages: Anthropic.MessageParam[] = previousMessages
      .filter(m => m.content && typeof m.content === 'string' && m.content.trim().length > 0)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Bygg det nya user-meddelandet med eventuella bilder
    const userContent: (ImageBlockParam | TextBlockParam)[] = [];

    // Lägg till bilder först
    if (images && images.length > 0) {
      console.log(`Processing ${images.length} images for Claude`);
      for (const img of images) {
        console.log(`Adding image: type=${img.mediaType}, base64Length=${img.base64?.length || 0}`);
        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType,
            data: img.base64,
          },
        });
      }
    }

    // Lägg till textmeddelandet
    if (message) {
      userContent.push({
        type: 'text',
        text: message,
      });
    } else if (images.length > 0) {
      // Om bara bilder utan text - be AI:n analysera kostschema-bilden
      userContent.push({
        type: 'text',
        text: `Analysera denna bild. Om det är ett kostschema/måltidsplan, extrahera alla måltider och livsmedel med gramvikter. Använd sedan MÅLTID X-formatet för att visa varje måltid med livsmedel och makros. Om det är en bild av mat, uppskatta näringsinnehållet.`,
      });
    }

    claudeMessages.push({
      role: 'user',
      content: userContent,
    });

    // Lägg till mallbild som första meddelande om den finns
    // Skickas ALLTID i början av konversationen så AI:n har referensen
    if (coachSettings?.templateImage && coachSettings?.templateImageType) {
      console.log('Adding template image as first message, base64 length:', coachSettings.templateImage.length);
      // Injicera mallbild som första user+assistant-utbyte
      claudeMessages.unshift(
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: coachSettings.templateImageType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: coachSettings.templateImage,
              },
            },
            {
              type: 'text',
              text: `MALL-KOSTSCHEMA: Detta är ett exempel på hur ett kostschema ska se ut.

VIKTIGT: När användaren ber dig "generera ett kostschema" eller "applicera på schemat", ska du:
1. Läsa av EXAKT vilka livsmedel och gramvikter som visas i denna mallbild
2. Återge dessa i MÅLTID X-formatet med exakta namn och vikter
3. INTE hitta på egna livsmedel eller vikter - använd ENDAST det som syns i bilden

Analysera bilden nu och lista alla måltider med livsmedel och gramvikter du ser.`,
            },
          ],
        },
        {
          role: 'assistant',
          content: `Jag har analyserat mallbilden. Jag ser ett komplett kostschema med flera måltider. När du ber mig generera eller applicera ett kostschema kommer jag att återge EXAKT de livsmedel och gramvikter som visas i mallbilden, inte hitta på egna. Vad vill du att jag ska göra?`,
        }
      );
    }

    // Anropa Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: claudeMessages,
    });

    // Extrahera svaret
    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Extrahera reasoning om det finns
    const reasoningMatch = assistantMessage.match(
      /<reasoning>([\s\S]*?)<\/reasoning>/
    );
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : null;
    const cleanResponse = assistantMessage
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '')
      .trim();

    // Uppdatera konversationshistorik
    const newMessages: AIMessage[] = [
      ...previousMessages,
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: assistantMessage, timestamp: new Date(), reasoning: reasoning || undefined },
    ];

    await prisma.aIConversation.upsert({
      where: { nutritionPlanId },
      create: {
        nutritionPlanId,
        messages: newMessages as any,
      },
      update: {
        messages: newMessages as any,
      },
    });

    const responseData: AIChatResponse = {
      response: cleanResponse,
      reasoning,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('AI Chat error:', error);
    // Logga mer detaljer för felsökning
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      // Kolla om det är ett Anthropic API-fel
      if (error.message.includes('image') || error.message.includes('base64')) {
        console.error('Possible image encoding issue');
      }
    }
    // Returnera mer specifikt felmeddelande
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Ett fel uppstod vid kommunikation med AI:n: ${errorMsg}` },
      { status: 500 }
    );
  }
}

// GET - Hämta konversationshistorik
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nutritionPlanId = searchParams.get('nutritionPlanId');

    if (!nutritionPlanId) {
      return NextResponse.json(
        { error: 'nutritionPlanId krävs' },
        { status: 400 }
      );
    }

    const conversation = await prisma.aIConversation.findUnique({
      where: { nutritionPlanId },
    });

    return NextResponse.json({
      messages: conversation?.messages || [],
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta konversation' },
      { status: 500 }
    );
  }
}

// DELETE - Rensa konversationshistorik
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nutritionPlanId = searchParams.get('nutritionPlanId');

    if (!nutritionPlanId) {
      return NextResponse.json(
        { error: 'nutritionPlanId krävs' },
        { status: 400 }
      );
    }

    await prisma.aIConversation.delete({
      where: { nutritionPlanId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Kunde inte radera konversation' },
      { status: 500 }
    );
  }
}
