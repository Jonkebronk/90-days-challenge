/**
 * Juni AI Session Manager
 *
 * Hanterar checkpointing och återställning av agent-sessioner.
 * Sparar session state för att kunna:
 * - Återuppta konversationer efter avbrott
 * - Spara kontext mellan sessioner
 * - Implementera "time travel" debugging
 */

import { prisma } from '@/lib/prisma';

// =============================================================================
// TYPES
// =============================================================================

export interface SessionCheckpoint {
  id: string;
  sessionId: string;
  nutritionPlanId?: string;
  clientId?: string;
  timestamp: Date;

  // Konversationshistorik
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    toolCalls?: Array<{
      name: string;
      input: any;
      result: any;
    }>;
  }>;

  // Agent state
  agentState: {
    mode: 'wizard' | 'planning';
    currentTask?: string;
    pendingApproval?: any;
    lastToolUsed?: string;
    iterationCount: number;
  };

  // Context som byggts upp
  context: {
    clientInfo?: any;
    targetMacros?: any;
    currentMealPlan?: any;
    gatheredPreferences?: string[];
  };
}

export interface SessionSummary {
  sessionId: string;
  startedAt: Date;
  lastActivityAt: Date;
  messageCount: number;
  mode: string;
  status: 'active' | 'completed' | 'abandoned';
}

// =============================================================================
// SESSION STORAGE
// =============================================================================

// In-memory cache för aktiva sessioner (för snabb åtkomst)
const activeSessionCache = new Map<string, SessionCheckpoint>();

/**
 * Spara en checkpoint av sessionens state
 */
export async function saveCheckpoint(checkpoint: SessionCheckpoint): Promise<void> {
  // Uppdatera cache
  activeSessionCache.set(checkpoint.sessionId, checkpoint);

  // Spara till databas
  try {
    await prisma.aIConversation.upsert({
      where: {
        nutritionPlanId: checkpoint.nutritionPlanId || `session_${checkpoint.sessionId}`
      },
      create: {
        nutritionPlanId: checkpoint.nutritionPlanId || `session_${checkpoint.sessionId}`,
        messages: checkpoint.messages as any,
        // Metadata lagras i messages JSON
      },
      update: {
        messages: {
          ...checkpoint.messages as any,
          _checkpoint: {
            agentState: checkpoint.agentState,
            context: checkpoint.context,
            timestamp: checkpoint.timestamp
          }
        } as any
      }
    });
  } catch (error) {
    console.error('Failed to save checkpoint to database:', error);
    // Cache-only fallback är OK för korta sessioner
  }
}

/**
 * Hämta senaste checkpoint för en session
 */
export async function getCheckpoint(sessionId: string): Promise<SessionCheckpoint | null> {
  // Kolla cache först
  const cached = activeSessionCache.get(sessionId);
  if (cached) {
    return cached;
  }

  // Försök hämta från databas
  try {
    const conversation = await prisma.aIConversation.findFirst({
      where: {
        OR: [
          { nutritionPlanId: sessionId },
          { nutritionPlanId: `session_${sessionId}` }
        ]
      }
    });

    if (conversation) {
      const messages = conversation.messages as any;
      const checkpoint: SessionCheckpoint = {
        id: conversation.id,
        sessionId,
        nutritionPlanId: conversation.nutritionPlanId,
        timestamp: conversation.updatedAt,
        messages: Array.isArray(messages) ? messages : messages._messages || [],
        agentState: messages._checkpoint?.agentState || {
          mode: 'planning',
          iterationCount: 0
        },
        context: messages._checkpoint?.context || {}
      };

      // Cacha för framtida åtkomst
      activeSessionCache.set(sessionId, checkpoint);

      return checkpoint;
    }
  } catch (error) {
    console.error('Failed to load checkpoint from database:', error);
  }

  return null;
}

/**
 * Skapa en ny session
 */
export function createSession(
  nutritionPlanId?: string,
  clientId?: string,
  mode: 'wizard' | 'planning' = 'planning'
): SessionCheckpoint {
  const sessionId = nutritionPlanId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const checkpoint: SessionCheckpoint = {
    id: sessionId,
    sessionId,
    nutritionPlanId,
    clientId,
    timestamp: new Date(),
    messages: [],
    agentState: {
      mode,
      iterationCount: 0
    },
    context: {}
  };

  activeSessionCache.set(sessionId, checkpoint);

  return checkpoint;
}

/**
 * Uppdatera session med nytt meddelande
 */
export function addMessageToSession(
  sessionId: string,
  message: SessionCheckpoint['messages'][0]
): SessionCheckpoint | null {
  const checkpoint = activeSessionCache.get(sessionId);
  if (!checkpoint) return null;

  checkpoint.messages.push(message);
  checkpoint.timestamp = new Date();

  return checkpoint;
}

/**
 * Uppdatera agent state
 */
export function updateAgentState(
  sessionId: string,
  update: Partial<SessionCheckpoint['agentState']>
): SessionCheckpoint | null {
  const checkpoint = activeSessionCache.get(sessionId);
  if (!checkpoint) return null;

  checkpoint.agentState = {
    ...checkpoint.agentState,
    ...update
  };
  checkpoint.timestamp = new Date();

  return checkpoint;
}

/**
 * Uppdatera kontext
 */
export function updateContext(
  sessionId: string,
  update: Partial<SessionCheckpoint['context']>
): SessionCheckpoint | null {
  const checkpoint = activeSessionCache.get(sessionId);
  if (!checkpoint) return null;

  checkpoint.context = {
    ...checkpoint.context,
    ...update
  };
  checkpoint.timestamp = new Date();

  return checkpoint;
}

/**
 * Avsluta och rensa session
 */
export async function endSession(sessionId: string, save: boolean = true): Promise<void> {
  const checkpoint = activeSessionCache.get(sessionId);

  if (checkpoint && save) {
    await saveCheckpoint(checkpoint);
  }

  activeSessionCache.delete(sessionId);
}

/**
 * Hämta alla aktiva sessioner för en klient
 */
export async function getClientSessions(clientId: string): Promise<SessionSummary[]> {
  try {
    // Hämta från cache
    const cachedSessions: SessionSummary[] = [];
    activeSessionCache.forEach((checkpoint, sessionId) => {
      if (checkpoint.clientId === clientId) {
        cachedSessions.push({
          sessionId,
          startedAt: checkpoint.messages[0]?.timestamp || checkpoint.timestamp,
          lastActivityAt: checkpoint.timestamp,
          messageCount: checkpoint.messages.length,
          mode: checkpoint.agentState.mode,
          status: 'active'
        });
      }
    });

    // Hämta från databas
    const plans = await prisma.clientNutritionPlan.findMany({
      where: { clientId },
      include: {
        aiConversation: true
      }
    });

    const dbSessions: SessionSummary[] = plans
      .filter(p => p.aiConversation)
      .map(p => {
        const messages = (p.aiConversation?.messages as any[]) || [];
        return {
          sessionId: p.id,
          startedAt: p.aiConversation?.createdAt || p.createdAt,
          lastActivityAt: p.aiConversation?.updatedAt || p.updatedAt,
          messageCount: messages.length,
          mode: 'planning',
          status: 'completed' as const
        };
      });

    // Kombinera och deduplicera
    const allSessions = [...cachedSessions, ...dbSessions];
    const uniqueSessions = allSessions.reduce((acc, session) => {
      if (!acc.find(s => s.sessionId === session.sessionId)) {
        acc.push(session);
      }
      return acc;
    }, [] as SessionSummary[]);

    return uniqueSessions.sort((a, b) =>
      b.lastActivityAt.getTime() - a.lastActivityAt.getTime()
    );
  } catch (error) {
    console.error('Failed to get client sessions:', error);
    return [];
  }
}

/**
 * Återställ session till en tidigare checkpoint
 */
export async function restoreToCheckpoint(
  sessionId: string,
  messageIndex: number
): Promise<SessionCheckpoint | null> {
  const checkpoint = await getCheckpoint(sessionId);
  if (!checkpoint) return null;

  // Trimma messages till angiven punkt
  checkpoint.messages = checkpoint.messages.slice(0, messageIndex);
  checkpoint.timestamp = new Date();

  // Uppdatera cache
  activeSessionCache.set(sessionId, checkpoint);

  return checkpoint;
}

/**
 * Exportera session för debugging
 */
export function exportSession(sessionId: string): string | null {
  const checkpoint = activeSessionCache.get(sessionId);
  if (!checkpoint) return null;

  return JSON.stringify({
    ...checkpoint,
    exportedAt: new Date().toISOString()
  }, null, 2);
}

/**
 * Importera session för debugging
 */
export function importSession(jsonData: string): SessionCheckpoint | null {
  try {
    const data = JSON.parse(jsonData);
    const checkpoint: SessionCheckpoint = {
      id: data.id,
      sessionId: data.sessionId || `imported_${Date.now()}`,
      nutritionPlanId: data.nutritionPlanId,
      clientId: data.clientId,
      timestamp: new Date(data.timestamp),
      messages: data.messages,
      agentState: data.agentState,
      context: data.context
    };

    activeSessionCache.set(checkpoint.sessionId, checkpoint);

    return checkpoint;
  } catch (error) {
    console.error('Failed to import session:', error);
    return null;
  }
}
