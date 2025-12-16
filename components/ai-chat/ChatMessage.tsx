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
    return content
      .split('\n')
      .map((line, i) => {
        // Markdown-rubriker (## eller **)
        if (line.startsWith('## ') || line.startsWith('### ')) {
          const text = line.replace(/^#+\s*/, '');
          return (
            <div key={i} className="font-semibold text-primary mt-4 mb-2 text-base border-b border-border pb-1">
              {text}
            </div>
          );
        }
        // Bold text med **
        if (line.startsWith('**') && line.endsWith('**')) {
          const text = line.replace(/\*\*/g, '');
          return (
            <div key={i} className="font-semibold mt-3 mb-1">
              {text}
            </div>
          );
        }
        // MÅLTID-rubriker
        if (line.startsWith('MÅLTID') || line.includes('MÅLTID')) {
          return (
            <div key={i} className="font-semibold text-primary mt-4 mb-2 text-base bg-primary/5 px-2 py-1 rounded">
              {line}
            </div>
          );
        }
        // TOTALT och ALTERNATIV
        if (line.startsWith('TOTALT:') || line.startsWith('**TOTALT')) {
          const text = line.replace(/\*\*/g, '');
          return (
            <div key={i} className="font-medium text-sm bg-muted/50 px-2 py-1 rounded mt-2">
              {text}
            </div>
          );
        }
        if (line.startsWith('ALTERNATIV:') || line.startsWith('**ALTERNATIV')) {
          const text = line.replace(/\*\*/g, '');
          return (
            <div key={i} className="font-medium text-sm mt-3 mb-1 text-muted-foreground">
              {text}
            </div>
          );
        }
        // LIVSMEDEL-rubrik
        if (line.startsWith('LIVSMEDEL:') || line.startsWith('**LIVSMEDEL')) {
          const text = line.replace(/\*\*/g, '');
          return (
            <div key={i} className="font-medium text-sm mt-2 mb-1">
              {text}
            </div>
          );
        }
        // Träd-struktur (livsmedel med mängder)
        if (line.startsWith('├─') || line.startsWith('└─') || line.startsWith('├') || line.startsWith('└')) {
          return (
            <div key={i} className="font-mono text-sm ml-1 py-0.5 text-foreground/90">
              {line}
            </div>
          );
        }
        // Streckade linjer
        if (line.includes('───')) {
          return (
            <div key={i} className="text-muted-foreground text-xs my-1">
              {line}
            </div>
          );
        }
        // Listor med •
        if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
          return (
            <div key={i} className="text-sm ml-2 py-0.5">
              {line}
            </div>
          );
        }
        // Warnings/tips/emojis
        if (line.includes('⚠️') || line.includes('✅') || line.includes('📊') || line.includes('📝')) {
          return (
            <div key={i} className="font-medium mt-2">
              {line}
            </div>
          );
        }
        // Separatorer
        if (line.trim() === '---') {
          return <hr key={i} className="my-3 border-border" />;
        }
        // Tom rad
        if (!line.trim()) {
          return <div key={i} className="h-2" />;
        }
        // Normal text
        return (
          <div key={i} className="text-sm leading-relaxed">
            {line}
          </div>
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
