'use client';

import { RefreshCw, Search, Info } from 'lucide-react';
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

const categoryInfo: Record<MacroCategory, string> = {
  protein: 'Proteinkällor kan innehålla fett. Välj mager källa för lägre kalorier.',
  carb: 'Kolhydratkällor ger energi. Fullkorn ger längre mättnad.',
  fat: 'Fettkällor är kaloritäta. Små portioner ger stort bidrag.',
  vegetable: 'Grönsaker är fria och räknas inte i makros.',
  sauce: 'Såser bidrar med extra kalorier och fett.',
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

// Get macro label based on category
function getMacroLabel(category: MacroCategory): string {
  switch (category) {
    case 'protein':
      return 'protein';
    case 'carb':
      return 'kolhydrater';
    case 'fat':
      return 'fett';
    default:
      return '';
  }
}

export function CategorySection({ item, onSwapFood, onSelectFood, disabled }: CategorySectionProps) {
  // Combine selected + alternatives for display with ELLER dividers
  const allOptions = [
    { foodId: item.selected.foodId, name: item.selected.name, grams: item.selected.grams, isSelected: true },
    ...item.alternatives.map(alt => ({ foodId: alt.foodId, name: alt.name, grams: alt.grams, isSelected: false }))
  ];

  const targetMacro = getTargetMacro(item);
  const macroLabel = getMacroLabel(item.category);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Gray header with search button */}
      <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">
          {categoryTitles[item.category]}
        </h4>
        {/* Search button in header - always visible */}
        {!disabled && onSelectFood && (
          <button
            onClick={() => onSelectFood(item.category, targetMacro)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-zinc-300 hover:border-amber-400 hover:bg-amber-50 transition-colors text-xs text-zinc-600 hover:text-amber-700"
            title="Sök i produktbiblioteket"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Sök</span>
          </button>
        )}
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

              {/* Swap button - always visible for alternatives */}
              {!disabled && onSwapFood && !option.isSelected && (
                <button
                  onClick={() => onSwapFood(item.category, option.foodId)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 hover:bg-amber-100 border border-zinc-200 hover:border-amber-300 transition-colors text-xs text-zinc-600 hover:text-amber-700"
                  title="Välj detta alternativ"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Välj</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info box about macro impact */}
      <div className="px-4 pb-3">
        <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <span className="font-medium">Mål: {Math.round(targetMacro)}g {macroLabel}</span>
            <p className="mt-0.5 text-blue-600">{categoryInfo[item.category]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
