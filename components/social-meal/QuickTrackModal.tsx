'use client';

import { useState, useCallback } from 'react';
import { X, Utensils, ChefHat, Star, Save, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategorySelector } from './CategorySelector';
import { FoodItemPicker } from './FoodItemPicker';
import { SelectedComponentsList } from './SelectedComponentsList';
import { FamilyDinnerGrid } from './FamilyDinnerGrid';
import { NutritionSummary } from './NutritionSummary';
import type {
  QuickTrackCategory,
  PortionSize,
  SelectedComponent,
  MealType,
  FamilyDinnerPreset,
  QuickTrackFoodItem,
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
  }) => Promise<void>;
  initialMealType?: MealType;
}

type TabType = 'build' | 'presets' | 'saved';

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

  const nutrition = calculateTotalNutrition(components);

  const handleAddComponent = useCallback(
    (item: QuickTrackFoodItem, portion: PortionSize) => {
      if (!selectedCategory) return;

      const component = createComponent(selectedCategory, item.id, portion);
      if (component) {
        setComponents((prev) => [...prev, component]);
        setSelectedCategory(null);
      }
    },
    [selectedCategory]
  );

  const handleRemoveComponent = useCallback((index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handlePresetSelect = useCallback((preset: FamilyDinnerPreset) => {
    const presetComponents = createComponentsFromPreset(preset.id);
    setComponents(presetComponents);
    setUsedPreset({ id: preset.id, name: preset.name });
    setActiveTab('build');
  }, []);

  const handleSave = async () => {
    if (components.length === 0) return;

    setSaving(true);
    try {
      await onSave({
        mealType,
        components,
        nutrition,
        presetId: usedPreset?.id,
        presetName: usedPreset?.name,
      });
      // Reset state
      setComponents([]);
      setSelectedCategory(null);
      setUsedPreset(null);
      onClose();
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
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            <button
              onClick={() => setActiveTab('build')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors',
                activeTab === 'build'
                  ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Plus className="h-4 w-4" />
              Bygg måltid
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors',
                activeTab === 'presets'
                  ? 'bg-amber-100 text-amber-700 border-b-2 border-amber-500'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <ChefHat className="h-4 w-4" />
              Familjemiddagar
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors',
                activeTab === 'saved'
                  ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Star className="h-4 w-4" />
              Mina favoriter
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
                setActiveTab('build');
              }}
            />
          )}
        </div>

        {/* Footer with Nutrition Summary and Save Button */}
        <div className="flex-shrink-0 border-t border-gray-200 pt-4 space-y-4">
          {components.length > 0 && (
            <NutritionSummary nutrition={nutrition} />
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
              disabled={components.length === 0 || saving}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors',
                components.length === 0 || saving
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

  // Fetch saved meals on mount
  useState(() => {
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
  });

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
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
