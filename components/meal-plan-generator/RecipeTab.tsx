'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, RefreshCw, X, Search, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecipeSwapModal } from './RecipeSwapModal';
import type {
  GeneratedMeal,
  CalculatedMacros,
  RecipeSwapOption,
} from '@/lib/types/meal-plan-generator';

interface RecipeTabProps {
  meal: GeneratedMeal;
  mealIndex: number;
  onSelectRecipe: (recipeId: string, scaledServings: number, scaledMacros: CalculatedMacros) => void;
  onClearRecipe: () => void;
  disabled?: boolean;
}

// Format difference with color
function formatDiff(value: number): { text: string; color: string } {
  if (value === 0) return { text: '±0', color: 'text-zinc-400' };
  const text = value > 0 ? `+${Math.round(value)}` : `${Math.round(value)}`;
  const color = value > 0 ? 'text-red-500' : 'text-green-500';
  return { text, color };
}

export function RecipeTab({
  meal,
  mealIndex,
  onSelectRecipe,
  onClearRecipe,
  disabled = false,
}: RecipeTabProps) {
  const [alternatives, setAlternatives] = useState<RecipeSwapOption[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);

  // Get target macros for this meal
  const targetMacros = meal.targetMacros || {
    kcal: meal.totalMacros.kcal,
    protein: meal.totalMacros.protein,
    carbs: meal.totalMacros.carbs,
    fat: meal.totalMacros.fat,
  };

  // Load alternative recipes when tab is shown
  useEffect(() => {
    if (!meal.selectedRecipe) {
      loadAlternatives();
    }
  }, [meal.type, targetMacros.kcal]);

  const loadAlternatives = async () => {
    setLoadingAlternatives(true);
    try {
      const params = new URLSearchParams({
        mealType: meal.type,
        targetKcal: targetMacros.kcal.toString(),
        targetProtein: targetMacros.protein.toString(),
        targetCarbs: targetMacros.carbs.toString(),
        targetFat: targetMacros.fat.toString(),
        limit: '4',
      });

      if (meal.selectedRecipe) {
        params.append('currentKcal', meal.selectedRecipe.scaledMacros.kcal.toString());
        params.append('currentProtein', meal.selectedRecipe.scaledMacros.protein.toString());
        params.append('currentCarbs', meal.selectedRecipe.scaledMacros.carbs.toString());
        params.append('currentFat', meal.selectedRecipe.scaledMacros.fat.toString());
      }

      const response = await fetch(`/api/recipes/for-meal-plan?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out current recipe
        const filtered = meal.selectedRecipe
          ? data.recipes.filter((r: RecipeSwapOption) => r.recipeId !== meal.selectedRecipe?.recipeId)
          : data.recipes;
        setAlternatives(filtered.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading recipe alternatives:', error);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  // Reload alternatives when recipe is selected/changed
  useEffect(() => {
    if (meal.selectedRecipe) {
      loadAlternatives();
    }
  }, [meal.selectedRecipe?.recipeId]);

  if (meal.selectedRecipe) {
    const recipe = meal.selectedRecipe;
    return (
      <div className="space-y-4">
        {/* Selected recipe card */}
        <div className="rounded-xl p-4 bg-amber-100 border-2 border-amber-400 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Recipe image */}
            {recipe.coverImage ? (
              <img
                src={recipe.coverImage}
                alt={recipe.title}
                className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <ChefHat className="h-8 w-8 text-amber-400" />
              </div>
            )}

            {/* Recipe info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  VALT RECEPT
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 truncate">{recipe.title}</h3>
              <p className="text-sm text-zinc-600 mt-0.5">
                {recipe.scaledServings.toFixed(1)} portioner
              </p>
              <div className="flex gap-2 mt-2 text-sm">
                <span className="font-semibold text-green-700">{Math.round(recipe.scaledMacros.kcal)} kcal</span>
                <span className="text-zinc-400">|</span>
                <span className="text-rose-600">P: {Math.round(recipe.scaledMacros.protein)}g</span>
                <span className="text-amber-600">K: {Math.round(recipe.scaledMacros.carbs)}g</span>
                <span className="text-blue-600">F: {Math.round(recipe.scaledMacros.fat)}g</span>
              </div>
            </div>

            {/* Actions */}
            {!disabled && (
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSwapModalOpen(true)}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Byt
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearRecipe}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  Ta bort
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Alternative recipes */}
        {alternatives.length > 0 && (
          <>
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                eller välj
              </span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {alternatives.map((alt) => {
                const kcalDiff = formatDiff(alt.macroDifference.kcal);
                const proteinDiff = formatDiff(alt.macroDifference.protein);
                const carbsDiff = formatDiff(alt.macroDifference.carbs);
                const fatDiff = formatDiff(alt.macroDifference.fat);

                return (
                  <div
                    key={alt.recipeId}
                    className="rounded-lg p-3 bg-white border border-zinc-200 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {alt.coverImage ? (
                        <img
                          src={alt.coverImage}
                          alt={alt.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                          <ChefHat className="h-4 w-4 text-zinc-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{alt.title}</p>
                        <p className="text-[10px] text-zinc-500">
                          {alt.scaledServings.toFixed(1)} port.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 mt-2 text-[10px]">
                      <span className={kcalDiff.color}>{kcalDiff.text}</span>
                      <span className={proteinDiff.color}>P{proteinDiff.text}</span>
                      <span className={carbsDiff.color}>K{carbsDiff.text}</span>
                      <span className={fatDiff.color}>F{fatDiff.text}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectRecipe(alt.recipeId, alt.scaledServings, alt.scaledMacros)}
                      disabled={disabled}
                      className="w-full mt-2 text-xs h-7"
                    >
                      <RefreshCw className="h-2.5 w-2.5 mr-1" />
                      Välj
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Recipe swap modal */}
        <RecipeSwapModal
          isOpen={swapModalOpen}
          onClose={() => setSwapModalOpen(false)}
          onSelect={onSelectRecipe}
          mealType={meal.type}
          targetMacros={targetMacros}
          currentRecipeId={recipe.recipeId}
        />
      </div>
    );
  }

  // No recipe selected - show search prompt and alternatives
  return (
    <div className="space-y-4">
      {/* No recipe selected prompt */}
      <div className="rounded-xl p-6 border-2 border-dashed border-amber-200 bg-amber-50/50 text-center">
        <ChefHat className="h-10 w-10 text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-amber-800 font-medium mb-3">
          Välj ett recept som inspiration för denna måltid
        </p>
        <Button
          onClick={() => setSwapModalOpen(true)}
          disabled={disabled}
          className="bg-amber-500 hover:bg-amber-600"
        >
          <Search className="h-4 w-4 mr-2" />
          Hitta recept
        </Button>
      </div>

      {/* Alternative recipes */}
      {loadingAlternatives ? (
        <div className="flex items-center justify-center py-4 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Laddar receptförslag...
        </div>
      ) : alternatives.length > 0 && (
        <>
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              förslag
            </span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {alternatives.map((alt) => (
              <div
                key={alt.recipeId}
                className="rounded-lg p-3 bg-white border border-zinc-200 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {alt.coverImage ? (
                    <img
                      src={alt.coverImage}
                      alt={alt.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                      <ChefHat className="h-4 w-4 text-zinc-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{alt.title}</p>
                    <p className="text-[10px] text-zinc-500">
                      {Math.round(alt.scaledMacros.kcal)} kcal
                    </p>
                  </div>
                  <div className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    alt.matchScore >= 90 ? 'bg-green-100 text-green-700' :
                    alt.matchScore >= 70 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {alt.matchScore}%
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectRecipe(alt.recipeId, alt.scaledServings, alt.scaledMacros)}
                  disabled={disabled}
                  className="w-full mt-2 text-xs h-7"
                >
                  Välj recept
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recipe swap modal */}
      <RecipeSwapModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        onSelect={onSelectRecipe}
        mealType={meal.type}
        targetMacros={targetMacros}
      />
    </div>
  );
}
