'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, RefreshCw, Plus, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoodItemDisplay } from './FoodItemDisplay';
import type {
  GeneratedMeal,
  GeneratedMealItem,
  MacroCategory,
} from '@/lib/types/meal-plan-generator';
import { MEAL_TYPE_LABELS, VEGETABLE_GRAMS } from '@/lib/types/meal-plan-generator';

interface MealCardProps {
  meal: GeneratedMeal;
  mealIndex: number;
  mealNumber?: number;
  onSwapFood: (mealIndex: number, category: MacroCategory, foodId: string) => void;
  onAddSauce: (mealIndex: number) => void;
  onRemoveSauce: (mealIndex: number) => void;
  disabled?: boolean;
}

export function MealCard({
  meal,
  mealIndex,
  mealNumber,
  onSwapFood,
  onAddSauce,
  onRemoveSauce,
  disabled = false,
}: MealCardProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<MacroCategory>>(
    new Set()
  );

  const toggleCategory = (category: MacroCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const canHaveSauce = meal.type === 'lunch' || meal.type === 'middag';
  const hasVegetables = meal.vegetableGrams > 0;

  const mealLabel = mealNumber
    ? `${MEAL_TYPE_LABELS[meal.type]} ${mealNumber}`
    : MEAL_TYPE_LABELS[meal.type];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{mealLabel}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {Math.round(meal.totalMacros.kcal)} kcal
            </Badge>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-500 mt-1">
          <span className="text-pink-600">P: {meal.totalMacros.protein.toFixed(1)}g</span>
          <span className="text-teal-600">K: {meal.totalMacros.carbs.toFixed(1)}g</span>
          <span className="text-amber-600">F: {meal.totalMacros.fat.toFixed(1)}g</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Food items by category */}
        {meal.items.map((item) => (
          <MealItemSection
            key={item.category}
            item={item}
            isExpanded={expandedCategories.has(item.category)}
            onToggle={() => toggleCategory(item.category)}
            onSelectAlternative={(foodId) =>
              onSwapFood(mealIndex, item.category, foodId)
            }
            disabled={disabled}
          />
        ))}

        {/* Vegetables (if applicable) */}
        {hasVegetables && (
          <div className="rounded-lg bg-green-50 border-2 border-green-200 p-3">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700">Grönsaker</span>
              <span className="text-sm text-green-600">{VEGETABLE_GRAMS}g (valfria)</span>
            </div>
          </div>
        )}

        {/* Sauce */}
        {canHaveSauce && (
          <div className="pt-2 border-t border-gray-100">
            {meal.sauce ? (
              <div className="flex items-center justify-between">
                <FoodItemDisplay
                  food={meal.sauce}
                  category="sauce"
                  isSelected={true}
                  compact
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSauce(mealIndex)}
                  disabled={disabled}
                  className="ml-2 text-red-500 hover:text-red-700"
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
        )}
      </CardContent>
    </Card>
  );
}

interface MealItemSectionProps {
  item: GeneratedMealItem;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectAlternative: (foodId: string) => void;
  disabled?: boolean;
}

function MealItemSection({
  item,
  isExpanded,
  onToggle,
  onSelectAlternative,
  disabled,
}: MealItemSectionProps) {
  const hasAlternatives = item.alternatives.length > 0;

  return (
    <div className="space-y-2">
      {/* Selected food */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <FoodItemDisplay
            food={item.selected}
            category={item.category}
            isSelected={true}
          />
        </div>
        {hasAlternatives && !disabled && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Alternatives */}
      {isExpanded && hasAlternatives && (
        <div className="ml-4 space-y-2">
          <p className="text-xs text-gray-500 font-medium">Alternativ:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.alternatives.map((alt) => (
              <FoodItemDisplay
                key={alt.foodId}
                food={{
                  foodId: alt.foodId,
                  name: alt.name,
                  grams: alt.grams,
                  macros: alt.macros,
                }}
                category={item.category}
                isSelected={false}
                onClick={() => onSelectAlternative(alt.foodId)}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
