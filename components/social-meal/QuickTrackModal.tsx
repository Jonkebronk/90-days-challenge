'use client';

import { useState, useEffect } from 'react';
import { X, Utensils, ArrowLeft, Star, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SocialMealInput } from './SocialMealInput';
import { SocialMealBuilder } from './SocialMealBuilder';
import { MealFeedbackModal } from './MealFeedbackModal';
import type { MacroCategory, CalculatedMacros } from '@/lib/types/meal-plan-generator';
import type { AIAnalysisResult, NutritionEstimate, MealType, SelectedComponent, QuickTrackCategory, PortionSize } from '@/lib/social-meal/types';
import { cn } from '@/lib/utils';

interface MealItem {
  id: string;
  name: string;
  brand?: string | null;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  category: MacroCategory;
}

interface QuickTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    mealType: MealType;
    components: SelectedComponent[];
    nutrition: { kcal: number; protein: number; carbs: number; fat: number };
    presetId?: string;
    presetName?: string;
    inputMethod?: 'quick_track' | 'text' | 'image' | 'both';
    confidence?: 'low' | 'medium' | 'high';
    dataSource?: string;
  }) => Promise<{ id: string } | void>;
  initialMealType?: MealType; // Ignored - always uses 'dinner'
}

type ViewMode = 'input' | 'build' | 'ai-result' | 'favorites';

export function QuickTrackModal({
  isOpen,
  onClose,
  onSave,
  initialMealType, // Ignored - always uses 'dinner'
}: QuickTrackModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [items, setItems] = useState<MealItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [imageInput, setImageInput] = useState<string | null>(null);

  // Feedback modal state
  const [showFeedback, setShowFeedback] = useState(false);
  const [savedMealId, setSavedMealId] = useState<string | null>(null);
  const [savedNutrition, setSavedNutrition] = useState<NutritionEstimate | null>(null);

  // Saved meals (favorites)
  const [savedMeals, setSavedMeals] = useState<Array<{
    id: string;
    name: string;
    components: MealItem[];
    totalNutrition: { kcal: number; protein: number; carbs: number; fat: number };
    useCount: number;
  }>>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode('input');
      setItems([]);
      setAiResult(null);
      setAiError(null);
      setTextInput('');
      setImageInput(null);
    }
  }, [isOpen]);

  // Load favorites when viewing favorites
  useEffect(() => {
    if (viewMode === 'favorites') {
      loadFavorites();
    }
  }, [viewMode]);

  const loadFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const response = await fetch('/api/social-meals/saved');
      if (response.ok) {
        const data = await response.json();
        setSavedMeals(data.savedMeals || []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // AI Analysis
  const handleAnalyze = async (text?: string, imageBase64?: string) => {
    if (!text && !imageBase64) return;

    setIsAnalyzing(true);
    setAiError(null);
    setTextInput(text || '');
    setImageInput(imageBase64 || null);

    try {
      const response = await fetch('/api/social-meals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          imageBase64,
          mealType: 'dinner',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze meal');
      }

      const result = await response.json() as AIAnalysisResult;
      setAiResult(result);

      // Convert AI items to meal items
      const aiItems: MealItem[] = result.items.map((item, index) => ({
        id: `ai-${index}-${Date.now()}`,
        name: item.name,
        grams: item.estimatedGrams,
        kcal: item.nutrition.kcal,
        protein: item.nutrition.protein,
        carbs: item.nutrition.carbs,
        fat: item.nutrition.fat,
        category: item.matchedCategory || 'protein',
      }));
      setItems(aiItems);
      setViewMode('ai-result');
    } catch (error) {
      console.error('Error analyzing:', error);
      setAiError('Kunde inte analysera måltiden. Försök igen eller bygg manuellt.');
    } finally {
      setIsAnalyzing(false);
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
        // Recalculate macros based on new grams
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

  // Helper to map MacroCategory to QuickTrackCategory
  const mapCategoryToQuickTrack = (category: MacroCategory): QuickTrackCategory => {
    const mapping: Record<MacroCategory, QuickTrackCategory> = {
      protein: 'protein',
      carb: 'carb',
      fat: 'fat',
      vegetable: 'vegetable',
      sauce: 'sauce',
    };
    return mapping[category] || 'protein';
  };

  // Helper to determine portion size from grams
  const getPortionSize = (grams: number): PortionSize => {
    if (grams <= 50) return 'small';
    if (grams <= 150) return 'normal';
    if (grams <= 250) return 'large';
    return 'extra';
  };

  // Save meal
  const handleSave = async () => {
    if (items.length === 0) return;

    setIsSaving(true);
    try {
      const inputMethod = aiResult
        ? imageInput && textInput
          ? 'both'
          : imageInput
          ? 'image'
          : 'text'
        : 'quick_track';

      // Convert MealItem[] to SelectedComponent[]
      const components: SelectedComponent[] = items.map((item) => ({
        category: mapCategoryToQuickTrack(item.category),
        foodItemId: item.id,
        foodItemName: item.name,
        portionSize: getPortionSize(item.grams),
        grams: item.grams,
        kcal: item.kcal,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      }));

      const result = await onSave({
        mealType: 'dinner',
        components,
        nutrition: totals,
        inputMethod,
        confidence: aiResult?.confidence,
        dataSource: aiResult?.dataSource,
      });

      if (result?.id) {
        setSavedMealId(result.id);
        setSavedNutrition(totals);
        setShowFeedback(true);
      } else {
        handleClose();
      }
    } catch (error) {
      console.error('Error saving meal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save as favorite
  const handleSaveAsFavorite = async () => {
    if (items.length === 0) return;

    const name = prompt('Ge din favoritmåltid ett namn:');
    if (!name) return;

    try {
      const response = await fetch('/api/social-meals/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          components: items,
          totalNutrition: totals,
        }),
      });

      if (response.ok) {
        alert('Måltiden har sparats som favorit!');
      } else {
        const data = await response.json();
        alert(data.error || 'Kunde inte spara favorit');
      }
    } catch (error) {
      console.error('Error saving favorite:', error);
      alert('Något gick fel');
    }
  };

  // Load favorite
  const handleLoadFavorite = (meal: typeof savedMeals[0]) => {
    setItems(meal.components);
    setViewMode('build');
  };

  const handleClose = () => {
    setItems([]);
    setViewMode('input');
    setAiResult(null);
    setAiError(null);
    setTextInput('');
    setImageInput(null);
    onClose();
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    setSavedMealId(null);
    setSavedNutrition(null);
    handleClose();
  };

  const handleBack = () => {
    if (viewMode === 'build' || viewMode === 'ai-result' || viewMode === 'favorites') {
      setViewMode('input');
      if (viewMode !== 'favorites') {
        setItems([]);
        setAiResult(null);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showFeedback} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              {viewMode !== 'input' && (
                <button
                  onClick={handleBack}
                  className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-green-600" />
                <DialogTitle className="text-lg font-semibold text-gray-800">
                  Social Middag
                </DialogTitle>
              </div>
            </div>
            <button
              onClick={() => setViewMode('favorites')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'favorites'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-gray-600 hover:bg-white/50'
              )}
            >
              <Star className="h-4 w-4" />
              Favoriter
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === 'input' && (
              <div className="space-y-6">
                {/* Greeting */}
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🌿</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Vad åt du till middag?
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Beskriv med text, ta ett foto, eller bygg manuellt
                  </p>
                </div>

                {/* Error message */}
                {aiError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    {aiError}
                  </div>
                )}

                {/* Input */}
                <SocialMealInput
                  onTextSubmit={(text) => handleAnalyze(text)}
                  onImageUpload={(image) => handleAnalyze(undefined, image)}
                  onBuildMeal={() => setViewMode('build')}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            )}

            {viewMode === 'build' && (
              <SocialMealBuilder
                items={items}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onUpdateGrams={handleUpdateGrams}
                onSave={handleSave}
                onSaveAsFavorite={handleSaveAsFavorite}
                isSaving={isSaving}
              />
            )}

            {viewMode === 'ai-result' && aiResult && (
              <div className="space-y-4">
                {/* AI Result header */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">AI-analys klar</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        aiResult.confidence === 'high'
                          ? 'bg-green-100 text-green-700'
                          : aiResult.confidence === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {aiResult.confidence === 'high'
                        ? 'Hög säkerhet'
                        : aiResult.confidence === 'medium'
                        ? 'Medium säkerhet'
                        : 'Låg säkerhet'}
                    </span>
                  </div>
                  {aiResult.reasoning && (
                    <p className="text-sm text-green-700">{aiResult.reasoning}</p>
                  )}
                </div>

                {/* Meal builder with AI items */}
                <SocialMealBuilder
                  items={items}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onUpdateGrams={handleUpdateGrams}
                  onSave={handleSave}
                  onSaveAsFavorite={handleSaveAsFavorite}
                  isSaving={isSaving}
                />
              </div>
            )}

            {viewMode === 'favorites' && (
              <div className="space-y-4">
                {loadingFavorites ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                    <p className="text-gray-500 mt-2">Laddar favoriter...</p>
                  </div>
                ) : savedMeals.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Inga sparade favoriter</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Bygg en måltid och spara som favorit
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedMeals.map((meal) => (
                      <button
                        key={meal.id}
                        onClick={() => handleLoadFavorite(meal)}
                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span className="font-medium text-gray-900">{meal.name}</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Använd {meal.useCount} gånger
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {meal.totalNutrition.kcal} kcal
                          </p>
                          <p className="text-xs text-gray-500">
                            P: {meal.totalNutrition.protein}g
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      {savedMealId && savedNutrition && (
        <MealFeedbackModal
          isOpen={showFeedback}
          onClose={handleFeedbackClose}
          mealId={savedMealId}
          nutrition={savedNutrition}
        />
      )}
    </>
  );
}
