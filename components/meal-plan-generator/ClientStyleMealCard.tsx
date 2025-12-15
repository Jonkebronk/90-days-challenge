'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Utensils, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MacroBadge } from './MacroBadge';
import { CategorySection } from './CategorySection';
import { FoodItemDisplay } from './FoodItemDisplay';
import { ProductSelectModal } from './ProductSelectModal';
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
  onAddSauce: (mealIndex: number) => void;
  onRemoveSauce: (mealIndex: number) => void;
  disabled?: boolean;
}

export function ClientStyleMealCard({
  meal,
  mealIndex,
  mealNumber,
  onSwapFood,
  onSelectFood,
  onAddSauce,
  onRemoveSauce,
  disabled = false,
}: ClientStyleMealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Modal state for product selection
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectCategory, setSelectCategory] = useState<MacroCategory | null>(null);
  const [selectTargetMacro, setSelectTargetMacro] = useState(0);

  const canHaveSauce = meal.type === 'lunch' || meal.type === 'middag';
  const hasVegetables = meal.vegetableGrams > 0;

  const mealLabel = mealNumber
    ? `${MEAL_TYPE_LABELS[meal.type]} ${mealNumber}`
    : MEAL_TYPE_LABELS[meal.type];

  // Group items by category for display order
  const proteinItem = meal.items.find(item => item.category === 'protein');
  const carbItem = meal.items.find(item => item.category === 'carb');
  const fatItem = meal.items.find(item => item.category === 'fat');

  const handleSwapFood = (category: MacroCategory, foodId: string) => {
    onSwapFood(mealIndex, category, foodId);
  };

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
          <div className="flex items-center gap-4">
            {/* Circular macro badges */}
            <div className="flex items-center gap-3">
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
        <div className="px-5 pb-5 space-y-4">
          {/* Minimalist instruction */}
          <p className="text-xs text-zinc-500 italic">
            Välj en råvara från varje kategori för att sätta ihop din måltid
          </p>

          {/* Category sections - grid layout: PROTEIN, KOLHYDRATER, FETT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proteinItem && (
              <CategorySection
                item={proteinItem}
                onSwapFood={!disabled ? handleSwapFood : undefined}
                onSelectFood={!disabled && onSelectFood ? handleOpenSelectModal : undefined}
                disabled={disabled}
              />
            )}

            {carbItem && (
              <CategorySection
                item={carbItem}
                onSwapFood={!disabled ? handleSwapFood : undefined}
                onSelectFood={!disabled && onSelectFood ? handleOpenSelectModal : undefined}
                disabled={disabled}
              />
            )}

            {fatItem && (
              <CategorySection
                item={fatItem}
                onSwapFood={!disabled ? handleSwapFood : undefined}
                onSelectFood={!disabled && onSelectFood ? handleOpenSelectModal : undefined}
                disabled={disabled}
              />
            )}
          </div>

          {/* Vegetables section (if applicable) */}
          {hasVegetables && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Grönsaker
                </span>
                {!disabled && onSelectFood && (
                  <button
                    onClick={() => handleOpenSelectModal('vegetable', 0)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 hover:opacity-80 transition-opacity"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Bläddra</span>
                  </button>
                )}
              </div>
              <div className="rounded-xl p-3 bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-zinc-900">{VEGETABLE_GRAMS}g</span>
                    <p className="text-sm text-zinc-700 font-medium">Valfria grönsaker</p>
                  </div>
                </div>
                <p className="text-[11px] text-green-600 mt-2">
                  Räknas inte i makros - ät fritt!
                </p>
              </div>
            </div>
          )}

          {/* Sauce section */}
          {canHaveSauce && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                Sås
              </span>
              {meal.sauce ? (
                <div className="rounded-xl p-3 bg-orange-50 border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                      <span className="text-2xl">🥫</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-lg font-bold text-zinc-900">{Math.round(meal.sauce.grams)}g</span>
                      <p className="text-sm text-zinc-700 font-medium">{meal.sauce.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSauce(mealIndex)}
                      disabled={disabled}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Ta bort
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onAddSauce(mealIndex)}
                  disabled={disabled}
                  className="w-full rounded-xl p-3 border-2 border-dashed border-orange-200 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-300 transition-colors text-orange-600 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Lägg till sås</span>
                </button>
              )}
            </div>
          )}
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
