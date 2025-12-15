'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { ClientStyleMealCard } from './ClientStyleMealCard';
import { MacroSummary } from './MacroSummary';
import { SauceSelector } from './SauceSelector';
import { FoodSwapModal } from './FoodSwapModal';
import type {
  MealConfig,
  MacroCategory,
  MealType,
  MacroTargets,
  GeneratedMeal,
  SwapFeedback,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';
import { DEFAULT_MEAL_CONFIGS } from '@/lib/types/meal-plan-generator';

interface MealPlanGeneratorProps {
  nutritionPlanId: string;
  targetMacros: MacroTargets;
  onSave?: (planId: string) => void;
  onCancel?: () => void;
}

interface GeneratedPlanState {
  id: string;
  meals: GeneratedMeal[];
  targetMacros: MacroTargets;
  actualMacros: MacroTargets;
}

export function MealPlanGenerator({
  nutritionPlanId,
  targetMacros,
  onSave,
  onCancel,
}: MealPlanGeneratorProps) {
  // Generated plan state
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlanState | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [sauceModalOpen, setSauceModalOpen] = useState(false);
  const [sauceMealIndex, setSauceMealIndex] = useState<number | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapContext, setSwapContext] = useState<{
    mealIndex: number;
    category: MacroCategory;
    mealType: MealType;
    currentFoodId: string;
  } | null>(null);
  const [addingSauce, setAddingSauce] = useState(false);

  // Create empty meal plan on mount
  useEffect(() => {
    createEmptyPlan();
  }, [nutritionPlanId]);

  const createEmptyPlan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/meal-plan/create-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutritionPlanId,
          mealConfigs: DEFAULT_MEAL_CONFIGS,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte skapa kostschema');
        return;
      }

      setGeneratedPlan({
        id: data.id,
        meals: data.meals,
        targetMacros: data.targetMacros,
        actualMacros: data.actualMacros,
      });
    } catch (err) {
      setError('Ett fel uppstod vid skapande av kostschema');
      console.error('Create error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Food swap handler
  const handleSwapFood = (mealIndex: number, category: MacroCategory, foodId: string) => {
    if (!generatedPlan) return;

    const meal = generatedPlan.meals[mealIndex];
    const item = meal.items.find((i) => i.category === category);

    // Check if this is one of the alternatives (direct swap)
    const isAlternative = item?.alternatives.some((a) => a.foodId === foodId);

    if (isAlternative) {
      // Direct swap with alternative
      performSwap(mealIndex, category, foodId);
    } else {
      // Open modal to select different food
      setSwapContext({
        mealIndex,
        category,
        mealType: meal.type,
        currentFoodId: item?.selected.foodId || '',
      });
      setSwapModalOpen(true);
    }
  };

  // Perform the swap API call
  const performSwap = async (
    mealIndex: number,
    category: MacroCategory,
    newFoodId: string
  ): Promise<SwapFeedback | null> => {
    if (!generatedPlan) return null;

    try {
      const response = await fetch(`/api/meal-plan/${generatedPlan.id}/swap`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealIndex,
          category,
          newFoodId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          type: 'error',
          message: data.error || 'Kunde inte byta livsmedel',
        };
      }

      // Update local state
      const newMeals = [...generatedPlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setGeneratedPlan({
        ...generatedPlan,
        meals: newMeals,
        actualMacros: data.actualMacros,
      });

      return data.feedback || { type: 'success', message: 'Livsmedel bytt!' };
    } catch (err) {
      console.error('Swap error:', err);
      return {
        type: 'error',
        message: 'Ett fel uppstod vid byte av livsmedel',
      };
    }
  };

  // Sauce handlers
  const handleAddSauce = (mealIndex: number) => {
    setSauceMealIndex(mealIndex);
    setSauceModalOpen(true);
  };

  const handleSauceSelect = async (sauceId: string, grams: number) => {
    if (sauceMealIndex === null || !generatedPlan) return;

    setAddingSauce(true);
    try {
      const response = await fetch(`/api/meal-plan/${generatedPlan.id}/sauce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealIndex: sauceMealIndex,
          sauceId,
          grams,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte lägga till sås');
        return;
      }

      // Update local state with the updated plan
      setGeneratedPlan({
        ...generatedPlan,
        meals: data.updatedPlan.meals,
        actualMacros: data.updatedPlan.actualMacros,
      });

      setSauceModalOpen(false);
      setSauceMealIndex(null);
    } catch (err) {
      setError('Ett fel uppstod vid tillägg av sås');
      console.error('Sauce error:', err);
    } finally {
      setAddingSauce(false);
    }
  };

  const handleRemoveSauce = async (mealIndex: number) => {
    if (!generatedPlan) return;

    try {
      const response = await fetch(
        `/api/meal-plan/${generatedPlan.id}/sauce?mealIndex=${mealIndex}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte ta bort sås');
        return;
      }

      // Update local state
      const newMeals = [...generatedPlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setGeneratedPlan({
        ...generatedPlan,
        meals: newMeals,
        actualMacros: data.actualMacros,
      });
    } catch (err) {
      setError('Ett fel uppstod vid borttagning av sås');
      console.error('Remove sauce error:', err);
    }
  };

  // Select food from product library handler
  const handleSelectFood = async (
    mealIndex: number,
    category: MacroCategory,
    product: { id: string; name: string },
    grams: number,
    macros: CalculatedMacros
  ) => {
    if (!generatedPlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${generatedPlan.id}/select-food`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealIndex,
          category,
          productId: product.id,
          grams,
          macros,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte välja livsmedel');
        return;
      }

      // Update local state
      const newMeals = [...generatedPlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setGeneratedPlan({
        ...generatedPlan,
        meals: newMeals,
        actualMacros: data.actualMacros,
      });
    } catch (err) {
      setError('Ett fel uppstod vid val av livsmedel');
      console.error('Select food error:', err);
    }
  };

  // Update grams handler
  const handleUpdateGrams = async (
    mealIndex: number,
    category: MacroCategory,
    grams: number
  ) => {
    if (!generatedPlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${generatedPlan.id}/update-grams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealIndex, category, grams }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte uppdatera gram');
        return;
      }

      // Update local state
      const newMeals = [...generatedPlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setGeneratedPlan({
        ...generatedPlan,
        meals: newMeals,
        actualMacros: data.actualMacros,
      });
    } catch (err) {
      setError('Ett fel uppstod vid uppdatering av gram');
      console.error('Update grams error:', err);
    }
  };

  // Update meal target macros handler
  const handleUpdateMealMacros = async (
    mealIndex: number,
    targetMacros: CalculatedMacros
  ) => {
    if (!generatedPlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${generatedPlan.id}/update-meal-macros`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealIndex, targetMacros }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte uppdatera måltidsmakron');
        return;
      }

      // Update local state
      const newMeals = [...generatedPlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setGeneratedPlan({
        ...generatedPlan,
        meals: newMeals,
      });
    } catch (err) {
      setError('Ett fel uppstod vid uppdatering av måltidsmakron');
      console.error('Update meal macros error:', err);
    }
  };

  // Select recipe handler
  const handleSelectRecipe = async (
    mealIndex: number,
    recipeId: string,
    scaledServings: number,
    scaledMacros: CalculatedMacros
  ) => {
    if (!generatedPlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${generatedPlan.id}/select-recipe`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealIndex,
          recipeId,
          scaledServings,
          scaledMacros,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte välja recept');
        return;
      }

      // Update local state
      const newMeals = [...generatedPlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setGeneratedPlan({
        ...generatedPlan,
        meals: newMeals,
        actualMacros: data.actualMacros,
      });
    } catch (err) {
      setError('Ett fel uppstod vid val av recept');
      console.error('Select recipe error:', err);
    }
  };

  // Clear recipe handler
  const handleClearRecipe = async (mealIndex: number) => {
    if (!generatedPlan) return;

    try {
      const response = await fetch(
        `/api/meal-plan/${generatedPlan.id}/clear-recipe?mealIndex=${mealIndex}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte ta bort recept');
        return;
      }

      // Update local state
      const newMeals = [...generatedPlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setGeneratedPlan({
        ...generatedPlan,
        meals: newMeals,
        actualMacros: data.actualMacros,
      });
    } catch (err) {
      setError('Ett fel uppstod vid borttagning av recept');
      console.error('Clear recipe error:', err);
    }
  };

  // Save handler
  const handleSave = () => {
    if (generatedPlan && onSave) {
      onSave(generatedPlan.id);
    }
  };

  // Count meals by type for numbering
  const getMealNumber = (meals: GeneratedMeal[], index: number): number | undefined => {
    const type = meals[index].type;
    const sameTypeBefore = meals.slice(0, index).filter((m) => m.type === type).length;
    const totalOfType = meals.filter((m) => m.type === type).length;
    return totalOfType > 1 ? sameTypeBefore + 1 : undefined;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generated plan */}
      {generatedPlan && (
        <>
          {/* Macro summary */}
          <MacroSummary
            targetMacros={generatedPlan.targetMacros}
            actualMacros={generatedPlan.actualMacros}
          />

          {/* Meals - vertical list */}
          <div className="space-y-4">
            {generatedPlan.meals.map((meal, index) => (
              <ClientStyleMealCard
                key={index}
                meal={meal}
                mealIndex={index}
                mealNumber={getMealNumber(generatedPlan.meals, index)}
                onSwapFood={handleSwapFood}
                onSelectFood={handleSelectFood}
                onAddSauce={handleAddSauce}
                onRemoveSauce={handleRemoveSauce}
                onUpdateGrams={handleUpdateGrams}
                onUpdateMealMacros={handleUpdateMealMacros}
                onSelectRecipe={handleSelectRecipe}
                onClearRecipe={handleClearRecipe}
              />
            ))}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={createEmptyPlan}
            >
              Börja om
            </Button>
            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Avbryt
                </Button>
              )}
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Spara kostschema
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <SauceSelector
        isOpen={sauceModalOpen}
        onClose={() => {
          setSauceModalOpen(false);
          setSauceMealIndex(null);
        }}
        onSelect={handleSauceSelect}
        isLoading={addingSauce}
      />

      {swapContext && (
        <FoodSwapModal
          isOpen={swapModalOpen}
          onClose={() => {
            setSwapModalOpen(false);
            setSwapContext(null);
          }}
          onSwap={(foodId) =>
            performSwap(swapContext.mealIndex, swapContext.category, foodId)
          }
          category={swapContext.category}
          mealType={swapContext.mealType}
          currentFoodId={swapContext.currentFoodId}
        />
      )}
    </div>
  );
}
