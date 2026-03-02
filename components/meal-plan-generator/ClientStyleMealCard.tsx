'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Utensils, Leaf, RefreshCw, X, Cherry, Pencil, ArrowUp, ArrowDown, Info, MoreHorizontal, Heart, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProductSelectModal } from './ProductSelectModal';
import { RecipeDetailDialog } from './RecipeDetailDialog';
import { FoodItemDetailDialog } from './FoodItemDetailDialog';
import { RecommendedFoodsDialog } from './RecommendedFoodsDialog';
import { DinnerTipsDialog } from '@/components/meal-plan/DinnerTipsDialog';
import { cn } from '@/lib/utils';
import type {
  GeneratedMeal,
  MacroCategory,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal-plan-generator';

// Gram input component - updates on blur or Enter
function GramInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (grams: number) => void;
  disabled?: boolean;
}) {
  const [localValue, setLocalValue] = useState(value.toString());
  const lastSavedValue = useRef(value);

  // Only sync if the external value changed (from another source, not our own update)
  useEffect(() => {
    if (value !== lastSavedValue.current) {
      setLocalValue(value.toString());
      lastSavedValue.current = value;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleSave = () => {
    const numValue = parseInt(localValue) || 0;
    if (numValue >= 0 && numValue !== lastSavedValue.current) {
      lastSavedValue.current = numValue;
      onChange(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className="w-14 text-center text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded px-1 py-0.5 focus:outline-none focus:border-[#4ECDC4] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      min="0"
    />
  );
}

interface ProductForSelect {
  id: string;
  name: string;
  brand?: string | null;
  image?: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface RecipeSuggestion {
  id: string;
  name: string;
  image?: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealRecipe {
  id: string;
  recipeId: string;
  name: string;
  image?: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ClientStyleMealCardProps {
  meal: GeneratedMeal;
  mealIndex: number;
  mealNumber?: number;
  mealPlanId?: string;
  onSwapFood: (mealIndex: number, category: MacroCategory, foodId: string) => void;
  onSelectFood?: (mealIndex: number, category: MacroCategory, product: ProductForSelect, grams: number, macros: CalculatedMacros, isAlternative?: boolean) => void;
  onRemoveFood?: (mealIndex: number, category: MacroCategory, foodId?: string) => void;
  onRemoveAlternative?: (mealIndex: number, category: MacroCategory, foodId: string) => void;
  onAddAlternative?: (mealIndex: number, category: MacroCategory, product: ProductForSelect, grams: number, macros: CalculatedMacros) => void;
  onAddSauce: (mealIndex: number) => void;
  onRemoveSauce: (mealIndex: number) => void;
  onUpdateGrams?: (mealIndex: number, category: MacroCategory, grams: number, foodId?: string) => void;
  onUpdateMealMacros?: (mealIndex: number, targetMacros: CalculatedMacros) => void;
  onUpdateMealName?: (mealIndex: number, customName: string) => void;
  onUpdateMealNotes?: (mealIndex: number, notes: string) => void;
  disabled?: boolean;
  recipeSuggestions?: RecipeSuggestion[];
  onSelectRecipe?: (mealIndex: number, recipeId: string) => void;
  // Recipe management props
  mealRecipes?: MealRecipe[];
  onAddMealRecipe?: (mealIndex: number) => void;
  onRemoveMealRecipe?: (mealIndex: number, recipeId: string) => void;
  onRefreshMealData?: () => void;
  // Reorder props
  onMoveUp?: (mealIndex: number) => void;
  onMoveDown?: (mealIndex: number) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

// Category styling config with distinct colors
const CATEGORY_CONFIG: Record<string, {
  bg: string;
  border: string;
  headerBg: string;
  text: string;
  label: string;
  icon?: string;
}> = {
  protein: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    headerBg: 'bg-rose-100',
    text: 'text-rose-700',
    label: 'Proteinkällor',
    icon: '🥩'
  },
  carb: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    headerBg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Kolhydrater',
    icon: '🍚'
  },
  fat: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    headerBg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Fettkällor',
    icon: '🧈'
  },
  vegetable: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    headerBg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Grönsaker',
    icon: '🥗'
  },
  berry: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    headerBg: 'bg-purple-100',
    text: 'text-purple-700',
    label: 'Bär',
    icon: '🫐'
  },
  sauce: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    headerBg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Sås',
    icon: '🫗'
  },
};

// Helper to check if a food is a berry
function isBerry(name: string): boolean {
  const nameLower = name.toLowerCase();
  return nameLower.includes('bär') || nameLower.includes('hallon') ||
         nameLower.includes('blåbär') || nameLower.includes('jordgubb') ||
         nameLower.includes('björnbär') || nameLower.includes('lingon') ||
         nameLower.includes('krusbär') || nameLower.includes('vinbär');
}

export function ClientStyleMealCard({
  meal,
  mealIndex,
  mealNumber,
  mealPlanId,
  onSelectFood,
  onRemoveFood,
  onAddSauce,
  onRemoveSauce,
  onUpdateGrams,
  onUpdateMealMacros,
  onUpdateMealName,
  onUpdateMealNotes,
  disabled = false,
  recipeSuggestions = [],
  onSelectRecipe,
  mealRecipes = [],
  onAddMealRecipe,
  onRemoveMealRecipe,
  onRefreshMealData,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: ClientStyleMealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Modal state for product selection
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectCategory, setSelectCategory] = useState<MacroCategory | null>(null);
  const [selectTargetMacro, setSelectTargetMacro] = useState(0);
  const [selectDefaultSubcategory, setSelectDefaultSubcategory] = useState<string | undefined>(undefined);

  // Recipe detail dialog state
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  // Food item detail dialog state
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [selectedFoodName, setSelectedFoodName] = useState<string>('');
  const [selectedFoodGrams, setSelectedFoodGrams] = useState<number>(100);

  // Recommended foods dialog state
  const [recommendedCategory, setRecommendedCategory] = useState<string | null>(null);

  // Edit target macros dialog state
  const [editTargetOpen, setEditTargetOpen] = useState(false);
  const [editTargetValues, setEditTargetValues] = useState<CalculatedMacros | null>(null);

  // Edit meal name dialog state
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  // Handle recipe click
  const handleRecipeClick = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setRecipeDialogOpen(true);
  };

  // Handle food item click
  const handleFoodClick = (foodId: string, name: string, grams: number) => {
    setSelectedFoodId(foodId);
    setSelectedFoodName(name);
    setSelectedFoodGrams(grams);
    setFoodDialogOpen(true);
  };

  // Calculate display name for header - always use meal type
  const mealLabel = mealNumber
    ? `${MEAL_TYPE_LABELS[meal.type]} ${mealNumber}`
    : MEAL_TYPE_LABELS[meal.type];

  // Handle edit target macros
  const handleEditTarget = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (meal.targetMacros) {
      setEditTargetValues({ ...meal.targetMacros });
      setEditTargetOpen(true);
    }
  };

  // Save edited target macros
  const handleSaveTarget = async () => {
    if (editTargetValues && onUpdateMealMacros) {
      await onUpdateMealMacros(mealIndex, editTargetValues);
      setEditTargetOpen(false);
      setEditTargetValues(null);
    }
  };

  // Get items by category - separate berries from other carbs
  const proteinItems = meal.items.filter(item => item.category === 'protein');
  const carbItems = meal.items.filter(item => item.category === 'carb' && !isBerry(item.selected.name));
  const berryItems = meal.items.filter(item => item.category === 'carb' && isBerry(item.selected.name));
  const fatItems = meal.items.filter(item => item.category === 'fat');
  const vegetableItems = meal.items.filter(item => item.category === 'vegetable');

  const canHaveSauce = meal.type === 'lunch' || meal.type === 'middag';

  // Open product select modal
  const handleOpenSelectModal = (category: MacroCategory, targetMacro: number, defaultSubcategory?: string) => {
    setSelectCategory(category);
    setSelectTargetMacro(targetMacro);
    setSelectDefaultSubcategory(defaultSubcategory);
    setSelectModalOpen(true);
  };

  // Handle product selection from modal
  const handleProductSelect = (product: ProductForSelect, grams: number, macros: CalculatedMacros, isAlternative?: boolean) => {
    if (selectCategory && onSelectFood) {
      onSelectFood(mealIndex, selectCategory, product, grams, macros, isAlternative);
    }
    setSelectModalOpen(false);
  };

  // Get target macro for category
  const getTargetMacro = (category: MacroCategory): number => {
    switch (category) {
      case 'protein': return meal.targetMacros?.protein || 30;
      case 'carb': return meal.targetMacros?.carbs || 30;
      case 'fat': return meal.targetMacros?.fat || 15;
      default: return 0;
    }
  };

  // Handle direct gram input change
  const handleGramInputChange = (category: MacroCategory, foodId: string, newGrams: number) => {
    if (onUpdateGrams && newGrams >= 0) {
      onUpdateGrams(mealIndex, category, newGrams, foodId);
    }
  };

  // Get first recipe image as meal image (if available)
  const mealImage = mealRecipes.length > 0 ? mealRecipes[0].image : null;

  // Render ingredient row for new design
  const renderIngredientRow = (
    item: { category: MacroCategory; selected: { foodId: string; name: string; grams: number; macros: CalculatedMacros; image?: string | null } },
    category: MacroCategory
  ) => {
    return (
      <div
        key={item.selected.foodId}
        className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-gray-400">•</span>
          <button
            onClick={() => handleFoodClick(item.selected.foodId, item.selected.name, item.selected.grams)}
            className="text-sm text-[#1A3A4A] hover:text-[#E91E8C] transition-colors truncate"
          >
            {item.selected.name}
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <GramInput
            value={item.selected.grams}
            onChange={(grams) => handleGramInputChange(category, item.selected.foodId, grams)}
            disabled={disabled}
          />
          <span className="text-xs text-gray-400">g</span>
          <button
            onClick={() => !disabled && handleOpenSelectModal(category, getTargetMacro(category))}
            disabled={disabled}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
            title="Byt"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {onRemoveFood && (
            <button
              onClick={() => !disabled && onRemoveFood(mealIndex, category, item.selected.foodId)}
              disabled={disabled}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
              title="Ta bort"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Combine all items for ingredients display
  const allItems = [...proteinItems, ...carbItems, ...fatItems, ...vegetableItems, ...berryItems];

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Header - New design matching reference */}
      <div className="p-4">
        {/* Meal type badge + calories + menu */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1A3A4A] uppercase tracking-wider">
              {mealLabel.toUpperCase()}
            </span>
            {/* Dinner tips - only for middag */}
            {meal.type === 'middag' && <DinnerTipsDialog />}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1A3A4A]">
              {Math.round(meal.totalMacros.kcal)} kcal
            </span>
            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onAddMealRecipe && (
                  <DropdownMenuItem onClick={() => onAddMealRecipe(mealIndex)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Byt Recept
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { /* TODO: Save as favorite */ }}>
                  <Heart className="w-4 h-4 mr-2" />
                  Spara som Favorit
                </DropdownMenuItem>
                {onUpdateMealName && (
                  <DropdownMenuItem onClick={() => {
                    setEditNameValue(meal.customName || '');
                    setEditNameOpen(true);
                  }}>
                    <Type className="w-4 h-4 mr-2" />
                    Byt namn på måltid
                  </DropdownMenuItem>
                )}
                {onUpdateMealMacros && meal.targetMacros && (
                  <DropdownMenuItem onClick={handleEditTarget}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Redigera mål
                  </DropdownMenuItem>
                )}
                {/* Move up/down */}
                {(onMoveUp || onMoveDown) && (
                  <>
                    {canMoveUp && onMoveUp && (
                      <DropdownMenuItem onClick={() => onMoveUp(mealIndex)}>
                        <ArrowUp className="w-4 h-4 mr-2" />
                        Flytta upp
                      </DropdownMenuItem>
                    )}
                    {canMoveDown && onMoveDown && (
                      <DropdownMenuItem onClick={() => onMoveDown(mealIndex)}>
                        <ArrowDown className="w-4 h-4 mr-2" />
                        Flytta ner
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main content row: Image + Name */}
        <div className="flex items-start gap-3">
          {/* Meal/Recipe image */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            {mealImage ? (
              <img
                src={mealImage}
                alt={mealLabel}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Utensils className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Meal name and info */}
          <div className="flex-1 min-w-0">
            {meal.customName ? (
              <span className="text-base font-semibold text-[#1A3A4A]">
                {meal.customName}
              </span>
            ) : mealRecipes.length > 0 ? (
              <button
                onClick={() => handleRecipeClick(mealRecipes[0].recipeId)}
                className="text-base font-semibold text-[#1A3A4A] hover:text-[#E91E8C] transition-colors text-left truncate block"
              >
                {mealRecipes[0].name}
              </button>
            ) : (
              <span className="text-base font-semibold text-[#1A3A4A]">
                {allItems.length > 0 ? allItems[0].selected.name : 'Ingen mat vald'}
              </span>
            )}
          </div>
        </div>

        {/* Macro row - horizontal */}
        <div className="flex items-center justify-between mt-4 px-2 py-2 bg-[#F5F7FA] rounded-lg">
          <div className="text-center">
            <div className="text-[10px] font-semibold text-gray-500 uppercase">KCAL</div>
            <div className="text-sm font-bold text-[#1A3A4A]">{Math.round(meal.totalMacros.kcal)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-semibold text-gray-500 uppercase">KOLH</div>
            <div className="text-sm font-bold text-[#1A3A4A]">{meal.totalMacros.carbs.toFixed(1)}g</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-semibold text-gray-500 uppercase">FETT</div>
            <div className="text-sm font-bold text-[#1A3A4A]">{meal.totalMacros.fat.toFixed(1)}g</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-semibold text-gray-500 uppercase">PROT</div>
            <div className="text-sm font-bold text-[#1A3A4A]">{meal.totalMacros.protein.toFixed(1)}g</div>
          </div>
        </div>
      </div>

      {/* Expandable Ingredients section */}
      <div className="border-t border-gray-100">
        <button
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#E91E8C]" />
            <span className="text-sm font-semibold text-[#1A3A4A]">Ingredienser</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* All ingredients list */}
            <div className="space-y-1">
              {allItems.map((item) => renderIngredientRow(item, item.category))}

              {/* Sauce if present */}
              {meal.sauce && (
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-gray-400">•</span>
                    <button
                      onClick={() => handleFoodClick(meal.sauce!.foodId, meal.sauce!.name, meal.sauce!.grams)}
                      className="text-sm text-[#1A3A4A] hover:text-[#E91E8C] transition-colors truncate"
                    >
                      {meal.sauce.name}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <GramInput
                      value={meal.sauce.grams}
                      onChange={(grams) => onUpdateGrams && onUpdateGrams(mealIndex, 'sauce', grams, meal.sauce!.foodId)}
                      disabled={disabled}
                    />
                    <span className="text-xs text-gray-400">g</span>
                    <button
                      onClick={() => onRemoveSauce(mealIndex)}
                      disabled={disabled}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                      title="Ta bort"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add buttons for each category */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Lägg till
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => !disabled && handleOpenSelectModal('protein', getTargetMacro('protein'))}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  Protein
                </button>
                <button
                  onClick={() => !disabled && handleOpenSelectModal('carb', getTargetMacro('carb'))}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  Kolhydrat
                </button>
                <button
                  onClick={() => !disabled && handleOpenSelectModal('fat', getTargetMacro('fat'))}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  Fett
                </button>
                <button
                  onClick={() => !disabled && handleOpenSelectModal('vegetable', 0)}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  Grönsaker
                </button>
                <button
                  onClick={() => !disabled && handleOpenSelectModal('carb', getTargetMacro('carb'), 'Bär')}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  Bär
                </button>
                {canHaveSauce && !meal.sauce && (
                  <button
                    onClick={() => onAddSauce(mealIndex)}
                    disabled={disabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                    Sås
                  </button>
                )}
              </div>
            </div>

            {/* Recipes section */}
            {onAddMealRecipe && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Receptförslag
                </p>

                {mealRecipes.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {mealRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleRecipeClick(recipe.recipeId)}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                          {recipe.image ? (
                            <img
                              src={recipe.image}
                              alt={recipe.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Utensils className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-[#1A3A4A] truncate">
                            {recipe.name}
                          </div>
                        </div>
                        {onRemoveMealRecipe && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveMealRecipe(mealIndex, recipe.id);
                            }}
                            disabled={disabled}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Ta bort"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => onAddMealRecipe(mealIndex)}
                  disabled={disabled}
                  className="w-full py-2 px-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#E91E8C] hover:text-[#E91E8C] hover:bg-pink-50/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Lägg till recept
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Select Modal */}
      {selectCategory && (
        <ProductSelectModal
          isOpen={selectModalOpen}
          onClose={() => setSelectModalOpen(false)}
          category={selectCategory}
          targetMacro={selectTargetMacro}
          mealType={meal.type}
          onSelect={handleProductSelect}
          defaultSubcategory={selectDefaultSubcategory}
        />
      )}

      {/* Recipe Detail Dialog */}
      <RecipeDetailDialog
        recipeId={selectedRecipeId}
        open={recipeDialogOpen}
        onOpenChange={setRecipeDialogOpen}
        mealPlanId={mealPlanId}
        mealIndex={mealIndex}
        targetMacros={meal.targetMacros}
        onCustomizeSuccess={onRefreshMealData}
      />

      {/* Food Item Detail Dialog */}
      <FoodItemDetailDialog
        foodId={selectedFoodId}
        foodName={selectedFoodName}
        currentGrams={selectedFoodGrams}
        open={foodDialogOpen}
        onOpenChange={setFoodDialogOpen}
      />

      {/* Recommended Foods Dialog */}
      <RecommendedFoodsDialog
        open={recommendedCategory !== null}
        onOpenChange={(open) => !open && setRecommendedCategory(null)}
        category={recommendedCategory}
      />

      {/* Edit Target Macros Dialog */}
      <Dialog open={editTargetOpen} onOpenChange={setEditTargetOpen}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Redigera mål - {mealLabel}</DialogTitle>
          </DialogHeader>
          {editTargetValues && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Protein (g)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={Math.round(editTargetValues.protein)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditTargetValues({
                        ...editTargetValues,
                        protein: val,
                        kcal: val * 4 + editTargetValues.carbs * 4 + editTargetValues.fat * 9
                      });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Kolhydrater (g)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={Math.round(editTargetValues.carbs)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditTargetValues({
                        ...editTargetValues,
                        carbs: val,
                        kcal: editTargetValues.protein * 4 + val * 4 + editTargetValues.fat * 9
                      });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Fett (g)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={Math.round(editTargetValues.fat)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditTargetValues({
                        ...editTargetValues,
                        fat: val,
                        kcal: editTargetValues.protein * 4 + editTargetValues.carbs * 4 + val * 9
                      });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Kalorier</label>
                  <Input
                    type="text"
                    value={Math.round(editTargetValues.kcal)}
                    disabled
                    className="mt-1 bg-zinc-50"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Kalorier beräknas automatiskt: P×4 + K×4 + F×9
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditTargetOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveTarget}
                  disabled={disabled}
                  className="bg-[#E91E8C] hover:bg-[#d11a7d]"
                >
                  Spara
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Meal Name Dialog */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Byt namn på måltid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">Namn</label>
              <Input
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                placeholder="T.ex. Frukost, Kvällssnack..."
                className="mt-1"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Lämna tomt för att visa ingrediensnamn
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditNameOpen(false)}>
                Avbryt
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (onUpdateMealName) {
                    onUpdateMealName(mealIndex, editNameValue.trim());
                  }
                  setEditNameOpen(false);
                }}
                disabled={disabled}
                className="bg-[#E91E8C] hover:bg-[#d11a7d]"
              >
                Spara
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
