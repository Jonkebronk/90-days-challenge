'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Sparkles, Wrench } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MealBuilder } from './MealBuilder';
import { MealInput } from './MealInput';
import type { MacroCategory } from '@/lib/types/meal-plan-generator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MealItem {
  id: string;
  name: string;
  brand?: string | null;
  image?: string | null;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  category: MacroCategory;
}

interface DeviationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: {
    deviationDate: Date;
    nutrition: { kcal: number; protein: number; carbs: number; fat: number };
    items: MealItem[];
  }) => void;
  // Edit mode props
  editMealId?: string | null;
  initialItems?: MealItem[];
  initialDate?: Date;
}

type InputMode = 'ai' | 'manual';

export function DeviationModal({
  isOpen,
  onClose,
  onSave,
  editMealId,
  initialItems,
  initialDate,
}: DeviationModalProps) {
  const isEditMode = !!editMealId;
  const [items, setItems] = useState<MealItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('ai');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  // Deviation date selection
  const [deviationDate, setDeviationDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Reset when modal opens, or load initial items for edit mode
  useEffect(() => {
    if (isOpen) {
      if (initialItems && initialItems.length > 0) {
        setItems(initialItems);
        setInputMode('manual'); // Switch to manual when editing
        if (initialDate) {
          setDeviationDate(initialDate);
        }
      } else {
        setItems([]);
        setInputMode('ai');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setDeviationDate(today);
      }
      setPendingText(null);
      setPendingImage(null);
    }
  }, [isOpen, initialItems, initialDate]);

  // Analyze when we have pending input
  useEffect(() => {
    if ((pendingText || pendingImage) && !isAnalyzing) {
      analyzeWithAI();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingText, pendingImage]);

  const analyzeWithAI = async () => {
    if (!pendingText && !pendingImage) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/deviation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pendingText,
          imageBase64: pendingImage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze');
      }

      const result = await response.json();

      if (result.success && result.items) {
        // Convert AI items to MealItems
        const newItems: MealItem[] = result.items.map((item: {
          name: string;
          estimatedGrams: number;
          nutrition: { kcal: number; protein: number; carbs: number; fat: number };
          category?: string;
        }, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          name: item.name,
          brand: null,
          image: null,
          grams: item.estimatedGrams,
          kcal: item.nutrition.kcal,
          protein: item.nutrition.protein,
          carbs: item.nutrition.carbs,
          fat: item.nutrition.fat,
          category: (item.category as MacroCategory) || 'mixed',
        }));

        setItems((prev) => [...prev, ...newItems]);
        toast.success(`Lade till ${newItems.length} ingredienser`);

        // Show reasoning if available
        if (result.reasoning) {
          console.log('AI reasoning:', result.reasoning);
        }
      }
    } catch (error) {
      console.error('Error analyzing meal:', error);
      toast.error('Kunde inte analysera måltiden. Försök igen eller lägg till manuellt.');
    } finally {
      setIsAnalyzing(false);
      setPendingText(null);
      setPendingImage(null);
    }
  };

  // Item management
  const handleAddItem = (item: MealItem) => {
    setItems((prev) => [...prev, item]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateGrams = (id: string, grams: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const ratio = grams / item.grams;
        return {
          ...item,
          grams,
          kcal: Math.round(item.kcal * ratio),
          protein: Math.round(item.protein * ratio * 10) / 10,
          carbs: Math.round(item.carbs * ratio * 10) / 10,
          fat: Math.round(item.fat * ratio * 10) / 10,
        };
      })
    );
  };

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + item.kcal,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Save deviation
  const handleSave = async () => {
    if (items.length === 0) return;

    setIsSaving(true);
    try {
      onSave?.({
        deviationDate,
        nutrition: totals,
        items,
      });

      handleClose();
    } catch (error) {
      console.error('Error saving deviation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setItems([]);
    setPendingText(null);
    setPendingImage(null);
    onClose();
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayName = dayNames[date.getDay()];
    const dayNum = date.getDate();

    if (date.getTime() === today.getTime()) {
      return `${dayName} ${dayNum} (idag)`;
    }

    return `${dayName} ${dayNum}`;
  };

  // Get date options for current week (Monday to Sunday)
  const getDateOptions = () => {
    const options = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find Monday of current week
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    // Generate Monday to Sunday
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      options.push(date);
    }
    return options;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full h-full max-w-full max-h-full sm:max-w-lg sm:max-h-[90vh] sm:h-auto overflow-hidden flex flex-col p-0 rounded-none sm:rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <DialogTitle className="text-lg font-semibold text-gray-800">
                {isEditMode ? 'Redigera Kostavvikelse' : 'Registrera Kostavvikelse'}
              </DialogTitle>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Date selector */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">Vilken dag gäller avvikelsen?</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {getDateOptions().map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => setDeviationDate(date)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      deviationDate.getTime() === date.getTime()
                        ? 'bg-amber-500 text-white'
                        : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-100'
                    )}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            </div>

            {/* Input mode toggle */}
            <div className="flex items-center justify-center gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setInputMode('ai')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
                  inputMode === 'ai'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                )}
              >
                <Sparkles className="h-4 w-4" />
                AI-analys
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
                  inputMode === 'manual'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                )}
              >
                <Wrench className="h-4 w-4" />
                Manuell
              </button>
            </div>

            {/* AI Input mode */}
            {inputMode === 'ai' && (
              <div className="space-y-4">
                <MealInput
                  onTextSubmit={(text) => setPendingText(text)}
                  onImageUpload={(image) => setPendingImage(image)}
                  onBuildMeal={() => setInputMode('manual')}
                  isAnalyzing={isAnalyzing}
                />

                {/* Show items if any added */}
                {items.length > 0 && (
                  <MealBuilder
                    items={items}
                    onAddItem={handleAddItem}
                    onRemoveItem={handleRemoveItem}
                    onUpdateGrams={handleUpdateGrams}
                    onSave={handleSave}
                    isSaving={isSaving}
                    showFavoriteButton={false}
                    showAddButton={false}
                  />
                )}
              </div>
            )}

            {/* Manual input mode */}
            {inputMode === 'manual' && (
              <MealBuilder
                items={items}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onUpdateGrams={handleUpdateGrams}
                onSave={handleSave}
                isSaving={isSaving}
                showFavoriteButton={false}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
