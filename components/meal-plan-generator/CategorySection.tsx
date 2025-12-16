'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Search, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { GeneratedMealItem, MacroCategory, CalculatedMacros } from '@/lib/types/meal-plan-generator';

interface CategorySectionProps {
  item: GeneratedMealItem;
  onSwapFood?: (category: MacroCategory, foodId: string) => void;
  onSelectFood?: (category: MacroCategory, targetMacro: number) => void;
  onUpdateGrams?: (category: MacroCategory, grams: number) => void;
  onRemoveFood?: (category: MacroCategory) => void;
  onRemoveAlternative?: (category: MacroCategory, foodId: string) => void;
  disabled?: boolean;
}

const categoryColors: Record<MacroCategory, {
  bg: string;
  border: string;
  text: string;
  badge: string;
  selectedBg: string;
  selectedBorder: string;
}> = {
  protein: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700', selectedBg: 'bg-rose-100', selectedBorder: 'border-rose-400' },
  carb: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', selectedBg: 'bg-amber-100', selectedBorder: 'border-amber-400' },
  fat: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', selectedBg: 'bg-blue-100', selectedBorder: 'border-blue-400' },
  vegetable: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', selectedBg: 'bg-green-100', selectedBorder: 'border-green-400' },
  sauce: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', selectedBg: 'bg-orange-100', selectedBorder: 'border-orange-400' },
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

export function CategorySection({ item, onSwapFood, onSelectFood, onUpdateGrams, onRemoveFood, onRemoveAlternative, disabled }: CategorySectionProps) {
  const colors = categoryColors[item.category];
  const targetMacro = getTargetMacro(item);
  const selectedMacros = item.selected.macros;

  // Local state for editable grams
  const [editingGrams, setEditingGrams] = useState(false);
  const [gramsValue, setGramsValue] = useState(item.selected.grams.toString());

  // Update local state when item changes
  useEffect(() => {
    setGramsValue(item.selected.grams.toString());
  }, [item.selected.grams]);

  const handleGramsBlur = () => {
    setEditingGrams(false);
    const newGrams = parseInt(gramsValue) || 0;
    if (newGrams > 0 && newGrams !== item.selected.grams && onUpdateGrams) {
      onUpdateGrams(item.category, newGrams);
    } else {
      setGramsValue(item.selected.grams.toString());
    }
  };

  const handleGramsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGramsBlur();
    } else if (e.key === 'Escape') {
      setGramsValue(item.selected.grams.toString());
      setEditingGrams(false);
    }
  };

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

      {/* Selected food card - distinct styling */}
      <div className={`rounded-xl p-3 ${colors.selectedBg} border-2 ${colors.selectedBorder} shadow-sm`}>
        <div className="flex items-center gap-3">
          {/* Product image */}
          {item.selected.image ? (
            <img
              src={item.selected.image}
              alt={item.selected.name}
              className="w-14 h-14 rounded-lg object-cover bg-white shadow-sm shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
              <span className="text-zinc-300 text-[10px]">Bild</span>
            </div>
          )}

          {/* Food info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {editingGrams && onUpdateGrams ? (
                <Input
                  type="number"
                  value={gramsValue}
                  onChange={(e) => setGramsValue(e.target.value)}
                  onBlur={handleGramsBlur}
                  onKeyDown={handleGramsKeyDown}
                  className="w-20 h-8 text-lg font-bold"
                  autoFocus
                  min={1}
                />
              ) : (
                <button
                  onClick={() => !disabled && onUpdateGrams && setEditingGrams(true)}
                  className={`text-xl font-bold text-zinc-900 ${!disabled && onUpdateGrams ? 'hover:bg-white/50 px-2 py-0.5 rounded cursor-pointer' : ''}`}
                  disabled={disabled || !onUpdateGrams}
                >
                  {Math.round(item.selected.grams)}g
                </button>
              )}
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                <Check className="h-3 w-3" />
                VALD
              </span>
              {/* Remove button */}
              {!disabled && onRemoveFood && (
                <button
                  onClick={() => onRemoveFood(item.category)}
                  className="ml-auto p-1 rounded-full hover:bg-red-100 text-zinc-400 hover:text-red-500 transition-colors"
                  title="Ta bort"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-zinc-800 font-semibold truncate">
              {item.selected.name}
            </p>
          </div>
        </div>
      </div>

      {/* Alternatives section */}
      {item.alternatives.length > 0 && (
        <>
          {/* Separator */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">eller välj</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          {/* Alternative food cards - responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.alternatives.map((alt) => (
              <div key={alt.foodId} className={`relative rounded-lg p-2.5 ${colors.bg} ${colors.border} border overflow-hidden`}>
                {/* Remove button */}
                {!disabled && onRemoveAlternative && (
                  <button
                    onClick={() => onRemoveAlternative(item.category, alt.foodId)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-zinc-200 hover:bg-red-100 flex items-center justify-center transition-colors group z-10"
                    title="Ta bort alternativ"
                  >
                    <X className="w-3 h-3 text-zinc-500 group-hover:text-red-500" />
                  </button>
                )}

                <div className="flex items-center gap-2.5">
                  {/* Product image */}
                  {alt.image ? (
                    <img
                      src={alt.image}
                      alt={alt.name}
                      className="w-11 h-11 rounded-lg object-cover bg-white shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                      <span className="text-zinc-300 text-[8px]">Bild</span>
                    </div>
                  )}

                  {/* Food info */}
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-base font-bold text-zinc-900">
                      {Math.round(alt.grams)}g
                    </span>
                    <p className="text-xs text-zinc-600 font-medium truncate">
                      {alt.name}
                    </p>
                  </div>
                </div>

                {/* Footer with impact and action */}
                <div className="mt-2 pt-2 border-t border-zinc-200/60 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5 text-[10px] shrink-0">
                    {(() => {
                      const impact = getSwapImpact(alt.macros);
                      return (
                        <>
                          <span className={getDiffColor(impact.protein)}>P{formatDiff(impact.protein)}</span>
                          <span className={getDiffColor(impact.carbs)}>K{formatDiff(impact.carbs)}</span>
                          <span className={getDiffColor(impact.fat)}>F{formatDiff(impact.fat)}</span>
                        </>
                      );
                    })()}
                  </div>

                  {/* Action button */}
                  {!disabled && onSwapFood && (
                    <button
                      onClick={() => onSwapFood(item.category, alt.foodId)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-white shadow-sm border border-zinc-300 hover:border-zinc-400 hover:shadow transition-all text-[10px] font-medium text-zinc-700 shrink-0"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Välj
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
