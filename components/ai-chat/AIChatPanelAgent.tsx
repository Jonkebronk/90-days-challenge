'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RefreshCw, Trash2, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from './ChatMessage';
import { ApprovalDialog } from './ApprovalDialog';
import type { AIMessage } from '@/lib/ai/types';

// =============================================================================
// TYPES
// =============================================================================

type AgentMode = 'wizard' | 'planning';

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

interface AIChatPanelAgentProps {
  mode: AgentMode;
  nutritionPlanId?: string;
  clientId?: string;
  clientName?: string;
  targetMacros?: {
    protein: number;
    carbs: number;
    fat: number;
    kcal: number;
  };
  onPlanCreated?: (planId: string) => void;
  onMealPlanUpdated?: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIChatPanelAgent({
  mode,
  nutritionPlanId,
  clientId,
  clientName,
  targetMacros,
  onPlanCreated,
  onMealPlanUpdated,
}: AIChatPanelAgentProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [pendingApproval, setPendingApproval] = useState<AgentResponse['approvalRequest'] | null>(null);
  const [approving, setApproving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, [nutritionPlanId, clientId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const loadConversation = async () => {
    try {
      const params = new URLSearchParams();
      if (nutritionPlanId) params.append('nutritionPlanId', nutritionPlanId);
      if (conversationId) params.append('conversationId', conversationId);

      if (params.toString()) {
        const response = await fetch(`/api/ai/agent?${params}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          if (data.conversationId) {
            setConversationId(data.conversationId);
          }
        }
      }
    } catch (error) {
      console.error('Could not load conversation:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = useCallback(async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || loading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId,
          mode,
          nutritionPlanId,
          clientId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error (${response.status})`);
      }

      const data: AgentResponse = await response.json();

      // Save conversation ID
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Add assistant message
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Handle approval requests
      if (data.requiresApproval && data.approvalRequest) {
        setPendingApproval(data.approvalRequest);
      }

      // Check if a plan was created (for wizard mode)
      if (mode === 'wizard' && data.toolCalls) {
        const createPlanCall = data.toolCalls.find(tc => tc.name === 'create_nutrition_plan');
        if (createPlanCall?.result?.data?.planId) {
          onPlanCreated?.(createPlanCall.result.data.planId);
        }
      }

      // Check if meal plan was saved
      if (data.toolCalls) {
        const saveMealCall = data.toolCalls.find(tc => tc.name === 'save_meal_plan');
        if (saveMealCall?.result?.success) {
          onMealPlanUpdated?.();
        }
      }

    } catch (error) {
      console.error('Agent error:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, loading, conversationId, mode, nutritionPlanId, clientId, onPlanCreated, onMealPlanUpdated]);

  const handleApproval = async (approved: boolean, feedback?: string) => {
    if (!pendingApproval) return;

    setApproving(true);

    try {
      // Send approval message
      const approvalMessage = approved ? 'OK' : feedback || 'Avbryt';

      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: approvalMessage,
          conversationId,
          mode,
          nutritionPlanId,
          clientId,
          approvalContext: approved ? pendingApproval : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process approval');
      }

      const data: AgentResponse = await response.json();

      // Add user message
      const userMessage: AIMessage = {
        role: 'user',
        content: approvalMessage,
        timestamp: new Date(),
      };

      // Add assistant response
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);

      // Check for new approval requests
      if (data.requiresApproval && data.approvalRequest) {
        setPendingApproval(data.approvalRequest);
      } else {
        setPendingApproval(null);
      }

      // Handle callbacks
      if (approved) {
        if (pendingApproval.type === 'nutrition_plan' && data.toolCalls) {
          const createCall = data.toolCalls.find(tc => tc.name === 'create_nutrition_plan');
          if (createCall?.result?.data?.planId) {
            onPlanCreated?.(createCall.result.data.planId);
          }
        }
        if (pendingApproval.type === 'meal_plan' && data.toolCalls) {
          const saveCall = data.toolCalls.find(tc => tc.name === 'save_meal_plan');
          if (saveCall?.result?.success) {
            onMealPlanUpdated?.();
          }
        }
      }

    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setApproving(false);
    }
  };

  const handleClearConversation = async () => {
    if (!confirm('Vill du rensa konversationen?')) return;

    try {
      const params = new URLSearchParams();
      if (nutritionPlanId) params.append('nutritionPlanId', nutritionPlanId);
      if (conversationId) params.append('conversationId', conversationId);

      await fetch(`/api/ai/agent?${params}`, { method: 'DELETE' });
      setMessages([]);
      setConversationId(undefined);
      setPendingApproval(null);
    } catch (error) {
      console.error('Could not clear conversation:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (initialLoading) {
    return (
      <Card className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-h-[800px] bg-[#2f2f2f] border-[#3f3f3f]">
        <CardHeader className="py-3 border-b border-[#3f3f3f]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#e07a5f]" />
            <h3 className="font-semibold text-white">Juni - AI Kostassistent</h3>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[#e07a5f]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-h-[800px] bg-[#2f2f2f] border-[#3f3f3f]">
      {/* Header */}
      <CardHeader className="py-3 px-4 border-b border-[#3f3f3f] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#e07a5f]" />
            <h3 className="font-medium text-sm text-white">Juni - AI Kostassistent</h3>
            <Badge
              variant="outline"
              className={mode === 'wizard' ? 'border-amber-500/50 text-amber-400' : 'border-blue-500/50 text-blue-400'}
            >
              {mode === 'wizard' ? 'Skapa plan' : 'Planering'}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearConversation}
                className="text-gray-400 hover:text-red-400 h-7 w-7 p-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        {clientName && targetMacros && (
          <p className="text-xs text-gray-400">
            {clientName} |{' '}
            <span className="text-gray-300">
              P{targetMacros.protein}g K{targetMacros.carbs}g F{targetMacros.fat}g
            </span>
          </p>
        )}
      </CardHeader>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 bg-[#2f2f2f]">
        <CardContent className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-10 w-10 mx-auto mb-3 text-[#e07a5f] opacity-70" />
              <p className="text-gray-300 text-sm font-medium">
                {mode === 'wizard'
                  ? 'Hej! Jag hjalper dig skapa en ny kostplan.'
                  : 'Hur kan jag hjalpa dig med kostplanen?'}
              </p>
              <p className="text-gray-500 text-xs mt-2 max-w-[280px] mx-auto">
                {mode === 'wizard'
                  ? 'Beskriv dig sjalv - alder, vikt, mal - sa bygger jag en personlig plan at dig.'
                  : 'Jag kan generera maltidsscheman, byta livsmedel, och optimera makros.'}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              isLast={i === messages.length - 1 && !pendingApproval}
            />
          ))}

          {/* Pending approval dialog */}
          {pendingApproval && (
            <ApprovalDialog
              type={pendingApproval.type}
              summary={pendingApproval.summary}
              details={pendingApproval.details}
              onApprove={() => handleApproval(true)}
              onReject={() => handleApproval(false)}
              onModify={(feedback) => handleApproval(false, feedback)}
              isLoading={approving}
            />
          )}

          {loading && (
            <div className="flex items-center gap-2 text-gray-400 p-3 bg-[#3a3a3a] rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-[#e07a5f]" />
              <span className="text-sm">Tanker...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-[#3f3f3f] flex-shrink-0 bg-[#2f2f2f]">
        <div className="flex items-end gap-2 bg-[#404040] rounded-2xl px-3 py-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={pendingApproval ? 'Vantar pa ditt godkannande...' : 'Skriv ett meddelande...'}
            className="min-h-[24px] max-h-[120px] resize-none text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-100 placeholder:text-gray-500 py-0"
            onKeyDown={handleKeyDown}
            disabled={loading || !!pendingApproval}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim() || !!pendingApproval}
            className="p-2 bg-[#e07a5f] hover:bg-[#c96a52] disabled:bg-[#4a4a4a] disabled:cursor-not-allowed text-white rounded-full transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className="px-4 py-2 border-t border-[#3f3f3f] bg-[#2a2a2a]">
        <p className="text-[11px] text-gray-500 text-center">
          Juni ar AI och kan gora misstag. Kontrollera alltid forslagen innan du godkanner.
        </p>
      </div>
    </Card>
  );
}
