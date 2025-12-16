'use client';

import { useState } from 'react';
import { User, Bot, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AIMessage } from '@/lib/ai/types';

interface ChatMessageProps {
  message: AIMessage;
  onFeedback?: (rating: number, typ: string) => void;
  isLast?: boolean;
}

export function ChatMessage({ message, onFeedback, isLast }: ChatMessageProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);

  const isUser = message.role === 'user';

  const handleFeedback = (typ: 'bra' | 'kan_forbattras' | 'fel') => {
    if (feedbackGiven) return;

    const rating = typ === 'bra' ? 5 : typ === 'kan_forbattras' ? 3 : 1;
    onFeedback?.(rating, typ);
    setFeedbackGiven(typ);
  };

  // Formatera innehållet för bättre visning
  const formatContent = (content: string) => {
    // Konvertera markdown-liknande formatering till enkel HTML
    return content
      .split('\n')
      .map((line, i) => {
        // Rubrikrader
        if (line.startsWith('MÅLTID') || line.startsWith('TOTALT:') || line.startsWith('ALTERNATIV:')) {
          return (
            <span key={i} className="font-semibold text-primary block mt-2">
              {line}
            </span>
          );
        }
        // Träd-struktur
        if (line.startsWith('├─') || line.startsWith('└─')) {
          return (
            <span key={i} className="block ml-2 text-sm font-mono">
              {line}
            </span>
          );
        }
        // Streckade linjer
        if (line.includes('───')) {
          return (
            <span key={i} className="block text-muted-foreground text-xs">
              {line}
            </span>
          );
        }
        // Listor
        if (line.startsWith('•') || line.startsWith('-')) {
          return (
            <span key={i} className="block ml-4 text-sm">
              {line}
            </span>
          );
        }
        // Warnings/tips
        if (line.includes('⚠️') || line.includes('✅') || line.includes('📊')) {
          return (
            <span key={i} className="block font-medium">
              {line}
            </span>
          );
        }
        // Normal text
        return line ? (
          <span key={i} className="block">
            {line}
          </span>
        ) : (
          <br key={i} />
        );
      });
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg',
        isUser ? 'bg-primary/10' : 'bg-muted/50'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-purple-500 text-white'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser ? 'Du' : 'AI Assistent'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString('sv-SE', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Reasoning (chain-of-thought) */}
        {message.reasoning && (
          <div className="mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground p-0 hover:bg-transparent"
              onClick={() => setShowReasoning(!showReasoning)}
            >
              {showReasoning ? (
                <ChevronUp className="h-3 w-3 mr-1" />
              ) : (
                <ChevronDown className="h-3 w-3 mr-1" />
              )}
              Visa tankegång
            </Button>
            {showReasoning && (
              <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground italic">
                {message.reasoning}
              </div>
            )}
          </div>
        )}

        {/* Message content */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {formatContent(message.content)}
        </div>

        {/* Feedback buttons (only for assistant messages) */}
        {!isUser && isLast && onFeedback && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Var detta svar hjälpsamt?</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 w-7 p-0',
                  feedbackGiven === 'bra' && 'bg-green-100 text-green-600'
                )}
                onClick={() => handleFeedback('bra')}
                disabled={!!feedbackGiven}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 w-7 p-0',
                  feedbackGiven === 'kan_forbattras' && 'bg-yellow-100 text-yellow-600'
                )}
                onClick={() => handleFeedback('kan_forbattras')}
                disabled={!!feedbackGiven}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 w-7 p-0',
                  feedbackGiven === 'fel' && 'bg-red-100 text-red-600'
                )}
                onClick={() => handleFeedback('fel')}
                disabled={!!feedbackGiven}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </div>
            {feedbackGiven && (
              <span className="text-xs text-muted-foreground">Tack för din feedback!</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
