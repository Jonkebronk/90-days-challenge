/**
 * Juni AI Agent - Streaming API Endpoint
 *
 * POST /api/ai/agent/stream
 *
 * Streaming version av agent API:et som ger realtidsfeedback:
 * - Visar vilka tools som körs
 * - Streamar text medan Juni tänker
 * - Progress-uppdateringar
 */

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
}

interface StreamEvent {
  type: 'status' | 'tool_start' | 'tool_end' | 'text_delta' | 'text_done' | 'approval' | 'error' | 'done';
  data: any;
}

interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{ name: string; input: any; result: any }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_ITERATIONS = 10;
const anthropic = new Anthropic();

// =============================================================================
// HELPERS
// =============================================================================

function createSSEMessage(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

async function getClientMemory(clientId: string): Promise<any> {
  const memory = await prisma.clientAIMemory.findFirst({
    where: { clientId }
  });
  return memory;
}

async function buildContextWithMemory(
  mode: AgentMode,
  nutritionPlanId?: string,
  clientId?: string
): Promise<{ context: AgentContext; memory: any }> {
  const context: AgentContext = { mode };
  let memory = null;

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

      // Hämta klientminne
      memory = await getClientMemory(plan.clientId);
    }
  } else if (clientId) {
    const client = await prisma.user.findUnique({
      where: { id: clientId },
    });

    if (client) {
      context.clientName = client.name || undefined;
      context.allergies = (client as any).allergies?.split(',').map((a: string) => a.trim()).filter(Boolean) || [];
      memory = await getClientMemory(clientId);
    }
  }

  return { context, memory };
}

async function getOrCreateConversation(
  conversationId: string | undefined,
  nutritionPlanId: string | undefined,
  clientId: string | undefined
): Promise<{ id: string; messages: StoredMessage[] }> {
  if (nutritionPlanId) {
    const existing = await prisma.aIConversation.findUnique({
      where: { nutritionPlanId },
    });

    if (existing) {
      return {
        id: existing.id,
        messages: (existing.messages as unknown as StoredMessage[]) || [],
      };
    }

    const newConv = await prisma.aIConversation.create({
      data: { nutritionPlanId, messages: [] },
    });
    return { id: newConv.id, messages: [] };
  }

  return { id: `wizard_${clientId || Date.now()}`, messages: [] };
}

async function saveConversation(
  conversationId: string,
  messages: StoredMessage[],
  nutritionPlanId?: string
): Promise<void> {
  if (conversationId.startsWith('wizard_') && !nutritionPlanId) return;

  if (nutritionPlanId) {
    await prisma.aIConversation.upsert({
      where: { nutritionPlanId },
      create: { nutritionPlanId, messages: messages as any },
      update: { messages: messages as any },
    });
  }
}

// =============================================================================
// STREAMING HANDLER
// =============================================================================

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(createSSEMessage(event)));
      };

      try {
        const body: AgentRequest = await request.json();
        const { message, conversationId, mode, nutritionPlanId, clientId } = body;

        if (!message) {
          send({ type: 'error', data: { message: 'Meddelande krävs' } });
          controller.close();
          return;
        }

        send({ type: 'status', data: { message: 'Förbereder...', phase: 'init' } });

        // Hämta kontext och minne
        const { context, memory } = await buildContextWithMemory(mode, nutritionPlanId, clientId);

        // Bygg system prompt med minne
        let systemPrompt = buildAgentSystemPrompt(context);

        // Lägg till klientminne om det finns
        if (memory) {
          const memorySection = `
<client_memory>
Detta är vad du tidigare lärt dig om klienten:
${memory.preferenser?.length > 0 ? `- Preferenser: ${memory.preferenser.join(', ')}` : ''}
${memory.framgangsrika?.length > 0 ? `- Fungerar bra: ${memory.framgangsrika.join(', ')}` : ''}
${memory.undvikMonster?.length > 0 ? `- Undvik: ${memory.undvikMonster.join(', ')}` : ''}

Använd denna information aktivt när du ger förslag. Referera till vad du vet om klienten.
</client_memory>
`;
          systemPrompt += memorySection;
        }

        // Hämta konversation
        const conversation = await getOrCreateConversation(conversationId, nutritionPlanId, clientId);

        // Bygg meddelandelista
        const claudeMessages: Anthropic.MessageParam[] = conversation.messages
          .filter(m => typeof m.content === 'string' && m.content.trim().length > 0)
          .map(m => ({ role: m.role, content: m.content as string }));

        claudeMessages.push({ role: 'user', content: message });

        // Spåra tool calls
        const allToolCalls: Array<{ name: string; input: any; result: any }> = [];
        let pendingApproval: any = null;
        let fullResponse = '';

        // =======================================================================
        // AGENTIC LOOP MED STREAMING
        // =======================================================================

        let iterations = 0;
        let continueLoop = true;

        while (continueLoop && iterations < MAX_ITERATIONS) {
          iterations++;

          send({
            type: 'status',
            data: {
              message: iterations === 1 ? 'Analyserar...' : `Fortsätter (steg ${iterations})...`,
              phase: 'thinking',
              iteration: iterations
            }
          });

          // Använd streaming för Claude-anropet
          const stream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: systemPrompt,
            tools: ALL_TOOLS,
            messages: claudeMessages,
          });

          let currentText = '';
          const toolUseBlocks: Anthropic.ToolUseBlock[] = [];

          // Processa streaming events
          for await (const event of stream) {
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'text') {
                // Text börjar
              } else if (event.content_block.type === 'tool_use') {
                send({
                  type: 'tool_start',
                  data: {
                    name: event.content_block.name,
                    toolIndex: event.index
                  }
                });
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                currentText += event.delta.text;
                send({
                  type: 'text_delta',
                  data: { text: event.delta.text }
                });
              }
            }
          }

          // Hämta slutgiltigt meddelande
          const finalMessage = await stream.finalMessage();

          // Extrahera tool use blocks
          for (const block of finalMessage.content) {
            if (block.type === 'tool_use') {
              toolUseBlocks.push(block);
            } else if (block.type === 'text') {
              fullResponse = block.text;
            }
          }

          // Kolla om vi ska fortsätta med tools
          if (finalMessage.stop_reason === 'tool_use' && toolUseBlocks.length > 0) {
            claudeMessages.push({ role: 'assistant', content: finalMessage.content });

            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolUse of toolUseBlocks) {
              send({
                type: 'tool_start',
                data: {
                  name: toolUse.name,
                  message: getToolMessage(toolUse.name)
                }
              });

              const result = await executeJuniTool(
                toolUse.name as JuniToolName,
                toolUse.input as Record<string, any>,
                { nutritionPlanId, clientId }
              );

              send({
                type: 'tool_end',
                data: {
                  name: toolUse.name,
                  success: result.success,
                  summary: getToolResultSummary(toolUse.name, result)
                }
              });

              allToolCalls.push({
                name: toolUse.name,
                input: toolUse.input,
                result,
              });

              if (result.requires_approval) {
                pendingApproval = {
                  type: result.approval_type,
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

            claudeMessages.push({ role: 'user', content: toolResults });

          } else {
            continueLoop = false;
          }
        }

        // Skicka slutgiltigt svar
        send({
          type: 'text_done',
          data: { text: fullResponse }
        });

        // Skicka approval om det finns
        if (pendingApproval) {
          send({
            type: 'approval',
            data: pendingApproval
          });
        }

        // Spara konversation
        const updatedMessages: StoredMessage[] = [
          ...conversation.messages,
          { role: 'user', content: message, timestamp: new Date() },
          {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
            toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
          },
        ];

        await saveConversation(conversation.id, updatedMessages, nutritionPlanId);

        // Skicka done
        send({
          type: 'done',
          data: {
            conversationId: conversation.id,
            toolCalls: allToolCalls,
            requiresApproval: !!pendingApproval
          }
        });

        controller.close();

      } catch (error) {
        console.error('Streaming agent error:', error);
        send({
          type: 'error',
          data: { message: error instanceof Error ? error.message : 'Ett fel uppstod' }
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// =============================================================================
// TOOL MESSAGE HELPERS
// =============================================================================

function getToolMessage(toolName: string): string {
  const messages: Record<string, string> = {
    search_foods: 'Söker i livsmedelsdatabasen...',
    calculate_macros: 'Beräknar makronäringsämnen...',
    validate_meal_plan: 'Validerar kostplanen...',
    propose_meal_plan: 'Förbereder förslag...',
    save_meal_plan: 'Sparar kostschema...',
    get_client_info: 'Hämtar klientinformation...',
    update_client_memory: 'Sparar preferens...',
    search_recipes: 'Söker i receptbanken...',
    suggest_recipes_for_meal: 'Hittar passande recept...',
    get_recipe_details: 'Hämtar receptdetaljer...',
    calculate_bmr_tdee: 'Beräknar energibehov...',
    calculate_macro_targets: 'Beräknar makromål...',
    create_nutrition_plan: 'Förbereder kostplan...',
  };
  return messages[toolName] || `Kör ${toolName}...`;
}

function getToolResultSummary(toolName: string, result: ToolResult): string {
  if (!result.success) {
    return result.error || 'Misslyckades';
  }

  switch (toolName) {
    case 'search_foods':
      return `Hittade ${result.data?.results?.length || 0} livsmedel`;
    case 'search_recipes':
      return `Hittade ${result.data?.results?.length || 0} recept`;
    case 'suggest_recipes_for_meal':
      return `${result.data?.suggestions?.length || 0} receptförslag`;
    case 'calculate_macros':
      const totals = result.data?.totals;
      return totals ? `${totals.kcal} kcal, ${totals.protein}g protein` : 'Beräknat';
    case 'validate_meal_plan':
      return result.data?.valid ? 'Godkänd' : `${result.data?.issues?.length || 0} problem`;
    case 'calculate_bmr_tdee':
      return `TDEE: ${result.data?.tdee} kcal`;
    case 'calculate_macro_targets':
      return `${result.data?.daily_calories} kcal/dag`;
    default:
      return 'Klar';
  }
}
