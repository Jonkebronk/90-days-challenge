/**
 * Juni AI Agent API Endpoint
 *
 * POST /api/ai/agent
 *
 * Agentic loop implementation för Juni.
 * Använder Anthropics tool use för att:
 * - Söka livsmedel
 * - Beräkna makros
 * - Validera och skapa kostplaner
 * - Hantera godkännande-flöden
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { ALL_TOOLS, type JuniToolName, type ToolResult } from '@/lib/ai/tools';
import { executeJuniTool } from '@/lib/ai/tool-executor';
import { buildAgentSystemPrompt, type AgentMode, type AgentContext } from '@/lib/ai/agent-prompt';

// =============================================================================
// TYPES
// =============================================================================

interface AgentRequest {
  message: string;
  conversationId?: string;
  mode: AgentMode;
  nutritionPlanId?: string;
  clientId?: string;
  approvalContext?: {
    type: 'meal_plan' | 'nutrition_plan';
    data: any;
  };
}

interface AgentResponse {
  response: string;
  toolCalls?: Array<{
    name: string;
    input: any;
    result: any;
  }>;
  requiresApproval?: boolean;
  approvalRequest?: {
    type: 'meal_plan' | 'nutrition_plan';
    summary: string;
    details: any;
  };
  conversationId: string;
}

interface StoredMessage {
  role: 'user' | 'assistant';
  content: string | Anthropic.ContentBlock[];
  timestamp: Date;
  toolCalls?: Array<{ name: string; input: any; result: any }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_ITERATIONS = 10; // Säkerhetsgräns för agentic loop
const anthropic = new Anthropic();

// =============================================================================
// HELPERS
// =============================================================================

async function getOrCreateConversation(
  conversationId: string | undefined,
  nutritionPlanId: string | undefined,
  clientId: string | undefined
): Promise<{ id: string; messages: StoredMessage[] }> {
  if (conversationId) {
    // Försök hämta befintlig konversation
    const existing = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
    });

    if (existing) {
      return {
        id: existing.id,
        messages: (existing.messages as unknown as StoredMessage[]) || [],
      };
    }
  }

  // Om nutritionPlanId finns, kolla om det redan finns en konversation
  if (nutritionPlanId) {
    const existingByPlan = await prisma.aIConversation.findUnique({
      where: { nutritionPlanId },
    });

    if (existingByPlan) {
      return {
        id: existingByPlan.id,
        messages: (existingByPlan.messages as unknown as StoredMessage[]) || [],
      };
    }

    // Skapa ny konversation kopplad till planen
    const newConv = await prisma.aIConversation.create({
      data: {
        nutritionPlanId,
        messages: [],
      },
    });

    return { id: newConv.id, messages: [] };
  }

  // Wizard mode utan plan - skapa temporär konversation
  // Vi använder en unik identifierare baserad på clientId eller genererad
  const tempId = `wizard_${clientId || Date.now()}`;

  // Kolla om det redan finns en wizard-konversation för denna klient
  // Notera: Detta är en workaround - i produktion bör vi ha en separat tabell för wizard-konversationer
  const existing = await prisma.aIConversation.findFirst({
    where: {
      id: tempId,
    },
  });

  if (existing) {
    return {
      id: existing.id,
      messages: (existing.messages as unknown as StoredMessage[]) || [],
    };
  }

  // För wizard utan plan skapar vi inte i databasen än
  // Vi returnerar tom konversation som hanteras i minnet
  return { id: tempId, messages: [] };
}

async function saveConversation(
  conversationId: string,
  messages: StoredMessage[],
  nutritionPlanId?: string
): Promise<void> {
  // Om det är en wizard-konversation utan plan, skippa sparning
  if (conversationId.startsWith('wizard_') && !nutritionPlanId) {
    return;
  }

  if (nutritionPlanId) {
    await prisma.aIConversation.upsert({
      where: { nutritionPlanId },
      create: {
        nutritionPlanId,
        messages: messages as any,
      },
      update: {
        messages: messages as any,
      },
    });
  }
}

async function buildContext(
  mode: AgentMode,
  nutritionPlanId?: string,
  clientId?: string
): Promise<AgentContext> {
  const context: AgentContext = { mode };

  if (nutritionPlanId) {
    const plan = await prisma.clientNutritionPlan.findUnique({
      where: { id: nutritionPlanId },
      include: { client: true },
    });

    if (plan) {
      context.clientName = plan.client.name || undefined;
      context.nutritionPlanId = plan.id;
      context.targetMacros = {
        protein: Number(plan.proteinGrams),
        carbs: Number(plan.carbGrams),
        fat: Number(plan.fatGrams),
        kcal: Number(plan.dailyCalorieTarget),
      };
      context.mealsPerDay = plan.mealsPerDay;
      context.allergies = plan.client.allergies?.split(',').map((a: string) => a.trim()).filter(Boolean) || [];
      context.dietaryPreferences = (plan as any).dietaryPreferences || undefined;
      context.workoutTime = plan.workoutTime || undefined;
    }
  } else if (clientId) {
    const client = await prisma.user.findUnique({
      where: { id: clientId },
    });

    if (client) {
      context.clientName = client.name || undefined;
      context.allergies = (client as any).allergies?.split(',').map((a: string) => a.trim()).filter(Boolean) || [];
    }
  }

  return context;
}

function extractTextFromContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('\n');
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: Request) {
  try {
    const body: AgentRequest = await request.json();
    const { message, conversationId, mode, nutritionPlanId, clientId, approvalContext } = body;

    console.log('Agent API received:', {
      mode,
      messageLength: message?.length,
      hasApprovalContext: !!approvalContext,
      nutritionPlanId,
      clientId,
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Meddelande krävs' },
        { status: 400 }
      );
    }

    // Hämta kontext för agenten
    const context = await buildContext(mode, nutritionPlanId, clientId);
    const systemPrompt = buildAgentSystemPrompt(context);

    // Hämta eller skapa konversation
    const conversation = await getOrCreateConversation(conversationId, nutritionPlanId, clientId);

    // Bygg meddelandelista för Claude
    const claudeMessages: Anthropic.MessageParam[] = conversation.messages
      .filter(m => {
        // Filtrera bort tomma meddelanden
        if (typeof m.content === 'string') {
          return m.content.trim().length > 0;
        }
        return Array.isArray(m.content) && m.content.length > 0;
      })
      .map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : m.content as any,
      }));

    // Lägg till användarens nya meddelande
    claudeMessages.push({ role: 'user', content: message });

    // Spåra alla tool calls för responsen
    const allToolCalls: Array<{ name: string; input: any; result: any }> = [];
    let pendingApproval: AgentResponse['approvalRequest'] | undefined;

    // =======================================================================
    // AGENTIC LOOP
    // =======================================================================
    let iterations = 0;
    let continueLoop = true;
    let response: Anthropic.Message | null = null;

    while (continueLoop && iterations < MAX_ITERATIONS) {
      iterations++;
      console.log(`Agent loop iteration ${iterations}`);

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools: ALL_TOOLS,
        messages: claudeMessages,
      });

      console.log('Claude response:', {
        stopReason: response.stop_reason,
        contentTypes: response.content.map(c => c.type),
      });

      // Kolla om Claude vill använda tools
      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        // Lägg till assistant-svaret i historiken
        claudeMessages.push({ role: 'assistant', content: response.content });

        // Exekvera varje tool
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          console.log(`Executing tool: ${toolUse.name}`, toolUse.input);

          const result = await executeJuniTool(
            toolUse.name as JuniToolName,
            toolUse.input as Record<string, any>,
            { nutritionPlanId, clientId }
          );

          console.log(`Tool result:`, {
            success: result.success,
            requiresApproval: result.requires_approval,
          });

          allToolCalls.push({
            name: toolUse.name,
            input: toolUse.input,
            result,
          });

          // Kolla om detta kräver godkännande
          if (result.requires_approval) {
            pendingApproval = {
              type: result.approval_type!,
              summary: result.summary || 'Förslag väntar på godkännande',
              details: result.data,
            };
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        }

        // Lägg till tool results
        claudeMessages.push({ role: 'user', content: toolResults });

      } else {
        // Claude är klar (stop_reason === 'end_turn' eller annat)
        continueLoop = false;
      }
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn('Agent reached max iterations limit');
    }

    // Extrahera slutgiltigt svar
    const finalText = response
      ? extractTextFromContent(response.content)
      : 'Något gick fel - inget svar genererades.';

    // Spara konversationen
    const updatedMessages: StoredMessage[] = [
      ...conversation.messages,
      {
        role: 'user',
        content: message,
        timestamp: new Date(),
      },
      {
        role: 'assistant',
        content: finalText,
        timestamp: new Date(),
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
      },
    ];

    await saveConversation(conversation.id, updatedMessages, nutritionPlanId);

    // Bygg respons
    const agentResponse: AgentResponse = {
      response: finalText,
      conversationId: conversation.id,
    };

    if (allToolCalls.length > 0) {
      agentResponse.toolCalls = allToolCalls;
    }

    if (pendingApproval) {
      agentResponse.requiresApproval = true;
      agentResponse.approvalRequest = pendingApproval;
    }

    return NextResponse.json(agentResponse);

  } catch (error) {
    console.error('Agent API error:', error);

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Ett fel uppstod: ${errorMsg}` },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Hämta konversation
// =============================================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const nutritionPlanId = searchParams.get('nutritionPlanId');

    if (!conversationId && !nutritionPlanId) {
      return NextResponse.json(
        { error: 'conversationId eller nutritionPlanId krävs' },
        { status: 400 }
      );
    }

    let conversation;

    if (conversationId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
      });
    } else if (nutritionPlanId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { nutritionPlanId },
      });
    }

    return NextResponse.json({
      messages: conversation?.messages || [],
      conversationId: conversation?.id,
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta konversation' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Rensa konversation
// =============================================================================

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const nutritionPlanId = searchParams.get('nutritionPlanId');

    if (!conversationId && !nutritionPlanId) {
      return NextResponse.json(
        { error: 'conversationId eller nutritionPlanId krävs' },
        { status: 400 }
      );
    }

    if (nutritionPlanId) {
      await prisma.aIConversation.delete({
        where: { nutritionPlanId },
      });
    } else if (conversationId) {
      await prisma.aIConversation.delete({
        where: { id: conversationId },
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Kunde inte radera konversation' },
      { status: 500 }
    );
  }
}
