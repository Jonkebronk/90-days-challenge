'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Trash2, ImagePlus, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { QuickActions } from './QuickActions';
import { AIChatResponse, AIMessage } from '@/lib/ai/types';
import Image from 'next/image';

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
  const [attachedImages, setAttachedImages] = useState<{ file: File; preview: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ladda konversationshistorik vid mount
  useEffect(() => {
    loadConversation();
  }, [nutritionPlanId]);

  // Scrolla till botten vid nya meddelanden
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hantera bilduppladdning
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: { file: File; preview: string }[] = [];

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newImages.push({ file, preview });
      }
    });

    setAttachedImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 bilder

    // Rensa input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Konvertera bild till base64
  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Ta bort data:image/xxx;base64, prefixet
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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
    if ((!text.trim() && attachedImages.length === 0) || loading) return;

    // Konvertera bilder till base64
    const imageData: { base64: string; mediaType: string }[] = [];
    for (const img of attachedImages) {
      const base64 = await imageToBase64(img.file);
      imageData.push({
        base64,
        mediaType: img.file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
      });
    }

    const userMessage: AIMessage = {
      role: 'user',
      content: text || (attachedImages.length > 0 ? `[${attachedImages.length} bild(er) bifogade]` : ''),
      timestamp: new Date(),
      images: attachedImages.map(img => img.preview),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImages([]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutritionPlanId,
          message: text,
          images: imageData,
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
      <Card className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-h-[800px] bg-[#2f2f2f] border-[#3f3f3f]">
        <CardHeader className="py-3 border-b border-[#3f3f3f]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#e07a5f]" />
            <h3 className="font-semibold text-white">AI Kostassistent</h3>
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
      <CardHeader className="py-3 px-4 border-b border-[#3f3f3f] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#e07a5f]" />
            <h3 className="font-medium text-sm text-white">AI Kostassistent</h3>
          </div>
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
        <p className="text-xs text-gray-400">
          {clientName} |{' '}
          <span className="text-gray-300">
            P{targetMacros.protein}g K{targetMacros.carbs}g F{targetMacros.fat}g
          </span>
        </p>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 bg-[#2f2f2f]">
        <CardContent className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-[#e07a5f] opacity-70" />
              <p className="text-gray-300 text-sm font-medium">Hur kan jag hjälpa dig idag?</p>
              <p className="text-gray-500 text-xs mt-2 max-w-[250px] mx-auto">
                Jag har tillgång till livsmedelsbiblioteket, receptbanken och
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
            <div className="flex items-center gap-2 text-gray-400 p-3 bg-[#3a3a3a] rounded-lg">
              <RefreshCw className="h-4 w-4 animate-spin text-[#e07a5f]" />
              <span className="text-sm">Tänker...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </ScrollArea>

      {/* Attached images preview */}
      {attachedImages.length > 0 && (
        <div className="px-4 py-2 border-t border-[#3f3f3f] flex-shrink-0 bg-[#353535]">
          <div className="flex gap-2 flex-wrap">
            {attachedImages.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img.preview}
                  alt={`Bifogad bild ${i + 1}`}
                  className="h-16 w-16 object-cover rounded-lg border border-[#4a4a4a]"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[#3f3f3f] flex-shrink-0 bg-[#2f2f2f]">
        <div className="flex items-end gap-2 bg-[#404040] rounded-2xl px-3 py-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || attachedImages.length >= 5}
            className="p-1.5 text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Bifoga bild (max 5)"
          >
            <ImagePlus className="h-5 w-5" />
          </button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Hur kan jag hjälpa dig idag?"
            className="min-h-[24px] max-h-[120px] resize-none text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-100 placeholder:text-gray-500 py-0"
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || (!input.trim() && attachedImages.length === 0)}
            className="p-2 bg-[#e07a5f] hover:bg-[#c96a52] disabled:bg-[#4a4a4a] disabled:cursor-not-allowed text-white rounded-full transition-colors"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}
