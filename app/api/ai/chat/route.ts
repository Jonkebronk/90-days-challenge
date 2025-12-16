/**
 * AI Chat API Endpoint
 *
 * POST /api/ai/chat
 *
 * Hanterar konversationer med AI Kostplaneringsagenten.
 * Inkluderar:
 * - Coach-livsmedelsbank (Product)
 * - Receptbank (Recipe)
 * - Livsmedelsverket SLV (2575 livsmedel)
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
  ProductForPrompt,
  RecipeForPrompt,
  SlvFoodForPrompt,
  ClientDataForPrompt,
  NutritionPlanForPrompt,
  ClientMemory,
  CoachAISettingsInput,
  AIMessage,
  ImageAttachment,
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

    // Hämta all data parallellt
    const [products, recipes, coachSettings, clientMemory] = await Promise.all([
      // Coach-produkter
      prisma.product.findMany({
        take: 500,
        orderBy: { name: 'asc' },
      }),
      // Recept
      prisma.recipe.findMany({
        take: 300,
        orderBy: { title: 'asc' },
      }),
      // Coach AI-inställningar
      prisma.coachAISettings.findUnique({
        where: { coachId: plan.coachId },
      }),
      // Klientminne
      prisma.clientAIMemory.findUnique({
        where: { clientId: plan.clientId },
      }),
    ]);

    // Ladda SLV-data
    const slvFoods = loadSlvData();

    // Formatera produkter för prompten
    const formattedProducts: ProductForPrompt[] = products.map(p => ({
      id: p.id,
      name: p.name,
      kcal: Number(p.kcal) || 0,
      protein: Number(p.protein) || 0,
      carbs: Number(p.carbs) || 0,
      fat: Number(p.fat) || 0,
      category: p.category || 'Övrigt',
    }));

    // Formatera recept för prompten
    const formattedRecipes: RecipeForPrompt[] = recipes.map(r => ({
      id: r.id,
      title: r.title,
      prepTimeMinutes: r.prepTimeMinutes || 30,
      proteinPerServing: Number(r.proteinPerServing) || 0,
      carbsPerServing: Number(r.carbsPerServing) || 0,
      fatPerServing: Number(r.fatPerServing) || 0,
      kcalPerServing: Number(r.caloriesPerServing) || 0,
      category: r.mealType || 'lunch_middag',
    }));

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

    // Bygg systemprompt
    const systemPrompt = buildSystemPrompt({
      client: clientData,
      plan: planData,
      products: formattedProducts,
      recipes: formattedRecipes,
      slvFoods,
      settings,
      memory,
    });

    // Hämta konversationshistorik
    const previousMessages: AIMessage[] = includeHistory && plan.aiConversation
      ? (plan.aiConversation.messages as unknown as AIMessage[]) || []
      : [];

    // Bygg meddelandelista för Claude (med bildstöd)
    const claudeMessages: Anthropic.MessageParam[] = previousMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Bygg det nya user-meddelandet med eventuella bilder
    const userContent: (ImageBlockParam | TextBlockParam)[] = [];

    // Lägg till bilder först
    if (images && images.length > 0) {
      for (const img of images) {
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
      // Om bara bilder, be om analys
      userContent.push({
        type: 'text',
        text: 'Analysera denna bild/dessa bilder och uppskatta näringsinnehållet (kalorier, protein, kolhydrater, fett). Ge också förslag på hur det passar in i kostplanen.',
      });
    }

    claudeMessages.push({
      role: 'user',
      content: userContent,
    });

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
    return NextResponse.json(
      { error: 'Ett fel uppstod vid kommunikation med AI:n' },
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
