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
      <Card className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-h-[800px]">
        <CardHeader className="py-3 border-b">
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
    <Card className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-h-[800px]">
      <CardHeader className="py-2 px-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h3 className="font-semibold text-sm">AI Kostassistent</h3>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearConversation}
              className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {clientName} |{' '}
          <span className="font-medium">
            P{targetMacros.protein}g K{targetMacros.carbs}g F{targetMacros.fat}g = {targetMacros.kcal}kcal
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

      {/* Attached images preview */}
      {attachedImages.length > 0 && (
        <div className="px-4 py-2 border-t flex-shrink-0 bg-muted/30">
          <div className="flex gap-2 flex-wrap">
            {attachedImages.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img.preview}
                  alt={`Bifogad bild ${i + 1}`}
                  className="h-16 w-16 object-cover rounded-md border"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t flex-shrink-0">
        <div className="flex gap-2">
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || attachedImages.length >= 5}
            className="self-end h-9 w-9 flex-shrink-0"
            title="Bifoga bild (max 5)"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ställ en fråga eller bifoga en bild..."
            className="min-h-[36px] max-h-[120px] resize-none text-sm"
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={loading || (!input.trim() && attachedImages.length === 0)}
            className="self-end h-9 w-9 flex-shrink-0"
            size="icon"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Bifoga bilder på mat för analys eller ställ frågor om kost
        </p>
      </div>
    </Card>
  );
}
