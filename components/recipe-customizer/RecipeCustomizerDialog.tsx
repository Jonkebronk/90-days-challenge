'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Loader2, ChefHat } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProductSelectModal } from '@/components/meal-plan-generator/ProductSelectModal';
import { IngredientMatchRow } from './IngredientMatchRow';
import { CustomizedMacrosSummary } from './CustomizedMacrosSummary';
import type {
  RecipeCustomizerDialogProps,
  CustomizedIngredient,
  RecipeIngredientInfo,
  LinkedProduct,
  AddCustomizedRecipeRequest,
} from './types';
import { determineMacroCategory } from './types';
import type { CalculatedMacros, MacroCategory } from '@/lib/types/meal-plan-generator';

interface RecipeWithIngredients {
  id: string;
  title: string;
  servings: number;
  coverImage?: string | null;
  ingredients: RecipeIngredientInfo[];
}

export function RecipeCustomizerDialog({
  recipeId,
  mealPlanId,
  mealIndex,
  open,
  onOpenChange,
  onSuccess,
}: RecipeCustomizerDialogProps) {
  // State
  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [customizedIngredients, setCustomizedIngredients] = useState<CustomizedIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [activeIngredientIndex, setActiveIngredientIndex] = useState<number | null>(null);

  // Fetch recipe on open
  useEffect(() => {
    if (open && recipeId) {
      fetchRecipe();
    }
  }, [open, recipeId]);

  const fetchRecipe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) throw new Error('Failed to fetch recipe');
      const data = await response.json();

      setRecipe(data.recipe);

      // Initialize customized ingredients from recipe
      const ingredients: CustomizedIngredient[] = (data.recipe.ingredients || []).map(
        (ing: RecipeIngredientInfo) => ({
          originalIngredient: ing,
          linkedProduct: null,
          isLinked: false,
        })
      );
      setCustomizedIngredients(ingredients);
    } catch (err) {
      setError('Kunde inte ladda receptet');
      console.error('Error fetching recipe:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total macros from linked products
  const totalMacros = useMemo<CalculatedMacros>(() => {
    const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    for (const ing of customizedIngredients) {
      if (ing.linkedProduct) {
        total.kcal += ing.linkedProduct.macros.kcal;
        total.protein += ing.linkedProduct.macros.protein;
        total.carbs += ing.linkedProduct.macros.carbs;
        total.fat += ing.linkedProduct.macros.fat;
      }
    }
    return total;
  }, [customizedIngredients]);

  // Count linked ingredients
  const linkedCount = customizedIngredients.filter((ing) => ing.isLinked).length;
  const hasLinkedProducts = linkedCount > 0;

  // Open product modal for an ingredient
  const handleLinkClick = (index: number) => {
    setActiveIngredientIndex(index);
    setProductModalOpen(true);
  };

  // Handle product selection from modal
  const handleProductSelect = (
    product: { id: string; name: string; image?: string | null; kcal: number; protein: number; carbs: number; fat: number; source?: 'product' | 'slv' },
    grams: number,
    macros: CalculatedMacros
  ) => {
    if (activeIngredientIndex === null) return;

    const linkedProduct: LinkedProduct = {
      productId: product.id,
      productName: product.name,
      grams,
      macros,
      image: product.image,
      source: product.source || 'product',
    };

    setCustomizedIngredients((prev) =>
      prev.map((ing, i) =>
        i === activeIngredientIndex
          ? { ...ing, linkedProduct, isLinked: true }
          : ing
      )
    );

    setProductModalOpen(false);
    setActiveIngredientIndex(null);
  };

  // Unlink a product from an ingredient
  const handleUnlink = (index: number) => {
    setCustomizedIngredients((prev) =>
      prev.map((ing, i) =>
        i === index ? { ...ing, linkedProduct: null, isLinked: false } : ing
      )
    );
  };

  // Update grams for a linked product
  const handleUpdateGrams = (index: number, grams: number) => {
    setCustomizedIngredients((prev) =>
      prev.map((ing, i) => {
        if (i !== index || !ing.linkedProduct) return ing;

        // Recalculate macros based on new grams
        const product = ing.linkedProduct;
        // We need the original per-100g values to recalculate
        // For now, we'll proportionally adjust based on the gram change
        const ratio = grams / product.grams;
        const newMacros: CalculatedMacros = {
          kcal: Math.round(product.macros.kcal * ratio),
          protein: Math.round(product.macros.protein * ratio * 10) / 10,
          carbs: Math.round(product.macros.carbs * ratio * 10) / 10,
          fat: Math.round(product.macros.fat * ratio * 10) / 10,
        };

        return {
          ...ing,
          linkedProduct: {
            ...product,
            grams,
            macros: newMacros,
          },
        };
      })
    );
  };

  // Submit customized recipe to meal plan
  const handleSubmit = async () => {
    if (!hasLinkedProducts || !recipe) return;

    setIsSaving(true);
    setError(null);

    try {
      const requestBody: AddCustomizedRecipeRequest = {
        mealIndex,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        customizedIngredients: customizedIngredients
          .filter((ing) => ing.isLinked && ing.linkedProduct)
          .map((ing) => ({
            productId: ing.linkedProduct!.productId,
            productName: ing.linkedProduct!.productName,
            grams: ing.linkedProduct!.grams,
            macros: ing.linkedProduct!.macros,
            source: ing.linkedProduct!.source,
            image: ing.linkedProduct!.image,
          })),
      };

      const response = await fetch(`/api/meal-plan/${mealPlanId}/add-customized-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add customized recipe');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
      console.error('Error submitting customized recipe:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Determine category for product search based on ingredient
  const getSearchCategory = (): MacroCategory => {
    if (activeIngredientIndex === null) return 'protein';
    const ing = customizedIngredients[activeIngredientIndex];
    if (!ing) return 'protein';

    // Use the food item's macros to determine category
    const { proteinG, carbsG, fatG } = ing.originalIngredient.foodItem;
    return determineMacroCategory({ protein: proteinG, carbs: carbsG, fat: fatG });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-500" />
              <span>Anpassa: {recipe?.title || 'Recept'}</span>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : (
            <>
              {/* Scrollable ingredient list */}
              <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  Ingredienser
                </div>
                {customizedIngredients.map((ing, index) => (
                  <IngredientMatchRow
                    key={ing.originalIngredient.id}
                    ingredient={ing}
                    onLinkClick={() => handleLinkClick(index)}
                    onUnlink={() => handleUnlink(index)}
                    onUpdateGrams={(grams) => handleUpdateGrams(index, grams)}
                  />
                ))}
              </div>

              {/* Macro summary - fixed at bottom */}
              <div className="shrink-0 pt-3 border-t border-zinc-200">
                <CustomizedMacrosSummary
                  macros={totalMacros}
                  linkedCount={linkedCount}
                  totalCount={customizedIngredients.length}
                />

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!hasLinkedProducts || isSaving}
                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sparar...
                      </>
                    ) : (
                      'Lägg till i måltid'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Product selection modal */}
      <ProductSelectModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setActiveIngredientIndex(null);
        }}
        category={getSearchCategory()}
        targetMacro={0} // Use default grams (100g)
        mealType="lunch" // Default meal type
        onSelect={handleProductSelect}
        showAlternativeOption={false}
      />
    </>
  );
}
