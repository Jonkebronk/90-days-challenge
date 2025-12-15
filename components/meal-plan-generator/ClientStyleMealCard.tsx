'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Utensils, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MacroBadge } from './MacroBadge';
import { CategorySection } from './CategorySection';
import { FoodItemDisplay } from './FoodItemDisplay';
import type {
  GeneratedMeal,
  MacroCategory,
} from '@/lib/types/meal-plan-generator';
import { MEAL_TYPE_LABELS, VEGETABLE_GRAMS } from '@/lib/types/meal-plan-generator';

interface ClientStyleMealCardProps {
  meal: GeneratedMeal;
  mealIndex: number;
  mealNumber?: number;
  onSwapFood: (mealIndex: number, category: MacroCategory, foodId: string) => void;
  onAddSauce: (mealIndex: number) => void;
  onRemoveSauce: (mealIndex: number) => void;
  disabled?: boolean;
}

export function ClientStyleMealCard({
  meal,
  mealIndex,
  mealNumber,
  onSwapFood,
  onAddSauce,
  onRemoveSauce,
  disabled = false,
}: ClientStyleMealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
        <div className="px-5 pb-5 space-y-3">
          {/* Instructions card */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200">
              <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">INSTRUKTIONER</h4>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-zinc-600 leading-relaxed">
                Du tar en råvara från varje angiven källa och gör en måltid.
              </p>
            </div>
          </div>

          {/* Category sections - grid layout: PROTEIN, KOLHYDRATER, FETT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {proteinItem && (
              <CategorySection
                item={proteinItem}
                onSwapFood={!disabled ? handleSwapFood : undefined}
                disabled={disabled}
              />
            )}

            {carbItem && (
              <CategorySection
                item={carbItem}
                onSwapFood={!disabled ? handleSwapFood : undefined}
                disabled={disabled}
              />
            )}

            {fatItem && (
              <CategorySection
                item={fatItem}
                onSwapFood={!disabled ? handleSwapFood : undefined}
                disabled={disabled}
              />
            )}
          </div>

          {/* Vegetables section (if applicable) */}
          {hasVegetables && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200">
                <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">GRÖNSAKER</h4>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-zinc-700">{VEGETABLE_GRAMS}g valfria grönsaker</span>
                </div>
              </div>
            </div>
          )}

          {/* Sauce section */}
          {canHaveSauce && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200">
                <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">SÅS</h4>
              </div>
              <div className="px-4 py-3">
                {meal.sauce ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-lg leading-none">•</span>
                      <span className="text-sm text-zinc-700">
                        {Math.round(meal.sauce.grams)}g {meal.sauce.name}
                      </span>
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
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddSauce(mealIndex)}
                    disabled={disabled}
                    className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till sås
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
