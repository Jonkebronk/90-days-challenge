'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChefHat, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  MealType,
  CalculatedMacros,
  RecipeSwapOption,
} from '@/lib/types/meal-plan-generator';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal-plan-generator';

interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories: { id: string; name: string; slug: string }[];
}

interface RecipeSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipeId: string, scaledServings: number, scaledMacros: CalculatedMacros) => void;
  mealType: MealType;
  targetMacros: CalculatedMacros;
  currentRecipeId?: string;
}

// Format difference with color
function formatDiff(value: number): { text: string; color: string } {
  if (value === 0) return { text: '±0', color: 'text-zinc-400' };
  const text = value > 0 ? `+${Math.round(value)}` : `${Math.round(value)}`;
  const color = value > 0 ? 'text-red-500' : 'text-green-500';
  return { text, color };
}

export function RecipeSwapModal({
  isOpen,
  onClose,
  onSelect,
  mealType,
  targetMacros,
  currentRecipeId,
}: RecipeSwapModalProps) {
  const [recipes, setRecipes] = useState<RecipeSwapOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSwapOption | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  // Get subcategories for selected category
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const subcategories = selectedCategory?.subcategories || [];

  // Fetch recipes on open or when category changes
  useEffect(() => {
    if (isOpen) {
      fetchRecipes();
      setSelectedRecipe(null);
      setSearchTerm('');
    }
  }, [isOpen, mealType, targetMacros, selectedCategoryId, selectedSubcategoryId]);

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSubcategoryId(null);
  }, [selectedCategoryId]);

  // Reset filters when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
    }
  }, [isOpen]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mealType,
        targetKcal: targetMacros.kcal.toString(),
        targetProtein: targetMacros.protein.toString(),
        targetCarbs: targetMacros.carbs.toString(),
        targetFat: targetMacros.fat.toString(),
        limit: '50',
      });

      if (selectedSubcategoryId) {
        params.set('subcategoryId', selectedSubcategoryId);
      } else if (selectedCategoryId) {
        params.set('categoryId', selectedCategoryId);
      }

      const response = await fetch(`/api/recipes/for-meal-plan?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
        // Only update categories if no filter is applied (to show all available)
        if (!selectedCategoryId && !selectedSubcategoryId) {
          setCategories(data.categories || []);
        }
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
  };

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.recipeId !== currentRecipeId &&
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = () => {
    if (!selectedRecipe) return;
    onSelect(selectedRecipe.recipeId, selectedRecipe.scaledServings, selectedRecipe.scaledMacros);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-amber-500" />
            Välj recept för {MEAL_TYPE_LABELS[mealType].toLowerCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target macros info */}
          <div className="bg-zinc-50 rounded-lg p-3 text-sm">
            <span className="text-zinc-500">Mål:</span>
            <span className="ml-2 font-medium">
              {Math.round(targetMacros.kcal)} kcal | P: {Math.round(targetMacros.protein)}g | K: {Math.round(targetMacros.carbs)}g | F: {Math.round(targetMacros.fat)}g
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Sök recept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category filters */}
          {categories.length > 0 && (
            <div className="space-y-2">
              {/* Main categories */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(
                      selectedCategoryId === category.id ? null : category.id
                    )}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                      selectedCategoryId === category.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    )}
                  >
                    {category.name}
                  </button>
                ))}
                {(selectedCategoryId || selectedSubcategoryId) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Rensa
                  </button>
                )}
              </div>

              {/* Subcategories (when a category is selected) */}
              {selectedCategoryId && subcategories.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-amber-200">
                  {subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubcategoryId(
                        selectedSubcategoryId === sub.id ? null : sub.id
                      )}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                        selectedSubcategoryId === sub.id
                          ? 'bg-amber-400 text-white'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      )}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recipe list */}
          <ScrollArea className="h-80 border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Laddar recept...
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <ChefHat className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-center">
                  {searchTerm ? 'Inga recept matchade sökningen' : 'Inga recept tillgängliga för denna måltid'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredRecipes.map((recipe) => {
                  const kcalDiff = formatDiff(recipe.macroDifference.kcal);
                  const proteinDiff = formatDiff(recipe.macroDifference.protein);
                  const carbsDiff = formatDiff(recipe.macroDifference.carbs);
                  const fatDiff = formatDiff(recipe.macroDifference.fat);

                  return (
                    <div
                      key={recipe.recipeId}
                      onClick={() => setSelectedRecipe(recipe)}
                      className={cn(
                        'p-3 rounded-lg cursor-pointer transition-all',
                        selectedRecipe?.recipeId === recipe.recipeId
                          ? 'bg-amber-100 border-2 border-amber-500 shadow-sm'
                          : 'bg-white hover:bg-zinc-50 border-2 border-zinc-200 hover:border-zinc-300'
                      )}
                    >
                      <div className="flex gap-3">
                        {/* Recipe image */}
                        {recipe.coverImage ? (
                          <img
                            src={recipe.coverImage}
                            alt={recipe.title}
                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                            <ChefHat className="h-6 w-6 text-zinc-300" />
                          </div>
                        )}

                        {/* Recipe info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-900 truncate">{recipe.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {recipe.scaledServings.toFixed(1)} portioner
                          </p>
                          <p className="text-xs text-zinc-600 mt-1">
                            {Math.round(recipe.scaledMacros.kcal)} kcal |
                            P: {Math.round(recipe.scaledMacros.protein)}g |
                            K: {Math.round(recipe.scaledMacros.carbs)}g |
                            F: {Math.round(recipe.scaledMacros.fat)}g
                          </p>
                        </div>

                        {/* Match score */}
                        <div className="text-right shrink-0">
                          <div className={cn(
                            'text-xs font-bold px-2 py-1 rounded-full',
                            recipe.matchScore >= 90 ? 'bg-green-100 text-green-700' :
                            recipe.matchScore >= 70 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          )}>
                            {recipe.matchScore}%
                          </div>
                        </div>
                      </div>

                      {/* Macro differences */}
                      <div className="flex gap-3 mt-2 pt-2 border-t border-zinc-100 text-xs">
                        <span className={kcalDiff.color}>{kcalDiff.text} kcal</span>
                        <span className={proteinDiff.color}>{proteinDiff.text}g P</span>
                        <span className={carbsDiff.color}>{carbsDiff.text}g K</span>
                        <span className={fatDiff.color}>{fatDiff.text}g F</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedRecipe}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Välj recept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
