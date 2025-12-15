'use client';

import { RefreshCw, Search } from 'lucide-react';
import type { GeneratedMealItem, MacroCategory, CalculatedMacros } from '@/lib/types/meal-plan-generator';

interface CategorySectionProps {
  item: GeneratedMealItem;
  onSwapFood?: (category: MacroCategory, foodId: string) => void;
  onSelectFood?: (category: MacroCategory, targetMacro: number) => void;
  disabled?: boolean;
}

const categoryColors: Record<MacroCategory, { bg: string; border: string; text: string; badge: string }> = {
  protein: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
  carb: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  fat: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  vegetable: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  sauce: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
};

const categoryTitles: Record<MacroCategory, string> = {
  protein: 'Protein',
  carb: 'Kolhydrater',
  fat: 'Fett',
  vegetable: 'Grönsaker',
  sauce: 'Sås',
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
  const colors = categoryColors[item.category];

  // Combine selected + alternatives for display
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
    <div className="space-y-2">
      {/* Category title with search button */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
          {categoryTitles[item.category]}
        </span>
        {!disabled && onSelectFood && (
          <button
            onClick={() => onSelectFood(item.category, targetMacro)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${colors.badge} hover:opacity-80 transition-opacity`}
          >
            <Search className="h-3 w-3" />
            <span>Sök</span>
          </button>
        )}
      </div>

      {/* Food cards */}
      <div className="space-y-2">
        {allOptions.map((option, index) => (
          <div key={option.foodId}>
            {/* ELLER label */}
            {index > 0 && (
              <div className="flex justify-center py-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">eller</span>
              </div>
            )}

            {/* Food card */}
            <div className={`rounded-xl p-3 ${colors.bg} ${colors.border} border ${option.isSelected ? 'ring-2 ring-offset-1 ring-zinc-400' : ''}`}>
              <div className="flex items-center gap-3">
                {/* Product image */}
                {option.image ? (
                  <img
                    src={option.image}
                    alt={option.name}
                    className="w-12 h-12 rounded-lg object-cover bg-white shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                    <span className="text-zinc-300 text-[10px]">Bild</span>
                  </div>
                )}

                {/* Food info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-zinc-900">
                      {Math.round(option.grams)}g
                    </span>
                    {option.isSelected && (
                      <span className="text-[10px] font-medium text-zinc-500 uppercase">Vald</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-700 font-medium truncate">
                    {option.name}
                  </p>
                </div>

                {/* Action button */}
                {!disabled && onSwapFood && !option.isSelected && (
                  <button
                    onClick={() => onSwapFood(item.category, option.foodId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white shadow-sm border border-zinc-200 hover:border-zinc-300 hover:shadow transition-all text-xs font-medium text-zinc-700"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Välj
                  </button>
                )}
              </div>

              {/* Swap impact - shown for alternatives */}
              {!option.isSelected && (
                <div className="mt-2 pt-2 border-t border-zinc-200/50">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-zinc-500">Vid byte:</span>
                    {(() => {
                      const impact = getSwapImpact(option.macros);
                      return (
                        <div className="flex gap-2">
                          <span className={getDiffColor(impact.protein)}>P {formatDiff(impact.protein)}</span>
                          <span className={getDiffColor(impact.carbs)}>K {formatDiff(impact.carbs)}</span>
                          <span className={getDiffColor(impact.fat)}>F {formatDiff(impact.fat)}</span>
                          <span className={getDiffColor(impact.kcal)}>{formatDiff(impact.kcal)} kcal</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
