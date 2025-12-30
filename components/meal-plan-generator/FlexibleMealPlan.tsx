'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, AlertTriangle, RefreshCw } from 'lucide-react';
import { ClientStyleMealCard } from './ClientStyleMealCard';
import { SauceSelector } from './SauceSelector';
import { FoodSwapModal } from './FoodSwapModal';
import { RecipeSelectionDialog } from '@/components/RecipeSelectionDialog';
import { QuickRedistributeDialog } from '@/components/meal-plan/QuickRedistributeDialog';
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

interface FlexibleMealPlanProps {
  nutritionPlanId: string;
  targetMacros: MacroTargets;
  onSave?: (planId: string) => void;
  onMealPlanIdChange?: (newId: string) => void;
  onTotalsChange?: (totals: { kcal: number; protein: number; carbs: number; fat: number }) => void;
  isSuggestion?: boolean; // Whether this is a coach's suggestion plan
}

interface FlexiblePlanState {
  id: string;
  meals: GeneratedMeal[];
  targetMacros: MacroTargets;
  actualMacros: MacroTargets;
}

export function FlexibleMealPlan({
  nutritionPlanId,
  targetMacros,
  onSave,
  onMealPlanIdChange,
  onTotalsChange,
  isSuggestion = false,
}: FlexibleMealPlanProps) {
  // Flexible plan state
  const [flexiblePlan, setFlexiblePlan] = useState<FlexiblePlanState | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false); // Prevent re-loading on tab focus

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

  // Recipe suggestions state (auto-loaded)
  const [recipeSuggestions, setRecipeSuggestions] = useState<Record<string, Array<{
    id: string;
    name: string;
    image?: string | null;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  }>>>({});

  // Meal recipes state (manually added by coach)
  const [mealRecipes, setMealRecipes] = useState<Record<number, Array<{
    id: string;
    recipeId: string;
    name: string;
    image?: string | null;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  }>>>({});

  // Recipe selector modal state
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [recipeMealIndex, setRecipeMealIndex] = useState<number | null>(null);

  // Redistribute dialog state
  const [redistributeOpen, setRedistributeOpen] = useState(false);

  // Load existing meal plan or create new one on mount
  useEffect(() => {
    // Only load once per nutritionPlanId to prevent re-fetching on tab focus
    if (!hasLoaded) {
      loadOrCreatePlan();
    }
  }, [nutritionPlanId, hasLoaded]);

  // Notify parent of totals changes
  useEffect(() => {
    if (flexiblePlan && onTotalsChange) {
      const totals = {
        kcal: Math.round(flexiblePlan.meals.reduce((acc, meal) => acc + meal.totalMacros.kcal, 0)),
        protein: Math.round(flexiblePlan.meals.reduce((acc, meal) => acc + meal.totalMacros.protein, 0)),
        carbs: Math.round(flexiblePlan.meals.reduce((acc, meal) => acc + meal.totalMacros.carbs, 0)),
        fat: Math.round(flexiblePlan.meals.reduce((acc, meal) => acc + meal.totalMacros.fat, 0)),
      };
      onTotalsChange(totals);
    }
  }, [flexiblePlan, onTotalsChange]);

  // Load recipe suggestions for each meal type
  useEffect(() => {
    const loadRecipeSuggestions = async () => {
      // Load recipes based on plan meals, or use default meal types if no plan yet
      const mealTypes = flexiblePlan?.meals
        ? [...new Set(flexiblePlan.meals.map(m => m.type))]
        : ['frukost', 'mellanmål', 'lunch', 'middag', 'kvällsmål'];
      const suggestions: Record<string, Array<{
        id: string;
        name: string;
        image?: string | null;
        kcal: number;
        protein: number;
        carbs: number;
        fat: number;
      }>> = {};

      // Map Swedish meal types to English for recipe API
      const mealTypeMapping: Record<string, string> = {
        'frukost': 'breakfast',
        'mellanmål': 'snack',
        'lunch': 'lunch',
        'middag': 'dinner',
        'kvällsmål': 'snack',
      };

      for (const mealType of mealTypes) {
        try {
          const englishMealType = mealTypeMapping[mealType] || mealType;
          const response = await fetch(`/api/recipes?mealType=${englishMealType}&limit=5`);
          if (response.ok) {
            const data = await response.json();
            const recipes = data.recipes || [];
            suggestions[mealType] = recipes.map((r: any) => ({
              id: r.id,
              name: r.title || r.name,
              image: r.coverImage || r.image,
              kcal: r.caloriesPerServing || r.kcal || 0,
              protein: r.proteinPerServing || r.protein || 0,
              carbs: r.carbsPerServing || r.carbs || 0,
              fat: r.fatPerServing || r.fat || 0,
            }));
          }
        } catch (err) {
          console.error(`Error loading recipes for ${mealType}:`, err);
        }
      }

      setRecipeSuggestions(suggestions);
    };

    loadRecipeSuggestions();
  }, [flexiblePlan?.meals, nutritionPlanId]);

  const loadOrCreatePlan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, try to fetch existing meal plan
      const existingResponse = await fetch(`/api/meal-plan/by-nutrition-plan/${nutritionPlanId}?isSuggestion=${isSuggestion}`);

      if (existingResponse.ok) {
        const existingData = await existingResponse.json();
        if (existingData) {
          setFlexiblePlan({
            id: existingData.id,
            meals: existingData.meals,
            targetMacros: existingData.targetMacros,
            actualMacros: existingData.actualMacros,
          });
          // Load saved meal recipes
          if (existingData.mealRecipes) {
            setMealRecipes(existingData.mealRecipes);
          }
          // Notify parent of meal plan ID
          if (onMealPlanIdChange) {
            onMealPlanIdChange(existingData.id);
          }
          setIsLoading(false);
          setHasLoaded(true);
          return;
        }
      }

      // No existing plan, create a new one (don't force recreate on initial load)
      await createEmptyPlan(false);
      setHasLoaded(true);
    } catch (err) {
      setError('Ett fel uppstod vid laddning av kostschema');
      console.error('Load error:', err);
      setIsLoading(false);
    }
  };

  const createEmptyPlan = async (forceRecreate: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/meal-plan/create-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutritionPlanId,
          mealConfigs: DEFAULT_MEAL_CONFIGS,
          forceRecreate,
          isSuggestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte skapa kostschema');
        return;
      }

      setFlexiblePlan({
        id: data.id,
        meals: data.meals,
        targetMacros: data.targetMacros,
        actualMacros: data.actualMacros,
      });

      // Notify parent of new meal plan ID
      if (onMealPlanIdChange) {
        onMealPlanIdChange(data.id);
      }
    } catch (err) {
      setError('Ett fel uppstod vid skapande av kostschema');
      console.error('Create error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Food swap handler
  const handleSwapFood = (mealIndex: number, category: MacroCategory, foodId: string) => {
    if (!flexiblePlan) return;

    const meal = flexiblePlan.meals[mealIndex];
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
    if (!flexiblePlan) return null;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/swap`, {
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
      const newMeals = [...flexiblePlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setFlexiblePlan({
        ...flexiblePlan,
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
    if (sauceMealIndex === null || !flexiblePlan) return;

    setAddingSauce(true);
    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/sauce`, {
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
      setFlexiblePlan({
        ...flexiblePlan,
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
    if (!flexiblePlan) return;

    try {
      const response = await fetch(
        `/api/meal-plan/${flexiblePlan.id}/sauce?mealIndex=${mealIndex}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte ta bort sås');
        return;
      }

      // Update local state
      const newMeals = [...flexiblePlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setFlexiblePlan({
        ...flexiblePlan,
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
    macros: CalculatedMacros,
    isAlternative?: boolean
  ) => {
    if (!flexiblePlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/select-food`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealIndex,
          category,
          productId: product.id,
          productName: product.name, // Needed for SLV products
          grams,
          macros,
          isAlternative: isAlternative || false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte välja livsmedel');
        return;
      }

      // Update local state
      const newMeals = [...flexiblePlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setFlexiblePlan({
        ...flexiblePlan,
        meals: newMeals,
        actualMacros: data.actualMacros,
      });
    } catch (err) {
      setError('Ett fel uppstod vid val av livsmedel');
      console.error('Select food error:', err);
    }
  };

  // Remove food handler - now supports foodId for multiple items per category
  const handleRemoveFood = async (mealIndex: number, category: MacroCategory, foodId?: string) => {
    if (!flexiblePlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/remove-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealIndex, category, foodId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte ta bort livsmedel');
        return;
      }

      // Update local state
      setFlexiblePlan({
        ...flexiblePlan,
        meals: data.meals,
        actualMacros: data.actualMacros,
      });
    } catch (err) {
      setError('Ett fel uppstod vid borttagning av livsmedel');
      console.error('Remove food error:', err);
    }
  };

  // Update grams handler - now supports foodId for multiple items per category
  const handleUpdateGrams = async (
    mealIndex: number,
    category: MacroCategory,
    grams: number,
    foodId?: string
  ) => {
    if (!flexiblePlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/update-grams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealIndex, category, grams, foodId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte uppdatera gram');
        return;
      }

      // Update local state
      const newMeals = [...flexiblePlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setFlexiblePlan({
        ...flexiblePlan,
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
    if (!flexiblePlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/update-meal-macros`, {
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
      const newMeals = [...flexiblePlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setFlexiblePlan({
        ...flexiblePlan,
        meals: newMeals,
      });
    } catch (err) {
      setError('Ett fel uppstod vid uppdatering av måltidsmakron');
      console.error('Update meal macros error:', err);
    }
  };

  // Update meal name handler
  const handleUpdateMealName = async (
    mealIndex: number,
    customName: string
  ) => {
    if (!flexiblePlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/update-meal-name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealIndex, customName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte uppdatera måltidsnamn');
        return;
      }

      // Update local state
      const newMeals = [...flexiblePlan.meals];
      newMeals[mealIndex] = {
        ...newMeals[mealIndex],
        customName: customName || undefined,
      };

      setFlexiblePlan({
        ...flexiblePlan,
        meals: newMeals,
      });
    } catch (err) {
      setError('Ett fel uppstod vid uppdatering av måltidsnamn');
      console.error('Update meal name error:', err);
    }
  };

  // Update meal notes handler
  const handleUpdateMealNotes = async (
    mealIndex: number,
    notes: string
  ) => {
    if (!flexiblePlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/update-meal-notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealIndex, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte uppdatera meddelande');
        return;
      }

      // Update local state
      const newMeals = [...flexiblePlan.meals];
      newMeals[mealIndex] = {
        ...newMeals[mealIndex],
        notes: notes || undefined,
      };

      setFlexiblePlan({
        ...flexiblePlan,
        meals: newMeals,
      });
    } catch (err) {
      setError('Ett fel uppstod vid uppdatering av meddelande');
      console.error('Update meal notes error:', err);
    }
  };

  // Handle opening recipe selector for a meal
  const handleAddMealRecipe = (mealIndex: number) => {
    setRecipeMealIndex(mealIndex);
    setRecipeModalOpen(true);
  };

  // Handle selecting a recipe from the modal
  const handleSelectRecipeForMeal = (recipe: {
    id: string;
    name: string;
    image?: string | null;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    if (recipeMealIndex === null) return;

    const newRecipe = {
      id: `recipe-${Date.now()}`,
      recipeId: recipe.id,
      name: recipe.name,
      image: recipe.image,
      kcal: recipe.kcal,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
    };

    setMealRecipes(prev => ({
      ...prev,
      [recipeMealIndex]: [...(prev[recipeMealIndex] || []), newRecipe],
    }));

    setRecipeModalOpen(false);
    setRecipeMealIndex(null);
  };

  // Handle removing a recipe from a meal
  const handleRemoveMealRecipe = (mealIndex: number, recipeId: string) => {
    setMealRecipes(prev => ({
      ...prev,
      [mealIndex]: (prev[mealIndex] || []).filter(r => r.id !== recipeId),
    }));
  };

  // Handle moving meal up/down
  const handleMoveMeal = async (mealIndex: number, direction: 'up' | 'down') => {
    if (!flexiblePlan) return;

    const targetIndex = direction === 'up' ? mealIndex - 1 : mealIndex + 1;

    // Validate bounds
    if (targetIndex < 0 || targetIndex >= flexiblePlan.meals.length) return;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/reorder-meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromIndex: mealIndex, toIndex: targetIndex }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte flytta måltid');
        return;
      }

      // Update local state
      setFlexiblePlan({
        ...flexiblePlan,
        meals: data.meals,
      });

      // Also update meal recipes order
      setMealRecipes(prev => {
        const newRecipes = { ...prev };
        const temp = newRecipes[mealIndex];
        newRecipes[mealIndex] = newRecipes[targetIndex];
        newRecipes[targetIndex] = temp;
        return newRecipes;
      });
    } catch (err) {
      setError('Ett fel uppstod vid flytt av måltid');
      console.error('Move meal error:', err);
    }
  };

  // Add alternative handler
  const handleAddAlternative = async (
    mealIndex: number,
    category: MacroCategory,
    product: { id: string; name: string },
    grams: number,
    macros: CalculatedMacros
  ) => {
    if (!flexiblePlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/add-alternative`, {
        method: 'POST',
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
        setError(data.error || 'Kunde inte lägga till alternativ');
        return;
      }

      // Update local state
      setFlexiblePlan({
        ...flexiblePlan,
        meals: data.meals,
      });
    } catch (err) {
      setError('Ett fel uppstod vid tillägg av alternativ');
      console.error('Add alternative error:', err);
    }
  };

  // Remove alternative handler
  const handleRemoveAlternative = async (
    mealIndex: number,
    category: MacroCategory,
    foodId: string
  ) => {
    if (!flexiblePlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/remove-alternative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealIndex, category, foodId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte ta bort alternativ');
        return;
      }

      // Update local state
      setFlexiblePlan({
        ...flexiblePlan,
        meals: data.meals,
      });
    } catch (err) {
      setError('Ett fel uppstod vid borttagning av alternativ');
      console.error('Remove alternative error:', err);
    }
  };

  // Select recipe handler
  const handleSelectRecipe = async (
    mealIndex: number,
    recipeId: string,
    scaledServings: number,
    scaledMacros: CalculatedMacros
  ) => {
    if (!flexiblePlan) return;

    try {
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/select-recipe`, {
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
      const newMeals = [...flexiblePlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setFlexiblePlan({
        ...flexiblePlan,
        meals: newMeals,
        actualMacros: data.actualMacros,
      });
    } catch (err) {
      setError('Ett fel uppstod vid val av recept');
      console.error('Select recipe error:', err);
    }
  };

  // Refresh meal plan data (used after recipe customization)
  const handleRefreshMealData = async () => {
    if (!flexiblePlan) return;

    try {
      const response = await fetch(`/api/meal-plan/by-nutrition-plan/${nutritionPlanId}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setFlexiblePlan({
            id: data.id,
            meals: data.meals,
            targetMacros: data.targetMacros,
            actualMacros: data.actualMacros,
          });
          if (data.mealRecipes) {
            setMealRecipes(data.mealRecipes);
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing meal data:', err);
    }
  };

  // Clear recipe handler
  const handleClearRecipe = async (mealIndex: number) => {
    if (!flexiblePlan) return;

    try {
      const response = await fetch(
        `/api/meal-plan/${flexiblePlan.id}/clear-recipe?mealIndex=${mealIndex}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kunde inte ta bort recept');
        return;
      }

      // Update local state
      const newMeals = [...flexiblePlan.meals];
      newMeals[mealIndex] = data.updatedMeal;

      setFlexiblePlan({
        ...flexiblePlan,
        meals: newMeals,
        actualMacros: data.actualMacros,
      });
    } catch (err) {
      setError('Ett fel uppstod vid borttagning av recept');
      console.error('Clear recipe error:', err);
    }
  };

  // Save handler - shows confirmation since changes are already saved automatically
  const handleSave = async () => {
    if (!flexiblePlan) return;

    setIsSaving(true);
    try {
      // Save meal recipes to database
      const response = await fetch(`/api/meal-plan/${flexiblePlan.id}/save-recipes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealRecipes }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Kunde inte spara receptförslag');
        return;
      }

      if (onSave) {
        onSave(flexiblePlan.id);
      }
    } catch (err) {
      setError('Ett fel uppstod vid sparning');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Redistribute handler - adjusts meal count and training placement
  const handleRedistribute = async (settings: {
    mealsPerDay: number;
    preWorkoutMeal: number;
    postWorkoutMeal: number;
    mealNames: string[];
  }) => {
    if (!flexiblePlan) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build meal distribution based on settings
      const proteinPerMeal = Math.round(targetMacros.protein / settings.mealsPerDay);
      const carbsPerMeal = Math.round(targetMacros.carbs / settings.mealsPerDay);
      const fatPerMeal = Math.round(targetMacros.fat / settings.mealsPerDay);

      // Create meal distribution array for API
      const mealDistribution = settings.mealNames.map((name, i) => {
        const mealNum = i + 1;
        let type: 'pre' | 'post' | 'bedtime' | 'other' = 'other';
        if (mealNum === settings.preWorkoutMeal) type = 'pre';
        else if (mealNum === settings.postWorkoutMeal) type = 'post';
        else if (mealNum === settings.mealsPerDay) type = 'bedtime';

        return {
          meal: mealNum,
          name,
          protein: proteinPerMeal,
          carbs: carbsPerMeal,
          fat: fatPerMeal,
          type,
        };
      });

      const response = await fetch('/api/meal-plan/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealsPerDay: settings.mealsPerDay,
          targetCalories: targetMacros.kcal,
          proteinGrams: targetMacros.protein,
          fatGrams: targetMacros.fat,
          carbGrams: targetMacros.carbs,
          nutritionPlanId,
          mealDistribution,
          mealNames: settings.mealNames,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to redistribute meals');
      }

      // Reload the plan to get new meals
      setHasLoaded(false);
    } catch (err) {
      setError('Ett fel uppstod vid redistribution');
      console.error('Redistribute error:', err);
      setIsLoading(false);
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
      {flexiblePlan && (
        <>
          {/* Meals - vertical list */}
          <div className="space-y-4">
            {flexiblePlan.meals.map((meal, index) => (
              <ClientStyleMealCard
                key={index}
                meal={meal}
                mealIndex={index}
                mealNumber={getMealNumber(flexiblePlan.meals, index)}
                mealPlanId={flexiblePlan.id}
                onSwapFood={handleSwapFood}
                onSelectFood={handleSelectFood}
                onRemoveFood={handleRemoveFood}
                onRemoveAlternative={handleRemoveAlternative}
                onAddAlternative={handleAddAlternative}
                onAddSauce={handleAddSauce}
                onRemoveSauce={handleRemoveSauce}
                onUpdateGrams={handleUpdateGrams}
                onUpdateMealMacros={handleUpdateMealMacros}
                onUpdateMealName={handleUpdateMealName}
                onUpdateMealNotes={handleUpdateMealNotes}
                mealRecipes={mealRecipes[index] || []}
                onAddMealRecipe={handleAddMealRecipe}
                onRemoveMealRecipe={handleRemoveMealRecipe}
                onRefreshMealData={handleRefreshMealData}
                onMoveUp={(idx) => handleMoveMeal(idx, 'up')}
                onMoveDown={(idx) => handleMoveMeal(idx, 'down')}
                canMoveUp={index > 0}
                canMoveDown={index < flexiblePlan.meals.length - 1}
              />
            ))}
          </div>

          {/* Dagtotal - summering av alla måltider */}
          {flexiblePlan.meals.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
                  Dagtotalt
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-400 uppercase font-medium tracking-wide">Kcal</div>
                    <div className="font-bold text-amber-600">
                      {Math.round(flexiblePlan.meals.reduce((acc, meal) => acc + meal.totalMacros.kcal, 0))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-400 uppercase font-medium tracking-wide">Prot</div>
                    <div className="font-bold text-rose-600">
                      {Math.round(flexiblePlan.meals.reduce((acc, meal) => acc + meal.totalMacros.protein, 0))}g
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-400 uppercase font-medium tracking-wide">Kolh</div>
                    <div className="font-bold text-amber-500">
                      {Math.round(flexiblePlan.meals.reduce((acc, meal) => acc + meal.totalMacros.carbs, 0))}g
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-400 uppercase font-medium tracking-wide">Fett</div>
                    <div className="font-bold text-sky-500">
                      {Math.round(flexiblePlan.meals.reduce((acc, meal) => acc + meal.totalMacros.fat, 0))}g
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
            <Button
              variant="outline"
              onClick={() => createEmptyPlan(true)}
              disabled={isLoading}
              className="text-zinc-600"
            >
              Rensa allt
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setRedistributeOpen(true)}
                disabled={isLoading}
                className="text-zinc-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Fördela om
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Spara
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

      {/* Recipe Selection Modal */}
      <RecipeSelectionDialog
        open={recipeModalOpen}
        onOpenChange={(open) => {
          setRecipeModalOpen(open);
          if (!open) setRecipeMealIndex(null);
        }}
        onSelect={(recipe, servingMultiplier) => {
          const multiplier = servingMultiplier || 1;
          handleSelectRecipeForMeal({
            id: recipe.id,
            name: recipe.title,
            image: recipe.coverImage,
            kcal: Math.round((recipe.caloriesPerServing || 0) * multiplier),
            protein: Math.round((recipe.proteinPerServing || 0) * multiplier),
            carbs: Math.round((recipe.carbsPerServing || 0) * multiplier),
            fat: Math.round((recipe.fatPerServing || 0) * multiplier),
          });
        }}
        mealPlanId={flexiblePlan?.id}
        mealIndex={recipeMealIndex ?? undefined}
        targetMacros={recipeMealIndex !== null && flexiblePlan?.meals[recipeMealIndex]?.targetMacros || undefined}
        onCustomizeSuccess={handleRefreshMealData}
      />

      {/* Quick Redistribute Dialog */}
      <QuickRedistributeDialog
        open={redistributeOpen}
        onOpenChange={setRedistributeOpen}
        currentMealsPerDay={flexiblePlan?.meals.length || 5}
        targetKcal={targetMacros.kcal}
        onSave={handleRedistribute}
      />
    </div>
  );
}
