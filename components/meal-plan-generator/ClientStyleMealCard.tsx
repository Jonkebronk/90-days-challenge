'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, Utensils, Leaf, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MacroBadge } from './MacroBadge';
import { ProductSelectModal } from './ProductSelectModal';
import { cn } from '@/lib/utils';
import type {
  GeneratedMeal,
  MacroCategory,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';
import { MEAL_TYPE_LABELS, VEGETABLE_GRAMS } from '@/lib/types/meal-plan-generator';

interface ProductForSelect {
  id: string;
  name: string;
  brand?: string | null;
  image?: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ClientStyleMealCardProps {
  meal: GeneratedMeal;
  mealIndex: number;
  mealNumber?: number;
  onSwapFood: (mealIndex: number, category: MacroCategory, foodId: string) => void;
  onSelectFood?: (mealIndex: number, category: MacroCategory, product: ProductForSelect, grams: number, macros: CalculatedMacros) => void;
  onRemoveFood?: (mealIndex: number, category: MacroCategory) => void;
  onRemoveAlternative?: (mealIndex: number, category: MacroCategory, foodId: string) => void;
  onAddAlternative?: (mealIndex: number, category: MacroCategory, product: ProductForSelect, grams: number, macros: CalculatedMacros) => void;
  onAddSauce: (mealIndex: number) => void;
  onRemoveSauce: (mealIndex: number) => void;
  onUpdateGrams?: (mealIndex: number, category: MacroCategory, grams: number) => void;
  onUpdateMealMacros?: (mealIndex: number, targetMacros: CalculatedMacros) => void;
  disabled?: boolean;
}

// Category colors and labels
const CATEGORY_CONFIG: Record<MacroCategory, { bg: string; border: string; text: string; label: string }> = {
  protein: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', label: 'Protein' },
  carb: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Kolhydrater' },
  fat: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Fett' },
  vegetable: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Grönsaker' },
  sauce: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'Sås' },
};

export function ClientStyleMealCard({
  meal,
  mealIndex,
  mealNumber,
  onSelectFood,
  onRemoveFood,
  onAddSauce,
  onRemoveSauce,
  onUpdateGrams,
  disabled = false,
}: ClientStyleMealCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Modal state for product selection
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectCategory, setSelectCategory] = useState<MacroCategory | null>(null);
  const [selectTargetMacro, setSelectTargetMacro] = useState(0);

  const mealLabel = mealNumber
    ? `${MEAL_TYPE_LABELS[meal.type]} ${mealNumber}`
    : MEAL_TYPE_LABELS[meal.type];

  // Get items by category
  const proteinItem = meal.items.find(item => item.category === 'protein');
  const carbItem = meal.items.find(item => item.category === 'carb');
  const fatItem = meal.items.find(item => item.category === 'fat');

  const canHaveSauce = meal.type === 'lunch' || meal.type === 'middag';
  const hasVegetables = meal.vegetableGrams > 0;

  // Open product select modal
  const handleOpenSelectModal = (category: MacroCategory, targetMacro: number) => {
    setSelectCategory(category);
    setSelectTargetMacro(targetMacro);
    setSelectModalOpen(true);
  };

  // Handle product selection from modal
  const handleProductSelect = (product: ProductForSelect, grams: number, macros: CalculatedMacros) => {
    if (selectCategory && onSelectFood) {
      onSelectFood(mealIndex, selectCategory, product, grams, macros);
    }
    setSelectModalOpen(false);
  };

  // Handle grams adjustment
  const adjustGrams = (category: MacroCategory, delta: number) => {
    const item = meal.items.find(i => i.category === category);
    if (item && onUpdateGrams) {
      const newGrams = Math.max(10, item.selected.grams + delta);
      onUpdateGrams(mealIndex, category, newGrams);
    }
  };

  // Get target macro for category
  const getTargetMacro = (category: MacroCategory): number => {
    switch (category) {
      case 'protein': return meal.targetMacros?.protein || 30;
      case 'carb': return meal.targetMacros?.carbs || 30;
      case 'fat': return meal.targetMacros?.fat || 15;
      default: return 0;
    }
  };

  // Render a food item row
  const renderFoodRow = (
    item: { category: MacroCategory; selected: { foodId: string; name: string; grams: number; macros: CalculatedMacros } } | undefined,
    category: MacroCategory
  ) => {
    const config = CATEGORY_CONFIG[category];
    const targetMacro = getTargetMacro(category);

    if (!item) {
      // Empty state - show add button
      return (
        <div
          key={category}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg border-2 border-dashed",
            config.border, config.bg
          )}
        >
          <span className={cn("text-sm font-medium", config.text)}>
            {config.label}
          </span>
          <button
            onClick={() => !disabled && handleOpenSelectModal(category, targetMacro)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              config.bg, config.text, "hover:opacity-80"
            )}
          >
            <Plus className="h-4 w-4" />
            Lägg till
          </button>
        </div>
      );
    }

    return (
      <div
        key={category}
        className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200"
      >
        {/* Food name and grams */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900 truncate">
              {item.selected.name}
            </span>
            <span className="text-sm font-semibold text-zinc-500">
              {item.selected.grams}g
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          {/* Decrease grams */}
          <button
            onClick={() => adjustGrams(category, -10)}
            disabled={disabled || item.selected.grams <= 10}
            className="p-1.5 rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 disabled:opacity-30 transition-colors"
            title="Minska 10g"
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Increase grams */}
          <button
            onClick={() => adjustGrams(category, 10)}
            disabled={disabled}
            className="p-1.5 rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 disabled:opacity-30 transition-colors"
            title="Öka 10g"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Swap food */}
          <button
            onClick={() => !disabled && handleOpenSelectModal(category, targetMacro)}
            disabled={disabled}
            className="p-1.5 rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 disabled:opacity-30 transition-colors"
            title="Byt livsmedel"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Remove food */}
          {onRemoveFood && (
            <button
              onClick={() => !disabled && onRemoveFood(mealIndex, category)}
              disabled={disabled}
              className="p-1.5 rounded hover:bg-red-100 text-zinc-400 hover:text-red-600 disabled:opacity-30 transition-colors"
              title="Ta bort"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">
      {/* Header */}
      <button
        className="w-full cursor-pointer py-4 px-5 hover:bg-zinc-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          {/* Left side: Icon + Name */}
          <div className="flex items-center gap-3">
            <Utensils className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-semibold text-zinc-900">{mealLabel}</span>
          </div>

          {/* Right side: Macro badges + Chevron */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <MacroBadge label="K" value={meal.totalMacros.kcal} color="green" />
              <MacroBadge label="P" value={meal.totalMacros.protein} color="red" />
              <MacroBadge label="F" value={meal.totalMacros.fat} color="blue" />
              <MacroBadge label="C" value={meal.totalMacros.carbs} color="amber" />
            </div>

            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-2">
          {/* Food items list */}
          {renderFoodRow(proteinItem, 'protein')}
          {renderFoodRow(carbItem, 'carb')}
          {renderFoodRow(fatItem, 'fat')}

          {/* Vegetables section */}
          {hasVegetables && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Leaf className="h-5 w-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <span className="font-medium text-zinc-900">Grönsaker</span>
                <span className="text-sm text-green-600 ml-2">{VEGETABLE_GRAMS}g (valfritt)</span>
              </div>
            </div>
          )}

          {/* Sauce section */}
          {canHaveSauce && (
            meal.sauce ? (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-xl">🥫</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-zinc-900 truncate">
                    {meal.sauce.name}
                  </span>
                  <span className="text-sm text-zinc-500 ml-2">
                    {Math.round(meal.sauce.grams)}g
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSauce(mealIndex)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700 text-xs h-8"
                >
                  Ta bort
                </Button>
              </div>
            ) : (
              <button
                onClick={() => onAddSauce(mealIndex)}
                disabled={disabled}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-orange-200 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-300 transition-colors text-orange-600"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Lägg till sås</span>
              </button>
            )
          )}

          {/* Totals summary */}
          <div className="pt-2 mt-2 border-t border-zinc-100">
            <div className="text-xs text-zinc-500">
              TOTALT: P{meal.totalMacros.protein.toFixed(0)}g | K{meal.totalMacros.carbs.toFixed(0)}g | F{meal.totalMacros.fat.toFixed(0)}g | {meal.totalMacros.kcal.toFixed(0)} kcal
            </div>
          </div>
        </div>
      )}

      {/* Product Select Modal */}
      {selectCategory && (
        <ProductSelectModal
          isOpen={selectModalOpen}
          onClose={() => setSelectModalOpen(false)}
          category={selectCategory}
          targetMacro={selectTargetMacro}
          mealType={meal.type}
          onSelect={handleProductSelect}
        />
      )}
    </div>
  );
}
