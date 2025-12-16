'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { QuickActions } from './QuickActions';
import { AIChatResponse, AIMessage } from '@/lib/ai/types';

interface AIChatPanelProps {
  nutritionPlanId: string;
  clientName: string;
  targetMacros: {
    protein: number;
    carbs: number;
    fat: number;
    kcal: number;
  };
  onGenerateSchema?: (response: string) => void;
}

export function AIChatPanel({
  nutritionPlanId,
  clientName,
  targetMacros,
  onGenerateSchema,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ladda konversationshistorik vid mount
  useEffect(() => {
    loadConversation();
  }, [nutritionPlanId]);

  // Scrolla till botten vid nya meddelanden
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    try {
      const response = await fetch(
        `/api/ai/chat?nutritionPlanId=${nutritionPlanId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Kunde inte ladda konversation:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = async (messageText?: string) => {
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
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutritionPlanId,
          message: text,
          includeHistory: true,
        }),
      });

      if (!response.ok) {
        throw new Error('API-fel');
      }

      const data: AIChatResponse = await response.json();

      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: data.response,
        reasoning: data.reasoning || undefined,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Om svaret innehåller ett genererat schema, meddela parent
      if (onGenerateSchema && data.response.includes('MÅLTID')) {
        onGenerateSchema(data.response);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: 'Ett fel uppstod. Försök igen.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleFeedback = async (
    messageIndex: number,
    rating: number,
    typ: string
  ) => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutritionPlanId,
          messageIndex,
          rating,
          typ,
        }),
      });
    } catch (error) {
      console.error('Kunde inte spara feedback:', error);
    }
  };

  const handleClearConversation = async () => {
    try {
      await fetch(`/api/ai/chat?nutritionPlanId=${nutritionPlanId}`, {
        method: 'DELETE',
      });
      setMessages([]);
    } catch (error) {
      console.error('Kunde inte rensa konversation:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initialLoading) {
    return (
      <Card className="flex flex-col h-[700px]">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">AI Kostassistent</h3>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[700px]">
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">AI Kostassistent</h3>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearConversation}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Hjälper {clientName} nå sina mål |{' '}
          <span className="font-medium">
            P{targetMacros.protein}g K{targetMacros.carbs}g F{targetMacros.fat}g
          </span>
        </p>
      </CardHeader>

      {/* Quick actions */}
      <QuickActions onSelect={handleSend} disabled={loading} />

      {/* Messages */}
      <ScrollArea className="flex-1">
        <CardContent className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ställ en fråga eller klicka på en snabbknapp</p>
              <p className="text-xs mt-2">
                Jag har tillgång till ditt livsmedelsbibliotek, receptbanken och
                Livsmedelsverkets databas.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              onFeedback={(rating, typ) => handleFeedback(i, rating, typ)}
              isLast={i === messages.length - 1}
            />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground p-3 bg-muted/50 rounded-lg">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Tänker...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t flex-shrink-0">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ställ en fråga om kost, makros eller recept..."
            className="min-h-[60px] max-h-[120px] resize-none"
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="self-end"
            size="icon"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
