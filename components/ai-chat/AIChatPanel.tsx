'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Trash2, ImagePlus, X, Paperclip, Settings, FileImage, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { QuickActions } from './QuickActions';
import { FoodDatabaseViewer } from './FoodDatabaseViewer';
import { AIChatResponse, AIMessage } from '@/lib/ai/types';
import Image from 'next/image';

interface AIChatPanelProps {
  nutritionPlanId: string;
  mealPlanId?: string;
  clientName: string;
  targetMacros: {
    protein: number;
    carbs: number;
    fat: number;
    kcal: number;
  };
  onGenerateSchema?: (response: string) => void;
  onMealPlanUpdated?: () => void;
}

interface ParsedMealItem {
  name: string;
  grams: number;
  category: 'protein' | 'carb' | 'fat';
}

interface ParsedMeal {
  mealType: string;
  mealIndex: number;
  items: ParsedMealItem[];
}

// Determine food category based on name
// Kategorisering:
// - PROTEIN: Kött, fisk, fågel, skaldjur, kvarg, baljväxter
// - KOLHYDRAT: Havregryn, ris, pasta, bröd, potatis, frukt, bär
// - FETT: Ägg, nötter, frön, oljor, ost, avokado
function determineFoodCategory(name: string): 'protein' | 'carb' | 'fat' | null {
  const nameLower = name.toLowerCase();

  // Skip vegetables and non-macro items
  if (nameLower.includes('grönsak') || nameLower.includes('sallad') ||
      nameLower.includes('spenat') || nameLower.includes('broccoli') ||
      nameLower.includes('tomat') || nameLower.includes('gurka') ||
      nameLower.includes('paprika') || nameLower.includes('lök')) {
    return null; // Skip vegetables
  }

  // FETTKÄLLOR: Ägg, nötter, frön, oljor, ost, avokado
  // OBS: Ägg klassas som FETT (inte protein)
  if (nameLower.includes('ägg') && !nameLower.includes('lägg')) {
    return 'fat';
  }
  if (nameLower.includes('olja') || nameLower.includes('nöt') ||
      nameLower.includes('mandel') || nameLower.includes('mandlar') ||
      nameLower.includes('avokado') || nameLower.includes('smör') ||
      (nameLower.includes('ost') && !nameLower.includes('cottage') && !nameLower.includes('kvarg')) ||
      nameLower.includes('frön') || nameLower.includes('jordnöt') ||
      nameLower.includes('olivolja') || nameLower.includes('rapsolja')) {
    return 'fat';
  }

  // KOLHYDRATKÄLLOR: Havregryn, ris, pasta, bröd, potatis, frukt, bär
  if (nameLower.includes('ris') || nameLower.includes('pasta') ||
      nameLower.includes('potatis') || nameLower.includes('bröd') ||
      nameLower.includes('havre') || nameLower.includes('müsli') ||
      nameLower.includes('quinoa') || nameLower.includes('bulgur') ||
      nameLower.includes('couscous') || nameLower.includes('banan') ||
      nameLower.includes('frukt') || nameLower.includes('äpple') ||
      nameLower.includes('honung') || nameLower.includes('sylt') ||
      nameLower.includes('blåbär') || nameLower.includes('hallon') ||
      nameLower.includes('jordgubb') || nameLower.includes('lasagne') ||
      nameLower.includes('cornflakes') || nameLower.includes('flingor') ||
      nameLower.includes('gryn')) {
    return 'carb';
  }

  // PROTEINKÄLLOR: Kött, fisk, fågel, skaldjur, kvarg (default)
  return 'protein';
}

// Parse AI response to extract meal plan items
function parseAIMealPlan(content: string): ParsedMeal[] {
  const meals: ParsedMeal[] = [];

  // Find all meal sections using regex - handles "MÅLTID 4" or "MÅLTID 4 - POST-WORKOUT" etc
  const mealRegex = /MÅLTID\s*(\d+)[^\n]*\n([\s\S]*?)(?=MÅLTID\s*\d|SLUTSATS|$)/gi;
  let match;

  while ((match = mealRegex.exec(content)) !== null) {
    const mealIndex = parseInt(match[1]) - 1; // Convert to 0-based index
    const section = match[2];

    const items: ParsedMealItem[] = [];

    // Parse lines looking for food items with grams
    // Handles various formats:
    // "├─ Havregryn (torr): 50g (P 6.75g...)"
    // "├─ Kvarg naturell fett 0,2%: 200g"
    // "- Banan: 150g"
    const lines = section.split('\n');
    for (const line of lines) {
      // Skip totalt lines, empty lines, and non-food lines
      if (line.includes('Totalt') || line.includes('TOTALT') ||
          line.includes('Makromål') || line.includes('LIVSMEDEL') ||
          line.includes('kcal') && !line.includes(':') ||
          !line.trim()) {
        continue;
      }

      // Match patterns like:
      // "├─ Havregryn (torr): 50g (P 6.75g, K 32.5g, F 3.4g) - 187 kcal"
      // "├─ Ägg (2 st medelstora, rå): 130g"
      // "└─ Kvarg färskost fett 1%: 150g"
      // Allow parentheses in food name before the colon
      const foodMatch = line.match(/[├└─\-\s]*([^:]+?):\s*(\d+)\s*g/i);
      if (foodMatch) {
        let name = foodMatch[1].trim()
          .replace(/^\*\*|\*\*$/g, '')  // Remove markdown bold
          .replace(/^\s*[├└─\-]\s*/, '')  // Remove tree characters
          .replace(/\s*\([^)]*\)\s*$/, '')  // Remove trailing parentheses like "(torr)" or "(2 st...)"
          .trim();
        const grams = parseInt(foodMatch[2]);

        console.log(`Parsed food: "${name}" ${grams}g from line: "${line.substring(0, 60)}..."`);

        if (name && grams > 0 && name.length > 1) {
          const category = determineFoodCategory(name);
          console.log(`  Category for "${name}": ${category}`);
          // Only add items with valid categories (skip vegetables)
          if (category) {
            items.push({ name, grams, category });
          }
        }
      }
    }

    if (items.length > 0) {
      meals.push({
        mealType: 'meal',
        mealIndex,
        items,
      });
    }
  }

  return meals;
}

export function AIChatPanel({
  nutritionPlanId,
  mealPlanId,
  clientName,
  targetMacros,
  onGenerateSchema,
  onMealPlanUpdated,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [attachedImages, setAttachedImages] = useState<{ file: File; preview: string }[]>([]);
  const [hasTemplateImage, setHasTemplateImage] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  // Ladda konversationshistorik och inställningar vid mount
  useEffect(() => {
    loadConversation();
    loadAISettings();
  }, [nutritionPlanId]);

  // Ladda AI-inställningar (för att kolla om mallbild finns)
  const loadAISettings = async () => {
    try {
      const response = await fetch('/api/ai/settings');
      if (response.ok) {
        const data = await response.json();
        setHasTemplateImage(data.hasTemplateImage || false);
      }
    } catch (error) {
      console.error('Kunde inte ladda AI-inställningar:', error);
    }
  };

  // Ladda upp mallbild
  const handleTemplateImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Endast bildfiler är tillåtna');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Bilden får max vara 5MB');
      return;
    }

    setUploadingTemplate(true);

    try {
      // Konvertera till base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Ta bort data:image/xxx;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Spara till API
      const response = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateImage: base64,
          templateImageType: file.type,
        }),
      });

      if (response.ok) {
        setHasTemplateImage(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Kunde inte spara mallbilden');
      }
    } catch (error) {
      console.error('Fel vid uppladdning av mallbild:', error);
      alert('Något gick fel vid uppladdning');
    } finally {
      setUploadingTemplate(false);
      if (templateInputRef.current) {
        templateInputRef.current.value = '';
      }
    }
  };

  // Ta bort mallbild
  const handleRemoveTemplateImage = async () => {
    if (!confirm('Vill du ta bort mallbilden?')) return;

    try {
      const response = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeTemplateImage: true }),
      });

      if (response.ok) {
        setHasTemplateImage(false);
      }
    } catch (error) {
      console.error('Kunde inte ta bort mallbild:', error);
    }
  };

  // Scrolla till botten vid nya meddelanden (endast inom chat-panelen)
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
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
      console.log('Sending to AI chat:', {
        nutritionPlanId,
        message: text,
        imagesCount: imageData.length,
        imageTypes: imageData.map(i => i.mediaType),
      });

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API-fel (${response.status})`);
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
      // Visa mer specifikt fel om möjligt
      let errorText = 'Ett fel uppstod. Försök igen.';
      if (error instanceof Error) {
        errorText = error.message;
      }
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: errorText,
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

  // Handle applying AI meal plan to the schema
  const handleApplyToSchema = async (content: string, useProductLibrary: boolean = false): Promise<void> => {
    console.log('handleApplyToSchema called, useProductLibrary:', useProductLibrary);
    console.log('mealPlanId:', mealPlanId);

    if (!mealPlanId) {
      console.error('No meal plan ID available');
      throw new Error('Inget kostschema finns. Skapa ett kostschema först.');
    }

    const parsedMeals = parseAIMealPlan(content);
    console.log('Parsed meals:', JSON.stringify(parsedMeals, null, 2));

    if (parsedMeals.length === 0) {
      console.error('No meals parsed from content');
      throw new Error('Kunde inte tolka måltidsförslaget. Försök igen.');
    }

    console.log('Sending to API...');
    const response = await fetch('/api/meal-plan/apply-ai-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealPlanId,
        suggestions: parsedMeals,
        useProductLibrary,  // Allow fallback to product library
      }),
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('API error:', error);
      throw new Error(error.error || 'Kunde inte applicera förslaget');
    }

    const result = await response.json();
    console.log('API result:', result);

    // Notify parent to refresh meal plan
    if (onMealPlanUpdated) {
      console.log('Calling onMealPlanUpdated');
      onMealPlanUpdated();
    }

    // If there are failed items and we haven't tried product library yet, ask user
    if (result.failedItems && result.failedItems.length > 0 && !useProductLibrary) {
      const failedNames = result.failedItems.join(', ');
      const useLibrary = confirm(
        `Följande livsmedel kunde inte hittas i Livsmedelsverkets databas:\n\n${failedNames}\n\nVill du söka i ditt livsmedelsbibliotek istället?`
      );

      if (useLibrary) {
        // Re-apply with product library fallback enabled
        await handleApplyToSchema(content, true);
        return;
      }
    }

    // Add result message to chat
    if (result.message) {
      const resultMessage: AIMessage = {
        role: 'assistant',
        content: `✅ ${result.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, resultMessage]);
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
          <div className="flex items-center gap-1">
            {/* Mallbild-knapp */}
            <input
              ref={templateInputRef}
              type="file"
              accept="image/*"
              onChange={handleTemplateImageSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hasTemplateImage ? handleRemoveTemplateImage() : templateInputRef.current?.click()}
              disabled={uploadingTemplate}
              className={`h-7 w-7 p-0 ${hasTemplateImage ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-200'}`}
              title={hasTemplateImage ? 'Mallbild aktiv - klicka för att ta bort' : 'Ladda upp mallbild för kostschema'}
            >
              {uploadingTemplate ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : hasTemplateImage ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <FileImage className="h-3.5 w-3.5" />
              )}
            </Button>
            {/* Rensa konversation */}
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
        <p className="text-xs text-gray-400">
          {clientName} |{' '}
          <span className="text-gray-300">
            P{targetMacros.protein}g K{targetMacros.carbs}g F{targetMacros.fat}g
          </span>
          {hasTemplateImage && (
            <span className="text-green-400 ml-2">| Mall aktiv</span>
          )}
        </p>
      </CardHeader>

      {/* Food Database Viewer - expandable */}
      <FoodDatabaseViewer />

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 bg-[#2f2f2f]">
        <CardContent className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-[#e07a5f] opacity-70" />
              <p className="text-gray-300 text-sm font-medium">Hur kan jag hjälpa dig idag?</p>
              <p className="text-gray-500 text-xs mt-2 max-w-[250px] mx-auto">
                Jag använder Livsmedelsverkets officiella databas med 2575 livsmedel
                och kompletta näringsvärden.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              onFeedback={(rating, typ) => handleFeedback(i, rating, typ)}
              onApplyToSchema={mealPlanId ? handleApplyToSchema : undefined}
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
