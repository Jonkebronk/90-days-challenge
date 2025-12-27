'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, X, Clock, Users, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { RecipeCustomizerDialog } from '@/components/recipe-customizer';
import type { CalculatedMacros } from '@/lib/types/meal-plan-generator';

type FoodItem = {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

type Ingredient = {
  id: string;
  amount: number;
  displayUnit?: string | null;
  displayAmount?: string | null;
  optional: boolean;
  notes?: string | null;
  foodItem: FoodItem;
};

type Instruction = {
  id: string;
  stepNumber: number;
  instruction: string;
  duration?: number | null;
};

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  servings: number;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  difficulty?: string | null;
  mealType?: string | null;
  cuisineType?: string | null;
  coverImage?: string | null;
  videoUrl?: string | null;
  dietaryTags: string[];
  caloriesPerServing?: number | null;
  proteinPerServing?: number | null;
  carbsPerServing?: number | null;
  fatPerServing?: number | null;
  category: {
    name: string;
  };
  ingredients: Ingredient[];
  instructions: Instruction[];
  favorites: any[];
};

interface RecipeDetailDialogProps {
  recipeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Optional props for recipe customization (when viewing from meal plan context)
  mealPlanId?: string;
  mealIndex?: number;
  targetMacros?: CalculatedMacros;
  onCustomizeSuccess?: () => void;
}

export function RecipeDetailDialog({
  recipeId,
  open,
  onOpenChange,
  mealPlanId,
  mealIndex,
  targetMacros,
  onCustomizeSuccess,
}: RecipeDetailDialogProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Check if customization is available (has meal plan context)
  const canCustomize = !!(mealPlanId && mealIndex !== undefined);

  useEffect(() => {
    if (open && recipeId) {
      fetchRecipe();
    } else {
      setRecipe(null);
    }
  }, [open, recipeId]);

  const fetchRecipe = async () => {
    if (!recipeId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
      } else {
        toast.error('Kunde inte hämta recept');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error('Ett fel uppstod');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!recipeId) return;

    try {
      const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchRecipe();
        toast.success('Favorit uppdaterad');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Ett fel uppstod');
    }
  };

  const isFavorited = () => {
    return recipe?.favorites && recipe.favorites.length > 0;
  };

  const totalTime =
    (recipe?.prepTimeMinutes || 0) + (recipe?.cookTimeMinutes || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : recipe ? (
          <>
            <DialogHeader className="space-y-0 pb-2">
              <div className="flex items-start justify-between">
                <DialogTitle className="text-xl font-bold text-zinc-900 pr-8">
                  {recipe.title}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className="shrink-0"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFavorited()
                        ? 'fill-red-500 text-red-500'
                        : 'text-zinc-400'
                    }`}
                  />
                </Button>
              </div>
            </DialogHeader>

            {/* Cover Image */}
            {recipe.coverImage && (
              <div className="rounded-lg overflow-hidden -mx-2">
                <img
                  src={recipe.coverImage}
                  alt={recipe.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-zinc-500 py-2">
              {totalTime > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{totalTime} min</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {recipe.servings}{' '}
                  {recipe.servings === 1 ? 'portion' : 'portioner'}
                </span>
              </div>
              {recipe.difficulty && (
                <span className="capitalize">{recipe.difficulty}</span>
              )}
            </div>

            {/* Description */}
            {recipe.description && (
              <p className="text-sm text-zinc-600 italic">
                {recipe.description}
              </p>
            )}

            {/* Ingredients */}
            <div className="space-y-2">
              <h3 className="font-semibold text-zinc-900">Ingredienser</h3>
              <ul className="space-y-1">
                {recipe.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="text-sm text-zinc-700 flex items-start gap-2"
                  >
                    <span className="text-amber-500">•</span>
                    <span>
                      {ingredient.displayAmount && ingredient.displayUnit
                        ? `${ingredient.displayAmount} ${ingredient.displayUnit}`
                        : `${Math.round(ingredient.amount)} g`}{' '}
                      {ingredient.foodItem.name}
                      {ingredient.notes && (
                        <span className="text-zinc-500">
                          , {ingredient.notes}
                        </span>
                      )}
                      {ingredient.optional && (
                        <span className="text-zinc-400"> (valfri)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            {recipe.instructions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-zinc-900">Gör så här</h3>
                <ol className="space-y-2">
                  {recipe.instructions
                    .sort((a, b) => a.stepNumber - b.stepNumber)
                    .map((instruction, index) => (
                      <li
                        key={instruction.id}
                        className="text-sm text-zinc-700 flex gap-3"
                      >
                        <span className="font-semibold text-amber-500 shrink-0">
                          {index + 1}.
                        </span>
                        <span>
                          {instruction.instruction}
                          {instruction.duration && (
                            <span className="text-zinc-500">
                              {' '}
                              ({instruction.duration} min)
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                </ol>
              </div>
            )}

            {/* Macros */}
            {(recipe.caloriesPerServing ||
              recipe.proteinPerServing ||
              recipe.carbsPerServing ||
              recipe.fatPerServing) && (
              <div className="border-t border-zinc-200 pt-4 mt-2">
                <h3 className="font-semibold text-zinc-900 text-sm mb-2">
                  Näringsvärde per portion
                </h3>
                <div className="flex gap-4 text-sm">
                  {recipe.caloriesPerServing && (
                    <div>
                      <span className="text-zinc-500">Kcal:</span>{' '}
                      <span className="font-medium">
                        {Math.round(recipe.caloriesPerServing)}
                      </span>
                    </div>
                  )}
                  {recipe.proteinPerServing && (
                    <div>
                      <span className="text-zinc-500">Protein:</span>{' '}
                      <span className="font-medium text-red-600">
                        {Math.round(recipe.proteinPerServing)}g
                      </span>
                    </div>
                  )}
                  {recipe.carbsPerServing && (
                    <div>
                      <span className="text-zinc-500">Kolh:</span>{' '}
                      <span className="font-medium text-green-600">
                        {Math.round(recipe.carbsPerServing)}g
                      </span>
                    </div>
                  )}
                  {recipe.fatPerServing && (
                    <div>
                      <span className="text-zinc-500">Fett:</span>{' '}
                      <span className="font-medium text-blue-600">
                        {Math.round(recipe.fatPerServing)}g
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customize Recipe Button - only shown when in meal plan context */}
            {canCustomize && (
              <div className="border-t border-zinc-200 pt-4 mt-2">
                <Button
                  onClick={() => setCustomizerOpen(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <ChefHat className="w-4 h-4 mr-2" />
                  Anpassa recept
                </Button>
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  Länka ingredienser till produkter och justera mängder för att passa din plan
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-zinc-500">
            Kunde inte ladda receptet
          </div>
        )}
      </DialogContent>

      {/* Recipe Customizer Dialog */}
      {canCustomize && recipeId && (
        <RecipeCustomizerDialog
          recipeId={recipeId}
          mealPlanId={mealPlanId!}
          mealIndex={mealIndex!}
          targetMacros={targetMacros}
          open={customizerOpen}
          onOpenChange={setCustomizerOpen}
          onSuccess={() => {
            setCustomizerOpen(false);
            onOpenChange(false);
            onCustomizeSuccess?.();
            toast.success('Recept anpassat och tillagt i måltiden');
          }}
        />
      )}
    </Dialog>
  );
}
