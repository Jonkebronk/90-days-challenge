'use client';

import { RefreshCw, Search, Info, ArrowRight } from 'lucide-react';
import type { GeneratedMealItem, MacroCategory, CalculatedMacros } from '@/lib/types/meal-plan-generator';

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

// Format macro difference with + or - sign
function formatDiff(diff: number): string {
  if (diff === 0) return '±0';
  return diff > 0 ? `+${Math.round(diff)}` : `${Math.round(diff)}`;
}

// Get color class for difference
function getDiffColor(diff: number): string {
  if (diff === 0) return 'text-zinc-500';
  if (diff > 0) return 'text-red-600';
  return 'text-green-600';
}

export function CategorySection({ item, onSwapFood, onSelectFood, disabled }: CategorySectionProps) {
  // Combine selected + alternatives for display with ELLER dividers
  const allOptions = [
    {
      foodId: item.selected.foodId,
      name: item.selected.name,
      grams: item.selected.grams,
      macros: item.selected.macros,
      image: item.selected.image,
      isSelected: true
    },
    ...item.alternatives.map(alt => ({
      foodId: alt.foodId,
      name: alt.name,
      grams: alt.grams,
      macros: alt.macros,
      image: alt.image,
      isSelected: false
    }))
  ];

  const targetMacro = getTargetMacro(item);
  const selectedMacros = item.selected.macros;

  // Calculate macro differences for alternatives
  const getSwapImpact = (altMacros: CalculatedMacros) => {
    return {
      protein: altMacros.protein - selectedMacros.protein,
      carbs: altMacros.carbs - selectedMacros.carbs,
      fat: altMacros.fat - selectedMacros.fat,
      kcal: altMacros.kcal - selectedMacros.kcal,
    };
  };

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

            <div className="flex items-center gap-3 py-1.5">
              {/* Product image thumbnail */}
              {option.image ? (
                <img
                  src={option.image}
                  alt={option.name}
                  className="w-10 h-10 rounded-lg object-cover bg-zinc-100 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                  <span className="text-zinc-300 text-xs">Bild</span>
                </div>
              )}

              {/* Grams + Name */}
              <span className={`flex-1 text-sm ${option.isSelected ? 'text-zinc-800 font-medium' : 'text-zinc-600'}`}>
                {Math.round(option.grams)}g {option.name}
              </span>

              {/* Buttons container */}
              <div className="flex items-center gap-1.5">
                {/* Search button - on every row */}
                {!disabled && onSelectFood && (
                  <button
                    onClick={() => onSelectFood(item.category, targetMacro)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-zinc-300 hover:border-amber-400 hover:bg-amber-50 transition-colors text-xs text-zinc-600 hover:text-amber-700"
                    title="Sök i produktbiblioteket"
                  >
                    <Search className="h-3 w-3" />
                    <span>Sök</span>
                  </button>
                )}

                {/* Swap button - for alternatives */}
                {!disabled && onSwapFood && !option.isSelected && (
                  <button
                    onClick={() => onSwapFood(item.category, option.foodId)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 hover:border-amber-400 transition-colors text-xs text-amber-700 hover:text-amber-800 font-medium"
                    title="Välj detta alternativ"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Välj</span>
                  </button>
                )}
              </div>
            </div>

            {/* Swap impact info - shown for alternatives */}
            {!option.isSelected && (
              <div className="ml-[52px] mt-1 mb-2">
                <div className="inline-flex items-center gap-2 px-2 py-1 bg-zinc-50 rounded text-xs">
                  <span className="text-zinc-500">Vid byte:</span>
                  {(() => {
                    const impact = getSwapImpact(option.macros);
                    return (
                      <>
                        <span className={getDiffColor(impact.protein)}>P {formatDiff(impact.protein)}g</span>
                        <span className={getDiffColor(impact.carbs)}>K {formatDiff(impact.carbs)}g</span>
                        <span className={getDiffColor(impact.fat)}>F {formatDiff(impact.fat)}g</span>
                        <span className={getDiffColor(impact.kcal)}>{formatDiff(impact.kcal)} kcal</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
