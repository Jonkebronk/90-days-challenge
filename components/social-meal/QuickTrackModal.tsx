'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Utensils, ChefHat, Star, Save, Plus, Camera, MessageSquare, Sparkles, Loader2, Upload, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategorySelector } from './CategorySelector';
import { FoodItemPicker } from './FoodItemPicker';
import { SelectedComponentsList } from './SelectedComponentsList';
import { FamilyDinnerGrid } from './FamilyDinnerGrid';
import { NutritionSummary } from './NutritionSummary';
import { MealFeedbackModal } from './MealFeedbackModal';
import type {
  QuickTrackCategory,
  PortionSize,
  SelectedComponent,
  MealType,
  FamilyDinnerPreset,
  QuickTrackFoodItem,
  AIAnalysisResult,
  NutritionEstimate,
} from '@/lib/social-meal/types';
import {
  createComponent,
  calculateTotalNutrition,
  createComponentsFromPreset,
} from '@/lib/social-meal/nutrition-calculator';
import { cn } from '@/lib/utils';

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
  initialMealType?: MealType;
}

type TabType = 'build' | 'presets' | 'saved' | 'ai-text' | 'ai-image';

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Frukost',
  lunch: 'Lunch',
  dinner: 'Middag',
  snack: 'Mellanmål',
};

const mealTypeIcons: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export function QuickTrackModal({
  isOpen,
  onClose,
  onSave,
  initialMealType = 'dinner',
}: QuickTrackModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('build');
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [selectedCategory, setSelectedCategory] = useState<QuickTrackCategory | null>(null);
  const [components, setComponents] = useState<SelectedComponent[]>([]);
  const [saving, setSaving] = useState(false);
  const [usedPreset, setUsedPreset] = useState<{ id: string; name: string } | null>(null);

  // AI Analysis state
  const [textDescription, setTextDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback modal state
  const [showFeedback, setShowFeedback] = useState(false);
  const [savedMealId, setSavedMealId] = useState<string | null>(null);
  const [savedNutrition, setSavedNutrition] = useState<NutritionEstimate | null>(null);

  const nutrition = aiResult?.totalNutrition || calculateTotalNutrition(components);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setMealType(initialMealType);
    }
  }, [isOpen, initialMealType]);

  const handleAddComponent = useCallback(
    (item: QuickTrackFoodItem, portion: PortionSize) => {
      if (!selectedCategory) return;

      const component = createComponent(selectedCategory, item.id, portion);
      if (component) {
        setComponents((prev) => [...prev, component]);
        setSelectedCategory(null);
        setAiResult(null); // Clear AI result when manually adding
      }
    },
    [selectedCategory]
  );

  const handleRemoveComponent = useCallback((index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
    setAiResult(null);
  }, []);

  const handlePresetSelect = useCallback((preset: FamilyDinnerPreset) => {
    const presetComponents = createComponentsFromPreset(preset.id);
    setComponents(presetComponents);
    setUsedPreset({ id: preset.id, name: preset.name });
    setAiResult(null);
    setActiveTab('build');
  }, []);

  // AI Text Analysis
  const handleAnalyzeText = async () => {
    if (!textDescription.trim()) return;

    setAnalyzing(true);
    setAiError(null);

    try {
      const response = await fetch('/api/social-meals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textDescription,
          mealType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze meal');
      }

      const result = await response.json() as AIAnalysisResult;
      setAiResult(result);

      // Convert AI items to components if possible
      const aiComponents: SelectedComponent[] = result.items.map((item, index) => ({
        category: item.matchedCategory || 'protein',
        foodItemId: item.matchedItemId || `ai-${index}`,
        foodItemName: item.name,
        portionSize: 'custom' as PortionSize,
        grams: item.estimatedGrams,
        kcal: item.nutrition.kcal,
        protein: item.nutrition.protein,
        carbs: item.nutrition.carbs,
        fat: item.nutrition.fat,
      }));
      setComponents(aiComponents);
    } catch (error) {
      console.error('Error analyzing text:', error);
      setAiError('Kunde inte analysera beskrivningen. Försök igen.');
    } finally {
      setAnalyzing(false);
    }
  };

  // AI Image Analysis
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!imageBase64) return;

    setAnalyzing(true);
    setAiError(null);

    try {
      const response = await fetch('/api/social-meals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          text: textDescription || undefined,
          mealType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json() as AIAnalysisResult;
      setAiResult(result);

      // Convert AI items to components
      const aiComponents: SelectedComponent[] = result.items.map((item, index) => ({
        category: item.matchedCategory || 'protein',
        foodItemId: item.matchedItemId || `ai-${index}`,
        foodItemName: item.name,
        portionSize: 'custom' as PortionSize,
        grams: item.estimatedGrams,
        kcal: item.nutrition.kcal,
        protein: item.nutrition.protein,
        carbs: item.nutrition.carbs,
        fat: item.nutrition.fat,
      }));
      setComponents(aiComponents);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAiError('Kunde inte analysera bilden. Försök igen.');
    } finally {
      setAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setAiResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (components.length === 0 && !aiResult) return;

    setSaving(true);
    try {
      const inputMethod = aiResult ?
        (imageBase64 && textDescription ? 'both' : imageBase64 ? 'image' : 'text') :
        'quick_track';

      const result = await onSave({
        mealType,
        components,
        nutrition,
        presetId: usedPreset?.id,
        presetName: usedPreset?.name,
        inputMethod,
        confidence: aiResult?.confidence,
        dataSource: aiResult?.dataSource,
      });

      // Show feedback modal if we got a meal ID back
      if (result?.id) {
        setSavedMealId(result.id);
        setSavedNutrition(nutrition);
        setShowFeedback(true);
      }

      // Reset state
      setComponents([]);
      setSelectedCategory(null);
      setUsedPreset(null);
      setTextDescription('');
      setImagePreview(null);
      setImageBase64(null);
      setAiResult(null);

      // Close modal if no feedback to show
      if (!result?.id) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving meal:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setComponents([]);
    setSelectedCategory(null);
    setUsedPreset(null);
    setActiveTab('build');
    setTextDescription('');
    setImagePreview(null);
    setImageBase64(null);
    setAiResult(null);
    setAiError(null);
    onClose();
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    setSavedMealId(null);
    setSavedNutrition(null);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showFeedback} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Social Måltid - Quick Track
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Meal Type Selector */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(mealTypeLabels) as MealType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-colors font-medium',
                    mealType === type
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span>{mealTypeIcons[type]}</span>
                  <span className="text-sm">{mealTypeLabels[type]}</span>
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-2">
              <button
                onClick={() => setActiveTab('build')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap',
                  activeTab === 'build'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Plus className="h-4 w-4" />
                Bygg
              </button>
              <button
                onClick={() => setActiveTab('presets')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap',
                  activeTab === 'presets'
                    ? 'bg-amber-100 text-amber-700 border-b-2 border-amber-500'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <ChefHat className="h-4 w-4" />
                Middagar
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap',
                  activeTab === 'saved'
                    ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Star className="h-4 w-4" />
                Favoriter
              </button>
              <button
                onClick={() => setActiveTab('ai-text')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap',
                  activeTab === 'ai-text'
                    ? 'bg-green-100 text-green-700 border-b-2 border-green-500'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <MessageSquare className="h-4 w-4" />
                Beskriv
              </button>
              <button
                onClick={() => setActiveTab('ai-image')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap',
                  activeTab === 'ai-image'
                    ? 'bg-pink-100 text-pink-700 border-b-2 border-pink-500'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Camera className="h-4 w-4" />
                Foto
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'build' && (
              <div className="space-y-4">
                {/* Category Selector */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Välj kategori
                  </h3>
                  <CategorySelector
                    selectedCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                  />
                </div>

                {/* Food Item Picker */}
                {selectedCategory && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Välj matvara och portion
                    </h3>
                    <FoodItemPicker
                      category={selectedCategory}
                      onSelect={handleAddComponent}
                    />
                  </div>
                )}

                {/* Selected Components */}
                {components.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Din måltid {usedPreset && `(${usedPreset.name})`}
                    </h3>
                    <SelectedComponentsList
                      components={components}
                      onRemove={handleRemoveComponent}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'presets' && (
              <FamilyDinnerGrid onSelect={handlePresetSelect} />
            )}

            {activeTab === 'saved' && (
              <SavedMealsTab
                onSelect={(components) => {
                  setComponents(components);
                  setAiResult(null);
                  setActiveTab('build');
                }}
              />
            )}

            {activeTab === 'ai-text' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-800">AI Textanalys</h3>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    Beskriv din måltid med egna ord så uppskattar AI näringsinnehållet.
                  </p>

                  <textarea
                    value={textDescription}
                    onChange={(e) => setTextDescription(e.target.value)}
                    placeholder="T.ex. 'Åt köttbullar med potatismos, gräddsås och lingonsylt hos mormor. Tog en normal portion och lite extra sås.'"
                    className="w-full h-32 p-3 border border-green-200 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />

                  <button
                    onClick={handleAnalyzeText}
                    disabled={!textDescription.trim() || analyzing}
                    className={cn(
                      'w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors',
                      textDescription.trim() && !analyzing
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Analyserar...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Analysera med AI
                      </>
                    )}
                  </button>
                </div>

                {aiError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    {aiError}
                  </div>
                )}

                {aiResult && (
                  <AIResultDisplay result={aiResult} />
                )}
              </div>
            )}

            {activeTab === 'ai-image' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Camera className="h-5 w-5 text-pink-600" />
                    <h3 className="font-medium text-pink-800">AI Bildanalys</h3>
                  </div>
                  <p className="text-sm text-pink-700 mb-4">
                    Ta ett foto eller ladda upp en bild av din måltid så analyserar AI vad du äter.
                  </p>

                  {/* Image Upload Area */}
                  {!imagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-pink-200 rounded-xl p-8 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors"
                    >
                      <Upload className="h-12 w-12 mx-auto text-pink-400 mb-3" />
                      <p className="text-pink-700 font-medium">Klicka för att ladda upp</p>
                      <p className="text-sm text-pink-500 mt-1">eller dra och släpp en bild</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Måltid"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* Optional text description */}
                  {imagePreview && (
                    <div className="mt-4">
                      <label className="text-sm text-pink-700 mb-2 block">
                        Lägg till beskrivning (valfritt):
                      </label>
                      <input
                        type="text"
                        value={textDescription}
                        onChange={(e) => setTextDescription(e.target.value)}
                        placeholder="T.ex. 'Det är köttbullar med extra sås'"
                        className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleAnalyzeImage}
                    disabled={!imagePreview || analyzing}
                    className={cn(
                      'w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors',
                      imagePreview && !analyzing
                        ? 'bg-pink-600 text-white hover:bg-pink-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Analyserar bild...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Analysera med AI
                      </>
                    )}
                  </button>
                </div>

                {aiError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    {aiError}
                  </div>
                )}

                {aiResult && (
                  <AIResultDisplay result={aiResult} />
                )}
              </div>
            )}
          </div>

          {/* Footer with Nutrition Summary and Save Button */}
          <div className="flex-shrink-0 border-t border-gray-200 pt-4 space-y-4">
            {(components.length > 0 || aiResult) && (
              <NutritionSummary
                nutrition={nutrition}
                confidence={aiResult?.confidence}
                showRange={!!(nutrition.kcalMin && nutrition.kcalMax)}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                disabled={(components.length === 0 && !aiResult) || saving}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors',
                  (components.length === 0 && !aiResult) || saving
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                )}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Sparar...' : 'Spara måltid'}
              </button>
            </div>
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

// AI Result Display Component
function AIResultDisplay({ result }: { result: AIAnalysisResult }) {
  const confidenceColors = {
    low: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-green-100 text-green-700 border-green-200',
  };

  const confidenceLabels = {
    low: 'Låg säkerhet',
    medium: 'Medium säkerhet',
    high: 'Hög säkerhet',
  };

  return (
    <div className="space-y-3">
      {/* Confidence Badge */}
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
        confidenceColors[result.confidence]
      )}>
        <Sparkles className="h-4 w-4" />
        {confidenceLabels[result.confidence]}
      </div>

      {/* Identified Items */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Identifierade komponenter:</h4>
        <div className="space-y-2">
          {result.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <span className="font-medium text-gray-900">{item.name}</span>
                <span className="text-sm text-gray-500 ml-2">~{item.estimatedGrams}g</span>
              </div>
              <span className="text-sm text-gray-600">{item.nutrition.kcal} kcal</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Reasoning */}
      {result.reasoning && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-800">{result.reasoning}</p>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions && result.suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Noteringar:</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            {result.suggestions.map((suggestion, index) => (
              <li key={index}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Saved Meals Tab Component
function SavedMealsTab({
  onSelect,
}: {
  onSelect: (components: SelectedComponent[]) => void;
}) {
  const [savedMeals, setSavedMeals] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    components: SelectedComponent[];
    totalNutrition: { kcal: number; protein: number; carbs: number; fat: number };
    useCount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedMeals = async () => {
      try {
        const response = await fetch('/api/social-meals/saved');
        if (response.ok) {
          const data = await response.json();
          setSavedMeals(data.savedMeals || []);
        }
      } catch (error) {
        console.error('Error fetching saved meals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedMeals();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
        Laddar favoriter...
      </div>
    );
  }

  if (savedMeals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Inga sparade favoriter</p>
        <p className="text-sm mt-1">
          Spara måltider du äter ofta för snabb registrering
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 max-h-80 overflow-y-auto">
      {savedMeals.map((meal) => (
        <button
          key={meal.id}
          onClick={() => onSelect(meal.components)}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-medium text-gray-900">{meal.name}</span>
            </div>
            {meal.description && (
              <p className="text-sm text-gray-600">{meal.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
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
  );
}
