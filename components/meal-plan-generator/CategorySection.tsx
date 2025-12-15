'use client';

import { RefreshCw, Search } from 'lucide-react';
import type { GeneratedMealItem, MacroCategory } from '@/lib/types/meal-plan-generator';

interface CategorySectionProps {
  item: GeneratedMealItem;
  onSwapFood?: (category: MacroCategory, foodId: string) => void;
  onSelectFood?: (category: MacroCategory, targetMacro: number) => void;
  disabled?: boolean;
}

const categoryTitles: Record<MacroCategory, string> = {
  protein: 'PROTEIN',
  carb: 'KOLHYDRATER',
  fat: 'FETT',
  vegetable: 'GRÖNSAKER',
  sauce: 'SÅS',
};

// Get target macro based on category
function getTargetMacro(item: GeneratedMealItem): number {
  switch (item.category) {
    case 'protein':
      return item.selected.macros.protein;
    case 'carb':
      return item.selected.macros.carbs;
    case 'fat':
      return item.selected.macros.fat;
    default:
      return 0;
  }
}

export function CategorySection({ item, onSwapFood, onSelectFood, disabled }: CategorySectionProps) {
  // Combine selected + alternatives for display with ELLER dividers
  const allOptions = [
    { foodId: item.selected.foodId, name: item.selected.name, grams: item.selected.grams, isSelected: true },
    ...item.alternatives.map(alt => ({ foodId: alt.foodId, name: alt.name, grams: alt.grams, isSelected: false }))
  ];

  const targetMacro = getTargetMacro(item);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Gray header */}
      <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200">
        <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">
          {categoryTitles[item.category]}
        </h4>
      </div>

      {/* Ingredients with ELLER dividers */}
      <div className="px-4 py-3">
        {allOptions.map((option, index) => (
          <div key={option.foodId}>
            {/* ELLER divider */}
            {index > 0 && (
              <div className="flex items-center gap-3 py-2 my-1">
                <div className="h-px flex-1 bg-zinc-200" />
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">ELLER</span>
                <div className="h-px flex-1 bg-zinc-200" />
              </div>
            )}

            <div className="flex items-center gap-2 py-1.5 group">
              {/* Bullet point */}
              <span className="text-zinc-400 text-lg leading-none">•</span>

              {/* Grams + Name */}
              <span className={`flex-1 text-sm ${option.isSelected ? 'text-zinc-800 font-medium' : 'text-zinc-600'}`}>
                {Math.round(option.grams)}g {option.name}
              </span>

              {/* Search button - opens product select modal */}
              {!disabled && onSelectFood && (
                <button
                  onClick={() => onSelectFood(item.category, targetMacro)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-amber-50 transition-opacity"
                  title="Sök i produktbiblioteket"
                >
                  <Search className="h-3.5 w-3.5 text-zinc-400 hover:text-amber-600" />
                </button>
              )}

              {/* Swap button - visible on hover */}
              {!disabled && onSwapFood && (
                <button
                  onClick={() => onSwapFood(item.category, option.foodId)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-100 transition-opacity"
                  title={option.isSelected ? 'Byt till annat livsmedel' : 'Välj detta alternativ'}
                >
                  <RefreshCw className="h-3.5 w-3.5 text-zinc-400 hover:text-amber-600" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
