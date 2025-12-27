'use client';

import { cn } from '@/lib/utils';
import type { FoodWithGrams } from '@/lib/types/meal-plan-generator';

interface FoodItemDisplayProps {
  food: FoodWithGrams;
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'sauce' | 'berry';
  isSelected?: boolean;
  onClick?: () => void;
  showMacros?: boolean;
  compact?: boolean;
}

const categoryColors = {
  protein: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    selectedBorder: 'border-pink-500',
    text: 'text-pink-700',
    label: 'Protein',
  },
  carb: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    selectedBorder: 'border-teal-500',
    text: 'text-teal-700',
    label: 'Kolhydrat',
  },
  fat: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    selectedBorder: 'border-amber-500',
    text: 'text-amber-700',
    label: 'Fett',
  },
  vegetable: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    selectedBorder: 'border-green-500',
    text: 'text-green-700',
    label: 'Grönsak',
  },
  sauce: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    selectedBorder: 'border-orange-500',
    text: 'text-orange-700',
    label: 'Sås',
  },
  berry: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    selectedBorder: 'border-purple-500',
    text: 'text-purple-700',
    label: 'Bär',
  },
};

export function FoodItemDisplay({
  food,
  category,
  isSelected = false,
  onClick,
  showMacros = true,
  compact = false,
}: FoodItemDisplayProps) {
  const colors = categoryColors[category];

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border-2 transition-all',
        colors.bg,
        isSelected ? colors.selectedBorder : colors.border,
        onClick && 'cursor-pointer hover:shadow-md',
        compact ? 'p-2' : 'p-3'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'font-medium text-gray-900 truncate',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {food.name}
          </h4>
          <p className={cn('text-gray-500', compact ? 'text-xs' : 'text-sm')}>
            {Math.round(food.grams)}g
          </p>
        </div>
        {showMacros && !compact && (
          <div className="text-right text-xs text-gray-500 space-y-0.5">
            <div>P: {food.macros.protein.toFixed(1)}g</div>
            <div>K: {food.macros.carbs.toFixed(1)}g</div>
            <div>F: {food.macros.fat.toFixed(1)}g</div>
          </div>
        )}
      </div>
      {showMacros && compact && (
        <div className="mt-1 text-xs text-gray-500 flex gap-2">
          <span>P: {food.macros.protein.toFixed(0)}g</span>
          <span>K: {food.macros.carbs.toFixed(0)}g</span>
          <span>F: {food.macros.fat.toFixed(0)}g</span>
        </div>
      )}
    </div>
  );
}
