'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wand2, Save, AlertTriangle } from 'lucide-react';
import { MealConfigMatrix } from './MealConfigMatrix';
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
  // Configuration state
  const [mealConfigs, setMealConfigs] = useState<MealConfig[]>(DEFAULT_MEAL_CONFIGS);

  // Generated plan state
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlanState | null>(null);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

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

  // Generate meal plan
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setWarnings([]);

    try {
      const response = await fetch('/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutritionPlanId,
          mealConfigs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte generera kostschema');
        if (data.warnings) {
          setWarnings(data.warnings);
        }
        return;
      }

      setGeneratedPlan({
        id: data.id,
        meals: data.meals,
        targetMacros: data.targetMacros,
        actualMacros: data.actualMacros,
      });

      if (data.warnings) {
        setWarnings(data.warnings);
      }
    } catch (err) {
      setError('Ett fel uppstod vid generering av kostschema');
      console.error('Generate error:', err);
    } finally {
      setIsGenerating(false);
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

  return (
    <div className="space-y-6">
      {/* Configuration */}
      {!generatedPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Konfigurera måltider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-gray-600">
              Välj vilka makronäringsämnen varje måltid ska innehålla. Protein,
              kolhydrater och fett fördelas automatiskt baserat på dina val.
            </p>

            <MealConfigMatrix
              configs={mealConfigs}
              onChange={setMealConfigs}
              disabled={isGenerating}
            />

            {/* Target macros summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Dagliga mål</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-pink-600 font-medium">Protein:</span>{' '}
                  {targetMacros.protein}g
                </div>
                <div>
                  <span className="text-teal-600 font-medium">Kolhydrater:</span>{' '}
                  {targetMacros.carbs}g
                </div>
                <div>
                  <span className="text-amber-600 font-medium">Fett:</span>{' '}
                  {targetMacros.fat}g
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Kalorier:</span>{' '}
                  {targetMacros.kcal}
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Avbryt
                </Button>
              )}
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Genererar...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generera kostschema
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                onAddSauce={handleAddSauce}
                onRemoveSauce={handleRemoveSauce}
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
              onClick={() => setGeneratedPlan(null)}
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
