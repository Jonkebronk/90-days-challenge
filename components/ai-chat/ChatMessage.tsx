'use client';

import { useState } from 'react';
import { User, Bot, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Minus, Wand2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AIMessage } from '@/lib/ai/types';

interface ChatMessageProps {
  message: AIMessage;
  onFeedback?: (rating: number, typ: string) => void;
  onApplyToSchema?: (content: string) => Promise<void>;
  isLast?: boolean;
}

export function ChatMessage({ message, onFeedback, onApplyToSchema, isLast }: ChatMessageProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const isUser = message.role === 'user';

  const handleFeedback = (typ: 'bra' | 'kan_forbattras' | 'fel') => {
    if (feedbackGiven) return;

    const rating = typ === 'bra' ? 5 : typ === 'kan_forbattras' ? 3 : 1;
    onFeedback?.(rating, typ);
    setFeedbackGiven(typ);
  };

  // Check if message contains a meal plan that can be applied
  // Look for MÅLTID pattern with food items (contains grams like "200g" or ": 150g")
  const hasMealPlan = !isUser &&
    message.content.includes('MÅLTID') &&
    /\d+\s*g/.test(message.content);

  const handleApplyToSchema = async () => {
    if (!onApplyToSchema || applying || applied) return;
    setApplying(true);
    try {
      console.log('Applying to schema, content:', message.content.substring(0, 500));
      await onApplyToSchema(message.content);
      setApplied(true);
    } catch (error) {
      console.error('Error applying to schema:', error);
      // Show error to user
      alert(error instanceof Error ? error.message : 'Kunde inte applicera förslaget');
    } finally {
      setApplying(false);
    }
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
            <div key={i} className="font-semibold text-[#e07a5f] mt-4 mb-2 text-base border-b border-[#4a4a4a] pb-1">
              {text}
            </div>
          );
        }
        // Bold text med **
        if (line.startsWith('**') && line.endsWith('**')) {
          const text = line.replace(/\*\*/g, '');
          return (
            <div key={i} className="font-semibold mt-3 mb-1 text-gray-100">
              {text}
            </div>
          );
        }
        // MÅLTID-rubriker
        if (line.startsWith('MÅLTID') || line.includes('MÅLTID')) {
          return (
            <div key={i} className="font-semibold text-[#e07a5f] mt-4 mb-2 text-base bg-[#e07a5f]/10 px-2 py-1 rounded-lg">
              {line}
            </div>
          );
        }
        // TOTALT och ALTERNATIV
        if (line.startsWith('TOTALT:') || line.startsWith('**TOTALT')) {
          const text = line.replace(/\*\*/g, '');
          return (
            <div key={i} className="font-medium text-sm bg-[#3a3a3a] px-2 py-1 rounded-lg mt-2 text-gray-200">
              {text}
            </div>
          );
        }
        if (line.startsWith('ALTERNATIV:') || line.startsWith('**ALTERNATIV')) {
          const text = line.replace(/\*\*/g, '');
          return (
            <div key={i} className="font-medium text-sm mt-3 mb-1 text-gray-400">
              {text}
            </div>
          );
        }
        // LIVSMEDEL-rubrik
        if (line.startsWith('LIVSMEDEL:') || line.startsWith('**LIVSMEDEL')) {
          const text = line.replace(/\*\*/g, '');
          return (
            <div key={i} className="font-medium text-sm mt-2 mb-1 text-gray-200">
              {text}
            </div>
          );
        }
        // Träd-struktur (livsmedel med mängder)
        if (line.startsWith('├─') || line.startsWith('└─') || line.startsWith('├') || line.startsWith('└')) {
          return (
            <div key={i} className="font-mono text-sm ml-1 py-0.5 text-gray-300">
              {line}
            </div>
          );
        }
        // Streckade linjer
        if (line.includes('───')) {
          return (
            <div key={i} className="text-gray-500 text-xs my-1">
              {line}
            </div>
          );
        }
        // Listor med •
        if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
          return (
            <div key={i} className="text-sm ml-2 py-0.5 text-gray-300">
              {line}
            </div>
          );
        }
        // Warnings/tips/emojis
        if (line.includes('⚠️') || line.includes('✅') || line.includes('📊') || line.includes('📝')) {
          return (
            <div key={i} className="font-medium mt-2 text-gray-200">
              {line}
            </div>
          );
        }
        // Separatorer
        if (line.trim() === '---') {
          return <hr key={i} className="my-3 border-[#4a4a4a]" />;
        }
        // Tom rad
        if (!line.trim()) {
          return <div key={i} className="h-2" />;
        }
        // Normal text
        return (
          <div key={i} className="text-sm leading-relaxed text-gray-300">
            {line}
          </div>
        );
      });
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-xl',
        isUser ? 'bg-[#404040]' : 'bg-[#353535]'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-[#e07a5f] text-white' : 'bg-[#5a5a5a] text-[#e07a5f]'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-200">
            {isUser ? 'Du' : 'AI Assistent'}
          </span>
          <span className="text-xs text-gray-500">
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
              className="h-6 text-xs text-gray-400 p-0 hover:bg-transparent hover:text-gray-200"
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
              <div className="mt-2 p-2 bg-[#2a2a2a] rounded-lg text-xs text-gray-400 italic border border-[#3f3f3f]">
                {message.reasoning}
              </div>
            )}
          </div>
        )}

        {/* Images if any */}
        {message.images && message.images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Bifogad bild ${i + 1}`}
                className="max-h-32 max-w-[200px] object-cover rounded-lg border border-[#4a4a4a]"
              />
            ))}
          </div>
        )}

        {/* Message content */}
        <div className="text-sm whitespace-pre-wrap break-words text-gray-200">
          {formatContent(message.content)}
        </div>

        {/* Apply to schema button (if message contains meal plan) */}
        {hasMealPlan && onApplyToSchema && (
          <div className="mt-3">
            <Button
              onClick={handleApplyToSchema}
              disabled={applying || applied}
              className={cn(
                'h-8 text-xs gap-1.5',
                applied
                  ? 'bg-green-600 hover:bg-green-600 text-white'
                  : 'bg-[#e07a5f] hover:bg-[#c96a52] text-white'
              )}
            >
              {applying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Applicerar...
                </>
              ) : applied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Applicerat på schema
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  Applicera på kostschema
                </>
              )}
            </Button>
          </div>
        )}

        {/* Feedback buttons (only for assistant messages) */}
        {!isUser && isLast && onFeedback && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Var detta svar hjälpsamt?</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 w-7 p-0 text-gray-400 hover:text-gray-200 hover:bg-[#4a4a4a]',
                  feedbackGiven === 'bra' && 'bg-green-900/50 text-green-400'
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
                  'h-7 w-7 p-0 text-gray-400 hover:text-gray-200 hover:bg-[#4a4a4a]',
                  feedbackGiven === 'kan_forbattras' && 'bg-yellow-900/50 text-yellow-400'
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
                  'h-7 w-7 p-0 text-gray-400 hover:text-gray-200 hover:bg-[#4a4a4a]',
                  feedbackGiven === 'fel' && 'bg-red-900/50 text-red-400'
                )}
                onClick={() => handleFeedback('fel')}
                disabled={!!feedbackGiven}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </div>
            {feedbackGiven && (
              <span className="text-xs text-gray-500">Tack för din feedback!</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
